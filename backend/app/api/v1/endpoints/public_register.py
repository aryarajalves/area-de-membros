from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.logger import logger
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.schemas.user import Token, UserResponse, PublicRegisterRequest

router = APIRouter(prefix="/auth", tags=["Autenticação Pública"])

@router.post(
    "/public-register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Conta Pública de Aluno",
    description="Permite que qualquer visitante crie uma conta gratuita com perfil de Aluno sem cursos vinculados para participar da comunidade."
)
def public_register(
    data: PublicRegisterRequest,
    db: Session = Depends(get_db)
):
    # 1. Verifica se já existe usuário com este e-mail
    existing = db.query(User).filter(User.email == data.email.strip().lower()).first()
    if existing:
        logger.warning(f"[PublicRegister] Tentativa de cadastro com e-mail já existente: {data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado no sistema."
        )

    # 2. Criação do usuário como aluno ativo
    hashed_password = get_password_hash(data.password)
    user = User(
        name=data.name.strip(),
        email=data.email.strip().lower(),
        hashed_password=hashed_password,
        role="aluno",
        is_active=True,
        phone=data.phone.strip() if data.phone else None
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(f"[PublicRegister] Nova conta de aluno criada com sucesso: #{user.id} ({user.email})")

    # 2.1 Aciona gatilhos de funis para novo aluno cadastrado
    try:
        from app.services.funnel_service import dispatch_student_created_funnels
        dispatch_student_created_funnels(db, user.id)
    except Exception as fn_err:
        logger.error(f"[PublicRegister] Falha ao acionar funis para aluno #{user.id}: {fn_err}")

    # 3. Geração de token de acesso JWT
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    # 4. Resposta com Token e dados do usuário
    user_resp = UserResponse.model_validate(user)
    user_resp.course_ids = []
    user_resp.course_access = []

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_resp
    )
