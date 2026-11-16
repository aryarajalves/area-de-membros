from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.logger import logger
from app.models.user import User
from app.schemas.user import (
    PublicRegisterRequest,
    RegisterInitiateResponse,
    Token,
    VerifyLinkRequest,
)
from app.services.registration_verification_service import (
    confirm_verification_by_token,
    initiate_email_verification,
)

router = APIRouter(prefix="/auth", tags=["Autenticação Pública"])


@router.post(
    "/public-register",
    response_model=RegisterInitiateResponse,
    status_code=status.HTTP_200_OK,
    summary="Iniciar Cadastro Público de Aluno",
    description="Envia um e-mail com botão de confirmação para validar o e-mail e ativar a conta gratuita na comunidade.",
)
@limiter.limit("5/hour")
async def public_register(
    request: Request,
    data: PublicRegisterRequest,
    db: Session = Depends(get_db),
):
    clean_email = data.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        logger.warning(f"[PublicRegister] Tentativa de cadastro com e-mail já existente: {clean_email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado no sistema.",
        )

    await initiate_email_verification(
        db,
        email=clean_email,
        name=data.name,
        password=data.password,
        role="aluno",
        phone=data.phone,
        invite_token=None,
        request=request,
    )

    logger.info(f"[PublicRegister] E-mail de confirmação enviado para novo cadastro público: {clean_email}")

    return RegisterInitiateResponse(
        message="Enviamos um link de confirmação para o seu e-mail. Clique no botão do e-mail para ativar sua conta.",
        email=clean_email,
        requires_verification=True,
    )


@router.post(
    "/register/verify-link",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Confirmar Cadastro via Botão/Link do E-mail",
    description="Valida o token recebido no e-mail, cria a conta do usuário e retorna o JWT para login automático.",
)
def verify_registration_link(
    data: VerifyLinkRequest,
    db: Session = Depends(get_db),
):
    return confirm_verification_by_token(db, data.token)
