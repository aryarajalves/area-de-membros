import secrets
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.api_token import ApiToken
from app.schemas.api_token import ApiTokenCreate, ApiTokenResponse, ApiTokenCreatedResponse
from app.api.v1.endpoints.users import get_current_user

router = APIRouter()

def require_admin_or_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores."
        )
    return current_user


@router.get(
    "",
    response_model=List[ApiTokenResponse],
    summary="Listar Tokens de API",
    description="Retorna todas as chaves de API ativas e revogadas do sistema (Exige Admin ou SuperAdmin)."
)
def list_api_tokens(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Lista as chaves de API cadastradas."""
    try:
        tokens = db.query(ApiToken).order_by(desc(ApiToken.created_at)).all()
        return tokens
    except Exception as exc:
        logger.error(f"Erro ao listar tokens de API: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar lista de tokens de API."
        )


@router.post(
    "",
    response_model=ApiTokenCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Novo Token de API",
    description="Gera uma nova chave de API com prefixo sk_live_ e validade opcional. O token bruto é retornado apenas nesta resposta."
)
def create_api_token(
    data: ApiTokenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Gera um novo token de API seguro."""
    try:
        raw_key = f"sk_live_{secrets.token_urlsafe(32)}"
        masked_key = f"sk_live_••••••••{raw_key[-4:]}"

        expires_at = None
        if data.expiration_days and data.expiration_days > 0:
            expires_at = datetime.now(timezone.utc) + timedelta(days=data.expiration_days)

        api_token = ApiToken(
            user_id=current_user.id,
            name=data.name.strip(),
            token=raw_key,
            masked_token=masked_key,
            is_active=True,
            expires_at=expires_at,
        )
        db.add(api_token)
        db.commit()
        db.refresh(api_token)

        logger.info(f"Token de API '{api_token.name}' (ID: {api_token.id}) criado por {current_user.email}.")

        return ApiTokenCreatedResponse(
            id=api_token.id,
            name=api_token.name,
            masked_token=api_token.masked_token,
            is_active=api_token.is_active,
            last_used_at=api_token.last_used_at,
            expires_at=api_token.expires_at,
            created_at=api_token.created_at,
            raw_token=raw_key,
        )
    except Exception as exc:
        logger.error(f"Erro ao criar token de API: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao gerar token de API."
        )


@router.delete(
    "/{token_id}",
    summary="Revogar e Excluir Token de API",
    description="Remove definitivamente o token de API, invalidando qualquer integração que o utilize."
)
def delete_api_token(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Revoga e exclui um token de API."""
    token = db.query(ApiToken).filter(ApiToken.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token de API não encontrado.")

    try:
        name = token.name
        db.delete(token)
        db.commit()
        logger.info(f"Token de API '{name}' (ID: {token_id}) revogado por {current_user.email}.")
        return {"detail": f"Token '{name}' revogado e excluído com sucesso."}
    except Exception as exc:
        logger.error(f"Erro ao excluir token de API {token_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao revogar token de API."
        )


@router.patch(
    "/{token_id}/toggle",
    response_model=ApiTokenResponse,
    summary="Ativar ou Desativar Token de API",
    description="Pausa ou reativa um token de API sem excluí-lo."
)
def toggle_api_token(
    token_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Alterna o status ativo de um token de API."""
    token = db.query(ApiToken).filter(ApiToken.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token de API não encontrado.")

    try:
        token.is_active = not token.is_active
        db.commit()
        db.refresh(token)
        status_str = "ativado" if token.is_active else "desativado"
        logger.info(f"Token de API '{token.name}' (ID: {token_id}) {status_str} por {current_user.email}.")
        return token
    except Exception as exc:
        logger.error(f"Erro ao alternar status do token de API {token_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao alterar status do token de API."
        )
