from typing import Dict, Any, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.endpoints.users import get_current_user, require_admin_or_superadmin
from app.models.user import User
from app.services.presence_service import (
    get_online_user_ids,
    get_online_summary,
    mark_user_activity,
    is_user_online,
)

router = APIRouter(tags=["Presença e Status Online"])


@router.get(
    "/stats",
    summary="Estatísticas de Usuários Online",
    description="Retorna a contagem de usuários online agrupados por perfis (Total, Super Admins, Admins, Alunos)."
)
def get_presence_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, int]:
    return get_online_summary(db=db)


@router.get(
    "/online-ids",
    summary="Lista de IDs de Usuários Online",
    description="Retorna a lista de IDs de usuários atualmente com conexão ativa."
)
def list_online_user_ids(
    current_user: User = Depends(get_current_user)
) -> List[int]:
    return list(get_online_user_ids())


@router.get(
    "/online-users",
    summary="Listar Contatos Online na Comunidade",
    description="Retorna os dados dos usuários conectados em tempo real (exclusivo para Admin e Super Admin)."
)
def list_online_users_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
) -> List[Dict[str, Any]]:
    online_ids = list(get_online_user_ids())
    if not online_ids:
        return []

    users = (
        db.query(User)
        .filter(User.id.in_(online_ids), User.is_active == True)
        .all()
    )
    role_priority = {"superadmin": 0, "admin": 1, "aluno": 2}
    users.sort(key=lambda u: (role_priority.get(u.role, 3), (u.name or u.email or "").lower()))

    return [
        {
            "id": u.id,
            "name": u.name or u.email,
            "email": u.email,
            "role": u.role,
            "avatar_url": getattr(u, "avatar_url", None),
            "last_seen_at": u.last_seen_at,
        }
        for u in users
    ]


@router.post(
    "/heartbeat",
    summary="Sinal de Atividade / Heartbeat",
    description="Atualiza o timestamp `last_seen_at` do usuário autenticado."
)
def presence_heartbeat(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    last_seen = mark_user_activity(db, current_user.id)
    return {
        "status": "ok",
        "user_id": current_user.id,
        "is_online": True,
        "last_seen_at": last_seen,
    }
