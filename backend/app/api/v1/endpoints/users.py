import secrets
import json
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token
)
from app.models.user import User, Invite, PasswordResetToken, RegistrationVerification
from app.models.course import UserCourse
from app.services.email import send_verification_email
from app.schemas.user import (
    UserLogin,
    Token,
    CourseAccessItem,
    UserResponse,
    UserUpdate,
    BulkDeleteRequest,
    InviteCreate,
    InviteResponse,
    InviteValidateResponse,
    RegisterWithInvite,
    RegisterInitiateResponse,
    VerifyCodeRequest,
    ResendCodeRequest,
    PasswordResetRequestResponse,
    PasswordResetConfirm,
    PasswordResetValidateResponse
)

router = APIRouter(prefix="/auth", tags=["Auth & Users"])

ACCESS_DURATION_DAYS = {
    "lifetime": None,
    "1_month": 30,
    "3_months": 90,
    "6_months": 180,
    "1_year": 365,
    "2_years": 730,
    "3_years": 1095,
}


def calculate_course_expiration(access_duration: str = "lifetime", base_time: datetime = None):
    if not access_duration or access_duration == "lifetime":
        return None
    days = ACCESS_DURATION_DAYS.get(access_duration)
    if not days:
        return None
    now = base_time or datetime.now(timezone.utc)
    return now + timedelta(days=days)


def _parse_invite_courses(raw_json: str):
    """Retorna (allowed_course_ids: List[int], course_access: List[CourseAccessItem])."""
    if not raw_json:
        return [], []
    try:
        parsed = json.loads(raw_json)
    except Exception:
        return [], []
    if not isinstance(parsed, list):
        return [], []
    c_ids = []
    c_access = []
    for item in parsed:
        if isinstance(item, dict) and "course_id" in item:
            cid = int(item["course_id"])
            dur = item.get("access_duration") or "lifetime"
            c_ids.append(cid)
            c_access.append(CourseAccessItem(course_id=cid, access_duration=dur))
        elif isinstance(item, int):
            c_ids.append(item)
            c_access.append(CourseAccessItem(course_id=item, access_duration="lifetime"))
    return c_ids, c_access


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido ou inválido",
        )
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inativo ou não encontrado",
        )
    return user

def require_admin_or_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado para este perfil",
        )
    return current_user

def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas Super Administradores podem acessar este recurso",
        )
    return current_user

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo",
        )
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    users = db.query(User).order_by(User.id.asc()).all()
    user_courses = db.query(UserCourse).all()
    courses_map = {}
    access_map = {}
    for uc in user_courses:
        courses_map.setdefault(uc.user_id, []).append(uc.course_id)
        access_map.setdefault(uc.user_id, []).append(
            CourseAccessItem(
                course_id=uc.course_id,
                access_duration=uc.access_duration or "lifetime",
                expires_at=uc.expires_at
            )
        )

    results = []
    for u in users:
        res = UserResponse.model_validate(u)
        res.course_ids = courses_map.get(u.id, [])
        res.course_access = access_map.get(u.id, [])
        results.append(res)
    return results

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Regra: Não pode editar o superadmin
    if target_user.role == "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Não é permitido editar as informações do Super Admin."
        )

    # Apenas admin, user ou aluno podem ser atribuídos
    if user_update.role not in ["admin", "user", "aluno"]:
        raise HTTPException(status_code=400, detail="Perfil inválido.")

    target_user.role = user_update.role

    # Atualiza cursos liberados e tempos de acesso se informado
    if user_update.course_access is not None or user_update.course_ids is not None:
        existing_ucs = db.query(UserCourse).filter(UserCourse.user_id == user_id).all()
        existing_map = {uc.course_id: uc for uc in existing_ucs}
        db.query(UserCourse).filter(UserCourse.user_id == user_id).delete()

        if user_update.role == "aluno":
            now = datetime.now(timezone.utc)
            items_to_save = []
            if user_update.course_access is not None:
                for item in user_update.course_access:
                    items_to_save.append((item.course_id, item.access_duration or "lifetime"))
            elif user_update.course_ids is not None:
                for cid in user_update.course_ids:
                    prev_dur = existing_map[cid].access_duration if cid in existing_map else "lifetime"
                    items_to_save.append((cid, prev_dur or "lifetime"))

            seen_cids = set()
            for cid, dur in items_to_save:
                if cid in seen_cids:
                    continue
                seen_cids.add(cid)
                if cid in existing_map and (existing_map[cid].access_duration or "lifetime") == dur:
                    exp = None if dur == "lifetime" else (existing_map[cid].expires_at or calculate_course_expiration(dur, now))
                else:
                    exp = calculate_course_expiration(dur, now)
                db.add(UserCourse(
                    user_id=user_id,
                    course_id=cid,
                    access_duration=dur,
                    expires_at=exp
                ))

    db.commit()
    db.refresh(target_user)

    updated_ucs = db.query(UserCourse).filter(UserCourse.user_id == user_id).all()
    res = UserResponse.model_validate(target_user)
    res.course_ids = [uc.course_id for uc in updated_ucs]
    res.course_access = [
        CourseAccessItem(
            course_id=uc.course_id,
            access_duration=uc.access_duration or "lifetime",
            expires_at=uc.expires_at
        )
        for uc in updated_ucs
    ]
    return res

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if target_user.role == "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Não é permitido excluir o Super Admin."
        )

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Não é permitido excluir seu próprio usuário atual."
        )

    db.delete(target_user)
    db.commit()
    return {"message": "Usuário excluído com sucesso."}

@router.post("/users/bulk-delete")
def bulk_delete_users(
    data: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    if not data.ids:
        raise HTTPException(status_code=400, detail="Nenhum usuário selecionado.")

    users_to_delete = db.query(User).filter(User.id.in_(data.ids)).all()
    deleted_count = 0
    for u in users_to_delete:
        if u.role == "superadmin":
            continue # Ignora superadmin por segurança
        if u.id == current_user.id:
            continue # Ignora o próprio usuário logado
        db.delete(u)
        deleted_count += 1

    db.commit()
    return {"message": f"{deleted_count} usuário(s) excluído(s) com sucesso.", "deleted_count": deleted_count}

@router.post("/users/{user_id}/reset-password-request", response_model=PasswordResetRequestResponse)
def request_password_reset(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Regra: Não pode redefinir senha do Super Admin por esse fluxo
    if target_user.role == "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Não é permitido redefinir a senha do Super Admin."
        )

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=24)
    token = secrets.token_urlsafe(32)

    reset_token = PasswordResetToken(
        user_id=target_user.id,
        token=token,
        expires_at=expires_at,
        is_used=False
    )
    db.add(reset_token)
    db.commit()

    return PasswordResetRequestResponse(
        reset_url=f"/reset-password?token={token}",
        token=token,
        expires_at=expires_at,
        user_email=target_user.email,
        user_name=target_user.name
    )

@router.get("/reset-password/validate", response_model=PasswordResetValidateResponse)
def validate_reset_password_token(token: str, db: Session = Depends(get_db)):
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()
    if not record:
        return PasswordResetValidateResponse(valid=False, detail="Link de redefinição não encontrado.")
    if record.is_used:
        return PasswordResetValidateResponse(valid=False, detail="Este link de redefinição já foi utilizado.")
    
    now = datetime.now(timezone.utc)
    exp = record.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if now > exp:
        return PasswordResetValidateResponse(valid=False, detail="Este link de redefinição expirou.")

    target_user = db.query(User).filter(User.id == record.user_id).first()
    if not target_user:
        return PasswordResetValidateResponse(valid=False, detail="Usuário associado não encontrado.")

    return PasswordResetValidateResponse(
        valid=True,
        email=target_user.email,
        name=target_user.name
    )

@router.post("/reset-password/confirm")
def confirm_password_reset(
    data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token == data.token).first()
    if not record:
        raise HTTPException(status_code=400, detail="Link de redefinição não encontrado.")
    if record.is_used:
        raise HTTPException(status_code=400, detail="Este link de redefinição já foi utilizado.")

    now = datetime.now(timezone.utc)
    exp = record.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if now > exp:
        raise HTTPException(status_code=400, detail="Este link de redefinição expirou.")

    if data.password_confirm is not None and data.password != data.password_confirm:
        raise HTTPException(status_code=400, detail="As senhas digitadas não coincidem.")

    target_user = db.query(User).filter(User.id == record.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if target_user.role == "superadmin":
        raise HTTPException(status_code=403, detail="Não é permitido redefinir senha do Super Admin.")

    target_user.hashed_password = get_password_hash(data.password)
    record.is_used = True
    db.commit()

    return {"message": "Senha redefinida com sucesso."}

@router.post("/invites", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
def create_invite(
    invite_in: InviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    if invite_in.role not in ["admin", "user", "aluno"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de usuário inválido para convite. Apenas 'admin', 'user' ou 'aluno' são permitidos.",
        )

    duration = max(1, invite_in.duration_hours)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=duration)
    token = secrets.token_urlsafe(32)

    allowed_courses_json = None
    access_items = []
    if invite_in.course_access is not None:
        access_items = [
            {"course_id": item.course_id, "access_duration": item.access_duration or "lifetime"}
            for item in invite_in.course_access
        ]
        allowed_courses_json = json.dumps(access_items)
    elif invite_in.course_ids is not None:
        access_items = [
            {"course_id": cid, "access_duration": "lifetime"}
            for cid in invite_in.course_ids
        ]
        allowed_courses_json = json.dumps(access_items)

    invite = Invite(
        token=token,
        role=invite_in.role,
        expires_at=expires_at,
        is_used=False,
        allowed_course_ids=allowed_courses_json
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    c_ids, c_access = _parse_invite_courses(invite.allowed_course_ids)
    invite_res = InviteResponse.model_validate(invite)
    invite_res.invite_url = f"/register?token={token}"
    invite_res.is_expired = False
    invite_res.time_remaining = f"{duration}h"
    invite_res.allowed_course_ids = c_ids
    invite_res.course_access = c_access
    return invite_res

def format_time_remaining(expires_at: datetime) -> str:
    now = datetime.now(timezone.utc)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    diff = expires_at - now
    if diff.total_seconds() <= 0:
        return "Expirado"
    days = diff.days
    hours = diff.seconds // 3600
    minutes = (diff.seconds % 3600) // 60
    if days > 0:
        return f"{days}d {hours}h restantes"
    if hours > 0:
        return f"{hours}h {minutes}m restantes"
    return f"{minutes}m restantes"

@router.get("/invites", response_model=List[InviteResponse])
def list_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    invites = db.query(Invite).order_by(Invite.id.desc()).all()
    results = []
    now = datetime.now(timezone.utc)
    for inv in invites:
        exp = inv.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        is_expired = now > exp
        time_rem = format_time_remaining(inv.expires_at)

        c_ids, c_access = _parse_invite_courses(inv.allowed_course_ids)

        inv_dto = InviteResponse.model_validate(inv)
        inv_dto.invite_url = f"/register?token={inv.token}"
        inv_dto.is_expired = is_expired
        inv_dto.time_remaining = time_rem
        inv_dto.allowed_course_ids = c_ids
        inv_dto.course_access = c_access
        results.append(inv_dto)
    return results

@router.delete("/invites/{invite_id}")
def delete_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    target_invite = db.query(Invite).filter(Invite.id == invite_id).first()
    if not target_invite:
        raise HTTPException(status_code=404, detail="Convite não encontrado.")

    db.delete(target_invite)
    db.commit()
    return {"message": "Convite excluído com sucesso."}

@router.post("/invites/bulk-delete")
def bulk_delete_invites(
    data: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    if not data.ids:
        raise HTTPException(status_code=400, detail="Nenhum convite selecionado.")

    invites_to_delete = db.query(Invite).filter(Invite.id.in_(data.ids)).all()
    deleted_count = len(invites_to_delete)
    for inv in invites_to_delete:
        db.delete(inv)

    db.commit()
    return {"message": f"{deleted_count} convite(s) excluído(s) com sucesso.", "deleted_count": deleted_count}

@router.get("/invites/validate", response_model=InviteValidateResponse)
def validate_invite(token: str, db: Session = Depends(get_db)):
    invite = db.query(Invite).filter(Invite.token == token).first()
    if not invite:
        return InviteValidateResponse(valid=False, detail="Convite não encontrado.")
    if invite.is_used:
        return InviteValidateResponse(valid=False, detail="Este convite já foi utilizado.")
    
    now = datetime.now(timezone.utc)
    expires_at = invite.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if now > expires_at:
        return InviteValidateResponse(valid=False, detail="Este convite expirou.")

    return InviteValidateResponse(valid=True, role=invite.role)

@router.post("/register", response_model=RegisterInitiateResponse, status_code=status.HTTP_200_OK)
async def register_user(
    data: RegisterWithInvite,
    db: Session = Depends(get_db)
):
    invite = db.query(Invite).filter(Invite.token == data.token).first()
    if not invite:
        raise HTTPException(status_code=400, detail="Convite não encontrado.")
    if invite.is_used:
        raise HTTPException(status_code=400, detail="Este convite já foi utilizado.")
    
    now = datetime.now(timezone.utc)
    expires_at = invite.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if now > expires_at:
        raise HTTPException(status_code=400, detail="Este convite expirou.")

    if data.password_confirm is not None and data.password != data.password_confirm:
        raise HTTPException(
            status_code=400,
            detail="As senhas digitadas não coincidem."
        )

    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Já existe um usuário cadastrado com este e-mail."
        )

    # Gera código OTP de 6 dígitos
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    code_expires_at = now + timedelta(minutes=15)
    hashed_pw = get_password_hash(data.password)

    # Invalida tentativas anteriores para esse e-mail
    db.query(RegistrationVerification).filter(
        RegistrationVerification.email == data.email,
        RegistrationVerification.is_used == False
    ).update({"is_used": True})

    verification = RegistrationVerification(
        email=data.email,
        name=data.name,
        hashed_password=hashed_pw,
        role=invite.role,
        invite_token=data.token,
        code=otp_code,
        expires_at=code_expires_at,
        is_used=False
    )
    db.add(verification)
    db.commit()

    # Dispara e-mail via Brevo
    await send_verification_email(
        to_email=data.email,
        to_name=data.name,
        code=otp_code
    )

    return RegisterInitiateResponse(
        message="Código de verificação enviado para o seu e-mail.",
        email=data.email,
        requires_verification=True
    )

@router.post("/register/verify", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def verify_registration(
    data: VerifyCodeRequest,
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    verification = (
        db.query(RegistrationVerification)
        .filter(
            RegistrationVerification.email == data.email,
            RegistrationVerification.is_used == False
        )
        .order_by(RegistrationVerification.id.desc())
        .first()
    )

    if not verification:
        raise HTTPException(status_code=400, detail="Solicitação de verificação não encontrada.")

    exp = verification.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if now > exp:
        raise HTTPException(status_code=400, detail="O código de verificação expirou. Solicite um novo.")

    if verification.code != data.code.strip():
        raise HTTPException(status_code=400, detail="Código de verificação inválido.")

    # Valida convite novamente
    invite = db.query(Invite).filter(Invite.token == verification.invite_token).first()
    if not invite or invite.is_used:
        raise HTTPException(status_code=400, detail="O convite associado já foi utilizado ou é inválido.")

    # Verifica se usuário já foi cadastrado
    existing = db.query(User).filter(User.email == verification.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Usuário já cadastrado.")

    # Cria o novo usuário
    new_user = User(
        email=verification.email,
        name=verification.name,
        hashed_password=verification.hashed_password,
        role=verification.role,
        is_active=True
    )
    db.add(new_user)
    verification.is_used = True
    invite.is_used = True
    invite.used_by_email = verification.email
    db.flush()

    # Se o convite continha cursos liberados, vincula-os ao novo aluno com seus respectivos prazos
    if invite.allowed_course_ids:
        _, c_access = _parse_invite_courses(invite.allowed_course_ids)
        seen_cids = set()
        for item in c_access:
            if item.course_id in seen_cids:
                continue
            seen_cids.add(item.course_id)
            dur = item.access_duration or "lifetime"
            exp = calculate_course_expiration(dur, now)
            db.add(UserCourse(
                user_id=new_user.id,
                course_id=item.course_id,
                access_duration=dur,
                expires_at=exp
            ))

    db.commit()
    db.refresh(new_user)

    assigned_ucs = db.query(UserCourse).filter(UserCourse.user_id == new_user.id).all()
    res = UserResponse.model_validate(new_user)
    res.course_ids = [uc.course_id for uc in assigned_ucs]
    res.course_access = [
        CourseAccessItem(
            course_id=uc.course_id,
            access_duration=uc.access_duration or "lifetime",
            expires_at=uc.expires_at
        )
        for uc in assigned_ucs
    ]
    return res

@router.post("/register/resend-code")
async def resend_registration_code(
    data: ResendCodeRequest,
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    last_verif = (
        db.query(RegistrationVerification)
        .filter(
            RegistrationVerification.email == data.email,
            RegistrationVerification.invite_token == data.invite_token,
            RegistrationVerification.is_used == False
        )
        .order_by(RegistrationVerification.id.desc())
        .first()
    )

    if not last_verif:
        raise HTTPException(status_code=400, detail="Nenhum cadastro pendente encontrado para este e-mail.")

    # Gera novo código
    new_code = f"{secrets.randbelow(900000) + 100000}"
    last_verif.code = new_code
    last_verif.expires_at = now + timedelta(minutes=15)
    db.commit()

    # Dispara e-mail
    await send_verification_email(
        to_email=last_verif.email,
        to_name=last_verif.name,
        code=new_code
    )

    return {"message": "Novo código de verificação enviado com sucesso."}
