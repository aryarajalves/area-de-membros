"""
Endpoints dedicados para:
- Reações com emoji em mensagens do chat e DM (ChatMessageReaction)
- Marcação de DM como lida (mark-read)
- Marcação de DM como não lida (mark-unread)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.endpoints.users import get_current_user
from app.models.user import User
from app.schemas.chat import (
    ChatMessageReactionToggleRequest,
    ChatMessageReactionToggleResponse,
    ChatDmMarkStatusResponse,
)
from app.services.chat_dm_service import (
    toggle_message_reaction,
    mark_dm_as_read,
    mark_dm_as_unread,
)

router = APIRouter()


@router.post(
    "/messages/{message_id}/reactions",
    response_model=ChatMessageReactionToggleResponse,
    summary="Alterna (adiciona/remove/substitui) uma reação com emoji em uma mensagem de chat ou DM",
)
def react_to_message(
    message_id: int,
    payload: ChatMessageReactionToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clean_emoji = payload.emoji.strip()
    if not clean_emoji:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Emoji inválido.",
        )
    return toggle_message_reaction(db, current_user, message_id, clean_emoji)


@router.post(
    "/dm/{contact_id}/mark-read",
    response_model=ChatDmMarkStatusResponse,
    summary="Marca todas as mensagens recebidas de um contato na DM como lidas",
)
def mark_contact_dm_as_read(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    marked_count = mark_dm_as_read(db, current_user, contact_id)
    return ChatDmMarkStatusResponse(
        success=True,
        contact_id=contact_id,
        marked_count=marked_count,
        is_read=True,
    )


@router.post(
    "/dm/{contact_id}/mark-unread",
    response_model=ChatDmMarkStatusResponse,
    summary="Marca a conversa de um contato na DM como não lida",
)
def mark_contact_dm_as_unread(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    marked_count = mark_dm_as_unread(db, current_user, contact_id)
    return ChatDmMarkStatusResponse(
        success=True,
        contact_id=contact_id,
        marked_count=marked_count,
        is_read=False,
    )
