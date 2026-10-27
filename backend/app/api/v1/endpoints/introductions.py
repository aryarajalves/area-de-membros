from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

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
    IntroductionLikeResponse,
)
from app.api.v1.endpoints.users import get_current_user

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


def _format_post_out(
    post: IntroductionPost,
    current_user_id: int,
    include_comments: bool = False
) -> IntroductionPostOut:
    user = post.user
    is_liked = any(like.user_id == current_user_id for like in post.likes)

    last_comment_name: Optional[str] = None
    last_comment_date = None
    if post.comments:
        last_comment = post.comments[-1]
        last_comment_name = last_comment.user.name if last_comment.user else "Membro"
        last_comment_date = last_comment.created_at

    comments_out = []
    if include_comments and post.comments:
        comments_out = [_format_comment_out(c) for c in post.comments]

    return IntroductionPostOut(
        id=post.id,
        user_id=post.user_id,
        user_name=user.name if user else "Membro",
        user_role=user.role if user else "aluno",
        user_avatar=user.avatar_url if user else None,
        title=post.title,
        content=post.content,
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        is_liked_by_me=is_liked,
        last_comment_user_name=last_comment_name,
        last_comment_at=last_comment_date,
        created_at=post.created_at,
        updated_at=post.updated_at,
        comments=comments_out,
    )


@router.get("", response_model=List[IntroductionPostOut])
def list_introductions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista todos os posts de apresentação na comunidade, ordenados do mais recente para o mais antigo.
    """
    try:
        posts = (
            db.query(IntroductionPost)
            .order_by(desc(IntroductionPost.created_at))
            .all()
        )
        return [_format_post_out(post, current_user.id, include_comments=False) for post in posts]
    except Exception as exc:
        logger.error(f"[Introductions] Erro ao listar posts de apresentação: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar apresentações da comunidade."
        )


@router.post("", response_model=IntroductionPostOut, status_code=status.HTTP_201_CREATED)
def create_introduction(
    post_in: IntroductionPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cria uma nova apresentação do usuário na comunidade.
    """
    clean_title = post_in.title.strip()
    clean_content = post_in.content.strip()

    if not clean_title or not clean_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Título e conteúdo da apresentação são obrigatórios."
        )

    try:
        new_post = IntroductionPost(
            user_id=current_user.id,
            title=clean_title,
            content=clean_content,
            likes_count=0,
            comments_count=0,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Alterna a curtida (Like) no post de apresentação.
    """
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
            db.delete(existing_like)
            post.likes_count = max(0, (post.likes_count or 0) - 1)
            db.commit()
            return IntroductionLikeResponse(liked=False, likes_count=post.likes_count)
        else:
            new_like = IntroductionLike(post_id=post_id, user_id=current_user.id)
            db.add(new_like)
            post.likes_count = (post.likes_count or 0) + 1
            db.commit()
            return IntroductionLikeResponse(liked=True, likes_count=post.likes_count)
    except Exception as exc:
        db.rollback()
        logger.error(f"[Introductions] Erro ao alternar like no post {post_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar curtida."
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
