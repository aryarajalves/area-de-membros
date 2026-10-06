"""
Serviço dedicado para controle de mensagens não lidas no Chat da Comunidade:
- Cálculo de mensagens não lidas por canal e total para o usuário
- Marcação de canal como lido
"""
from typing import Dict
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.chat import ChatMessage, ChatChannelReadStatus, ChatMessageMention
from app.models.user import User
from app.models.course import Course, UserCourse
from app.schemas.chat import ChatUnreadSummaryResponse
from app.core.logger import logger


def get_channel_last_read_map(db: Session, user_id: int) -> Dict[str, int]:
    """Retorna dicionário {channel_id: last_read_message_id} para o usuário."""
    records = (
        db.query(ChatChannelReadStatus.channel_id, ChatChannelReadStatus.last_read_message_id)
        .filter(ChatChannelReadStatus.user_id == user_id)
        .all()
    )
    return {r[0]: r[1] for r in records}


def mark_channel_as_read(db: Session, user_id: int, channel_id: str, last_message_id: int = None) -> int:
    """
    Atualiza a última mensagem lida no canal para o usuário.
    Se last_message_id não for informado, busca a mensagem mais recente daquele canal.
    """
    if last_message_id is None:
        if channel_id == "general":
            latest_msg = (
                db.query(ChatMessage.id)
                .filter(ChatMessage.channel_type == "general")
                .order_by(ChatMessage.id.desc())
                .first()
            )
        elif channel_id.startswith("course_"):
            try:
                c_id = int(channel_id.replace("course_", ""))
                latest_msg = (
                    db.query(ChatMessage.id)
                    .filter(ChatMessage.channel_type == "course", ChatMessage.course_id == c_id)
                    .order_by(ChatMessage.id.desc())
                    .first()
                )
            except ValueError:
                latest_msg = None
        else:
            latest_msg = None
        last_message_id = latest_msg[0] if latest_msg else 0

    record = (
        db.query(ChatChannelReadStatus)
        .filter(
            ChatChannelReadStatus.user_id == user_id,
            ChatChannelReadStatus.channel_id == channel_id,
        )
        .first()
    )

    if not record:
        record = ChatChannelReadStatus(
            user_id=user_id,
            channel_id=channel_id,
            last_read_message_id=last_message_id,
        )
        db.add(record)
    else:
        if last_message_id > record.last_read_message_id:
            record.last_read_message_id = last_message_id

    db.commit()
    return record.last_read_message_id


def get_channel_unread_count(
    db: Session,
    user_id: int,
    channel_type: str,
    course_id: int = None,
    last_read_id: int = 0,
) -> int:
    """Conta quantas mensagens foram enviadas no canal com ID superior a last_read_id."""
    query = db.query(func.count(ChatMessage.id)).filter(
        ChatMessage.channel_type == channel_type,
        ChatMessage.user_id != user_id,  # Mensagens do próprio usuário não contam como não lidas para si
    )
    if channel_type == "course":
        query = query.filter(ChatMessage.course_id == course_id)
    if last_read_id > 0:
        query = query.filter(ChatMessage.id > last_read_id)

    return query.scalar() or 0


def get_user_chat_unread_summary(db: Session, current_user: User) -> ChatUnreadSummaryResponse:
    """
    Calcula o resumo consolidado de mensagens não lidas:
    - Canais públicos (Comunidade Geral + Cursos liberados)
    - Mensagens Diretas (DMs recebidas com is_read == False)
    - Menções não lidas
    """
    last_read_map = get_channel_last_read_map(db, current_user.id)

    # 1. Canal Geral
    gen_last_id = last_read_map.get("general", 0)
    general_unread = get_channel_unread_count(
        db, current_user.id, channel_type="general", last_read_id=gen_last_id
    )

    # 2. Canais de Cursos liberados
    courses_unread = 0
    if current_user.role in ("superadmin", "admin"):
        courses = db.query(Course.id).all()
        course_ids = [c[0] for c in courses]
    else:
        now = datetime.now(timezone.utc)
        course_links = (
            db.query(UserCourse.course_id)
            .filter(
                UserCourse.user_id == current_user.id,
                or_(UserCourse.expires_at.is_(None), UserCourse.expires_at > now),
            )
            .all()
        )
        course_ids = [cl[0] for cl in course_links]

    for cid in course_ids:
        c_last_id = last_read_map.get(f"course_{cid}", 0)
        c_unread = get_channel_unread_count(
            db, current_user.id, channel_type="course", course_id=cid, last_read_id=c_last_id
        )
        courses_unread += c_unread

    channel_unread_total = general_unread + courses_unread

    # 3. DMs não lidas
    dm_unread = (
        db.query(func.count(ChatMessage.id))
        .filter(
            ChatMessage.channel_type == "dm",
            ChatMessage.recipient_id == current_user.id,
            ChatMessage.is_read == False,
        )
        .scalar()
        or 0
    )

    # 4. Menções não lidas
    mentions_unread = (
        db.query(func.count(ChatMessageMention.id))
        .filter(
            ChatMessageMention.mentioned_user_id == current_user.id,
            ChatMessageMention.is_read == False,
        )
        .scalar()
        or 0
    )

    total_unread = channel_unread_total + dm_unread

    return ChatUnreadSummaryResponse(
        total_unread=total_unread,
        channel_unread=channel_unread_total,
        dm_unread=dm_unread,
        mentions_unread=mentions_unread,
    )


def get_channel_items_list(db: Session, current_user: User):
    """Retorna lista de canais disponíveis com contagens de não lidas."""
    from app.schemas.chat import ChatChannelItem
    from sqlalchemy import desc

    channels = []
    last_read_map = get_channel_last_read_map(db, current_user.id)

    # 1. Canal Geral da Comunidade
    last_gen_msg = (
        db.query(ChatMessage)
        .filter(ChatMessage.channel_type == "general")
        .order_by(desc(ChatMessage.created_at))
        .first()
    )
    gen_unread = get_channel_unread_count(
        db, current_user.id, channel_type="general", last_read_id=last_read_map.get("general", 0)
    )
    channels.append(
        ChatChannelItem(
            id="general",
            name="Comunidade Geral",
            type="general",
            course_id=None,
            description="Bate-papo aberto para todos os alunos e instrutores",
            last_message=last_gen_msg.message if last_gen_msg else None,
            last_message_at=last_gen_msg.created_at if last_gen_msg else None,
            unread_count=gen_unread,
        )
    )

    # 2. Canais por Curso
    if current_user.role in ("superadmin", "admin"):
        courses = db.query(Course).order_by(Course.title.asc()).all()
    else:
        now = datetime.now(timezone.utc)
        courses = (
            db.query(Course)
            .join(UserCourse, UserCourse.course_id == Course.id)
            .filter(
                UserCourse.user_id == current_user.id,
                or_(UserCourse.expires_at.is_(None), UserCourse.expires_at > now),
            )
            .order_by(Course.title.asc())
            .all()
        )

    for c in courses:
        last_course_msg = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.channel_type == "course",
                ChatMessage.course_id == c.id,
            )
            .order_by(desc(ChatMessage.created_at))
            .first()
        )
        c_unread = get_channel_unread_count(
            db,
            current_user.id,
            channel_type="course",
            course_id=c.id,
            last_read_id=last_read_map.get(f"course_{c.id}", 0),
        )
        channels.append(
            ChatChannelItem(
                id=f"course_{c.id}",
                name=c.title,
                type="course",
                course_id=c.id,
                description=f"Canal exclusivo dos alunos de {c.title}",
                last_message=last_course_msg.message if last_course_msg else None,
                last_message_at=last_course_msg.created_at if last_course_msg else None,
                unread_count=c_unread,
            )
        )

    return channels

