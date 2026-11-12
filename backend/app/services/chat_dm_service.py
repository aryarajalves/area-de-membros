"""
Serviço dedicado para gerenciamento de Mensagens Diretas (DMs) entre usuários:
- Listagem de conversas na Inbox (todas ou apenas com mensagens não lidas)
- Histórico de mensagens privadas 1-a-1
- Envio de DM e marcação como lida
"""
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, func, asc
from fastapi import HTTPException, status

from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatUser, ChatDmConversationItem, ChatAdminDmConversationItem, ChatMessageResponse
from app.services.chat_encryption_service import decrypt_dm_message
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

        # Mensagens entre current_user e contact_user (incluindo respostas de superadmin na thread)
        msg_query = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.channel_type == "dm",
                or_(
                    and_(ChatMessage.user_id == current_user.id, ChatMessage.recipient_id == c_id),
                    and_(ChatMessage.user_id == c_id, ChatMessage.recipient_id == current_user.id),
                    and_(ChatMessage.dm_thread_admin_id == c_id, ChatMessage.recipient_id == current_user.id),
                    and_(ChatMessage.dm_thread_admin_id == current_user.id, ChatMessage.recipient_id == c_id),
                ),
            )
        )
        if current_user.role not in ("superadmin", "admin"):
            msg_query = msg_query.filter(ChatMessage.is_deleted == False)

        last_msg = msg_query.order_by(desc(ChatMessage.created_at), desc(ChatMessage.id)).first()

        unread_count = (
            db.query(func.count(ChatMessage.id))
            .filter(
                ChatMessage.channel_type == "dm",
                ChatMessage.user_id == c_id,
                ChatMessage.recipient_id == current_user.id,
                ChatMessage.is_read == False,
                ChatMessage.is_deleted == False,
            )
            .scalar()
            or 0
        )

        if unread_only and unread_count == 0:
            continue

        def _format_dm_preview(msg):
            if not msg:
                return None
            decrypted_text = decrypt_dm_message(msg.message)
            if decrypted_text and decrypted_text.strip():
                return decrypted_text.strip()
            if msg.media_url:
                m_type = msg.media_type or ""
                if m_type == "image":
                    return "📷 [Foto/GIF]"
                elif m_type == "video":
                    return "🎥 [Vídeo]"
                elif m_type == "audio":
                    return "🎤 [Áudio]"
                elif m_type == "file":
                    return "📄 [Documento]"
                return "📎 [Mídia]"
            return None

        conversations.append(
            ChatDmConversationItem(
                contact=ChatUser(
                    id=contact_user.id,
                    name=contact_user.name,
                    email=contact_user.email,
                    role=contact_user.role,
                    avatar_url=contact_user.avatar_url,
                ),
                last_message=_format_dm_preview(last_msg),
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
        chat_manager.send_to_user_sync(
            contact_id,
            "dm_read",
            {"reader_id": current_user.id, "contact_id": current_user.id}
        )


    query = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.channel_type == "dm",
            or_(
                and_(ChatMessage.user_id == current_user.id, ChatMessage.recipient_id == contact_id),
                and_(ChatMessage.user_id == contact_id, ChatMessage.recipient_id == current_user.id),
                and_(ChatMessage.dm_thread_admin_id == contact_id, ChatMessage.recipient_id == current_user.id),
                and_(ChatMessage.dm_thread_admin_id == current_user.id, ChatMessage.recipient_id == contact_id),
            ),
        )
    )

    if current_user.role not in ("superadmin", "admin"):
        query = query.filter(ChatMessage.is_deleted == False)

    query = query.order_by(desc(ChatMessage.id))

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
                dm_thread_admin_id=msg.dm_thread_admin_id,
                message=decrypt_dm_message(msg.message) or "",
                media_url=msg.media_url,
                media_type=msg.media_type,
                is_pinned=False,
                pinned_at=None,
                pinned_by_user_id=None,
                is_read=msg.is_read,
                read_at=msg.read_at,
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
                is_deleted=bool(msg.is_deleted),
                deleted_at=msg.deleted_at,
                deleted_by_user_id=msg.deleted_by_user_id,
            )
        )
    return result


def get_superadmin_admin_conversations(
    db: Session,
    unread_only: bool = False,
    limit: int = 50,
) -> List[ChatAdminDmConversationItem]:
    """
    Retorna para o Super Admin todas as conversas entre Alunos e Administradores da plataforma.
    Permite auditar atendimentos, identificar alunos sem resposta e intervir quando necessário.
    """
    # 1. Obter IDs de todos os administradores cadastrados
    admins = db.query(User).filter(User.role == "admin").all()
    if not admins:
        return []

    admin_ids = {a.id for a in admins}
    admin_map = {a.id: a for a in admins}

    # 2. Buscar todas as mensagens de DM que envolvam esses administradores
    dms = (
        db.query(ChatMessage.user_id, ChatMessage.recipient_id, ChatMessage.dm_thread_admin_id)
        .filter(
            ChatMessage.channel_type == "dm",
            or_(
                ChatMessage.user_id.in_(admin_ids),
                ChatMessage.recipient_id.in_(admin_ids),
                ChatMessage.dm_thread_admin_id.in_(admin_ids),
            ),
        )
        .distinct()
        .all()
    )

    pairs = set()
    for row in dms:
        u_id, r_id, thread_admin_id = row[0], row[1], row[2]
        if thread_admin_id and thread_admin_id in admin_ids:
            # Mensagem em thread de admin enviada por superadmin ou aluno
            if r_id and r_id not in admin_ids:
                pairs.add((r_id, thread_admin_id))
            elif u_id and u_id not in admin_ids:
                pairs.add((u_id, thread_admin_id))
        elif u_id in admin_ids and r_id and r_id not in admin_ids:
            pairs.add((r_id, u_id))  # (student_id, admin_id)
        elif r_id in admin_ids and u_id and u_id not in admin_ids:
            pairs.add((u_id, r_id))  # (student_id, admin_id)

    if not pairs:
        return []

    # 3. Carregar dados dos alunos envolvidos
    student_ids = {p[0] for p in pairs}
    students = db.query(User).filter(User.id.in_(student_ids)).all()
    student_map = {s.id: s for s in students}

    conversations: List[ChatAdminDmConversationItem] = []

    def _format_dm_preview(msg):
        if not msg:
            return None
        decrypted_text = decrypt_dm_message(msg.message)
        if decrypted_text and decrypted_text.strip():
            return decrypted_text.strip()
        if msg.media_url:
            m_type = msg.media_type or ""
            if m_type == "image":
                return "📷 [Foto/GIF]"
            elif m_type == "video":
                return "🎥 [Vídeo]"
            elif m_type == "audio":
                return "🎤 [Áudio]"
            elif m_type == "file":
                return "📄 [Documento]"
            return "📎 [Mídia]"
        return None

    for student_id, admin_id in pairs:
        student_user = student_map.get(student_id)
        admin_user = admin_map.get(admin_id)
        if not student_user or not admin_user:
            continue

        thread_filter = or_(
            and_(ChatMessage.user_id == student_id, ChatMessage.recipient_id == admin_id),
            and_(ChatMessage.user_id == admin_id, ChatMessage.recipient_id == student_id),
            and_(ChatMessage.dm_thread_admin_id == admin_id, ChatMessage.recipient_id == student_id),
        )

        last_msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.channel_type == "dm", thread_filter)
            .order_by(desc(ChatMessage.created_at), desc(ChatMessage.id))
            .first()
        )

        # Mensagens enviadas pelo aluno para o administrador que ainda não foram lidas
        unread_by_admin = (
            db.query(func.count(ChatMessage.id))
            .filter(
                ChatMessage.channel_type == "dm",
                ChatMessage.user_id == student_id,
                ChatMessage.recipient_id == admin_id,
                ChatMessage.is_read == False,
            )
            .scalar()
            or 0
        )

        total_msgs = (
            db.query(func.count(ChatMessage.id))
            .filter(ChatMessage.channel_type == "dm", thread_filter)
            .scalar()
            or 0
        )

        if unread_only and unread_by_admin == 0:
            continue

        conversations.append(
            ChatAdminDmConversationItem(
                student=ChatUser(
                    id=student_user.id,
                    name=student_user.name,
                    email=student_user.email,
                    role=student_user.role,
                    avatar_url=student_user.avatar_url,
                ),
                admin=ChatUser(
                    id=admin_user.id,
                    name=admin_user.name,
                    email=admin_user.email,
                    role=admin_user.role,
                    avatar_url=admin_user.avatar_url,
                ),
                last_message=_format_dm_preview(last_msg),
                last_message_at=last_msg.created_at if last_msg else None,
                unread_by_admin=unread_by_admin,
                total_messages=total_msgs,
            )
        )

    # Ordenar por data da última mensagem (mais recente primeiro)
    conversations.sort(
        key=lambda x: x.last_message_at or datetime.min,
        reverse=True,
    )
    return conversations[:limit]


def get_superadmin_thread_messages(
    db: Session,
    student_id: int,
    admin_id: int,
    limit: int = 50,
    before_id: Optional[int] = None,
) -> List[ChatMessageResponse]:
    """
    Retorna o histórico de mensagens entre um Aluno e um Administrador para visualização pelo Super Admin.
    REGRA CRÍTICA: NÃO altera 'is_read' para True, garantindo que o administrador destinatário
    continue ciente de mensagens pendentes em seu login.
    """
    student = db.query(User).filter(User.id == student_id).first()
    admin = db.query(User).filter(User.id == admin_id).first()

    if not student or not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno ou Administrador não encontrado.",
        )

    thread_filter = or_(
        and_(ChatMessage.user_id == student_id, ChatMessage.recipient_id == admin_id),
        and_(ChatMessage.user_id == admin_id, ChatMessage.recipient_id == student_id),
        and_(ChatMessage.dm_thread_admin_id == admin_id, ChatMessage.recipient_id == student_id),
    )

    query = (
        db.query(ChatMessage)
        .options(joinedload(ChatMessage.user), joinedload(ChatMessage.recipient))
        .filter(ChatMessage.channel_type == "dm", thread_filter)
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
                dm_thread_admin_id=msg.dm_thread_admin_id,
                message=decrypt_dm_message(msg.message) or "",
                media_url=msg.media_url,
                media_type=msg.media_type,
                is_pinned=False,
                pinned_at=None,
                pinned_by_user_id=None,
                is_read=msg.is_read,
                read_at=msg.read_at,
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
                can_delete=True,
                is_deleted=bool(msg.is_deleted),
                deleted_at=msg.deleted_at,
                deleted_by_user_id=msg.deleted_by_user_id,
            )
        )
    return result

