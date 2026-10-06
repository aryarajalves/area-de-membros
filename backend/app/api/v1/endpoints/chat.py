import json
import os
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func

from app.core.database import get_db, SessionLocal
from app.core.logger import logger
from app.core.security import decode_access_token
from app.api.v1.endpoints.users import get_current_user, require_admin_or_superadmin
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.chat import ChatMessage, ChatMessageLike, ChatMessageFavorite, ChatMessageMention
from app.schemas.chat import (
    ChatChannelItem,
    ChatMessageResponse,
    ChatMessageCreate,
    ChatUser,
    ChatMessageLikeToggleResponse,
    ChatMessageFavoriteToggleResponse,
    ChatMentionNotificationItem,
    ChatNotificationItem,
    ChatNotificationCountsResponse,
    ChatMentionContactItem,
    ChatDmConversationItem,
    ChatUnreadSummaryResponse,
)
from app.services.chat_ws_manager import chat_manager
from app.services.chat_media_service import process_chat_media_upload, CHAT_MEDIA_DIR
from app.services.chat_dm_service import get_user_dm_conversations, get_dm_messages_history
from app.services.chat_unread_service import (
    get_channel_last_read_map,
    get_channel_unread_count,
    get_user_chat_unread_summary,
    mark_channel_as_read,
    get_channel_items_list,
)
from app.services.chat_query_service import (
    get_chat_media_gallery_items,
    get_mentionable_contacts,
    get_user_chat_notifications,
    get_chat_notification_counts,
    mark_user_mention_read,
    mark_user_all_notifications_read,
)


router = APIRouter(tags=["Chat da Comunidade"])



def check_channel_access(user: User, channel_type: str, course_id: Optional[int], db: Session) -> bool:
    """
    Verifica se o usuário tem permissão para visualizar e enviar mensagens no canal.
    - 'general': Liberado para todos os usuários ativos.
    - 'course': Se admin/superadmin, liberado. Se aluno, requer vínculo ativo ao curso.
    """
    if channel_type == "general":
        return True

    if channel_type == "dm":
        return True

    if channel_type == "course":
        if not course_id:
            return False
        if user.role in ("superadmin", "admin"):
            return True
        now = datetime.now(timezone.utc)
        user_course = db.query(UserCourse).filter(
            UserCourse.user_id == user.id,
            UserCourse.course_id == course_id,
            or_(UserCourse.expires_at.is_(None), UserCourse.expires_at > now),
        ).first()
        return user_course is not None

    return False


@router.get(
    "/channels",
    response_model=List[ChatChannelItem],
    summary="Listar Canais de Chat Disponíveis",
    description="Retorna a Comunidade Geral e os canais dedicados dos cursos aos quais o usuário tem acesso."
)
def list_chat_channels(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna os canais de bate-papo disponíveis para o usuário:
    - Comunidade Geral (sempre presente)
    - Canais dos cursos (todos para admins, vinculados ativos para alunos)
    """
    return get_channel_items_list(db, current_user)


@router.get(
    "/unread-summary",
    response_model=ChatUnreadSummaryResponse,
    summary="Resumo de Mensagens Não Lidas",
    description="Retorna a contagem total de mensagens não lidas no Chat (canais públicos e DMs) para o badge de notificação.",
)
def get_unread_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna contagem consolidada de mensagens não lidas para o usuário."""
    return get_user_chat_unread_summary(db, current_user)


@router.post(
    "/channels/{channel_id}/read",
    summary="Marcar Canal como Lido",
    description="Atualiza o ponteiro de última mensagem lida no canal pelo usuário.",
)
def mark_channel_read(
    channel_id: str,
    last_message_id: Optional[int] = Query(default=None, description="ID da última mensagem lida"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marca o canal como lido e zera a contagem de mensagens pendentes naquele canal."""
    saved_id = mark_channel_as_read(db, current_user.id, channel_id, last_message_id)
    return {"status": "ok", "channel_id": channel_id, "last_read_message_id": saved_id}


@router.get(
    "/messages",
    response_model=List[ChatMessageResponse],
    summary="Listar Mensagens de um Canal",
    description="Retorna o histórico de mensagens ordenado cronologicamente, com suporte a polling incremental."
)
def get_channel_messages(
    channel_type: str = Query(default="general", description="'general' ou 'course'"),
    course_id: Optional[int] = Query(default=None, description="ID do curso se canal for 'course'"),
    parent_id: Optional[int] = Query(default=None, description="Filtrar respostas da thread da mensagem com este ID"),
    limit: int = Query(default=50, ge=1, le=100, description="Quantidade de mensagens a retornar"),
    before_id: Optional[int] = Query(default=None, description="Buscar mensagens anteriores a esse ID (scroll infinito)"),
    after_id: Optional[int] = Query(default=None, description="Buscar novas mensagens posteriores a esse ID (polling)"),
    favorites_only: bool = Query(default=False, description="Filtrar apenas mensagens favoritadas pelo usuário logado"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna as mensagens do canal especificado.
    Se parent_id for informado, retorna as mensagens da thread.
    Caso contrário, retorna apenas as mensagens principais (parent_id IS NULL) do canal.
    """
    if not check_channel_access(current_user, channel_type, course_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este canal de bate-papo.",
        )

    query = db.query(ChatMessage).filter(ChatMessage.channel_type == channel_type)
    if channel_type == "course":
        query = query.filter(ChatMessage.course_id == course_id)

    if parent_id is not None:
        query = query.filter(ChatMessage.parent_id == parent_id)
    elif not favorites_only:
        # No feed principal do canal, listar mensagens raízes (parent_id is None)
        query = query.filter(ChatMessage.parent_id.is_(None))

    if favorites_only:
        fav_ids_query = db.query(ChatMessageFavorite.message_id).filter(
            ChatMessageFavorite.user_id == current_user.id
        )
        query = query.filter(ChatMessage.id.in_(fav_ids_query))

    if after_id:
        query = query.filter(ChatMessage.id > after_id).order_by(asc(ChatMessage.id))
        messages = query.limit(limit).all()
    elif before_id:
        query = query.filter(ChatMessage.id < before_id).order_by(desc(ChatMessage.id))
        messages = query.limit(limit).all()
        messages.reverse()
    else:
        query = query.order_by(desc(ChatMessage.id))
        messages = query.limit(limit).all()
        messages.reverse()

    is_privileged = current_user.role in ("superadmin", "admin")
    all_msg_ids = [msg.id for msg in messages]

    user_liked_set = set()
    user_favorited_set = set()
    likes_count_map = {}
    reply_count_map = {}

    if all_msg_ids:
        user_likes = db.query(ChatMessageLike.message_id).filter(
            ChatMessageLike.message_id.in_(all_msg_ids),
            ChatMessageLike.user_id == current_user.id
        ).all()
        user_liked_set = {row[0] for row in user_likes}

        user_favs = db.query(ChatMessageFavorite.message_id).filter(
            ChatMessageFavorite.message_id.in_(all_msg_ids),
            ChatMessageFavorite.user_id == current_user.id
        ).all()
        user_favorited_set = {row[0] for row in user_favs}

        counts = db.query(
            ChatMessageLike.message_id,
            func.count(ChatMessageLike.id)
        ).filter(
            ChatMessageLike.message_id.in_(all_msg_ids)
        ).group_by(ChatMessageLike.message_id).all()
        likes_count_map = {row[0]: row[1] for row in counts}

        # Contagem de respostas de thread por mensagem
        replies_counts = db.query(
            ChatMessage.parent_id,
            func.count(ChatMessage.id)
        ).filter(
            ChatMessage.parent_id.in_(all_msg_ids)
        ).group_by(ChatMessage.parent_id).all()
        reply_count_map = {row[0]: row[1] for row in replies_counts}

    result = []
    for msg in messages:
        user_info = ChatUser(
            id=msg.user.id if msg.user else 0,
            name=msg.user.name if msg.user else "Usuário Desconhecido",
            email=msg.user.email if msg.user else "",
            role=msg.user.role if msg.user else "aluno",
            avatar_url=msg.user.avatar_url if msg.user else None,
        )
        can_del = is_privileged or (msg.user_id == current_user.id)
        result.append(
            ChatMessageResponse(
                id=msg.id,
                channel_type=msg.channel_type,
                course_id=msg.course_id,
                parent_id=msg.parent_id,
                message=msg.message or "",
                media_url=msg.media_url,
                media_type=msg.media_type,
                button_text=msg.button_text,
                button_url=msg.button_url,
                button_action_type=msg.button_action_type,
                is_pinned=bool(msg.is_pinned),
                pinned_at=msg.pinned_at,
                pinned_by_user_id=msg.pinned_by_user_id,
                likes_count=likes_count_map.get(msg.id, 0),
                liked_by_me=msg.id in user_liked_set,
                is_favorited=msg.id in user_favorited_set,
                reply_count=reply_count_map.get(msg.id, 0),
                created_at=msg.created_at,
                user=user_info,
                can_delete=can_del,
            )
        )

    return result


@router.get(
    "/pinned-message",
    response_model=Optional[ChatMessageResponse],
    summary="Obter Mensagem Fixada do Canal"
)
def get_pinned_message(
    channel_type: str = Query(default="general"),
    course_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna a mensagem fixada atual no canal informado."""
    if not check_channel_access(current_user, channel_type, course_id, db):
        raise HTTPException(status_code=403, detail="Acesso não autorizado ao canal.")

    query = db.query(ChatMessage).filter(
        ChatMessage.channel_type == channel_type,
        ChatMessage.is_pinned == True
    )
    if channel_type == "course":
        query = query.filter(ChatMessage.course_id == course_id)

    msg = query.order_by(desc(ChatMessage.pinned_at), desc(ChatMessage.id)).first()
    if not msg:
        return None

    user_info = ChatUser(
        id=msg.user.id if msg.user else 0,
        name=msg.user.name if msg.user else "Usuário Desconhecido",
        email=msg.user.email if msg.user else "",
        role=msg.user.role if msg.user else "aluno",
        avatar_url=msg.user.avatar_url if msg.user else None,
    )
    is_privileged = current_user.role in ("superadmin", "admin")
    likes_count = db.query(func.count(ChatMessageLike.id)).filter(ChatMessageLike.message_id == msg.id).scalar() or 0
    liked_by_me = db.query(ChatMessageLike).filter(ChatMessageLike.message_id == msg.id, ChatMessageLike.user_id == current_user.id).first() is not None
    is_fav = db.query(ChatMessageFavorite).filter(ChatMessageFavorite.message_id == msg.id, ChatMessageFavorite.user_id == current_user.id).first() is not None

    return ChatMessageResponse(
        id=msg.id,
        channel_type=msg.channel_type,
        course_id=msg.course_id,
        message=msg.message or "",
        media_url=msg.media_url,
        media_type=msg.media_type,
        is_pinned=True,
        pinned_at=msg.pinned_at,
        pinned_by_user_id=msg.pinned_by_user_id,
        likes_count=likes_count,
        liked_by_me=liked_by_me,
        is_favorited=is_fav,
        created_at=msg.created_at,
        user=user_info,
        can_delete=is_privileged or (msg.user_id == current_user.id),
    )


@router.post(
    "/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enviar Mensagem no Chat",
    description="Publica uma nova mensagem com texto e/ou mídia no canal informado."
)
def send_chat_message(
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Envia uma nova mensagem com texto e/ou mídia no canal especificado.
    """
    clean_text = (payload.message or "").strip()
    media_url = (payload.media_url or "").strip() or None
    media_type = payload.media_type or ("image" if media_url else None)

    if not clean_text and not media_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A mensagem deve conter texto ou mídia anexada.",
        )

    if not check_channel_access(current_user, payload.channel_type, payload.course_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para enviar mensagens neste canal.",
        )

    # Validar se parent_id pertence ao mesmo canal/curso
    parent_id = payload.parent_id
    if parent_id is not None:
        parent_msg = db.query(ChatMessage).filter(ChatMessage.id == parent_id).first()
        if not parent_msg or parent_msg.channel_type != payload.channel_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mensagem pai da thread não encontrada neste canal.",
            )

    try:
        new_msg = ChatMessage(
            channel_type=payload.channel_type,
            course_id=payload.course_id if payload.channel_type == "course" else None,
            parent_id=parent_id,
            user_id=current_user.id,
            recipient_id=payload.recipient_id if payload.channel_type == "dm" else None,
            message=clean_text,
            media_url=media_url,
            media_type=media_type,
            button_text=payload.button_text,
            button_url=payload.button_url,
            button_action_type=payload.button_action_type,
            is_pinned=False,
            is_read=False,
        )
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)

        # Detectar menções do tipo @Nome ou @Nome Sobrenome
        # Varre usuários ativos e cria registros em chat_mentions
        if "@" in clean_text:
            try:
                active_users = db.query(User).filter(User.is_active == True, User.id != current_user.id).all()
                mentioned_set = set()
                text_lower = clean_text.lower()
                for u in active_users:
                    if not u.name:
                        continue
                    # Checar menção por nome completo ou primeiro nome
                    mention_tag = f"@{u.name.lower()}"
                    first_name_tag = f"@{u.name.lower().split()[0]}" if len(u.name.split()) > 1 else None
                    if mention_tag in text_lower or (first_name_tag and first_name_tag in text_lower):
                        mentioned_set.add(u.id)

                for m_uid in mentioned_set:
                    mention_rec = ChatMessageMention(
                        message_id=new_msg.id,
                        mentioned_user_id=m_uid,
                        is_read=False,
                    )
                    db.add(mention_rec)
                if mentioned_set:
                    db.commit()
                    for m_uid in mentioned_set:
                        chat_manager.send_to_user_sync(
                            m_uid,
                            "new_notification",
                            {"user_id": m_uid, "type": "mention", "message_id": new_msg.id}
                        )
            except Exception as m_exc:
                logger.error(f"Erro ao processar menções no chat: {m_exc}")

        # Se for resposta em thread, notifica o autor da mensagem pai
        if parent_id is not None and parent_msg.user_id != current_user.id:
            chat_manager.send_to_user_sync(
                parent_msg.user_id,
                "new_notification",
                {"user_id": parent_msg.user_id, "type": "thread_reply", "message_id": new_msg.id}
            )

        # Gamificação: pontua aluno respeitando o limite diário de mensagens
        try:
            from app.services.gamification_service import award_points
            award_points(db, current_user, "chat_message", reference_id=new_msg.id)
        except Exception as g_exc:
            logger.error(f"Erro ao atribuir pontos de gamificação no chat: {g_exc}")

        logger.info(
            f"Mensagem enviada no chat [{payload.channel_type}] pelo usuário {current_user.email} (ID {current_user.id})"
        )

        user_info = ChatUser(
            id=current_user.id,
            name=current_user.name,
            email=current_user.email,
            role=current_user.role,
            avatar_url=current_user.avatar_url,
        )

        resp = ChatMessageResponse(
            id=new_msg.id,
            channel_type=new_msg.channel_type,
            course_id=new_msg.course_id,
            parent_id=new_msg.parent_id,
            recipient_id=new_msg.recipient_id,
            message=new_msg.message,
            media_url=new_msg.media_url,
            media_type=new_msg.media_type,
            button_text=new_msg.button_text,
            button_url=new_msg.button_url,
            button_action_type=new_msg.button_action_type,
            is_pinned=False,
            pinned_at=None,
            pinned_by_user_id=None,
            is_read=new_msg.is_read,
            likes_count=0,
            liked_by_me=False,
            is_favorited=False,
            reply_count=0,
            created_at=new_msg.created_at,
            user=user_info,
            can_delete=True,
        )

        chat_manager.broadcast_sync(
            "new_message",
            resp.model_dump(mode="json"),
            channel_type=new_msg.channel_type,
            course_id=new_msg.course_id,
        )

        if payload.channel_type == "dm" and payload.recipient_id:
            chat_manager.send_to_user_sync(
                payload.recipient_id,
                "new_dm",
                {
                    "recipient_id": payload.recipient_id,
                    "sender_id": current_user.id,
                    "message_id": new_msg.id,
                    "message": resp.model_dump(mode="json"),
                }
            )


        return resp
    except Exception as exc:
        db.rollback()
        logger.error(f"Erro ao salvar mensagem no chat: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao registrar mensagem no chat.",
        )


@router.post(
    "/messages/{message_id}/like",
    response_model=ChatMessageLikeToggleResponse,
    summary="Curtir / Descurtir Mensagem do Chat"
)
def toggle_chat_message_like(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Alterna a curtida em uma mensagem do chat pelo usuário autenticado."""
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mensagem não encontrada.")

    if not check_channel_access(current_user, msg.channel_type, msg.course_id, db):
        raise HTTPException(status_code=403, detail="Acesso não autorizado ao canal da mensagem.")

    existing_like = db.query(ChatMessageLike).filter(
        ChatMessageLike.message_id == message_id,
        ChatMessageLike.user_id == current_user.id
    ).first()

    if existing_like:
        db.delete(existing_like)
        db.commit()
        liked_by_me = False
    else:
        new_like = ChatMessageLike(
            message_id=message_id,
            user_id=current_user.id
        )
        db.add(new_like)
        db.commit()
        liked_by_me = True

        try:
            from app.services.gamification_service import award_points
            author = db.query(User).filter(User.id == msg.user_id).first()
            if author and author.id != current_user.id and author.role == "aluno":
                award_points(db, author, "chat_like_received", reference_id=msg.id)
        except Exception as g_exc:
            logger.error(f"Erro ao pontuar curtida em mensagem do chat: {g_exc}")

    count = db.query(func.count(ChatMessageLike.id)).filter(ChatMessageLike.message_id == message_id).scalar() or 0
    resp_like = ChatMessageLikeToggleResponse(
        message_id=message_id,
        likes_count=count,
        liked_by_me=liked_by_me,
        liked=liked_by_me,
    )
    chat_manager.broadcast_sync(
        "message_liked",
        {
            "message_id": message_id,
            "likes_count": count,
            "user_id": current_user.id,
            "liked": liked_by_me,
        },
        channel_type=msg.channel_type,
        course_id=msg.course_id,
    )
    return resp_like


@router.post(
    "/messages/{message_id}/favorite",
    response_model=ChatMessageFavoriteToggleResponse,
    summary="Favoritar / Desfavoritar Mensagem do Chat"
)
def toggle_chat_message_favorite(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Alterna o status de favorita para a mensagem do chat pelo usuário autenticado."""
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mensagem não encontrada.")

    if not check_channel_access(current_user, msg.channel_type, msg.course_id, db):
        raise HTTPException(status_code=403, detail="Acesso não autorizado ao canal da mensagem.")

    existing_fav = db.query(ChatMessageFavorite).filter(
        ChatMessageFavorite.message_id == message_id,
        ChatMessageFavorite.user_id == current_user.id
    ).first()

    if existing_fav:
        db.delete(existing_fav)
        db.commit()
        chat_manager.send_to_user_sync(current_user.id, "favorites_updated", {"user_id": current_user.id, "message_id": message_id})
        is_favorited = False
    else:
        new_fav = ChatMessageFavorite(
            message_id=message_id,
            user_id=current_user.id
        )
        db.add(new_fav)
        db.commit()
        chat_manager.send_to_user_sync(current_user.id, "favorites_updated", {"user_id": current_user.id, "message_id": message_id})
        is_favorited = True

    return ChatMessageFavoriteToggleResponse(
        message_id=message_id,
        is_favorited=is_favorited,
        favorited=is_favorited,
    )



@router.patch(
    "/messages/{message_id}/pin",
    response_model=ChatMessageResponse,
    summary="Fixar / Desafixar Mensagem no Chat",
    description="Apenas administradores e superadmins podem fixar ou desafixar mensagens no topo do chat."
)
def toggle_pin_chat_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Fixa ou desafixa uma mensagem no topo do canal do chat (restrito a gestores)."""
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mensagem não encontrada.")

    if msg.is_pinned:
        msg.is_pinned = False
        msg.pinned_at = None
        msg.pinned_by_user_id = None
        logger.info(f"Mensagem ID {message_id} desafixada por {current_user.email}")
    else:
        msg.is_pinned = True
        msg.pinned_at = datetime.now(timezone.utc)
        msg.pinned_by_user_id = current_user.id
        logger.info(f"Mensagem ID {message_id} fixada por {current_user.email}")

    db.commit()
    db.refresh(msg)

    user_info = ChatUser(
        id=msg.user.id if msg.user else 0,
        name=msg.user.name if msg.user else "Usuário Desconhecido",
        email=msg.user.email if msg.user else "",
        role=msg.user.role if msg.user else "aluno",
        avatar_url=msg.user.avatar_url if msg.user else None,
    )
    likes_count = db.query(func.count(ChatMessageLike.id)).filter(ChatMessageLike.message_id == msg.id).scalar() or 0
    liked_by_me = db.query(ChatMessageLike).filter(ChatMessageLike.message_id == msg.id, ChatMessageLike.user_id == current_user.id).first() is not None
    is_favorited = db.query(ChatMessageFavorite).filter(ChatMessageFavorite.message_id == msg.id, ChatMessageFavorite.user_id == current_user.id).first() is not None

    resp_pin = ChatMessageResponse(
        id=msg.id,
        channel_type=msg.channel_type,
        course_id=msg.course_id,
        message=msg.message or "",
        media_url=msg.media_url,
        media_type=msg.media_type,
        is_pinned=msg.is_pinned,
        pinned_at=msg.pinned_at,
        pinned_by_user_id=msg.pinned_by_user_id,
        likes_count=likes_count,
        liked_by_me=liked_by_me,
        is_favorited=is_favorited,
        created_at=msg.created_at,
        user=user_info,
        can_delete=True,
    )
    chat_manager.broadcast_sync(
        "message_pinned",
        {
            "message_id": msg.id,
            "is_pinned": msg.is_pinned,
            "pinned_at": msg.pinned_at.isoformat() if msg.pinned_at else None,
            "pinned_message": resp_pin.model_dump(mode="json") if msg.is_pinned else None,
        },
        channel_type=msg.channel_type,
        course_id=msg.course_id,
    )
    return resp_pin



@router.delete(
    "/messages/{message_id}",
    summary="Excluir Mensagem do Chat",
    description="Permite que o autor da mensagem ou um administrador exclua uma mensagem do chat."
)
def delete_chat_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Exclui a mensagem se o usuário for o autor ou tiver perfil de administrador.
    """
    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mensagem não encontrada.",
        )

    is_privileged = current_user.role in ("superadmin", "admin")
    if not is_privileged and msg.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para excluir esta mensagem.",
        )

    try:
        channel_type = msg.channel_type
        course_id = msg.course_id
        db.delete(msg)
        db.commit()
        logger.info(f"Mensagem ID {message_id} excluída por {current_user.email}")
        chat_manager.broadcast_sync(
            "message_deleted",
            {"message_id": message_id},
            channel_type=channel_type,
            course_id=course_id,
        )
        return {"ok": True, "message": "Mensagem excluída com sucesso."}
    except Exception as exc:
        db.rollback()
        logger.error(f"Erro ao excluir mensagem {message_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao excluir mensagem.",
        )


@router.post(
    "/upload-media",
    summary="Upload de Mídia para o Chat",
    description="Permite o envio de imagens (JPG, PNG, WEBP, GIF), vídeos (MP4, MOV, MKV), áudios (MP3, WAV, OGG, M4A, WEBM) ou documentos (PDF, DOCX, XLSX, TXT, ZIP) de até 25 MB para o chat."
)
async def upload_chat_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    return await process_chat_media_upload(file)


@router.get(
    "/media-gallery",
    summary="Listar Mídias e Documentos do Canal",
    description="Retorna todas as mensagens com mídias ou documentos anexados no canal selecionado."
)
def list_chat_media_gallery(
    channel_type: str = Query(default="general"),
    course_id: Optional[int] = Query(default=None),
    media_type: Optional[str] = Query(default=None, description="Filtro: all, image, video, audio, file"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista as mídias trocadas no canal para o popup de galeria de mídias."""
    if not check_channel_access(current_user, channel_type, course_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este canal de bate-papo.",
        )
    return get_chat_media_gallery_items(
        db, channel_type=channel_type, course_id=course_id, media_type=media_type, limit=limit, offset=offset
    )


@router.get(
    "/mention-contacts",
    response_model=List[ChatMentionContactItem],
    summary="Listar Contatos para Menção no Chat",
    description="Retorna usuários ativos para sugestão ao digitar @ na caixa de mensagens."
)
def list_mentionable_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista usuários da plataforma para autocomplete ao digitar @."""
    return get_mentionable_contacts(db, limit=100)


@router.get(
    "/mentions",
    response_model=List[ChatMentionNotificationItem],
    summary="Listar Mensagens em que o Usuário Foi Mencionado",
    description="Retorna as menções recebidas pelo usuário logado no chat."
)
def list_my_mentions(
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna a lista de mensagens em que o usuário foi citado com @."""
    mentions = (
        db.query(ChatMessageMention)
        .join(ChatMessage, ChatMessage.id == ChatMessageMention.message_id)
        .filter(ChatMessageMention.mentioned_user_id == current_user.id)
        .order_by(desc(ChatMessageMention.created_at))
        .limit(limit)
        .all()
    )

    result = []
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
        result.append(
            ChatMentionNotificationItem(
                id=m.id,
                message_id=m.message_id,
                channel_type=msg.channel_type if msg else "general",
                course_id=msg.course_id if msg else None,
                message_text=msg.message if msg else "",
                sender=sender_info,
                created_at=m.created_at,
                is_read=m.is_read,
            )
        )
    return result


@router.patch(
    "/mentions/{mention_id}/read",
    summary="Marcar Menção como Lida"
)
def mark_mention_as_read(
    mention_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marca uma notificação de menção como lida."""
    return mark_user_mention_read(db, current_user, mention_id)


@router.get(
    "/notifications",
    response_model=List[ChatNotificationItem],
    summary="Listar Notificações Unificadas do Chat",
    description="Retorna notificações agrupadas por abas: inbox (não lidas), mentions (menções @), threads (respostas) e all."
)
def list_chat_notifications(
    tab: str = Query(default="inbox", description="Aba: inbox | mentions | threads | all"),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna a lista de notificações para a Central de Notificações."""
    return get_user_chat_notifications(db, current_user, tab=tab, limit=limit)


@router.get(
    "/notifications/counts",
    response_model=ChatNotificationCountsResponse,
    summary="Contadores de Notificações Não Lidas",
    description="Retorna o total não lido na inbox, em menções e em threads."
)
def get_notification_counts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna os contadores numéricos para as abas de notificações."""
    return get_chat_notification_counts(db, current_user)


@router.post(
    "/notifications/mark-all-read",
    summary="Marcar Todas as Notificações como Lidas",
    description="Marca todas as menções e respostas em threads do usuário como lidas."
)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marca menções e respostas de threads pendentes do usuário como lidas."""
    return mark_user_all_notifications_read(db, current_user)



@router.get(
    "/dm/conversations",
    response_model=List[ChatDmConversationItem],
    summary="Listar Conversas de Mensagens Diretas (Inbox)",
    description="Retorna os contatos com histórico de DM e contagem de mensagens não lidas."
)
def list_dm_conversations(
    unread_only: bool = Query(default=False, description="Filtrar apenas conversas com mensagens não lidas"),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna as conversas da inbox privada de DMs."""
    return get_user_dm_conversations(db, current_user, unread_only=unread_only, limit=limit)


@router.get(
    "/dm/messages/{contact_id}",
    response_model=List[ChatMessageResponse],
    summary="Listar Mensagens Diretas com um Contato",
    description="Retorna o histórico de mensagens 1-a-1 com o contato e marca as mensagens como lidas."
)
def list_dm_messages(
    contact_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    before_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Busca as mensagens privadas trocadas com o contato especificado."""
    return get_dm_messages_history(db, current_user, contact_id=contact_id, limit=limit, before_id=before_id)



@router.get("/media/{filename}", include_in_schema=False)
def get_chat_media(filename: str):
    """Serve um arquivo de mídia do chat armazenado localmente no servidor."""
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(CHAT_MEDIA_DIR, safe_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    return FileResponse(filepath)


@router.websocket("/ws")
async def chat_websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Endpoint WebSocket para comunicação em tempo real no Chat da Comunidade.
    Permite receber novas mensagens, curtidas, fixações e exclusões instantaneamente.
    """
    auth_token = token
    if not auth_token:
        # Tenta extrair token da query string no scope caso Query não resolva no handshake
        query_str = websocket.scope.get("query_string", b"").decode("utf-8")
        if "token=" in query_str:
            for part in query_str.split("&"):
                if part.startswith("token="):
                    auth_token = part.split("=")[1]
                    break

    if not auth_token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(auth_token)
    if not payload or "sub" not in payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = payload.get("sub")
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_name = user.name
        user_role = user.role
        u_id = user.id
    except Exception as exc:
        logger.error(f"Erro ao autenticar usuário no WebSocket do Chat: {exc}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await chat_manager.connect(websocket, u_id, user_role, user_name)

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                msg_data = json.loads(raw_text)
                if msg_data.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        await chat_manager.disconnect(websocket)
    except Exception as exc:
        logger.debug(f"Desconexão no WebSocket do Chat: {exc}")
        await chat_manager.disconnect(websocket)

