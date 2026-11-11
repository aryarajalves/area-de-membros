from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.api.v1.endpoints.users import get_current_user
from app.models.user import User
from app.schemas.chat import ChatChannelMembersResponse, ChatDmCandidatesResponse
from app.services.chat_query_service import get_channel_members, get_dm_candidates

router = APIRouter(tags=["Chat da Comunidade"])


@router.get(
    "/members",
    response_model=ChatChannelMembersResponse,
    summary="Listar Membros com Acesso ao Canal de Chat",
    description="Retorna os usuários que têm permissão de visualização no chat selecionado (Super Admins, Admins e Alunos)."
)
@limiter.limit("60/minute")
def list_chat_channel_members(
    request: Request,
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


@router.get(
    "/dm/candidates",
    response_model=ChatDmCandidatesResponse,
    summary="Listar Contatos para Nova Conversa DM",
    description="Retorna usuários paginados (máx 20) com filtros de perfil, busca, curso e ordenação."
)
@limiter.limit("60/minute")
def list_dm_candidates(
    request: Request,
    search: Optional[str] = Query(default=None),
    role: Optional[str] = Query(default="all", description="'all', 'superadmin', 'admin', 'aluno'"),
    course_id: Optional[int] = Query(default=None, description="Filtrar por curso matriculado"),
    order_by: str = Query(default="name_asc", description="'name_asc', 'name_desc', 'level_desc', 'recent', 'oldest'"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna candidatos para conversa privada 1-a-1 com paginação e filtros."""
    return get_dm_candidates(
        db=db,
        current_user_id=current_user.id,
        search=search,
        role=role,
        course_id=course_id,
        order_by=order_by,
        page=page,
        limit=limit,
    )
