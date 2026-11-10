from typing import Set, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.services.chat_ws_manager import chat_manager
from app.services import redis_service
from app.models.user import User
from app.core.logger import logger


def get_online_user_ids() -> Set[int]:
    """
    Retorna os IDs de usuários com conexão WebSocket ativa.
    Consulta o Redis distribuído (para cobrir todos os workers e réplicas) e mescla com os sockets locais.
    """
    local_ids = chat_manager.get_online_user_ids()
    if redis_service.is_redis_configured():
        try:
            import redis
            from app.core.config import settings
            r = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_timeout=1.0)
            members = r.smembers(redis_service.REDIS_KEY_ONLINE_USERS)
            r.close()
            redis_ids = {int(m) for m in members if m.isdigit()}
            return redis_ids.union(local_ids)
        except Exception as exc:
            logger.debug(f"[PRESENCE] Fallback para local ao consultar IDs online: {exc}")

    return local_ids


def is_user_online(user_id: int) -> bool:
    """Verifica se um usuário específico está online."""
    if not user_id:
        return False
    return user_id in get_online_user_ids()


def get_online_summary() -> Dict[str, int]:
    """
    Retorna métricas agregadas de membros online agrupadas por role.
    Consulta o cluster Redis para abranger todos os workers e réplicas, mesclando com o estado local.
    """
    roles_map: Dict[str, str] = {}
    if redis_service.is_redis_configured():
        try:
            import redis
            from app.core.config import settings
            r = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_timeout=1.0)
            roles_map = r.hgetall(redis_service.REDIS_KEY_USER_ROLES)
            r.close()
        except Exception as exc:
            logger.debug(f"[PRESENCE] Fallback para local ao consultar resumo online: {exc}")

    # Mescla sockets locais para consistência imediata
    online_sockets = list(chat_manager.active_connections.values())
    for meta in online_sockets:
        uid = str(meta.get("user_id"))
        role = str(meta.get("role", "aluno")).lower()
        if uid and uid not in roles_map:
            roles_map[uid] = role

    if roles_map:
        superadmins = sum(1 for r in roles_map.values() if r == "superadmin")
        admins = sum(1 for r in roles_map.values() if r == "admin")
        students = sum(1 for r in roles_map.values() if r in ["aluno", "user"])
        return {
            "total_online": len(roles_map),
            "superadmins_online": superadmins,
            "admins_online": admins,
            "students_online": students,
        }

    return {
        "total_online": 0,
        "superadmins_online": 0,
        "admins_online": 0,
        "students_online": 0,
    }


def mark_user_activity(db: Session, user_id: int) -> Optional[datetime]:
    """
    Atualiza discretamente o timestamp `last_seen_at` do usuário no banco.
    """
    try:
        now_utc = datetime.now(timezone.utc)
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.last_seen_at = now_utc
            db.commit()
            return now_utc
    except Exception as exc:
        logger.debug(f"[PRESENCE] Falha ao atualizar last_seen_at do usuário {user_id}: {exc}")
        db.rollback()
    return None
