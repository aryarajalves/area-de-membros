import os
import uuid
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, desc

from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user import User
from app.models.community_stories import CommunityStory, CommunityStoryView, CommunityStoryReaction
from app.models.chat import ChatMessage
from app.schemas.community_stories import (
    CommunityStoryCreate,
    CommunityStoryOut,
    StoryUserGroupOut,
    StoryViewItem,
    StoryReactIn,
    StoryReplyIn,
    StoryHighlightToggleIn,
)
from app.api.v1.endpoints.users import get_current_user
from app.services.gamification_service import award_points
from app.services.chat_encryption_service import encrypt_dm_message
from app.services.community_strikes_service import check_user_is_banned
from app.core.logger import logger

router = APIRouter()

STORIES_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "..",
    "uploads",
    "community_stories"
)
os.makedirs(STORIES_UPLOAD_DIR, exist_ok=True)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTS = {".mp4", ".webm", ".mov"}


def _format_story(story: CommunityStory, current_user_id: int) -> CommunityStoryOut:
    views_count = len(story.views) if story.views else 0
    has_viewed = any(v.user_id == current_user_id for v in story.views) if story.views else False

    my_reaction = None
    if story.reactions:
        for r in story.reactions:
            if r.user_id == current_user_id:
                my_reaction = r.reaction_type
                break

    return CommunityStoryOut(
        id=story.id,
        user_id=story.user_id,
        user_name=story.user.name if story.user else "Usuário",
        user_avatar_url=story.user.avatar_url if story.user else None,
        user_role=story.user.role if story.user else "aluno",
        media_url=story.media_url,
        media_type=story.media_type,
        media_thumbnail_url=story.media_thumbnail_url,
        caption=story.caption,
        duration_seconds=story.duration_seconds,
        is_highlight=story.is_highlight,
        highlight_title=story.highlight_title,
        created_at=story.created_at,
        expires_at=story.expires_at,
        views_count=views_count,
        has_viewed=has_viewed,
        my_reaction=my_reaction,
        is_owner=(story.user_id == current_user_id),
    )


@router.get(
    "/stories/tray",
    response_model=List[StoryUserGroupOut],
    summary="Obter Bandeja de Stories Ativos",
    description="Retorna a lista agrupada de membros que possuem stories ativos nas últimas 24 horas.",
)
@limiter.limit("60/minute")
def get_stories_tray(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna a lista agrupada de membros que têm stories ativos (últimas 24h).
    Ordena: usuário atual primeiro, depois usuários com stories não visualizados, depois já vistos.
    """
    now = datetime.utcnow()
    active_stories = (
        db.query(CommunityStory)
        .options(joinedload(CommunityStory.user))
        .filter(CommunityStory.expires_at > now)
        .order_by(desc(CommunityStory.created_at))
        .all()
    )

    if not active_stories:
        return []

    # Mapear visualizações do usuário atual
    story_ids = [s.id for s in active_stories]
    my_views = set(
        v[0] for v in db.query(CommunityStoryView.story_id)
        .filter(CommunityStoryView.user_id == current_user.id, CommunityStoryView.story_id.in_(story_ids))
        .all()
    )

    # Agrupar por usuário
    user_groups = {}
    for s in active_stories:
        uid = s.user_id
        if uid not in user_groups:
            user_groups[uid] = {
                "user": s.user,
                "stories": [],
                "has_unviewed": False,
                "latest_story_created_at": s.created_at,
            }
        user_groups[uid]["stories"].append(s)
        if s.id not in my_views:
            user_groups[uid]["has_unviewed"] = True

    result = []
    for uid, data in user_groups.items():
        u = data["user"]
        result.append(
            StoryUserGroupOut(
                user_id=uid,
                name=u.name if u else "Membro",
                avatar_url=u.avatar_url if u else None,
                role=u.role if u else "aluno",
                has_unviewed=data["has_unviewed"],
                stories_count=len(data["stories"]),
                latest_story_created_at=data["latest_story_created_at"],
                is_me=(uid == current_user.id),
            )
        )

    # Ordenar: meu story primeiro, depois unviewed primeiro, depois por data mais recente
    result.sort(
        key=lambda g: (
            not g.is_me,
            not g.has_unviewed,
            -g.latest_story_created_at.timestamp(),
        )
    )

    return result


@router.get(
    "/stories/user/{target_user_id}",
    response_model=List[CommunityStoryOut],
    summary="Listar Stories de um Membro",
    description="Retorna os stories ativos e/ou destaques de um determinado membro.",
)
@limiter.limit("60/minute")
def get_user_stories(
    request: Request,
    target_user_id: int,
    include_highlights: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna os stories ativos de um determinado membro.
    """
    now = datetime.utcnow()
    query = db.query(CommunityStory).filter(CommunityStory.user_id == target_user_id)
    if not include_highlights:
        query = query.filter(CommunityStory.expires_at > now)
    else:
        query = query.filter(or_(CommunityStory.expires_at > now, CommunityStory.is_highlight == True))

    stories = query.order_by(CommunityStory.created_at.asc()).all()
    return [_format_story(s, current_user.id) for s in stories]


@router.post(
    "/stories",
    response_model=CommunityStoryOut,
    summary="Publicar Novo Story",
    description="Publica um novo story com validade de 24 horas e atribui pontos de gamificação (+5 XP).",
)
@limiter.limit("20/minute")
def create_story(
    request: Request,
    data: CommunityStoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Publica um novo story com validade padrão de 24 horas.
    Concede +5 XP de gamificação (limite de 5 stories/dia = 25 XP/dia).
    """
    if check_user_is_banned(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você está banido da comunidade por acumular 3 strikes e não pode publicar stories."
        )
    now = datetime.utcnow()
    expires = now + timedelta(hours=24)

    # Duração segura: max 60s
    duration = min(60, max(2, data.duration_seconds))

    new_story = CommunityStory(
        user_id=current_user.id,
        media_url=data.media_url,
        media_type=data.media_type,
        media_thumbnail_url=data.media_thumbnail_url,
        caption=data.caption.strip() if data.caption else None,
        duration_seconds=duration,
        is_highlight=data.is_highlight,
        highlight_title=data.highlight_title.strip() if data.highlight_title else None,
        created_at=now,
        expires_at=expires,
    )
    db.add(new_story)
    db.commit()
    db.refresh(new_story)

    # Gamificação: +5 XP por story (com limite diário de até 5 stories/dia)
    try:
        award_points(db, current_user, "community_story_post", reference_id=new_story.id)
    except Exception as e:
        logger.warning(f"[STORIES] Erro ao atribuir XP de gamificação: {e}")

    return _format_story(new_story, current_user.id)


@router.delete(
    "/stories/{story_id}",
    summary="Excluir Story",
    description="Exclui um story publicado (permitido ao autor ou administradores).",
)
@limiter.limit("30/minute")
def delete_story(
    request: Request,
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Exclui um story. Permitido para o autor do story ou administradores.
    """
    story = db.query(CommunityStory).filter(CommunityStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story não encontrado.")

    is_admin = current_user.role in ["admin", "superadmin"]
    if story.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir este story.")

    db.delete(story)
    db.commit()
    return {"message": "Story excluído com sucesso.", "id": story_id}


@router.post(
    "/stories/{story_id}/view",
    summary="Registrar Visualização de Story",
    description="Registra que o usuário visualizou o story de forma idempotente.",
)
@limiter.limit("120/minute")
def record_story_view(
    request: Request,
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registra que o usuário visualizou o story (idempotente).
    """
    story = db.query(CommunityStory).filter(CommunityStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story não encontrado.")

    existing = (
        db.query(CommunityStoryView)
        .filter(CommunityStoryView.story_id == story_id, CommunityStoryView.user_id == current_user.id)
        .first()
    )
    if not existing:
        new_view = CommunityStoryView(story_id=story_id, user_id=current_user.id)
        db.add(new_view)
        try:
            db.commit()
        except Exception:
            db.rollback()

    return {"viewed": True, "story_id": story_id}


@router.post(
    "/stories/{story_id}/react",
    summary="Reagir ao Story",
    description="Reage ao story com um emoji (fire, heart, clap, laugh, rocket).",
)
@limiter.limit("60/minute")
def react_to_story(
    request: Request,
    story_id: int,
    data: StoryReactIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reage ao story com um emoji (fire, heart, clap, laugh, rocket).
    """
    story = db.query(CommunityStory).filter(CommunityStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story não encontrado.")

    existing = (
        db.query(CommunityStoryReaction)
        .filter(CommunityStoryReaction.story_id == story_id, CommunityStoryReaction.user_id == current_user.id)
        .first()
    )
    if existing:
        existing.reaction_type = data.reaction_type
    else:
        new_reaction = CommunityStoryReaction(
            story_id=story_id,
            user_id=current_user.id,
            reaction_type=data.reaction_type,
        )
        db.add(new_reaction)

    db.commit()
    return {"reaction": data.reaction_type, "story_id": story_id}


@router.get("/stories/{story_id}/views", response_model=List[StoryViewItem], summary="Listar Visualizadores do Story", description="Lista os usuários que visualizaram o story. Acessível apenas pelo autor ou admins.")
@limiter.limit("60/minute")
def get_story_views(
    request: Request,
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista os usuários que visualizaram o story.
    Acessível apenas pelo autor do story ou administradores.
    """
    story = db.query(CommunityStory).filter(CommunityStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story não encontrado.")

    is_admin = current_user.role in ["admin", "superadmin"]
    if story.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Você não tem permissão para ver os visualizadores deste story.")

    views = (
        db.query(CommunityStoryView)
        .filter(CommunityStoryView.story_id == story_id)
        .order_by(desc(CommunityStoryView.viewed_at))
        .all()
    )

    return [
        StoryViewItem(
            id=v.id,
            user_id=v.user_id,
            name=v.user.name if v.user else "Usuário",
            avatar_url=v.user.avatar_url if v.user else None,
            role=v.user.role if v.user else "aluno",
            viewed_at=v.viewed_at,
        )
        for v in views
    ]


@router.post("/stories/{story_id}/reply", summary="Responder Story via DM", description="Responde ao story enviando uma mensagem direta (DM) no chat para o autor.")
@limiter.limit("30/minute")
def reply_to_story(
    request: Request,
    story_id: int,
    data: StoryReplyIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Responde ao story enviando uma mensagem direta (DM) no chat para o autor do story,
    incluindo a imagem/thumbnail do story como referência.
    """
    story = db.query(CommunityStory).filter(CommunityStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story não encontrado.")

    if story.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode responder ao seu próprio story.")

    reply_content = f"📷 [Story]: {data.message.strip()}"
    encrypted_msg = encrypt_dm_message(reply_content)

    dm_msg = ChatMessage(
        channel_type="dm",
        user_id=current_user.id,
        recipient_id=story.user_id,
        message=encrypted_msg,
        media_url=story.media_thumbnail_url or story.media_url,
        media_type="image",
        is_read=False,
    )
    db.add(dm_msg)
    db.commit()
    db.refresh(dm_msg)

    # Disparar notificação via WebSocket para o destinatário
    try:
        from app.services.chat_ws_manager import chat_manager
        chat_manager.send_to_user_sync(
            story.user_id,
            "new_dm",
            {
                "message_id": dm_msg.id,
                "sender_id": current_user.id,
                "sender_name": current_user.name,
                "preview": f"Respondeu ao seu story: {data.message.strip()[:60]}",
            }
        )
    except Exception as ws_err:
        logger.warning(f"[STORIES] Notificação WS não enviada: {ws_err}")

    return {"sent": True, "recipient_id": story.user_id, "message_id": dm_msg.id}


@router.post("/stories/{story_id}/highlight", response_model=CommunityStoryOut, summary="Fixar/Desafixar Story nos Destaques", description="Fixa ou desafixa um story nos Destaques do perfil do membro.")
@limiter.limit("30/minute")
def toggle_story_highlight(
    request: Request,
    story_id: int,
    data: StoryHighlightToggleIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fixa ou desafixa um story nos Destaques do perfil do membro.
    """
    story = db.query(CommunityStory).filter(CommunityStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story não encontrado.")

    is_admin = current_user.role in ["admin", "superadmin"]
    if story.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Você não tem permissão para alterar os destaques deste story.")

    story.is_highlight = data.is_highlight
    story.highlight_title = data.highlight_title.strip() if data.highlight_title else None
    db.commit()
    db.refresh(story)

    return _format_story(story, current_user.id)


@router.post("/stories/upload", summary="Upload de Mídia para Stories", description="Upload de mídia para Stories (JPG, PNG, WebP ou Vídeo MP4/WebM de até 50MB).")
@limiter.limit("15/minute")
async def upload_story_media(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload de mídia para Stories (JPG, PNG, WebP ou Vídeo MP4/WebM de até 60 segundos e 50MB).
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    is_image = ext in IMAGE_EXTS
    is_video = ext in VIDEO_EXTS

    if not is_image and not is_video:
        raise HTTPException(
            status_code=400,
            detail="Formato de mídia não suportado para Stories. Envie imagens (JPG, PNG, WebP) ou vídeos (MP4, WebM)."
        )

    max_size = 50 * 1024 * 1024  # 50 MB
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="O arquivo não pode exceder 50MB.")

    unique_name = f"story_{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(STORIES_UPLOAD_DIR, unique_name)
    with open(dest_path, "wb") as f:
        f.write(contents)

    media_url = f"/api/v1/community/stories/media/{unique_name}"
    return {
        "media_url": media_url,
        "filename": unique_name,
        "media_type": "video" if is_video else "image",
    }


@router.get("/stories/media/{filename}", summary="Servir Mídia do Story", description="Serve a mídia gravada do Story de forma pública para tags de imagem e vídeo.")
@limiter.limit("120/minute")
def serve_story_media(request: Request, filename: str):
    """
    Serve a mídia do Story.
    """
    file_path = os.path.join(STORIES_UPLOAD_DIR, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Mídia do Story não encontrada.")
    return FileResponse(file_path)
