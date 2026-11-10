from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from math import ceil
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func
from fastapi import HTTPException, status
from app.models.chat import ChatMessage, ChatMessageMention
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.gamification import GamificationPoint
from app.schemas.chat import (
    ChatMentionContactItem,
    ChatMentionNotificationItem,
    ChatNotificationItem,
    ChatNotificationCountsResponse,
    ChatUser,
    ChatMemberItem,
    ChatChannelMembersResponse,
    ChatDmCandidateItem,
    ChatDmCandidatesResponse,
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


def get_channel_members(
    db: Session,
    channel_type: str = "general",
    course_id: Optional[int] = None,
) -> ChatChannelMembersResponse:
    """
    Retorna os usuários que têm permissão para visualizar e participar deste canal de chat:
    - Super Admins (acesso global)
    - Administradores (acesso global)
    - Alunos:
        * 'general': Todos os alunos ativos cadastrados no sistema.
        * 'course': Alunos ativos com matrícula válida/não expirada no respectivo curso.
    """
    from app.services.chat_ws_manager import chat_manager

    online_ids = chat_manager.get_online_user_ids()
    channel_name = "Comunidade Geral"

    # 1. Super Admins
    superadmin_users = (
        db.query(User)
        .filter(User.role == "superadmin", User.is_active == True)
        .order_by(User.name.asc())
        .all()
    )

    # 2. Administradores
    admin_users = (
        db.query(User)
        .filter(User.role == "admin", User.is_active == True)
        .order_by(User.name.asc())
        .all()
    )

    # 3. Alunos
    if channel_type == "course" and course_id:
        course = db.query(Course).filter(Course.id == course_id).first()
        if course:
            channel_name = f"Curso: {course.title}"
        now = datetime.now(timezone.utc)
        student_users = (
            db.query(User)
            .join(UserCourse, User.id == UserCourse.user_id)
            .filter(
                UserCourse.course_id == course_id,
                User.role.in_(["aluno", "user"]),
                User.is_active == True,
                or_(UserCourse.expires_at.is_(None), UserCourse.expires_at > now),
            )
            .distinct()
            .order_by(User.name.asc())
            .all()
        )
    else:
        student_users = (
            db.query(User)
            .filter(User.role.in_(["aluno", "user"]), User.is_active == True)
            .order_by(User.name.asc())
            .all()
        )

    def _to_member_item(u: User) -> ChatMemberItem:
        return ChatMemberItem(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            avatar_url=u.avatar_url,
            phone=u.phone,
            created_at=u.created_at,
            is_online=u.id in online_ids,
        )

    superadmins_dto = [_to_member_item(u) for u in superadmin_users]
    admins_dto = [_to_member_item(u) for u in admin_users]
    students_dto = [_to_member_item(u) for u in student_users]

    total = len(superadmins_dto) + len(admins_dto) + len(students_dto)

    return ChatChannelMembersResponse(
        channel_type=channel_type,
        course_id=course_id,
        channel_name=channel_name,
        total_members=total,
        superadmins=superadmins_dto,
        admins=admins_dto,
        students=students_dto,
    )


def get_dm_candidates(
    db: Session,
    current_user_id: int,
    search: Optional[str] = None,
    role: Optional[str] = "all",
    course_id: Optional[int] = None,
    order_by: str = "name_asc",
    page: int = 1,
    limit: int = 20,
) -> ChatDmCandidatesResponse:
    """
    Lista usuários para iniciar uma nova conversa no DM com filtros avançados:
    - Busca por nome/e-mail
    - Filtro por perfil (all, superadmin, admin, aluno)
    - Filtro por curso matriculado
    - Ordenação (name_asc, name_desc, level_desc, recent, oldest)
    - Paginação de 20 por página
    """
    from app.services.chat_ws_manager import chat_manager
    from app.services.gamification_level_service import calculate_student_level

    query = db.query(User).filter(User.is_active == True, User.id != current_user_id)

    # 1. Filtro por Perfil
    if role and role != "all":
        if role == "admin":
            query = query.filter(User.role.in_(["admin", "superadmin"]))
        elif role == "aluno":
            query = query.filter(User.role.in_(["aluno", "user"]))
        elif role == "superadmin":
            query = query.filter(User.role == "superadmin")

    # 2. Filtro por Busca (Nome ou E-mail)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(User.name.ilike(term), User.email.ilike(term)))

    # 3. Filtro por Curso
    if course_id:
        query = query.join(UserCourse, UserCourse.user_id == User.id).filter(
            UserCourse.course_id == course_id
        )

    # 4. Ordenação
    if order_by == "level_desc":
        pts_subq = (
            db.query(
                GamificationPoint.user_id,
                func.coalesce(func.sum(GamificationPoint.points), 0).label("pts"),
            )
            .group_by(GamificationPoint.user_id)
            .subquery()
        )
        query = query.outerjoin(pts_subq, User.id == pts_subq.c.user_id).order_by(
            desc(func.coalesce(pts_subq.c.pts, 0)), User.name.asc()
        )
    elif order_by == "name_desc":
        query = query.order_by(User.name.desc())
    elif order_by == "recent":
        query = query.order_by(User.created_at.desc())
    elif order_by == "oldest":
        query = query.order_by(User.created_at.asc())
    else:  # name_asc padrão
        query = query.order_by(User.name.asc())

    total = query.count()
    pages = max(1, ceil(total / limit)) if limit > 0 else 1
    offset = max(0, (page - 1) * limit)

    users = query.offset(offset).limit(limit).all()
    user_ids = [u.id for u in users]

    # Carregar Cursos Vinculados
    course_map: Dict[int, List[int]] = {}
    if user_ids:
        uc_rows = (
            db.query(UserCourse.user_id, UserCourse.course_id)
            .filter(UserCourse.user_id.in_(user_ids))
            .all()
        )
        for uid, cid in uc_rows:
            course_map.setdefault(uid, []).append(cid)

    # Carregar Pontos de Gamificação para Nível RPG
    points_map: Dict[int, int] = {}
    if user_ids:
        pts_rows = (
            db.query(
                GamificationPoint.user_id,
                func.coalesce(func.sum(GamificationPoint.points), 0).label("pts"),
            )
            .filter(GamificationPoint.user_id.in_(user_ids))
            .group_by(GamificationPoint.user_id)
            .all()
        )
        for uid, pts in pts_rows:
            points_map[uid] = int(pts)

    online_ids = chat_manager.get_online_user_ids()

    items = []
    for u in users:
        pts = points_map.get(u.id, 0)
        level_info = calculate_student_level(pts)
        items.append(
            ChatDmCandidateItem(
                id=u.id,
                name=u.name,
                email=u.email,
                role=u.role,
                avatar_url=u.avatar_url,
                is_online=u.id in online_ids,
                last_seen_at=u.last_seen_at,
                level=level_info["level"],
                level_title=level_info["level_title"],
                level_tier=level_info["level_tier"],
                total_points=pts,
                course_ids=course_map.get(u.id, []),
            )
        )

    return ChatDmCandidatesResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )



