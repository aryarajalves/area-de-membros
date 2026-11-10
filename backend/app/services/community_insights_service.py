from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from app.models.community_feed import CommunityPost, CommunityPostView, CommunityPostBookmark
from app.models.user import User
from app.schemas.community_feed import PostInsightsOut, PostViewerOut
from app.core.logger import logger


def record_post_view(db: Session, post_id: int, user_id: int) -> dict:
    """
    Registra uma visualização única do post por parte do usuário.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    existing_view = (
        db.query(CommunityPostView)
        .filter(CommunityPostView.post_id == post_id, CommunityPostView.user_id == user_id)
        .first()
    )

    if not existing_view:
        view = CommunityPostView(post_id=post_id, user_id=user_id)
        db.add(view)
        post.views_count = (post.views_count or 0) + 1
        db.commit()
        db.refresh(post)
        logger.info(f"[INSIGHTS] Visualização registrada para post_id={post_id} por user_id={user_id}")
        return {"recorded": True, "views_count": post.views_count}

    return {"recorded": False, "views_count": post.views_count or 0}


def get_post_insights(db: Session, post_id: int, current_user: User) -> PostInsightsOut:
    """
    Retorna métricas de insights detalhadas da publicação para o autor ou administradores.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicação não encontrada.")

    is_author = post.user_id == current_user.id
    is_manager = current_user.role in ["admin", "superadmin"]

    if not is_author and not is_manager:
        raise HTTPException(
            status_code=403,
            detail="Apenas o autor da publicação ou administradores podem ver os insights deste post."
        )

    # Contagem precisa de visualizações únicas
    views_count = db.query(CommunityPostView).filter(CommunityPostView.post_id == post_id).count()
    if post.views_count != views_count:
        post.views_count = views_count
        db.commit()

    likes_count = post.likes_count or 0
    comments_count = post.comments_count or 0
    bookmarks_count = (
        db.query(CommunityPostBookmark)
        .filter(CommunityPostBookmark.post_id == post_id)
        .count()
    )

    total_interactions = likes_count + comments_count + bookmarks_count
    engagement_rate = round((total_interactions / views_count * 100), 2) if views_count > 0 else 0.0

    # Últimos 20 visualizadores identificados
    views = (
        db.query(CommunityPostView)
        .options(joinedload(CommunityPostView.user))
        .filter(CommunityPostView.post_id == post_id)
        .order_by(CommunityPostView.created_at.desc())
        .limit(20)
        .all()
    )

    recent_viewers = []
    for v in views:
        if v.user:
            recent_viewers.append(
                PostViewerOut(
                    user_id=v.user.id,
                    name=v.user.name,
                    role=v.user.role,
                    avatar_url=v.user.avatar_url,
                    viewed_at=v.created_at,
                )
            )

    return PostInsightsOut(
        post_id=post.id,
        views_count=views_count,
        likes_count=likes_count,
        comments_count=comments_count,
        bookmarks_count=bookmarks_count,
        total_interactions=total_interactions,
        engagement_rate=engagement_rate,
        recent_viewers=recent_viewers,
        created_at=post.created_at,
    )
