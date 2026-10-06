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
from app.models.chat import ChatMessage, ChatMessageLike, ChatMessageFavorite
from app.schemas.chat import (
    ChatChannelItem,
    ChatMessageResponse,
    ChatMessageCreate,
    ChatUser,
    ChatMessageLikeToggleResponse,
    ChatMessageFavoriteToggleResponse,
)
from app.services.storage import upload_media_file
from app.services.chat_ws_manager import chat_manager

router = APIRouter(tags=["Chat da Comunidade"])

BASE_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "uploads"
)
CHAT_MEDIA_DIR = os.path.join(BASE_UPLOAD_DIR, "chat_media")
os.makedirs(CHAT_MEDIA_DIR, exist_ok=True)



def check_channel_access(user: User, channel_type: str, course_id: Optional[int], db: Session) -> bool:
    """
    Verifica se o usuário tem permissão para visualizar e enviar mensagens no canal.
    - 'general': Liberado para todos os usuários ativos.
    - 'course': Se admin/superadmin, liberado. Se aluno, requer vínculo ativo ao curso.
    """
    if channel_type == "general":
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
    channels: List[ChatChannelItem] = []

    # 1. Canal Geral da Comunidade
    last_gen_msg = (
        db.query(ChatMessage)
        .filter(ChatMessage.channel_type == "general")
        .order_by(desc(ChatMessage.created_at))
        .first()
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
        channels.append(
            ChatChannelItem(
                id=f"course_{c.id}",
                name=c.title,
                type="course",
                course_id=c.id,
                description=f"Canal exclusivo dos alunos de {c.title}",
                last_message=last_course_msg.message if last_course_msg else None,
                last_message_at=last_course_msg.created_at if last_course_msg else None,
            )
        )

    return channels


@router.get(
    "/messages",
    response_model=List[ChatMessageResponse],
    summary="Listar Mensagens de um Canal",
    description="Retorna o histórico de mensagens ordenado cronologicamente, com suporte a polling incremental."
)
def get_channel_messages(
    channel_type: str = Query(default="general", description="'general' ou 'course'"),
    course_id: Optional[int] = Query(default=None, description="ID do curso se canal for 'course'"),
    limit: int = Query(default=50, ge=1, le=100, description="Quantidade de mensagens a retornar"),
    before_id: Optional[int] = Query(default=None, description="Buscar mensagens anteriores a esse ID (scroll infinito)"),
    after_id: Optional[int] = Query(default=None, description="Buscar novas mensagens posteriores a esse ID (polling)"),
    favorites_only: bool = Query(default=False, description="Filtrar apenas mensagens favoritadas pelo usuário logado"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna as mensagens do canal especificado.
    Valida se o usuário tem permissão para acessar o canal.
    """
    if not check_channel_access(current_user, channel_type, course_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este canal de bate-papo.",
        )

    query = db.query(ChatMessage).filter(ChatMessage.channel_type == channel_type)
    if channel_type == "course":
        query = query.filter(ChatMessage.course_id == course_id)

    if favorites_only:
        fav_ids_query = db.query(ChatMessageFavorite.message_id).filter(
            ChatMessageFavorite.user_id == current_user.id
        )
        query = query.filter(ChatMessage.id.in_(fav_ids_query))

    if after_id:
        # Polling: buscar mensagens novas que chegaram após o after_id
        query = query.filter(ChatMessage.id > after_id).order_by(asc(ChatMessage.id))
        messages = query.limit(limit).all()
    elif before_id:
        # Histórico anterior: mensagens com id menor que before_id
        query = query.filter(ChatMessage.id < before_id).order_by(desc(ChatMessage.id))
        messages = query.limit(limit).all()
        messages.reverse()  # Reverter para ordem cronológica
    else:
        # Últimas N mensagens
        query = query.order_by(desc(ChatMessage.id))
        messages = query.limit(limit).all()
        messages.reverse()  # Reverter para ordem cronológica crescente

    is_privileged = current_user.role in ("superadmin", "admin")
    all_msg_ids = [msg.id for msg in messages]

    user_liked_set = set()
    user_favorited_set = set()
    likes_count_map = {}

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
                message=msg.message or "",
                media_url=msg.media_url,
                media_type=msg.media_type,
                is_pinned=bool(msg.is_pinned),
                pinned_at=msg.pinned_at,
                pinned_by_user_id=msg.pinned_by_user_id,
                likes_count=likes_count_map.get(msg.id, 0),
                liked_by_me=msg.id in user_liked_set,
                is_favorited=msg.id in user_favorited_set,
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

    try:
        new_msg = ChatMessage(
            channel_type=payload.channel_type,
            course_id=payload.course_id if payload.channel_type == "course" else None,
            user_id=current_user.id,
            message=clean_text,
            media_url=media_url,
            media_type=media_type,
            is_pinned=False,
        )
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)

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
            message=new_msg.message,
            media_url=new_msg.media_url,
            media_type=new_msg.media_type,
            is_pinned=False,
            pinned_at=None,
            pinned_by_user_id=None,
            likes_count=0,
            liked_by_me=False,
            is_favorited=False,
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
        is_favorited = False
    else:
        new_fav = ChatMessageFavorite(
            message_id=message_id,
            user_id=current_user.id
        )
        db.add(new_fav)
        db.commit()
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
    """Faz upload de mídia para o chat pelo aluno ou gestor."""
    image_exts = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    audio_exts = {".mp3", ".wav", ".ogg", ".m4a", ".webm", ".aac"}
    video_exts = {".mp4", ".mov", ".mkv"}
    doc_exts = {".pdf", ".docx", ".xlsx", ".pptx", ".txt", ".zip", ".rar", ".csv"}

    allowed_extensions = image_exts | audio_exts | video_exts | doc_exts
    filename = file.filename or "arquivo"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de arquivo inválido. Suportados: imagens, vídeos, áudios e documentos."
        )

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo excede o limite máximo permitido de 25 MB."
        )

    content_type = file.content_type or ""
    # Determinar tipo de mídia de acordo com extensão e mime-type
    if (content_type.startswith("audio/") or ext in audio_exts) and not content_type.startswith("video/"):
        media_type = "audio"
        default_mime = "audio/webm" if ext == ".webm" else "audio/mpeg"
    elif content_type.startswith("video/") or ext in video_exts:
        media_type = "video"
        default_mime = "video/mp4"
    elif content_type.startswith("image/") or ext in image_exts:
        media_type = "image"
        default_mime = "image/jpeg"
    else:
        media_type = "file"
        default_mime = "application/pdf" if ext == ".pdf" else "application/octet-stream"

    final_content_type = content_type or default_mime
    unique_name = f"chat_{uuid.uuid4().hex[:14]}{ext}"

    # 1. Tentar salvar no Backblaze B2
    b2_url = upload_media_file(
        file_bytes=content,
        filename=unique_name,
        content_type=final_content_type,
        folder="AreaDeMembros/chat_media/"
    )
    if b2_url:
        return {
            "media_url": b2_url,
            "media_type": media_type,
            "filename": filename
        }

    # 2. Fallback local
    target_path = os.path.join(CHAT_MEDIA_DIR, unique_name)
    with open(target_path, "wb") as f:
        f.write(content)

    return {
        "media_url": f"/api/v1/chat/media/{unique_name}",
        "media_type": media_type,
        "filename": filename
    }


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

