from typing import List, Set
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.logger import logger
from app.models.user import User
from app.models.user_block import UserBlock


def block_user(db: Session, blocker_id: int, blocked_id: int) -> UserBlock:
    """Bloqueia um usuário para ocultar suas publicações e impedir DMs."""
    existing = (
        db.query(UserBlock)
        .filter(UserBlock.blocker_id == blocker_id, UserBlock.blocked_id == blocked_id)
        .first()
    )
    if existing:
        return existing

    record = UserBlock(blocker_id=blocker_id, blocked_id=blocked_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info(f"[BLOCK] Usuário {blocker_id} bloqueou usuário {blocked_id}.")
    return record


def unblock_user(db: Session, blocker_id: int, blocked_id: int) -> bool:
    """Remove o bloqueio entre blocker_id e blocked_id."""
    record = (
        db.query(UserBlock)
        .filter(UserBlock.blocker_id == blocker_id, UserBlock.blocked_id == blocked_id)
        .first()
    )
    if not record:
        return False

    db.delete(record)
    db.commit()
    logger.info(f"[BLOCK] Usuário {blocker_id} desbloqueou usuário {blocked_id}.")
    return True


def get_blocked_user_ids(db: Session, user_id: int) -> Set[int]:
    """Retorna IDs de usuários bloqueados pelo usuário atual."""
    rows = db.query(UserBlock.blocked_id).filter(UserBlock.blocker_id == user_id).all()
    return {row[0] for row in rows}


def is_blocked_between(db: Session, user_a_id: int, user_b_id: int) -> bool:
    """Verifica se existe bloqueio em qualquer direção entre dois usuários."""
    return (
        db.query(UserBlock.id)
        .filter(
            or_(
                (UserBlock.blocker_id == user_a_id) & (UserBlock.blocked_id == user_b_id),
                (UserBlock.blocker_id == user_b_id) & (UserBlock.blocked_id == user_a_id),
            )
        )
        .first()
        is not None
    )


def list_blocked_users(db: Session, blocker_id: int) -> List[dict]:
    """Lista usuários bloqueados pelo usuário autenticado."""
    rows = (
        db.query(UserBlock, User)
        .join(User, User.id == UserBlock.blocked_id)
        .filter(UserBlock.blocker_id == blocker_id)
        .order_by(UserBlock.created_at.desc())
        .all()
    )
    return [
        {
            "id": user.id,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "blocked_at": block.created_at,
        }
        for block, user in rows
    ]
