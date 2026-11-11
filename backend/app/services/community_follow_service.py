from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends

from app.models.user import User
from app.models.community_feed import CommunityFollow, CommunityNotification
from app.schemas.community_feed import FollowUserItem, FollowToggleOut
from app.core.logger import logger
from app.api.v1.endpoints.users import get_current_user


def require_community_manager(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Exige que o usuário seja administrador ou superadministrador para acessar o Feed Social em fase de testes.
    """
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="O Feed da Comunidade está em fase de testes e acessível apenas para administradores."
        )
    return current_user


def get_user_follow_stats(db: Session, target_user_id: int, current_user_id: int) -> Tuple[int, int, bool]:
    """
    Retorna (followers_count, following_count, is_following) de forma rápida.
    """
    followers_count = db.query(CommunityFollow).filter(CommunityFollow.following_id == target_user_id).count()
    following_count = db.query(CommunityFollow).filter(CommunityFollow.follower_id == target_user_id).count()

    is_following = False
    if current_user_id != target_user_id:
        is_following = db.query(CommunityFollow).filter(
            CommunityFollow.follower_id == current_user_id,
            CommunityFollow.following_id == target_user_id
        ).first() is not None

    return followers_count, following_count, is_following


def toggle_follow_user(db: Session, follower_id: int, target_user_id: int) -> FollowToggleOut:
    """
    Alterna o status de seguir/deixar de seguir entre follower e target.
    """
    if follower_id == target_user_id:
        raise HTTPException(status_code=400, detail="Você não pode seguir a si mesmo.")

    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    follower_user = db.query(User).filter(User.id == follower_id).first()

    existing_follow = db.query(CommunityFollow).filter(
        CommunityFollow.follower_id == follower_id,
        CommunityFollow.following_id == target_user_id
    ).first()

    if existing_follow:
        db.delete(existing_follow)
        db.commit()
        following = False
        logger.info(f"[FOLLOW] User id={follower_id} deixou de seguir user id={target_user_id}")
    else:
        new_follow = CommunityFollow(follower_id=follower_id, following_id=target_user_id)
        db.add(new_follow)

        # Notificação social para o usuário seguido
        try:
            follower_name = follower_user.name if follower_user else "Um membro"
            notification = CommunityNotification(
                user_id=target_user_id,
                actor_id=follower_id,
                notification_type="feed_follow",
                title=f"👤 {follower_name} começou a seguir você!",
                message="Acesse o perfil para ver as publicações e seguir de volta.",
                is_read=False,
            )
            db.add(notification)
        except Exception as e:
            logger.warning(f"[FOLLOW] Erro ao criar notificação de follow: {e}")

        db.commit()
        following = True
        logger.info(f"[FOLLOW] User id={follower_id} começou a seguir user id={target_user_id}")

    followers_count, following_count, _ = get_user_follow_stats(db, target_user_id, follower_id)
    return FollowToggleOut(
        following=following,
        followers_count=followers_count,
        following_count=following_count,
    )


def get_user_followers(db: Session, target_user_id: int, current_user_id: int) -> List[FollowUserItem]:
    """
    Retorna a lista de pessoas que seguem o target_user_id.
    """
    follows = (
        db.query(CommunityFollow)
        .filter(CommunityFollow.following_id == target_user_id)
        .order_by(CommunityFollow.created_at.desc())
        .all()
    )

    follower_ids = [f.follower_id for f in follows]
    if not follower_ids:
        return []

    users = db.query(User).filter(User.id.in_(follower_ids)).all()
    user_map = {u.id: u for u in users}

    # IDs que o usuário atual segue
    my_followings = set()
    if current_user_id:
        my_follows = (
            db.query(CommunityFollow.following_id)
            .filter(CommunityFollow.follower_id == current_user_id, CommunityFollow.following_id.in_(follower_ids))
            .all()
        )
        my_followings = {f[0] for f in my_follows}

    result = []
    for f in follows:
        u = user_map.get(f.follower_id)
        if not u:
            continue
        result.append(
            FollowUserItem(
                id=u.id,
                name=u.name,
                role=u.role,
                avatar_url=u.avatar_url,
                bio=u.bio,
                is_following=(u.id in my_followings),
                is_me=(u.id == current_user_id),
            )
        )
    return result


def get_user_following(db: Session, target_user_id: int, current_user_id: int) -> List[FollowUserItem]:
    """
    Retorna a lista de pessoas que o target_user_id está seguindo.
    """
    follows = (
        db.query(CommunityFollow)
        .filter(CommunityFollow.follower_id == target_user_id)
        .order_by(CommunityFollow.created_at.desc())
        .all()
    )

    following_ids = [f.following_id for f in follows]
    if not following_ids:
        return []

    users = db.query(User).filter(User.id.in_(following_ids)).all()
    user_map = {u.id: u for u in users}

    # IDs que o usuário atual segue
    my_followings = set()
    if current_user_id:
        my_follows = (
            db.query(CommunityFollow.following_id)
            .filter(CommunityFollow.follower_id == current_user_id, CommunityFollow.following_id.in_(following_ids))
            .all()
        )
        my_followings = {f[0] for f in my_follows}

    result = []
    for f in follows:
        u = user_map.get(f.following_id)
        if not u:
            continue
        result.append(
            FollowUserItem(
                id=u.id,
                name=u.name,
                role=u.role,
                avatar_url=u.avatar_url,
                bio=u.bio,
                is_following=(u.id in my_followings),
                is_me=(u.id == current_user_id),
            )
        )
    return result


def get_user_gamification_profile_data(db: Session, user_id: int) -> Dict[str, Any]:
    """
    Retorna os dados consolidados do Elo e Gamificação de um usuário para exibição no perfil.
    """
    from sqlalchemy import func
    from app.models.gamification import GamificationPoint
    from app.services.gamification_level_service import calculate_student_level

    total_pts = (
        db.query(func.coalesce(func.sum(GamificationPoint.points), 0))
        .filter(GamificationPoint.user_id == user_id)
        .scalar()
        or 0
    )
    lvl_info = calculate_student_level(total_pts)

    return {
        "gamification_points": int(total_pts),
        "gamification_level": lvl_info.get("level", 1),
        "gamification_tier": lvl_info.get("level_tier", "Bronze"),
        "gamification_level_title": lvl_info.get("level_title", "Bronze I"),
        "gamification_badge": lvl_info.get("level_badge", "🛡️ Bronze I"),
        "gamification_tier_color": lvl_info.get("tier_color", "#cd7f32"),
        "gamification_level_color": lvl_info.get("level_color", "#cd7f32"),
        "gamification_progress_percent": lvl_info.get("level_progress_percent", 0),
        "gamification_points_to_next": lvl_info.get("points_to_next_level", 100),
    }
