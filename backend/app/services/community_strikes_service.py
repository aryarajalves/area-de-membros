from typing import Optional, List, Dict
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.models.community_feed import CommunityStrike, CommunityNotification
from app.core.logger import logger


def check_user_is_banned(user: User) -> bool:
    """Verifica se o usuário está banido de postar ou interagir no Feed da Comunidade."""
    if not user:
        return False
    return bool(getattr(user, "is_community_banned", False) or (getattr(user, "community_strikes_count", 0) or 0) >= 3)


def apply_strike_to_user(
    db: Session,
    user_id: int,
    moderator_id: int,
    reason: str,
    description: Optional[str] = None,
    post_id: Optional[int] = None,
    comment_id: Optional[int] = None,
) -> CommunityStrike:
    """
    Aplica um strike formal contra um usuário por violação das diretrizes.
    Ao atingir o 3º strike, o usuário é banido automaticamente.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Incrementa strikes
    current_count = getattr(user, "community_strikes_count", 0) or 0
    new_count = current_count + 1
    user.community_strikes_count = new_count

    if new_count >= 3:
        user.is_community_banned = True
        logger.warning(f"[CommunityStrikes] Usuário {user.email} (ID: {user.id}) atingiu 3 strikes e foi BANIDO da comunidade.")

    strike = CommunityStrike(
        user_id=user_id,
        moderator_id=moderator_id,
        post_id=post_id,
        comment_id=comment_id,
        reason=reason,
        description=description,
        strike_number=new_count,
        appeal_status="none",
    )
    db.add(strike)
    db.flush()

    # Notificação do Feed
    if new_count >= 3:
        notif_title = "🚫 Conta Banida do Feed da Comunidade (3/3 strikes)"
        notif_msg = (
            f"Você acumulou 3 strikes e sua conta foi banida da comunidade por violar as diretrizes: \"{reason}\". "
            "Você pode solicitar recurso caso discorde desta decisão."
        )
    else:
        notif_title = f"⚠️ Advertência: Você recebeu um strike ({new_count}/3)"
        notif_msg = (
            f"Você recebeu uma advertência formal por violar as diretrizes da comunidade: \"{reason}\". "
            f"Atenção: Ao acumular 3 strikes você será banido automaticamente. Você pode recorrer desta advertência."
        )

    notif = CommunityNotification(
        user_id=user_id,
        actor_id=moderator_id,
        notification_type="feed_strike",
        post_id=post_id,
        comment_id=comment_id,
        title=notif_title,
        message=notif_msg,
    )
    db.add(notif)
    db.commit()
    db.refresh(strike)

    return strike


def get_user_strikes_status(db: Session, user_id: int) -> dict:
    """Retorna o status completo de strikes e banimento do aluno."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    strikes = (
        db.query(CommunityStrike)
        .filter(CommunityStrike.user_id == user_id)
        .order_by(CommunityStrike.created_at.desc())
        .all()
    )

    formatted_strikes = []
    for s in strikes:
        formatted_strikes.append({
            "id": s.id,
            "user_id": s.user_id,
            "user_name": user.name,
            "user_avatar": user.avatar_url,
            "moderator_id": s.moderator_id,
            "post_id": s.post_id,
            "comment_id": s.comment_id,
            "reason": s.reason,
            "description": s.description,
            "strike_number": s.strike_number,
            "appeal_status": s.appeal_status,
            "appeal_reason": s.appeal_reason,
            "appeal_reviewed_at": s.appeal_reviewed_at,
            "created_at": s.created_at,
        })

    return {
        "strikes_count": getattr(user, "community_strikes_count", 0) or 0,
        "is_banned": check_user_is_banned(user),
        "strikes": formatted_strikes,
    }


def submit_strike_appeal(db: Session, strike_id: int, user_id: int, appeal_reason: str) -> CommunityStrike:
    """Envia um recurso/justificativa para um strike recebido."""
    strike = db.query(CommunityStrike).filter(CommunityStrike.id == strike_id).first()
    if not strike:
        raise HTTPException(status_code=404, detail="Strike não encontrado.")

    if strike.user_id != user_id:
        raise HTTPException(status_code=403, detail="Você só pode recorrer de strikes aplicados à sua conta.")

    if strike.appeal_status == "pending":
        raise HTTPException(status_code=400, detail="Este strike já possui um recurso em análise pela moderação.")

    if strike.appeal_status == "approved":
        raise HTTPException(status_code=400, detail="Este strike já foi revogado com sucesso.")

    strike.appeal_status = "pending"
    strike.appeal_reason = appeal_reason
    db.commit()
    db.refresh(strike)

    logger.info(f"[CommunityStrikes] Recurso submetido para strike {strike_id} pelo usuário {user_id}.")
    return strike


def review_strike_appeal(db: Session, strike_id: int, moderator_id: int, action: str) -> CommunityStrike:
    """Aprova ou rejeita um recurso de strike."""
    strike = db.query(CommunityStrike).filter(CommunityStrike.id == strike_id).first()
    if not strike:
        raise HTTPException(status_code=404, detail="Strike não encontrado.")

    user = db.query(User).filter(User.id == strike.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário do strike não encontrado.")

    now_utc = datetime.now(timezone.utc)
    strike.appeal_reviewed_by = moderator_id
    strike.appeal_reviewed_at = now_utc

    if action == "approve":
        strike.appeal_status = "approved"
        # Diminui contador de strikes
        curr = getattr(user, "community_strikes_count", 0) or 0
        new_count = max(0, curr - 1)
        user.community_strikes_count = new_count
        if new_count < 3:
            user.is_community_banned = False

        notif = CommunityNotification(
            user_id=user.id,
            actor_id=moderator_id,
            notification_type="feed_strike",
            post_id=strike.post_id,
            title="✅ Recurso Aceito pela Moderação",
            message=f"Seu recurso referente à advertência \"{strike.reason}\" foi aceito! O strike foi revogado e sua conta foi regularizada.",
        )
        db.add(notif)
    else:
        strike.appeal_status = "rejected"
        notif = CommunityNotification(
            user_id=user.id,
            actor_id=moderator_id,
            notification_type="feed_strike",
            post_id=strike.post_id,
            title="❌ Recurso de Strike Indeferido",
            message=f"Seu recurso referente à advertência \"{strike.reason}\" foi analisado e mantido pela moderação.",
        )
        db.add(notif)

    db.commit()
    db.refresh(strike)
    return strike
