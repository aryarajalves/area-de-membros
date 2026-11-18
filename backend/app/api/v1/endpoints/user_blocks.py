from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints.users import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.user_block_service import block_user, list_blocked_users, unblock_user

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
def get_my_blocked_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista todos os usuários bloqueados pelo usuário autenticado."""
    return {"blocked_users": list_blocked_users(db, current_user.id)}


@router.post("/{blocked_user_id}", status_code=status.HTTP_200_OK)
def block_user_endpoint(
    blocked_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bloqueia um usuário na comunidade e mensagens diretas."""
    if blocked_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode bloquear a si mesmo.")

    target = db.query(User).filter(User.id == blocked_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    block_user(db, current_user.id, blocked_user_id)
    return {"status": "blocked", "blocked_user_id": blocked_user_id}


@router.delete("/{blocked_user_id}", status_code=status.HTTP_200_OK)
def unblock_user_endpoint(
    blocked_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Desbloqueia um usuário previamente bloqueado."""
    removed = unblock_user(db, current_user.id, blocked_user_id)
    return {"status": "unblocked" if removed else "not_found", "removed": removed}
