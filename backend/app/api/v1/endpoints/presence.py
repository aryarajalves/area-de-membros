from typing import Dict, Any, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.endpoints.users import get_current_user
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
    current_user: User = Depends(get_current_user)
) -> Dict[str, int]:
    return get_online_summary()


@router.get(
    "/online-ids",
    summary="Lista de IDs de Usuários Online",
    description="Retorna a lista de IDs de usuários atualmente com conexão ativa."
)
def list_online_user_ids(
    current_user: User = Depends(get_current_user)
) -> List[int]:
    return list(get_online_user_ids())


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
