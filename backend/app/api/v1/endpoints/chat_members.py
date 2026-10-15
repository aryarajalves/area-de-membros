from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.endpoints.users import get_current_user
from app.models.user import User
from app.schemas.chat import ChatChannelMembersResponse
from app.services.chat_query_service import get_channel_members

router = APIRouter(tags=["Chat da Comunidade"])


@router.get(
    "/members",
    response_model=ChatChannelMembersResponse,
    summary="Listar Membros com Acesso ao Canal de Chat",
    description="Retorna os usuários que têm permissão de visualização no chat selecionado (Super Admins, Admins e Alunos)."
)
def list_chat_channel_members(
    channel_type: str = Query(default="general", description="'general' ou 'course'"),
    course_id: Optional[int] = Query(default=None, description="ID do curso se canal for 'course'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna a lista de usuários com acesso a este canal de bate-papo,
    agrupados por perfil (Super Admin, Admins e Alunos), com status online e fotos de perfil.
    """
    return get_channel_members(db=db, channel_type=channel_type, course_id=course_id)
