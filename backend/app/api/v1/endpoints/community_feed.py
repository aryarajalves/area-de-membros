import os
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, and_, func

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.community_feed import (
    CommunityPost,
    CommunityPostComment,
    CommunityPostLike,
    CommunityPostBookmark,
    CommunityNotification,
    CommunityFollow,
)
from app.schemas.community_feed import (
    CommunityPostCreate,
    CommunityPostUpdate,
    CommunityPostOut,
    CommunityCommentCreate,
    CommunityCommentOut,
    CommunityFeedListResponse,
    CommunityLikeUserOut,
    CommunityMentionCandidate,
    CommunityNotificationOut,
    CommunityNotificationListResponse,
    CommunityProfileUpdate,
    CommunityUserProfileOut,
    FollowToggleOut,
    FollowUserItem,
    PostInsightsOut,
)
from app.api.v1.endpoints.users import get_current_user
from app.services.gamification_service import award_points
from app.services.community_feed_service import (
    format_comment,
    format_notification,
    notify_user,
    process_mentions_in_text,
    format_post,
)
from app.services.community_follow_service import (
    toggle_follow_user,
    get_user_followers,
    get_user_following,
    get_user_follow_stats,
    get_user_gamification_profile_data,
    require_community_manager,
)
from app.services.community_insights_service import record_post_view, get_post_insights
from app.services.community_strikes_service import check_user_is_banned

router = APIRouter()

COMMUNITY_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "..",
    "uploads",
    "community"
)
os.makedirs(COMMUNITY_UPLOAD_DIR, exist_ok=True)

# Aliases de compatibilidade interna para as funções extraídas
_format_comment = format_comment
_format_notification = format_notification
_notify_user = notify_user
_process_mentions_in_text = process_mentions_in_text
_format_post = format_post


@router.get("/feed", response_model=CommunityFeedListResponse, summary="Listar Publicações do Feed", description="Retorna o feed de publicações da comunidade com suporte a paginação e filtros.")
@limiter.limit("60/minute")
def get_feed(
    request: Request,
    filter: str = Query("all", description="'all', 'my_course', 'popular', 'my_posts', 'saved', 'following', 'scheduled'"),
    course_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None, description="Filtro por categoria / tag (ex: duvida, vitoria, dica, aviso, networking)"),
    hashtag: Optional[str] = Query(None, description="Filtro por hashtag (ex: #estudos, #react)"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Retorna o feed de publicações da comunidade com suporte a paginação e filtros.
    """
    query = (
        db.query(CommunityPost)
        .options(
            joinedload(CommunityPost.user),
            joinedload(CommunityPost.course),
            joinedload(CommunityPost.likes),
            joinedload(CommunityPost.bookmarks),
            joinedload(CommunityPost.comments).joinedload(CommunityPostComment.user)
        )
    )

    if filter == "scheduled":
        query = query.filter(CommunityPost.is_scheduled == True)
        if current_user.role not in ("admin", "superadmin"):
            query = query.filter(CommunityPost.user_id == current_user.id)
    else:
        # Em feeds gerais, exclui posts que estão agendados para o futuro
        query = query.filter(
            or_(
                CommunityPost.is_scheduled == False,
                and_(CommunityPost.scheduled_at != None, CommunityPost.scheduled_at <= func.now())
            )
        )

    if course_id:
        query = query.filter(CommunityPost.course_id == course_id)
    elif filter == "my_course":
        if current_user.role == "aluno":
            enrolled_ids = (
                db.query(UserCourse.course_id)
                .filter(UserCourse.user_id == current_user.id)
                .subquery()
            )
            query = query.filter(or_(CommunityPost.course_id.in_(enrolled_ids), CommunityPost.course_id.is_(None)))
    elif filter == "my_posts":
        query = query.filter(CommunityPost.user_id == current_user.id)
    elif filter == "saved":
        query = query.filter(CommunityPost.bookmarks.any(CommunityPostBookmark.user_id == current_user.id))
    elif filter == "following":
        following_ids_query = (
            db.query(CommunityFollow.following_id)
            .filter(CommunityFollow.follower_id == current_user.id)
        )
        query = query.filter(or_(CommunityPost.user_id.in_(following_ids_query), CommunityPost.user_id == current_user.id))

    if category and category.strip() and category.strip().lower() != "todas":
        query = query.filter(CommunityPost.category == category.strip().lower())

    if hashtag and hashtag.strip():
        tag_term = hashtag.strip().lstrip("#")
        query = query.filter(CommunityPost.content.ilike(f"%#{tag_term}%"))

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(CommunityPost.content.ilike(term), CommunityPost.category.ilike(term)))

    if filter in ("popular", "most_liked"):
        query = query.order_by(CommunityPost.is_pinned.desc(), CommunityPost.likes_count.desc(), CommunityPost.created_at.desc())
    elif filter == "most_commented":
        query = query.order_by(CommunityPost.is_pinned.desc(), CommunityPost.comments_count.desc(), CommunityPost.created_at.desc())
    elif filter == "most_saved":
        query = query.order_by(CommunityPost.is_pinned.desc(), CommunityPost.bookmarks_count.desc(), CommunityPost.created_at.desc())
    elif filter == "most_shared":
        query = query.order_by(CommunityPost.is_pinned.desc(), CommunityPost.shares_count.desc(), CommunityPost.created_at.desc())
    else:
        query = query.order_by(CommunityPost.is_pinned.desc(), CommunityPost.created_at.desc())

    total = query.count()
    posts = query.offset((page - 1) * limit).limit(limit).all()

    pages = (total + limit - 1) // limit if limit > 0 else 1

    return CommunityFeedListResponse(
        posts=[_format_post(p, current_user.id) for p in posts],
        total=total,
        page=page,
        pages=pages,
    )


@router.post("/feed", response_model=CommunityPostOut, status_code=status.HTTP_201_CREATED, summary="Criar Publicação no Feed", description="Cria uma nova publicação no feed da comunidade.")
@limiter.limit("30/minute")
def create_post(
    request: Request,
    data: CommunityPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Cria uma nova publicação no feed da comunidade.
    """
    if check_user_is_banned(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você está temporariamente banido de publicar no Feed da Comunidade por acumular 3 strikes. Você pode solicitar recurso no painel de moderação."
        )

    if not data.content or not data.content.strip():
        raise HTTPException(status_code=400, detail="O conteúdo da publicação não pode estar vazio.")

    media_type = data.media_type or "none"
    if data.media_urls and len(data.media_urls) > 0:
        if len(data.media_urls) > 1:
            media_type = "carousel"
        elif media_type not in ["video", "image"]:
            first_url = data.media_urls[0].lower()
            if any(first_url.endswith(v_ext) for v_ext in [".mp4", ".webm", ".mov", ".m4v"]):
                media_type = "video"
            else:
                media_type = "image"

    formatted_poll_options = None
    if data.poll_question and data.poll_options:
        formatted_poll_options = []
        for idx, opt in enumerate(data.poll_options, start=1):
            if isinstance(opt, str) and opt.strip():
                formatted_poll_options.append({"id": idx, "text": opt.strip()})
            elif isinstance(opt, dict) and "text" in opt:
                formatted_poll_options.append({"id": opt.get("id", idx), "text": str(opt["text"]).strip()})

    is_scheduled = False
    scheduled_at = None
    if data.scheduled_at:
        scheduled_at = data.scheduled_at
        is_scheduled = True

    post_location = data.location.strip() if (data.location and data.location.strip()) else None

    post = CommunityPost(
        user_id=current_user.id,
        course_id=data.course_id,
        content=data.content.strip(),
        media_urls=data.media_urls or [],
        media_type=media_type,
        media_thumbnail_url=data.media_thumbnail_url if media_type == "video" else None,
        category=(data.category or "geral").strip().lower(),
        location=post_location,
        scheduled_at=scheduled_at,
        is_scheduled=is_scheduled,
        poll_question=data.poll_question.strip() if (data.poll_question and formatted_poll_options) else None,
        poll_options=formatted_poll_options,
        achievement_type=data.achievement_type,
        achievement_data=data.achievement_data,
        likes_count=0,
        comments_count=0,
        is_pinned=False,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Gamificação: atribui pontos se for aluno (apenas se publicado agora)
    if not is_scheduled:
        try:
            award_points(db, current_user, "community_feed_post", post.id)
        except Exception as e:
            logger.warning(f"Erro ao atribuir pontos de feed: {e}")

        # Processa menções inteligentes (@aluno)
        _process_mentions_in_text(db, post.content, current_user, post_id=post.id)
        db.commit()

    logger.info(f"[FEED] Nova publicação criada id={post.id} por user_id={current_user.id}")
    return _format_post(post, current_user.id)


@router.put("/feed/{post_id}", response_model=CommunityPostOut, summary="Editar Publicação do Feed", description="Edita uma publicação existente (apenas o autor ou admin/superadmin).")
@limiter.limit("30/minute")
def update_post(
    request: Request,
    post_id: int,
    data: CommunityPostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Edita uma publicação existente (apenas o autor ou admin/superadmin).
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    is_manager = current_user.role in ["admin", "superadmin"]
    if post.user_id != current_user.id and not is_manager:
        raise HTTPException(status_code=403, detail="Você não tem permissão para editar esta publicação.")

    if data.content is not None:
        post.content = data.content.strip()

    if data.media_thumbnail_url is not None:
        post.media_thumbnail_url = data.media_thumbnail_url

    if data.is_pinned is not None and is_manager:
        post.is_pinned = data.is_pinned

    post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(post)

    return _format_post(post, current_user.id)


@router.delete("/feed/{post_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Excluir Publicação do Feed", description="Exclui uma publicação (apenas o autor ou admin/superadmin).")
@limiter.limit("30/minute")
def delete_post(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Exclui uma publicação (apenas o autor ou admin/superadmin).
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    is_manager = current_user.role in ["admin", "superadmin"]
    if post.user_id != current_user.id and not is_manager:
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir esta publicação.")

    db.delete(post)
    db.commit()
    logger.info(f"[FEED] Publicação id={post_id} excluída por user_id={current_user.id}")
    return None


@router.post("/feed/{post_id}/pin", summary="Fixar/Desafixar Publicação no Topo", description="Fixa ou desafixa um post no topo do feed (apenas admin/superadmin).")
@limiter.limit("30/minute")
def toggle_pin_post(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Fixa ou desafixa um post no topo do feed (apenas admin/superadmin).
    """
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Apenas administradores podem fixar publicações.")

    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    post.is_pinned = not post.is_pinned
    db.commit()
    db.refresh(post)

    return {"is_pinned": post.is_pinned}


@router.post("/feed/{post_id}/like", summary="Curtir/Descurtir Publicação", description="Alterna o like de uma publicação (curtir / descurtir).")
@limiter.limit("60/minute")
def toggle_like_post(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Alterna o like de uma publicação (curtir / descurtir).
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    existing_like = (
        db.query(CommunityPostLike)
        .filter(CommunityPostLike.post_id == post_id, CommunityPostLike.user_id == current_user.id)
        .first()
    )

    if existing_like:
        db.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        liked = False
    else:
        new_like = CommunityPostLike(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        post.likes_count += 1
        liked = True

        # Gamificação: pontua autor do post se for outro aluno
        if post.user and post.user.role == "aluno" and post.user_id != current_user.id:
            try:
                award_points(db, post.user, "community_feed_like", post.id)
            except Exception as e:
                logger.warning(f"Erro ao atribuir pontos de like do feed: {e}")

        # Notificação social para o autor da publicação
        if post.user_id != current_user.id:
            _notify_user(
                db=db,
                user_id=post.user_id,
                actor_id=current_user.id,
                notification_type="feed_like",
                title="Nova curtida",
                message=f"{current_user.name} curtiu sua publicação.",
                post_id=post.id,
            )

    db.commit()
    db.refresh(post)

    return {"liked": liked, "likes_count": post.likes_count}


@router.post("/feed/{post_id}/bookmark", summary="Salvar/Remover Publicação dos Favoritos", description="Salva ou remove uma publicação dos favoritos do usuário.")
@limiter.limit("60/minute")
def toggle_bookmark_post(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Salva ou remove uma publicação dos favoritos do usuário.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    existing_bm = (
        db.query(CommunityPostBookmark)
        .filter(CommunityPostBookmark.post_id == post_id, CommunityPostBookmark.user_id == current_user.id)
        .first()
    )

    if existing_bm:
        db.delete(existing_bm)
        post.bookmarks_count = max(0, (post.bookmarks_count or 0) - 1)
        bookmarked = False
    else:
        new_bm = CommunityPostBookmark(post_id=post_id, user_id=current_user.id)
        db.add(new_bm)
        post.bookmarks_count = (post.bookmarks_count or 0) + 1
        bookmarked = True

    db.commit()
    return {"bookmarked": bookmarked, "bookmarks_count": post.bookmarks_count}


@router.get("/feed/{post_id}/likes", response_model=List[CommunityLikeUserOut], summary="Listar Curtidas da Publicação", description="Retorna a lista de usuários que curtiram uma publicação.")
@limiter.limit("60/minute")
def get_post_likes(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Retorna a lista de usuários que curtiram uma publicação.
    """
    likes = (
        db.query(CommunityPostLike)
        .options(joinedload(CommunityPostLike.user))
        .filter(CommunityPostLike.post_id == post_id)
        .order_by(CommunityPostLike.created_at.desc())
        .all()
    )

    result = []
    for l in likes:
        if l.user:
            result.append(
                CommunityLikeUserOut(
                    user_id=l.user.id,
                    name=l.user.name,
                    avatar_url=l.user.avatar_url,
                    role=l.user.role,
                    created_at=l.created_at,
                )
            )
    return result


@router.get("/feed/mention-candidates", response_model=List[CommunityMentionCandidate], summary="Sugerir Membros para Menção (@)", description="Retorna membros ativos para sugestão e autocompletar de menções (@nome).")
@limiter.limit("60/minute")
def get_mention_candidates(
    request: Request,
    q: Optional[str] = Query("", description="Termo de busca para menção"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Retorna membros ativos para sugestão e autocompletar de menções (@nome).
    """
    query = db.query(User).filter(User.is_active == True)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(User.name.ilike(term))
    users = query.order_by(User.name.asc()).limit(15).all()

    return [
        CommunityMentionCandidate(
            id=u.id,
            name=u.name,
            avatar_url=u.avatar_url,
            role=u.role,
        )
        for u in users
    ]


@router.get("/feed/{post_id}/comments", response_model=List[CommunityCommentOut], summary="Listar Comentários da Publicação", description="Retorna todos os comentários de uma publicação específica.")
@limiter.limit("60/minute")
def get_post_comments(
    request: Request,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Retorna todos os comentários de uma publicação específica.
    """
    comments = (
        db.query(CommunityPostComment)
        .options(joinedload(CommunityPostComment.user))
        .filter(CommunityPostComment.post_id == post_id)
        .order_by(CommunityPostComment.created_at.asc())
        .all()
    )
    return [_format_comment(c) for c in comments]


@router.post("/feed/{post_id}/comments", response_model=CommunityCommentOut, status_code=status.HTTP_201_CREATED, summary="Criar Comentário na Publicação", description="Adiciona um comentário a uma publicação.")
@limiter.limit("30/minute")
def create_comment(
    request: Request,
    post_id: int,
    data: CommunityCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Adiciona um comentário a uma publicação.
    """
    if check_user_is_banned(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você está banido de comentar no Feed da Comunidade por acumular 3 strikes."
        )

    content = data.content.strip() if data.content else ""
    if not content:
        if data.media_type == "audio":
            content = "[Áudio]"
        elif data.media_type == "gif":
            content = "[GIF]"
        else:
            raise HTTPException(status_code=400, detail="O comentário não pode estar vazio.")

    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    comment = CommunityPostComment(
        post_id=post_id,
        user_id=current_user.id,
        parent_id=data.parent_id,
        content=content,
        media_type=data.media_type or "text",
        media_url=data.media_url,
    )
    db.add(comment)
    post.comments_count += 1
    db.commit()
    db.refresh(comment)

    # Notificação social para o autor da publicação
    if post.user_id != current_user.id:
        _notify_user(
            db=db,
            user_id=post.user_id,
            actor_id=current_user.id,
            notification_type="feed_comment",
            title="Novo comentário",
            message=f"{current_user.name} comentou: \"{comment.content[:80]}\"",
            post_id=post.id,
            comment_id=comment.id,
        )

    # Se for resposta a um comentário, notifica o autor do comentário pai
    if data.parent_id:
        parent_comment = db.query(CommunityPostComment).filter(CommunityPostComment.id == data.parent_id).first()
        if parent_comment and parent_comment.user_id not in [current_user.id, post.user_id]:
            _notify_user(
                db=db,
                user_id=parent_comment.user_id,
                actor_id=current_user.id,
                notification_type="feed_comment",
                title="Resposta ao seu comentário",
                message=f"{current_user.name} respondeu ao seu comentário: \"{comment.content[:80]}\"",
                post_id=post.id,
                comment_id=comment.id,
            )

    # Processa menções inteligentes (@aluno) no texto do comentário
    _process_mentions_in_text(db, comment.content, current_user, post_id=post.id, comment_id=comment.id)
    db.commit()

    logger.info(f"[FEED] Novo comentário criado id={comment.id} no post={post_id}")
    return _format_comment(comment)


@router.delete("/feed/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Excluir Comentário da Publicação", description="Exclui um comentário (apenas autor do comentário ou admin/superadmin).")
@limiter.limit("30/minute")
def delete_comment(
    request: Request,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Exclui um comentário (apenas autor do comentário ou admin/superadmin).
    """
    comment = db.query(CommunityPostComment).filter(CommunityPostComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comentário não encontrado.")

    is_manager = current_user.role in ["admin", "superadmin"]
    if comment.user_id != current_user.id and not is_manager:
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir este comentário.")

    post = db.query(CommunityPost).filter(CommunityPost.id == comment.post_id).first()
    if post:
        post.comments_count = max(0, post.comments_count - 1)

    db.delete(comment)
    db.commit()
    return None


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXTS = {".mp4", ".webm", ".mov", ".m4v"}
ALLOWED_EXTS = IMAGE_EXTS | VIDEO_EXTS


@router.post("/feed/upload", summary="Upload de Mídia para Feed", description="Upload de fotos (JPG, PNG, WebP) ou vídeos curtos (MP4, WebM, MOV) para publicações.")
@limiter.limit("15/minute")
async def upload_feed_media(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(require_community_manager),
):
    """
    Faz upload de foto ou vídeo curto para a publicação do feed.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400,
            detail="Formato de arquivo não suportado. Envie imagens (JPG, PNG, WebP) ou vídeos curtos (MP4, WebM, MOV)."
        )

    is_video = ext in VIDEO_EXTS
    media_type = "video" if is_video else "image"
    max_size = 50 * 1024 * 1024 if is_video else 10 * 1024 * 1024  # 50MB para vídeo, 10MB para imagem

    contents = await file.read()
    if len(contents) > max_size:
        limit_desc = "50MB" if is_video else "10MB"
        raise HTTPException(
            status_code=400,
            detail=f"O arquivo excede o tamanho máximo permitido de {limit_desc}."
        )

    filename = f"feed_{'vid' if is_video else 'img'}_{uuid.uuid4().hex[:12]}{ext}"
    file_path = os.path.join(COMMUNITY_UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    url = f"/api/v1/community/feed/media/{filename}"
    return {"url": url, "filename": filename, "media_type": media_type}


@router.get("/feed/media/{filename}", summary="Servir Mídia do Feed", description="Serve publicamente o arquivo de imagem ou vídeo da publicação do feed.")
@limiter.limit("120/minute")
def serve_feed_media(request: Request, filename: str):
    """
    Serve a imagem da publicação.
    """
    file_path = os.path.join(COMMUNITY_UPLOAD_DIR, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Mídia não encontrada.")
    return FileResponse(file_path)


@router.get("/feed/courses", summary="Listar Cursos para Marcação no Feed", description="Retorna os cursos disponíveis para marcação de posts no feed.")
@limiter.limit("60/minute")
def get_feed_courses(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Retorna os cursos disponíveis para marcação de posts.
    """
    courses = db.query(Course.id, Course.title).filter(Course.status == "published").order_by(Course.title.asc()).all()
    return [{"id": c.id, "title": c.title} for c in courses]


# ==============================================================================
# NOTIFICAÇÕES SOCIAIS DO FEED
# ==============================================================================

@router.get("/feed/notifications", response_model=CommunityNotificationListResponse, summary="Listar Notificações do Feed", description="Lista as notificações sociais do usuário atual com suporte a filtro de não lidas.")
@limiter.limit("60/minute")
def get_community_notifications(
    request: Request,
    unread_only: bool = Query(False, description="Filtrar apenas não lidas"),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Lista as notificações sociais do usuário atual com suporte a filtro de não lidas.
    """
    base_query = db.query(CommunityNotification).filter(CommunityNotification.user_id == current_user.id)
    unread_count = base_query.filter(CommunityNotification.is_read == False).count()

    query = base_query
    if unread_only:
        query = query.filter(CommunityNotification.is_read == False)

    total = query.count()
    notifications = (
        query.options(joinedload(CommunityNotification.actor))
        .order_by(CommunityNotification.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return CommunityNotificationListResponse(
        notifications=[_format_notification(n) for n in notifications],
        unread_count=unread_count,
        total=total,
    )


@router.get("/feed/notifications/unread-count", summary="Contador de Notificações Não Lidas", description="Retorna apenas a contagem de notificações não lidas para o badge no frontend.")
@limiter.limit("60/minute")
def get_unread_notifications_count(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Retorna apenas a contagem de notificações não lidas para o badge no frontend.
    """
    count = db.query(CommunityNotification).filter(
        CommunityNotification.user_id == current_user.id,
        CommunityNotification.is_read == False,
    ).count()
    return {"unread_count": count}


@router.post("/feed/notifications/{notification_id}/read", summary="Marcar Notificação como Lida", description="Marca uma notificação específica como lida.")
@limiter.limit("60/minute")
def mark_notification_as_read(
    request: Request,
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Marca uma notificação específica como lida.
    """
    notif = db.query(CommunityNotification).filter(
        CommunityNotification.id == notification_id,
        CommunityNotification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificação não encontrada.")

    notif.is_read = True
    db.commit()
    return {"success": True, "id": notification_id, "is_read": True}


@router.post("/feed/notifications/read-all", summary="Marcar Todas Notificações como Lidas", description="Marca todas as notificações do usuário atual como lidas.")
@limiter.limit("30/minute")
def mark_all_notifications_as_read(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Marca todas as notificações do usuário atual como lidas.
    """
    db.query(CommunityNotification).filter(
        CommunityNotification.user_id == current_user.id,
        CommunityNotification.is_read == False,
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"success": True, "message": "Todas as notificações foram marcadas como lidas."}


@router.delete("/feed/notifications/{notification_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Excluir Notificação do Feed", description="Exclui uma notificação específica do usuário.")
@limiter.limit("30/minute")
def delete_notification(
    request: Request,
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Exclui uma notificação específica do usuário.
    """
    notif = db.query(CommunityNotification).filter(
        CommunityNotification.id == notification_id,
        CommunityNotification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificação não encontrada.")

    db.delete(notif)
    db.commit()
    return None


# ==============================================================================
# PERFIL DO FEED SOCIAL (ESTILO INSTAGRAM)
# ==============================================================================

@router.get("/feed/profile/{user_id}", response_model=CommunityUserProfileOut, summary="Obter Perfil do Membro no Feed", description="Retorna os dados públicos do perfil do membro, bio, link, contadores e posts.")
@limiter.limit("60/minute")
def get_user_profile(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Retorna os dados públicos do perfil do membro, bio, link, contadores e posts.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    posts = (
        db.query(CommunityPost)
        .options(
            joinedload(CommunityPost.user),
            joinedload(CommunityPost.course),
            joinedload(CommunityPost.likes),
            joinedload(CommunityPost.bookmarks),
            joinedload(CommunityPost.comments).joinedload(CommunityPostComment.user),
        )
        .filter(CommunityPost.user_id == user_id)
        .order_by(CommunityPost.created_at.desc())
        .all()
    )

    formatted_posts = [_format_post(p, current_user.id) for p in posts]
    followers_count, following_count, is_following = get_user_follow_stats(db, target_user.id, current_user.id)
    gam_data = get_user_gamification_profile_data(db, target_user.id)

    return CommunityUserProfileOut(
        id=target_user.id,
        name=target_user.name,
        email=target_user.email,
        role=target_user.role,
        avatar_url=target_user.avatar_url,
        bio=target_user.bio,
        bio_link=target_user.bio_link,
        posts_count=len(formatted_posts),
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following,
        is_me=(current_user.id == target_user.id),
        created_at=target_user.created_at,
        posts=formatted_posts,
        **gam_data,
    )


@router.put("/feed/profile/me", response_model=CommunityUserProfileOut, summary="Atualizar Meu Perfil do Feed", description="Atualiza as informações do perfil do próprio usuário autenticado (nome, bio, link).")
@limiter.limit("30/minute")
def update_my_profile(
    request: Request,
    data: CommunityProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Atualiza as informações do perfil do próprio usuário autenticado (nome, bio de até 150 caracteres, link).
    """
    if data.name is not None and data.name.strip():
        current_user.name = data.name.strip()[:30]

    if data.bio is not None:
        current_user.bio = data.bio.strip()[:150] if data.bio.strip() else None

    if data.bio_link is not None:
        clean_link = data.bio_link.strip()[:255] if data.bio_link.strip() else None
        if clean_link and not clean_link.startswith(('http://', 'https://')):
            clean_link = f"https://{clean_link}"
        current_user.bio_link = clean_link

    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url

    db.commit()
    db.refresh(current_user)

    return get_user_profile(request=request, user_id=current_user.id, db=db, current_user=current_user)


@router.post("/feed/profile/avatar", summary="Upload de Avatar do Perfil", description="Upload de foto de perfil (avatar) do usuário autenticado.")
@limiter.limit("15/minute")
async def upload_profile_avatar(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    """
    Upload de foto de perfil (avatar) do usuário.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in IMAGE_EXTS:
        raise HTTPException(status_code=400, detail="Formato de imagem inválido (JPG, PNG, WebP).")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="A foto de perfil não pode ultrapassar 10MB.")

    filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(COMMUNITY_UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    avatar_url = f"/api/v1/community/feed/media/{filename}"
    current_user.avatar_url = avatar_url
    db.commit()

    return {"avatar_url": avatar_url, "message": "Foto de perfil atualizada com sucesso!"}


