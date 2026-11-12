"""
Serviço de utilitários e regras de formatação do Feed da Comunidade.
Extraído para manter modularidade e limite estrito de linhas do endpoint.
"""

import re
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.logger import logger
from app.models.user import User
from app.models.community_feed import (
    CommunityPost,
    CommunityPostComment,
    CommunityNotification,
)
from app.schemas.community_feed import (
    CommunityCommentOut,
    CommunityNotificationOut,
    CommunityPostOut,
)


def format_comment(c: CommunityPostComment) -> CommunityCommentOut:
    level_title = None
    level_badge = None
    if c.user:
        pts = getattr(c.user, "gamification_points", 0) or 0
        from app.services.gamification_level_service import calculate_student_level
        info = calculate_student_level(pts)
        level_title = info.get("level_title", "Bronze I")
        level_badge = info.get("level_badge", "🛡️ Bronze I")

    return CommunityCommentOut(
        id=c.id,
        post_id=c.post_id,
        user_id=c.user_id,
        user_name=c.user.name if c.user else "Membro",
        user_avatar=c.user.avatar_url if c.user else None,
        user_role=c.user.role if c.user else "aluno",
        parent_id=c.parent_id,
        content=c.content,
        media_type=getattr(c, "media_type", "text") or "text",
        media_url=getattr(c, "media_url", None),
        user_level_title=level_title,
        user_level_badge=level_badge,
        created_at=c.created_at,
    )


def format_notification(n: CommunityNotification) -> CommunityNotificationOut:
    return CommunityNotificationOut(
        id=n.id,
        user_id=n.user_id,
        actor_id=n.actor_id,
        actor_name=n.actor.name if n.actor else None,
        actor_avatar=n.actor.avatar_url if n.actor else None,
        notification_type=n.notification_type,
        post_id=n.post_id,
        comment_id=n.comment_id,
        title=n.title,
        message=n.message,
        is_read=n.is_read,
        created_at=n.created_at,
    )


def notify_user(
    db: Session,
    user_id: int,
    actor_id: Optional[int],
    notification_type: str,
    title: str,
    message: Optional[str] = None,
    post_id: Optional[int] = None,
    comment_id: Optional[int] = None,
):
    if not user_id or user_id == actor_id:
        return
    try:
        notif = CommunityNotification(
            user_id=user_id,
            actor_id=actor_id,
            notification_type=notification_type,
            title=title,
            message=message,
            post_id=post_id,
            comment_id=comment_id,
            is_read=False,
        )
        db.add(notif)
    except Exception as e:
        logger.warning(f"Erro ao criar notificação de comunidade: {e}")


def process_mentions_in_text(
    db: Session,
    text_content: str,
    actor: User,
    post_id: Optional[int] = None,
    comment_id: Optional[int] = None,
):
    if not text_content or "@" not in text_content:
        return
    tokens = re.findall(r"@([A-Za-zÀ-ÿ0-9_]{2,30})", text_content)
    if not tokens:
        return

    unique_tokens = set(tokens)
    for token in unique_tokens:
        users = db.query(User).filter(
            User.is_active == True,
            User.name.ilike(f"%{token}%")
        ).limit(5).all()
        for u in users:
            if u.id != actor.id:
                notify_user(
                    db=db,
                    user_id=u.id,
                    actor_id=actor.id,
                    notification_type="feed_mention",
                    title="Você foi mencionado",
                    message=f"{actor.name} mencionou você: \"{text_content[:80]}\"",
                    post_id=post_id,
                    comment_id=comment_id,
                )


def format_post(post: CommunityPost, current_user_id: int) -> CommunityPostOut:
    liked = False
    if post.likes:
        liked = any(like.user_id == current_user_id for like in post.likes)

    bookmarked = False
    if post.bookmarks:
        bookmarked = any(b.user_id == current_user_id for b in post.bookmarks)

    comments_out = [format_comment(c) for c in (post.comments or [])]

    # Nível RPG / Elo do autor do post
    level_title = None
    level_badge = None
    if post.user:
        pts = getattr(post.user, "gamification_points", 0) or 0
        from app.services.gamification_level_service import calculate_student_level
        info = calculate_student_level(pts)
        level_title = info.get("level_title", "Bronze I")
        level_badge = info.get("level_badge", "🛡️ Bronze I")

    # Enquete e Votos
    poll_options_out = None
    my_vote = None
    total_votes = 0
    if post.poll_question and post.poll_options:
        opts = post.poll_options
        if isinstance(opts, list):
            # Contabilizar votos
            votes = post.poll_votes or []
            total_votes = len(votes)
            votes_by_opt = {}
            for v in votes:
                votes_by_opt[v.option_id] = votes_by_opt.get(v.option_id, 0) + 1
                if v.user_id == current_user_id:
                    my_vote = v.option_id

            poll_options_out = []
            for item in opts:
                opt_id = item.get("id") if isinstance(item, dict) else 1
                opt_text = item.get("text", "") if isinstance(item, dict) else str(item)
                opt_votes = votes_by_opt.get(opt_id, 0)
                pct = round((opt_votes / total_votes * 100), 1) if total_votes > 0 else 0.0
                poll_options_out.append({
                    "id": opt_id,
                    "text": opt_text,
                    "votes": opt_votes,
                    "percent": pct,
                })

    return CommunityPostOut(
        id=post.id,
        user_id=post.user_id,
        user_name=post.user.name if post.user else "Membro da Comunidade",
        user_avatar=post.user.avatar_url if post.user else None,
        user_role=post.user.role if post.user else "aluno",
        user_level_title=level_title,
        user_level_badge=level_badge,
        course_id=post.course_id,
        course_title=post.course.title if post.course else None,
        content=post.content,
        media_urls=post.media_urls or [],
        media_type=post.media_type or "none",
        media_thumbnail_url=post.media_thumbnail_url,
        category=getattr(post, "category", "geral") or "geral",
        location=getattr(post, "location", None),
        scheduled_at=getattr(post, "scheduled_at", None),
        is_scheduled=getattr(post, "is_scheduled", False) or False,
        poll_question=getattr(post, "poll_question", None),
        poll_options=poll_options_out,
        my_poll_vote=my_vote,
        total_poll_votes=total_votes,
        achievement_type=getattr(post, "achievement_type", None),
        achievement_data=getattr(post, "achievement_data", None),
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        bookmarks_count=getattr(post, "bookmarks_count", 0) or 0,
        shares_count=getattr(post, "shares_count", 0) or 0,
        views_count=post.views_count or 0,
        is_liked_by_me=liked,
        is_bookmarked_by_me=bookmarked,
        is_pinned=post.is_pinned,
        created_at=post.created_at,
        comments=comments_out,
    )
