import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import desc, or_

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.introduction import IntroductionPost, IntroductionComment, IntroductionLike
from app.schemas.introduction import (
    IntroductionPostCreate,
    IntroductionPostUpdate,
    IntroductionPostOut,
    IntroductionCommentCreate,
    IntroductionCommentOut,
    IntroductionLikeRequest,
    IntroductionLikeResponse,
    IntroductionMediaUploadResponse,
    IntroductionPinResponse,
    IntroductionExampleResponse,
)
from app.api.v1.endpoints.users import get_current_user
from app.services.introduction_media_service import (
    process_introduction_media_upload,
    parse_video_embed,
    INTRO_MEDIA_DIR,
)

router = APIRouter()


def _format_comment_out(comment: IntroductionComment) -> IntroductionCommentOut:
    user = comment.user
    return IntroductionCommentOut(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        user_name=user.name if user else "Membro",
        user_role=user.role if user else "aluno",
        user_avatar=user.avatar_url if user else None,
        content=comment.content,
        created_at=comment.created_at,
    )


VALID_REACTIONS = ["like", "love", "celebrate", "insightful", "fire", "rocket"]


def _format_post_out(
    post: IntroductionPost,
    current_user_id: int,
    include_comments: bool = False
) -> IntroductionPostOut:
    user = post.user
    my_reaction: Optional[str] = None
    reactions_summary: List[str] = []

    if post.likes:
        for like in post.likes:
            rtype = getattr(like, "reaction_type", None) or "like"
            if rtype not in reactions_summary:
                reactions_summary.append(rtype)
            if like.user_id == current_user_id:
                my_reaction = rtype

    is_liked = my_reaction is not None

    last_comment_name: Optional[str] = None
    last_comment_date = None
    if post.comments:
        last_comment = post.comments[-1]
        last_comment_name = last_comment.user.name if last_comment.user else "Membro"
        last_comment_date = last_comment.created_at

    comments_out = []
    if include_comments and post.comments:
        comments_out = [_format_comment_out(c) for c in post.comments]

    from app.services.presence_service import is_user_online
    user_online = is_user_online(post.user_id) if post.user_id else False

    return IntroductionPostOut(
        id=post.id,
        user_id=post.user_id,
        user_name=user.name if user else "Membro",
        user_role=user.role if user else "aluno",
        user_avatar=user.avatar_url if user else None,
        user_birth_date=getattr(user, "birth_date", None) if user else None,
        user_is_online=user_online,
        title=post.title,
        content=post.content,
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        is_liked_by_me=is_liked,
        my_reaction=my_reaction,
        reactions_summary=reactions_summary,
        media_type=post.media_type or "none",
        media_url=post.media_url,
        video_embed_url=post.video_embed_url,
        instagram=post.instagram,
        linkedin=post.linkedin,
        whatsapp=post.whatsapp,
        website=post.website,
        niche=post.niche,
        location=post.location,
        seeking=post.seeking,
        offering=post.offering,
        is_pinned=bool(post.is_pinned),
        is_example=bool(getattr(post, "is_example", False)),
        last_comment_user_name=last_comment_name,
        last_comment_at=last_comment_date,
        created_at=post.created_at,
        updated_at=post.updated_at,
        comments=comments_out,
    )


@router.get("", response_model=List[IntroductionPostOut])
def list_introductions(
    skip: int = Query(0, ge=0, description="Número de registros a pular para paginação"),
    limit: int = Query(50, ge=1, le=100, description="Limite de registros retornados por página"),
    search: Optional[str] = Query(None, description="Busca textual por título, conteúdo, nome do aluno ou nicho"),
    niche: Optional[str] = Query(None, description="Filtro por área de atuação/nicho"),
    location: Optional[str] = Query(None, description="Filtro por cidade/estado"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista todos os posts de apresentação na comunidade, ordenados primeiro pelos fixados (is_pinned=True)
    e depois do mais recente para o mais antigo, com suporte a busca, filtros por nicho/local e paginação.
    """
    try:
        query = db.query(IntroductionPost).join(User, IntroductionPost.user_id == User.id)

        if search:
            search_term = f"%{search.strip().lower()}%"
            query = query.filter(
                or_(
                    IntroductionPost.title.ilike(search_term),
                    IntroductionPost.content.ilike(search_term),
                    IntroductionPost.niche.ilike(search_term),
                    IntroductionPost.location.ilike(search_term),
                    User.name.ilike(search_term),
                )
            )

        if niche:
            query = query.filter(IntroductionPost.niche.ilike(f"%{niche.strip().lower()}%"))

        if location:
            query = query.filter(IntroductionPost.location.ilike(f"%{location.strip().lower()}%"))

        posts = (
            query.options(
                joinedload(IntroductionPost.user),
                selectinload(IntroductionPost.likes),
                selectinload(IntroductionPost.comments).joinedload(IntroductionComment.user)
            )
            .order_by(
                desc(IntroductionPost.is_pinned),
                desc(IntroductionPost.created_at)
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [_format_post_out(post, current_user.id, include_comments=False) for post in posts]
    except Exception as exc:
        logger.error(f"[Introductions] Erro ao listar posts de apresentação: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar apresentações da comunidade."
        )


@router.post("/upload-media", response_model=IntroductionMediaUploadResponse)
async def upload_introduction_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Faz upload de foto ou vídeo para post de apresentação.
    """
    return await process_introduction_media_upload(file)


@router.get("/media/{filename}")
def get_introduction_media(filename: str):
    """
    Serve arquivo de mídia de apresentação salvo localmente em uploads/introductions.
    """
    file_path = os.path.join(INTRO_MEDIA_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arquivo não encontrado.")
    return FileResponse(file_path)


@router.post("", response_model=IntroductionPostOut, status_code=status.HTTP_201_CREATED)
def create_introduction(
    post_in: IntroductionPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cria uma nova apresentação do usuário na comunidade com mídias, redes sociais, matchmaking e nicho.
    """
    clean_title = post_in.title.strip()
    clean_content = post_in.content.strip()

    if not clean_title or not clean_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Título e conteúdo da apresentação são obrigatórios."
        )

    # Processa URL de vídeo externo se informado
    media_type = post_in.media_type or "none"
    embed_url = None
    if post_in.video_embed_url:
        parsed_url, provider = parse_video_embed(post_in.video_embed_url)
        embed_url = parsed_url
        if provider and provider in ["youtube", "loom", "vimeo"]:
            media_type = provider
        elif provider == "video":
            media_type = "video"

    try:
        new_post = IntroductionPost(
            user_id=current_user.id,
            title=clean_title,
            content=clean_content,
            likes_count=0,
            comments_count=0,
            media_type=media_type,
            media_url=post_in.media_url,
            video_embed_url=embed_url or post_in.video_embed_url,
            instagram=post_in.instagram.strip() if post_in.instagram else None,
            linkedin=post_in.linkedin.strip() if post_in.linkedin else None,
            whatsapp=post_in.whatsapp.strip() if post_in.whatsapp else None,
            website=post_in.website.strip() if post_in.website else None,
            niche=post_in.niche.strip() if post_in.niche else None,
            location=post_in.location.strip() if post_in.location else None,
            seeking=post_in.seeking.strip() if post_in.seeking else None,
            offering=post_in.offering.strip() if post_in.offering else None,
            is_pinned=False,
        )
        db.add(new_post)
        db.commit()
        db.refresh(new_post)
        logger.info(f"[Introductions] Novo post de apresentação criado (ID: {new_post.id}) pelo usuário {current_user.id}")

        # Dispara funis ativos com gatilho de Primeira Apresentação se for o 1º post do aluno
        try:
            total_user_posts = db.query(IntroductionPost).filter(IntroductionPost.user_id == current_user.id).count()
            if total_user_posts == 1:
                from app.services.funnel_community_triggers_service import dispatch_first_presentation_funnels
                dispatch_first_presentation_funnels(db, current_user.id)
        except Exception as p_err:
            logger.error(f"[Gatilho Apresentação] Erro ao verificar e disparar funis: {p_err}")

        return _format_post_out(new_post, current_user.id, include_comments=True)
    except Exception as exc:
        db.rollback()
        logger.error(f"[Introductions] Erro ao criar post de apresentação: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível publicar sua apresentação."
        )


@router.post("/{post_id}/pin", response_model=IntroductionPinResponse)
def toggle_pin_introduction(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fixa ou desafixa um post de apresentação no topo. Apenas para Super Admin e Admin.
    """
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem fixar ou desafixar apresentações."
        )

    post = db.query(IntroductionPost).filter(IntroductionPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apresentação não encontrada."
        )

    try:
        post.is_pinned = not bool(post.is_pinned)
        db.commit()
        action = "fixado no topo" if post.is_pinned else "desafixado"
        logger.info(f"[Introductions] Post ID {post_id} {action} pelo admin {current_user.id}")
        return IntroductionPinResponse(id=post.id, is_pinned=post.is_pinned)
    except Exception as exc:
        db.rollback()
        logger.error(f"[Introductions] Erro ao alternar pin no post {post_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao alterar status de fixação."
        )


@router.post("/{post_id}/example", response_model=IntroductionExampleResponse)
def toggle_example_introduction(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marca ou desmarca um post de apresentação como Exemplo Oficial.
    Ao marcar como exemplo, também fixa o post no topo automaticamente.
    Apenas para Super Admin e Admin.
    """
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem marcar apresentações como exemplo."
        )

    post = db.query(IntroductionPost).filter(IntroductionPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apresentação não encontrada."
        )

    try:
        new_example_state = not bool(getattr(post, "is_example", False))
        post.is_example = new_example_state
        if new_example_state:
            post.is_pinned = True
        db.commit()
        action = "marcado e fixado como exemplo" if post.is_example else "removido de exemplo"
        logger.info(f"[Introductions] Post ID {post_id} {action} pelo admin {current_user.id}")
        return IntroductionExampleResponse(
            id=post.id,
            is_example=bool(post.is_example),
            is_pinned=bool(post.is_pinned),
        )
    except Exception as exc:
        db.rollback()
        logger.error(f"[Introductions] Erro ao alternar exemplo no post {post_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao alterar status de exemplo."
        )


@router.get("/{post_id}", response_model=IntroductionPostOut)
def get_introduction_detail(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna os detalhes de um post de apresentação, incluindo seus comentários.
    """
    post = db.query(IntroductionPost).filter(IntroductionPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apresentação não encontrada."
        )
    return _format_post_out(post, current_user.id, include_comments=True)


@router.put("/{post_id}", response_model=IntroductionPostOut, status_code=status.HTTP_200_OK)
def update_introduction(
    post_id: int,
    post_in: IntroductionPostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atualiza uma apresentação existente. Permitido para o autor ou administradores/superadmins.
    """
    post = db.query(IntroductionPost).filter(IntroductionPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apresentação não encontrada."
        )

    if post.user_id != current_user.id and current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para editar esta apresentação."
        )

    update_data = post_in.model_dump(exclude_unset=True)

    if "title" in update_data:
        clean_title = (update_data["title"] or "").strip()
        if len(clean_title) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O título da apresentação é obrigatório."
            )
        post.title = clean_title

    if "content" in update_data:
        clean_content = (update_data["content"] or "").strip()
        if len(clean_content) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O conteúdo da apresentação é obrigatório."
            )
        post.content = clean_content

    for field in ["instagram", "linkedin", "whatsapp", "website", "niche", "location", "seeking", "offering"]:
        if field in update_data:
            val = update_data[field]
            setattr(post, field, val.strip() if isinstance(val, str) and val.strip() else None)

    if "media_type" in update_data or "media_url" in update_data or "video_embed_url" in update_data:
        media_type = update_data.get("media_type", post.media_type) or "none"
        video_embed_url = update_data.get("video_embed_url", post.video_embed_url)
        media_url = update_data.get("media_url", post.media_url)

        if video_embed_url:
            parsed_url, provider = parse_video_embed(video_embed_url)
            video_embed_url = parsed_url or video_embed_url
            if provider and provider in ["youtube", "loom", "vimeo"]:
                media_type = provider
            elif provider == "video":
                media_type = "video"

        post.media_type = media_type
        post.media_url = media_url
        post.video_embed_url = video_embed_url

    if "is_pinned" in update_data and current_user.role in ["superadmin", "admin"]:
        post.is_pinned = bool(update_data["is_pinned"])

    try:
        db.commit()
        db.refresh(post)
        logger.info(f"[Introductions] Post de apresentação ID {post_id} atualizado por {current_user.id}")
        return _format_post_out(post, current_user.id, include_comments=True)
    except Exception as exc:
        db.rollback()
        logger.error(f"[Introductions] Erro ao atualizar post {post_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar apresentação."
        )


@router.delete("/{post_id}", status_code=status.HTTP_200_OK)
def delete_introduction(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Exclui um post de apresentação. Permitido para o autor ou administradores/superadmins.
    """
    post = db.query(IntroductionPost).filter(IntroductionPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apresentação não encontrada."
        )

    if post.user_id != current_user.id and current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para excluir esta apresentação."
        )

    try:
        db.delete(post)
        db.commit()
        logger.info(f"[Introductions] Post de apresentação ID {post_id} excluído com sucesso por {current_user.id}")
        return {"detail": "Apresentação excluída com sucesso."}
    except Exception as exc:
        db.rollback()
        logger.error(f"[Introductions] Erro ao excluir post {post_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao excluir apresentação."
        )


@router.post("/{post_id}/like", response_model=IntroductionLikeResponse)
def toggle_like_introduction(
    post_id: int,
    payload: Optional[IntroductionLikeRequest] = None,
    reaction_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Alterna ou atualiza a reação (Like, Love, Celebrate, Insightful, Fire, Rocket) no post de apresentação.
    """
    chosen_reaction = (payload.reaction_type if payload and payload.reaction_type else None) or reaction_type or "like"
    if chosen_reaction not in VALID_REACTIONS:
        chosen_reaction = "like"

    post = db.query(IntroductionPost).filter(IntroductionPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apresentação não encontrada."
        )

    existing_like = (
        db.query(IntroductionLike)
        .filter(
            IntroductionLike.post_id == post_id,
            IntroductionLike.user_id == current_user.id
        )
        .first()
    )

    try:
        if existing_like:
            current_reaction = getattr(existing_like, "reaction_type", "like") or "like"
            # Se for o mesmo tipo de reação, remove (descurte/desmarca)
            if current_reaction == chosen_reaction:
                db.delete(existing_like)
                post.likes_count = max(0, (post.likes_count or 0) - 1)
                db.commit()
                return IntroductionLikeResponse(liked=False, likes_count=post.likes_count, reaction_type=None)
            else:
                # Se for um tipo diferente, altera a reação mantendo a mesma contagem
                existing_like.reaction_type = chosen_reaction
                db.commit()
                return IntroductionLikeResponse(liked=True, likes_count=post.likes_count, reaction_type=chosen_reaction)
        else:
            new_like = IntroductionLike(post_id=post_id, user_id=current_user.id, reaction_type=chosen_reaction)
            db.add(new_like)
            post.likes_count = (post.likes_count or 0) + 1
            db.commit()
            return IntroductionLikeResponse(liked=True, likes_count=post.likes_count, reaction_type=chosen_reaction)
    except Exception as exc:
        db.rollback()
        logger.error(f"[Introductions] Erro ao alternar reação no post {post_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar reação."
        )


@router.post("/{post_id}/comments", response_model=IntroductionCommentOut, status_code=status.HTTP_201_CREATED)
def add_comment_introduction(
    post_id: int,
    comment_in: IntroductionCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Adiciona um comentário / mensagem de boas-vindas na apresentação.
    """
    clean_content = comment_in.content.strip()
    if not clean_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O comentário não pode estar vazio."
        )

    post = db.query(IntroductionPost).filter(IntroductionPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apresentação não encontrada."
        )

    try:
        new_comment = IntroductionComment(
            post_id=post_id,
            user_id=current_user.id,
            content=clean_content,
        )
        db.add(new_comment)
        post.comments_count = (post.comments_count or 0) + 1
        db.commit()
        db.refresh(new_comment)
        logger.info(f"[Introductions] Novo comentário ID {new_comment.id} no post {post_id} pelo usuário {current_user.id}")
        return _format_comment_out(new_comment)
    except Exception as exc:
        db.rollback()
        logger.error(f"[Introductions] Erro ao adicionar comentário no post {post_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao salvar comentário."
        )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_200_OK)
def delete_comment_introduction(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Exclui um comentário de apresentação. Permitido para o autor do comentário, dono do post ou admin/superadmin.
    """
    comment = db.query(IntroductionComment).filter(IntroductionComment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comentário não encontrado."
        )

    post = comment.post
    is_owner_comment = comment.user_id == current_user.id
    is_owner_post = post and post.user_id == current_user.id
    is_admin = current_user.role in ["superadmin", "admin"]

    if not (is_owner_comment or is_owner_post or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para remover este comentário."
        )

    try:
        if post:
            post.comments_count = max(0, (post.comments_count or 0) - 1)
        db.delete(comment)
        db.commit()
        logger.info(f"[Introductions] Comentário ID {comment_id} excluído com sucesso")
        return {"detail": "Comentário excluído com sucesso."}
    except Exception as exc:
        db.rollback()
        logger.error(f"[Introductions] Erro ao excluir comentário {comment_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao excluir comentário."
        )
