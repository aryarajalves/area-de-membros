"""
Serviço dedicado para gerenciamento de Mensagens Diretas (DMs) entre usuários:
- Listagem de conversas na Inbox (todas ou apenas com mensagens não lidas)
- Histórico de mensagens privadas 1-a-1
- Envio de DM e marcação como lida
"""
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func, asc
from fastapi import HTTPException, status

from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatUser, ChatDmConversationItem, ChatMessageResponse
from app.core.logger import logger


def get_user_dm_conversations(
    db: Session,
    current_user: User,
    unread_only: bool = False,
    limit: int = 50,
) -> List[ChatDmConversationItem]:
    """
    Retorna a lista de contatos com os quais o usuário trocou mensagens diretas (DMs).
    Calcula a última mensagem trocada e a contagem de mensagens não lidas.
    """
    # 1. Encontrar todos os IDs de usuários que trocaram DM com o current_user
    sent_to = (
        db.query(ChatMessage.recipient_id)
        .filter(ChatMessage.channel_type == "dm", ChatMessage.user_id == current_user.id)
        .distinct()
        .all()
    )
    received_from = (
        db.query(ChatMessage.user_id)
        .filter(ChatMessage.channel_type == "dm", ChatMessage.recipient_id == current_user.id)
        .distinct()
        .all()
    )

    contact_ids = set()
    for row in sent_to:
        if row[0]:
            contact_ids.add(row[0])
    for row in received_from:
        if row[0]:
            contact_ids.add(row[0])

    if not contact_ids:
        return []

    # 2. Para cada contato, carregar dados, última mensagem e unread_count
    conversations: List[ChatDmConversationItem] = []
    contacts = db.query(User).filter(User.id.in_(contact_ids)).all()
    contact_map = {u.id: u for u in contacts}

    for c_id in contact_ids:
        contact_user = contact_map.get(c_id)
        if not contact_user:
            continue

        # Mensagens entre current_user e contact_user
        last_msg = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.channel_type == "dm",
                or_(
                    and_(ChatMessage.user_id == current_user.id, ChatMessage.recipient_id == c_id),
                    and_(ChatMessage.user_id == c_id, ChatMessage.recipient_id == current_user.id),
                ),
            )
            .order_by(desc(ChatMessage.created_at))
            .first()
        )

        unread_count = (
            db.query(func.count(ChatMessage.id))
            .filter(
                ChatMessage.channel_type == "dm",
                ChatMessage.user_id == c_id,
                ChatMessage.recipient_id == current_user.id,
                ChatMessage.is_read == False,
            )
            .scalar()
            or 0
        )

        if unread_only and unread_count == 0:
            continue

        conversations.append(
            ChatDmConversationItem(
                contact=ChatUser(
                    id=contact_user.id,
                    name=contact_user.name,
                    email=contact_user.email,
                    role=contact_user.role,
                    avatar_url=contact_user.avatar_url,
                ),
                last_message=last_msg.message if last_msg else None,
                last_message_at=last_msg.created_at if last_msg else None,
                unread_count=unread_count,
            )
        )

    # Ordenar por data da última mensagem (mais recente primeiro)
    conversations.sort(
        key=lambda x: x.last_message_at or datetime.min,
        reverse=True,
    )
    return conversations[:limit]


def get_dm_messages_history(
    db: Session,
    current_user: User,
    contact_id: int,
    limit: int = 50,
    before_id: Optional[int] = None,
) -> List[ChatMessageResponse]:
    """
    Retorna as mensagens privadas entre current_user e contact_id.
    Marca automaticamente as mensagens recebidas como lidas.
    """
    contact = db.query(User).filter(User.id == contact_id).first()
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contato não encontrado.",
        )

    # Marcar mensagens recebidas como lidas
    unread_msgs = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.channel_type == "dm",
            ChatMessage.user_id == contact_id,
            ChatMessage.recipient_id == current_user.id,
            ChatMessage.is_read == False,
        )
        .all()
    )
    now_utc = datetime.now(timezone.utc)
    for m in unread_msgs:
        m.is_read = True
        m.read_at = now_utc
    if unread_msgs:
        db.commit()
        from app.services.chat_ws_manager import chat_manager
        chat_manager.send_to_user_sync(
            current_user.id,
            "dm_read",
            {"user_id": current_user.id, "contact_id": contact_id}
        )


    query = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.channel_type == "dm",
            or_(
                and_(ChatMessage.user_id == current_user.id, ChatMessage.recipient_id == contact_id),
                and_(ChatMessage.user_id == contact_id, ChatMessage.recipient_id == current_user.id),
            ),
        )
        .order_by(desc(ChatMessage.id))
    )

    if before_id:
        query = query.filter(ChatMessage.id < before_id)

    messages = query.limit(limit).all()
    messages.reverse()

    result = []
    for msg in messages:
        sender_user = msg.user
        recipient_user = msg.recipient
        result.append(
            ChatMessageResponse(
                id=msg.id,
                channel_type="dm",
                course_id=None,
                parent_id=msg.parent_id,
                recipient_id=msg.recipient_id,
                message=msg.message or "",
                media_url=msg.media_url,
                media_type=msg.media_type,
                is_pinned=False,
                pinned_at=None,
                pinned_by_user_id=None,
                is_read=msg.is_read,
                button_text=msg.button_text,
                button_url=msg.button_url,
                button_action_type=msg.button_action_type,
                likes_count=0,
                liked_by_me=False,
                is_favorited=False,
                reply_count=0,
                created_at=msg.created_at,
                user=ChatUser(
                    id=sender_user.id if sender_user else 0,
                    name=sender_user.name if sender_user else "Usuário",
                    email=sender_user.email if sender_user else "",
                    role=sender_user.role if sender_user else "aluno",
                    avatar_url=sender_user.avatar_url if sender_user else None,
                ),
                recipient=ChatUser(
                    id=recipient_user.id if recipient_user else 0,
                    name=recipient_user.name if recipient_user else "Contato",
                    email=recipient_user.email if recipient_user else "",
                    role=recipient_user.role if recipient_user else "aluno",
                    avatar_url=recipient_user.avatar_url if recipient_user else None,
                ) if recipient_user else None,
                can_delete=(msg.user_id == current_user.id or current_user.role in ("superadmin", "admin")),
            )
        )
    return result
