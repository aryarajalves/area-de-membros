"""
Rotas exclusivas do Super Admin para auditoria, visualização e intervenção
em Mensagens Privadas (DMs) trocadas entre Alunos e Administradores da plataforma.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user import User
from app.api.v1.endpoints.users import get_current_user
from app.schemas.chat import ChatAdminDmConversationItem, ChatMessageResponse
from app.services.chat_dm_service import (
    get_superadmin_admin_conversations,
    get_superadmin_thread_messages,
)

router = APIRouter()


def require_superadmin_user(current_user: User = Depends(get_current_user)) -> User:
    """Valida se o usuário autenticado possui perfil de Super Admin."""
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso exclusivo ao Super Administrador da plataforma.",
        )
    return current_user


@router.get(
    "/dm/admin-conversations",
    response_model=List[ChatAdminDmConversationItem],
    summary="Lista todas as conversas entre Alunos e Administradores para supervisão do Super Admin",
    description="Retorna conversas privadas onde pelo menos um dos participantes é um administrador.",
)
@limiter.limit("60/minute")
def list_admin_conversations(
    request: Request,
    unread_only: bool = Query(default=False, description="Filtrar apenas atendimentos com mensagens pendentes"),
    limit: int = Query(default=50, le=100, description="Quantidade máxima de conversas"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin_user),
):
    return get_superadmin_admin_conversations(db, unread_only=unread_only, limit=limit)


@router.get(
    "/dm/admin-conversations/{student_id}/{admin_id}/messages",
    response_model=List[ChatMessageResponse],
    summary="Histórico de mensagens da thread Aluno ↔ Administrador para supervisão do Super Admin",
    description="Carrega as mensagens sem alterar o status de leitura para o administrador original.",
)
@limiter.limit("60/minute")
def list_admin_thread_messages(
    request: Request,
    student_id: int,
    admin_id: int,
    limit: int = Query(default=50, le=100, description="Limite de mensagens a retornar"),
    before_id: Optional[int] = Query(default=None, description="Cursor para paginação"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin_user),
):
    return get_superadmin_thread_messages(
        db,
        student_id=student_id,
        admin_id=admin_id,
        limit=limit,
        before_id=before_id,
    )
