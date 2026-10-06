from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status
from app.models.chat import ChatMessage, ChatMessageMention
from app.models.user import User
from app.schemas.chat import (
    ChatMentionContactItem,
    ChatMentionNotificationItem,
    ChatNotificationItem,
    ChatNotificationCountsResponse,
    ChatUser,
)


def get_mentionable_contacts(db: Session, limit: int = 100) -> List[ChatMentionContactItem]:
    """Lista usuários ativos para sugestão ao digitar @."""
    users = (
        db.query(User)
        .filter(User.is_active == True)
        .order_by(User.name.asc())
        .limit(limit)
        .all()
    )
    return [
        ChatMentionContactItem(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            avatar_url=u.avatar_url,
        )
        for u in users
    ]


def get_chat_media_gallery_items(
    db: Session,
    channel_type: str,
    course_id: Optional[int],
    media_type: Optional[str],
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    """Lista as mensagens com anexos de mídias para a galeria."""
    query = db.query(ChatMessage).filter(
        ChatMessage.channel_type == channel_type,
        ChatMessage.media_url.isnot(None),
        ChatMessage.media_url != "",
    )
    if channel_type == "course":
        query = query.filter(ChatMessage.course_id == course_id)

    if media_type and media_type != "all":
        if media_type == "file":
            query = query.filter(ChatMessage.media_type.in_(["file", "document"]))
        else:
            query = query.filter(ChatMessage.media_type == media_type)

    total = query.count()
    messages = query.order_by(desc(ChatMessage.id)).offset(offset).limit(limit).all()

    items = []
    for msg in messages:
        items.append({
            "id": msg.id,
            "message": msg.message or "",
            "media_url": msg.media_url,
            "media_type": msg.media_type or "file",
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
            "user": {
                "id": msg.user.id if msg.user else 0,
                "name": msg.user.name if msg.user else "Usuário Desconhecido",
                "email": msg.user.email if msg.user else "",
                "role": msg.user.role if msg.user else "aluno",
                "avatar_url": msg.user.avatar_url if msg.user else None,
            }
        })

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def get_user_chat_notifications(
    db: Session,
    user: User,
    tab: str = "inbox",
    limit: int = 50,
) -> List[ChatNotificationItem]:
    """
    Retorna notificações unificadas do chat para o usuário:
    - 'inbox': Todas as não lidas (menções + respostas em threads)
    - 'mentions': Todas as menções com @ ao usuário
    - 'threads': Respostas dentro das threads iniciadas pelo usuário
    - 'all': Todas combinadas (lidas e não lidas)
    """
    notifications: List[ChatNotificationItem] = []

    # 1. Menções
    if tab in ("inbox", "mentions", "all"):
        query_m = (
            db.query(ChatMessageMention)
            .join(ChatMessage, ChatMessage.id == ChatMessageMention.message_id)
            .filter(ChatMessageMention.mentioned_user_id == user.id)
        )
        if tab == "inbox":
            query_m = query_m.filter(ChatMessageMention.is_read == False)

        mentions = query_m.order_by(desc(ChatMessageMention.created_at)).limit(limit).all()
        for m in mentions:
            msg = m.message
            sender_user = msg.user if msg else None
            sender_info = ChatUser(
                id=sender_user.id if sender_user else 0,
                name=sender_user.name if sender_user else "Usuário Desconhecido",
                email=sender_user.email if sender_user else "",
                role=sender_user.role if sender_user else "aluno",
                avatar_url=sender_user.avatar_url if sender_user else None,
            )
            notifications.append(
                ChatNotificationItem(
                    id=m.id,
                    type="mention",
                    message_id=m.message_id,
                    parent_id=msg.parent_id if msg else None,
                    channel_type=msg.channel_type if msg else "general",
                    course_id=msg.course_id if msg else None,
                    message_text=msg.message if msg else "",
                    sender=sender_info,
                    created_at=m.created_at,
                    is_read=m.is_read,
                )
            )

    # 2. Respostas em Threads do usuário
    if tab in ("inbox", "threads", "all"):
        # Mensagens que são respostas (parent_id is not None)
        # onde o criador da mensagem pai (parent.user_id) é o usuário atual
        # e quem respondeu não é o próprio usuário (user_id != user.id)
        from sqlalchemy.orm import aliased
        ParentMessage = aliased(ChatMessage)

        query_t = (
            db.query(ChatMessage)
            .join(ParentMessage, ChatMessage.parent_id == ParentMessage.id)
            .filter(
                ChatMessage.parent_id.isnot(None),
                ParentMessage.user_id == user.id,
                ChatMessage.user_id != user.id,
            )
        )
        if tab == "inbox":
            query_t = query_t.filter(ChatMessage.is_read == False)

        threads = query_t.order_by(desc(ChatMessage.created_at)).limit(limit).all()
        for t in threads:
            sender_user = t.user
            sender_info = ChatUser(
                id=sender_user.id if sender_user else 0,
                name=sender_user.name if sender_user else "Usuário Desconhecido",
                email=sender_user.email if sender_user else "",
                role=sender_user.role if sender_user else "aluno",
                avatar_url=sender_user.avatar_url if sender_user else None,
            )
            notifications.append(
                ChatNotificationItem(
                    id=t.id,
                    type="thread_reply",
                    message_id=t.id,
                    parent_id=t.parent_id,
                    channel_type=t.channel_type or "general",
                    course_id=t.course_id,
                    message_text=t.message or "",
                    sender=sender_info,
                    created_at=t.created_at,
                    is_read=t.is_read,
                )
            )

    # Ordenar por mais recentes decrescente
    notifications.sort(key=lambda x: x.created_at, reverse=True)
    return notifications[:limit]


def get_chat_notification_counts(db: Session, user: User) -> ChatNotificationCountsResponse:
    """Retorna os contadores de notificações não lidas."""
    from sqlalchemy.orm import aliased
    ParentMessage = aliased(ChatMessage)

    unread_mentions = (
        db.query(ChatMessageMention)
        .filter(
            ChatMessageMention.mentioned_user_id == user.id,
            ChatMessageMention.is_read == False,
        )
        .count()
    )

    unread_threads = (
        db.query(ChatMessage)
        .join(ParentMessage, ChatMessage.parent_id == ParentMessage.id)
        .filter(
            ChatMessage.parent_id.isnot(None),
            ParentMessage.user_id == user.id,
            ChatMessage.user_id != user.id,
            ChatMessage.is_read == False,
        )
        .count()
    )

    return ChatNotificationCountsResponse(
        inbox=unread_mentions + unread_threads,
        mentions=unread_mentions,
        threads=unread_threads,
        total_unread=unread_mentions + unread_threads,
    )


def mark_user_mention_read(db: Session, user: User, mention_id: int):
    """Marca menção individual como lida e notifica via WebSocket."""
    mention = (
        db.query(ChatMessageMention)
        .filter(
            ChatMessageMention.id == mention_id,
            ChatMessageMention.mentioned_user_id == user.id,
        )
        .first()
    )
    if not mention:
        raise HTTPException(status_code=404, detail="Menção não encontrada.")
    mention.is_read = True
    db.commit()
    from app.services.chat_ws_manager import chat_manager
    chat_manager.send_to_user_sync(user.id, "notifications_updated", {"user_id": user.id})
    return {"ok": True, "message": "Menção marcada como lida."}


def mark_user_all_notifications_read(db: Session, user: User):
    """Marca todas as notificações do usuário como lidas e notifica via WebSocket."""
    from sqlalchemy.orm import aliased
    ParentMsg = aliased(ChatMessage)

    db.query(ChatMessageMention).filter(
        ChatMessageMention.mentioned_user_id == user.id,
        ChatMessageMention.is_read == False,
    ).update({"is_read": True}, synchronize_session=False)

    thread_messages = (
        db.query(ChatMessage)
        .join(ParentMsg, ChatMessage.parent_id == ParentMsg.id)
        .filter(
            ChatMessage.parent_id.isnot(None),
            ParentMsg.user_id == user.id,
            ChatMessage.user_id != user.id,
            ChatMessage.is_read == False,
        )
        .all()
    )
    for tm in thread_messages:
        tm.is_read = True

    db.commit()
    from app.services.chat_ws_manager import chat_manager
    chat_manager.send_to_user_sync(user.id, "notifications_updated", {"user_id": user.id})
    return {"ok": True, "message": "Todas as notificações foram marcadas como lidas."}


