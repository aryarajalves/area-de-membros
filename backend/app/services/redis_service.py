"""
Serviço de Integração com Redis para Concorrência e Escalabilidade Multi-Worker:
- Pub/Sub de mensagens WebSocket entre instâncias/workers
- Gestão distribuída de sessões ativas e status de presença (Online / Offline)
- Fallback automático e transparente em caso de ausência ou falha do Redis
"""
import json
import asyncio
from typing import Optional, Set, Dict, Any
from app.core.config import settings
from app.core.logger import logger

REDIS_CHANNEL_EVENTS = "area_membros:ws_events"
REDIS_KEY_ONLINE_USERS = "area_membros:online_users"
REDIS_KEY_USER_ROLES = "area_membros:user_roles"
REDIS_KEY_USER_CONNS_PREFIX = "area_membros:user_conns:"

_async_redis_client: Optional[Any] = None
_redis_available: Optional[bool] = None
_lock = asyncio.Lock()


def is_redis_configured() -> bool:
    """Verifica se há URL de conexão com Redis configurada nas variáveis de ambiente."""
    return bool(settings.REDIS_URL and settings.REDIS_URL.strip())


async def get_async_redis() -> Optional[Any]:
    """
    Retorna o cliente assíncrono do Redis com pool de conexões reutilizável.
    Em caso de falha de conexão ou Redis indisponível, retorna None sem gerar exceção.
    """
    global _async_redis_client, _redis_available

    if not is_redis_configured():
        _redis_available = False
        return None

    if _async_redis_client is not None and _redis_available:
        return _async_redis_client

    async with _lock:
        if _async_redis_client is not None and _redis_available:
            return _async_redis_client

        try:
            import redis.asyncio as aioredis
            client = aioredis.from_url(
                settings.REDIS_URL.strip(),
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=3.0,
                socket_connect_timeout=3.0,
                retry_on_timeout=True,
            )
            # Testa conexão inicial com PING
            await client.ping()
            _async_redis_client = client
            _redis_available = True
            logger.info(f"[REDIS] Conexão distribuída ativa com sucesso em: {settings.REDIS_URL.split('@')[-1]}")
            return _async_redis_client
        except Exception as exc:
            if _redis_available is not False:
                logger.warning(f"[REDIS] Não foi possível conectar ao Redis ({exc}). Operando em modo in-memory local.")
            _redis_available = False
            _async_redis_client = None
            return None


async def close_async_redis():
    """Fecha a conexão assíncrona do Redis no encerramento da aplicação."""
    global _async_redis_client, _redis_available
    if _async_redis_client:
        try:
            await _async_redis_client.aclose()
        except Exception:
            pass
        _async_redis_client = None
    _redis_available = None


async def publish_ws_event(payload: Dict[str, Any]) -> bool:
    """
    Publica um evento no canal Redis Pub/Sub para que todos os workers e réplicas recebam.
    """
    client = await get_async_redis()
    if not client:
        return False
    try:
        msg_str = json.dumps(payload, default=str)
        await client.publish(REDIS_CHANNEL_EVENTS, msg_str)
        return True
    except Exception as exc:
        logger.warning(f"[REDIS] Falha ao publicar evento no canal {REDIS_CHANNEL_EVENTS}: {exc}")
        return False


async def register_online_connection(user_id: int, role: str, conn_id: str) -> bool:
    """
    Registra uma conexão WebSocket ativa do usuário no Redis.
    Mantém o conjunto de sockets do usuário e o conjunto global de IDs online.
    """
    client = await get_async_redis()
    if not client:
        return False
    try:
        pipe = client.pipeline()
        # Adiciona ao conjunto de conexões ativas desse usuário
        user_conns_key = f"{REDIS_KEY_USER_CONNS_PREFIX}{user_id}"
        pipe.sadd(user_conns_key, conn_id)
        pipe.expire(user_conns_key, 86400)  # TTL de segurança (24h)
        # Adiciona o ID do usuário ao set global de membros online
        pipe.sadd(REDIS_KEY_ONLINE_USERS, str(user_id))
        # Salva o papel do usuário para métricas rápidas
        pipe.hset(REDIS_KEY_USER_ROLES, str(user_id), str(role).lower())
        await pipe.execute()
        return True
    except Exception as exc:
        logger.warning(f"[REDIS] Falha ao registrar presença do usuário {user_id}: {exc}")
        return False


async def unregister_online_connection(user_id: int, conn_id: str) -> bool:
    """
    Remove uma conexão WebSocket do usuário no Redis.
    Se o usuário não possuir mais nenhuma conexão ativa em nenhum worker, o remove de online_users.
    """
    client = await get_async_redis()
    if not client:
        return False
    try:
        user_conns_key = f"{REDIS_KEY_USER_CONNS_PREFIX}{user_id}"
        await client.srem(user_conns_key, conn_id)
        remaining = await client.scard(user_conns_key)
        if remaining == 0:
            pipe = client.pipeline()
            pipe.srem(REDIS_KEY_ONLINE_USERS, str(user_id))
            pipe.hdel(REDIS_KEY_USER_ROLES, str(user_id))
            pipe.delete(user_conns_key)
            await pipe.execute()
        return True
    except Exception as exc:
        logger.warning(f"[REDIS] Falha ao remover presença do usuário {user_id}: {exc}")
        return False


async def get_distributed_online_user_ids() -> Optional[Set[int]]:
    """
    Recupera a lista de IDs de usuários online em todo o cluster/workers via Redis.
    Retorna None se o Redis não estiver disponível.
    """
    client = await get_async_redis()
    if not client:
        return None
    try:
        raw_ids = await client.smembers(REDIS_KEY_ONLINE_USERS)
        result: Set[int] = set()
        for rid in raw_ids:
            try:
                result.add(int(rid))
            except (ValueError, TypeError):
                continue
        return result
    except Exception as exc:
        logger.warning(f"[REDIS] Falha ao consultar usuários online no Redis: {exc}")
        return None


async def get_distributed_online_summary() -> Optional[Dict[str, int]]:
    """
    Retorna o resumo consolidado de usuários online agrupados por perfil através do Redis.
    Retorna None se o Redis não estiver ativo.
    """
    client = await get_async_redis()
    if not client:
        return None
    try:
        roles_map = await client.hgetall(REDIS_KEY_USER_ROLES)
        superadmins = sum(1 for r in roles_map.values() if r == "superadmin")
        admins = sum(1 for r in roles_map.values() if r == "admin")
        students = sum(1 for r in roles_map.values() if r in ["aluno", "user"])
        return {
            "total_online": len(roles_map),
            "superadmins_online": superadmins,
            "admins_online": admins,
            "students_online": students,
        }
    except Exception as exc:
        logger.warning(f"[REDIS] Falha ao consultar resumo de presença no Redis: {exc}")
        return None
