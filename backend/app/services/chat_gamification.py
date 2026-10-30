"""
Serviço para vincular metadados de Gamificação RPG aos membros no Chat da Comunidade.
Permite exibir molduras neon no avatar e badges correspondentes ao Elo de cada aluno.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.gamification import GamificationPoint
from app.services.gamification_level_service import calculate_student_level
from app.schemas.chat import ChatUser


def get_users_gamification_map(db: Session, user_ids: List[int]) -> Dict[int, Dict[str, Any]]:
    """
    Retorna um dicionário mapeando cada user_id ao seu nível de RPG e dados visuais calculados.
    Executa apenas 1 query agregada para alta performance em listas de mensagens do chat.
    """
    if not user_ids:
        return {}

    valid_ids = [uid for uid in set(user_ids) if uid and uid > 0]
    if not valid_ids:
        return {}

    query_points = (
        db.query(
            GamificationPoint.user_id,
            func.coalesce(func.sum(GamificationPoint.points), 0).label("total_pts")
        )
        .filter(GamificationPoint.user_id.in_(valid_ids))
        .group_by(GamificationPoint.user_id)
        .all()
    )

    pts_dict = {uid: total for uid, total in query_points}
    result_map = {}

    for uid in valid_ids:
        pts = pts_dict.get(uid, 0)
        level_info = calculate_student_level(pts)
        result_map[uid] = {
            "points": pts,
            "tier": level_info["level_tier"],
            "title": level_info["level_title"],
            "badge": level_info["level_badge"],
            "tier_color": level_info["tier_color"],
            "level_color": level_info["level_color"],
            "level": level_info["level"],
        }

    return result_map


def build_chat_user(
    user: Optional[User],
    gamification_info: Optional[Dict[str, Any]] = None
) -> ChatUser:
    """
    Constrói um schema ChatUser enriquecido com os dados do Elo de Gamificação RPG.
    """
    if not user:
        return ChatUser(
            id=0,
            name="Usuário Desconhecido",
            email="",
            role="aluno",
            avatar_url=None,
            gamification_points=0,
            gamification_tier=None,
            gamification_level_title=None,
            gamification_tier_color=None,
            gamification_badge=None,
        )

    is_student = (user.role == "aluno")
    info = gamification_info if is_student and gamification_info else None

    return ChatUser(
        id=user.id,
        name=user.name or "Usuário",
        email=user.email or "",
        role=user.role or "aluno",
        avatar_url=getattr(user, "avatar_url", None),
        gamification_points=info["points"] if info else 0,
        gamification_tier=info["tier"] if info else None,
        gamification_level_title=info["title"] if info else None,
        gamification_tier_color=info["tier_color"] if info else None,
        gamification_badge=info["badge"] if info else None,
    )
