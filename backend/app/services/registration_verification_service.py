"""Serviço compartilhado de verificação de e-mail via link único (Magic Link) para cadastro por convite e cadastro público."""
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlparse

from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logger import logger
from app.core.security import create_access_token, get_password_hash
from app.models.course import UserCourse
from app.models.user import Invite, RegistrationVerification, User
from app.schemas.user import CourseAccessItem, Token, UserResponse
from app.services.course_access_utils import calculate_course_expiration, _parse_invite_courses
from app.services.course_bundle_service import grant_bundle_access_for_user
from app.services.email import send_verification_email

VERIFICATION_LINK_EXPIRATION_MINUTES = 30


def resolve_frontend_base_url(request: Optional[Request] = None) -> str:
    """Resolve a URL base do frontend para montar o link de confirmação no e-mail."""
    configured = (settings.FRONTEND_URL or "").strip().rstrip("/")
    if configured:
        return configured

    if request is not None:
        origin = (request.headers.get("origin") or "").strip().rstrip("/")
        if origin:
            return origin

        referer = (request.headers.get("referer") or "").strip()
        if referer:
            parsed = urlparse(referer)
            if parsed.scheme and parsed.netloc:
                return f"{parsed.scheme}://{parsed.netloc}"

        host = (request.headers.get("host") or "").strip()
        if host:
            scheme = request.headers.get("x-forwarded-proto") or request.url.scheme or "http"
            return f"{scheme}://{host}"

    return "http://localhost:3010"


def build_verification_url(base_url: str, verification_token: str) -> str:
    """Monta a URL completa de confirmação de conta."""
    return f"{base_url.rstrip('/')}/verify-email?token={verification_token}"


async def initiate_email_verification(
    db: Session,
    *,
    email: str,
    name: str,
    password: str,
    role: str,
    phone: Optional[str] = None,
    invite_token: Optional[str] = None,
    request: Optional[Request] = None,
) -> RegistrationVerification:
    """Cria registro de verificação pendente (30 min) e dispara o e-mail com botão de confirmação."""
    clean_email = email.strip().lower()
    clean_name = name.strip()
    clean_phone = phone.strip() if phone else None
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=VERIFICATION_LINK_EXPIRATION_MINUTES)
    verification_token = secrets.token_urlsafe(32)
    otp_code = f"{secrets.randbelow(900000) + 100000}"

    # Invalida solicitações pendentes anteriores para o mesmo e-mail
    db.query(RegistrationVerification).filter(
        RegistrationVerification.email == clean_email,
        RegistrationVerification.is_used == False,
    ).update({"is_used": True})

    verification = RegistrationVerification(
        email=clean_email,
        name=clean_name,
        phone=clean_phone,
        hashed_password=get_password_hash(password),
        role=role,
        invite_token=invite_token or "",
        verification_token=verification_token,
        code=otp_code,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)

    base_url = resolve_frontend_base_url(request)
    verify_url = build_verification_url(base_url, verification_token)

    await send_verification_email(
        to_email=clean_email,
        to_name=clean_name,
        code=otp_code,
        verification_url=verify_url,
    )
    logger.info(f"[EmailVerification] Link de confirmação gerado para {clean_email} (expira em {VERIFICATION_LINK_EXPIRATION_MINUTES} min).")
    return verification


async def resend_email_verification(
    db: Session,
    *,
    email: str,
    invite_token: Optional[str] = None,
    request: Optional[Request] = None,
) -> RegistrationVerification:
    """Gera novo token de confirmação (30 min) e reenvia o e-mail."""
    clean_email = email.strip().lower()
    query = db.query(RegistrationVerification).filter(
        RegistrationVerification.email == clean_email,
        RegistrationVerification.is_used == False,
    )
    if invite_token:
        query = query.filter(RegistrationVerification.invite_token == invite_token)

    last_verif = query.order_by(RegistrationVerification.id.desc()).first()
    if not last_verif:
        raise HTTPException(status_code=400, detail="Nenhum cadastro pendente encontrado para este e-mail.")

    now = datetime.now(timezone.utc)
    new_token = secrets.token_urlsafe(32)
    new_code = f"{secrets.randbelow(900000) + 100000}"
    last_verif.verification_token = new_token
    last_verif.code = new_code
    last_verif.expires_at = now + timedelta(minutes=VERIFICATION_LINK_EXPIRATION_MINUTES)
    db.commit()
    db.refresh(last_verif)

    base_url = resolve_frontend_base_url(request)
    verify_url = build_verification_url(base_url, new_token)

    await send_verification_email(
        to_email=last_verif.email,
        to_name=last_verif.name,
        code=new_code,
        verification_url=verify_url,
    )
    logger.info(f"[EmailVerification] E-mail de confirmação reenviado para {last_verif.email}.")
    return last_verif


def _assign_invite_courses(db: Session, user: User, invite: Invite, now: datetime) -> None:
    """Vincula os cursos liberados do convite (e combos) ao novo usuário."""
    if not invite.allowed_course_ids:
        return
    _, c_access = _parse_invite_courses(invite.allowed_course_ids)
    seen_cids = set()
    for item in c_access:
        if item.course_id in seen_cids:
            continue
        seen_cids.add(item.course_id)
        dur = item.access_duration or "lifetime"
        exp = calculate_course_expiration(dur, now)
        db.add(UserCourse(
            user_id=user.id,
            course_id=item.course_id,
            access_duration=dur,
            expires_at=exp,
        ))
    grant_bundle_access_for_user(db, user.id, list(seen_cids))


def confirm_verification_by_token(db: Session, token: str) -> Token:
    """Valida o token do link do e-mail, cria a conta e retorna o JWT para login imediato."""
    clean_token = (token or "").strip()
    if not clean_token:
        raise HTTPException(status_code=400, detail="Token de verificação inválido.")

    verification = (
        db.query(RegistrationVerification)
        .filter(RegistrationVerification.verification_token == clean_token)
        .first()
    )
    if not verification:
        raise HTTPException(status_code=400, detail="Link de verificação inválido ou inexistente.")

    if verification.is_used:
        raise HTTPException(
            status_code=400,
            detail="Este link de verificação já foi utilizado. Faça login para acessar sua conta.",
        )

    now = datetime.now(timezone.utc)
    exp = verification.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if now > exp:
        raise HTTPException(
            status_code=400,
            detail="Este link de verificação expirou. Volte ao cadastro e solicite um novo e-mail.",
        )

    existing_user = db.query(User).filter(User.email == verification.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado no sistema.")

    invite = None
    if verification.invite_token:
        invite = db.query(Invite).filter(Invite.token == verification.invite_token).first()
        if not invite or invite.is_used:
            raise HTTPException(status_code=400, detail="O convite associado já foi utilizado ou é inválido.")

    new_user = User(
        email=verification.email,
        name=verification.name,
        phone=verification.phone,
        hashed_password=verification.hashed_password,
        role=verification.role,
        is_active=True,
        first_login_at=now,
        last_login_at=now,
        login_count=1,
    )
    db.add(new_user)
    verification.is_used = True

    if invite is not None:
        invite.is_used = True
        invite.used_by_email = verification.email

    db.flush()

    if invite is not None:
        _assign_invite_courses(db, new_user, invite, now)

    db.commit()
    db.refresh(new_user)
    logger.info(f"[EmailVerification] Conta #{new_user.id} ({new_user.email}) confirmada e ativada via link.")

    if new_user.role in ("aluno", "user"):
        try:
            from app.services.funnel_service import dispatch_student_created_funnels
            dispatch_student_created_funnels(db, new_user.id)
        except Exception as fn_err:
            logger.error(f"[EmailVerification] Falha ao acionar funis de criação para #{new_user.id}: {fn_err}")

        try:
            from app.services.funnel_trigger_service import dispatch_first_login_funnels
            dispatch_first_login_funnels(db, new_user.id)
        except Exception as fn_err:
            logger.error(f"[EmailVerification] Falha ao acionar funis de 1º login para #{new_user.id}: {fn_err}")

    access_token = create_access_token(
        data={"sub": str(new_user.id), "role": new_user.role, "token_version": new_user.token_version or 1}
    )

    assigned_ucs = db.query(UserCourse).filter(UserCourse.user_id == new_user.id).all()
    user_resp = UserResponse.model_validate(new_user)
    user_resp.course_ids = [uc.course_id for uc in assigned_ucs]
    user_resp.course_access = [
        CourseAccessItem(
            course_id=uc.course_id,
            access_duration=uc.access_duration or "lifetime",
            expires_at=uc.expires_at,
        )
        for uc in assigned_ucs
    ]

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_resp,
    )
