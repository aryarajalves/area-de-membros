import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services import redis_service
from app.services.chat_ws_manager import ChatConnectionManager
from app.services import presence_service


def test_redis_configured_check():
    """Valida a checagem de configuração da URL do Redis."""
    with patch.object(redis_service.settings, "REDIS_URL", "redis://localhost:6379/0"):
        assert redis_service.is_redis_configured() is True

    with patch.object(redis_service.settings, "REDIS_URL", ""):
        assert redis_service.is_redis_configured() is False


@pytest.mark.asyncio
async def test_publish_ws_event_fallback_when_no_redis():
    """Valida que publish_ws_event não gera erro quando Redis não está disponível."""
    with patch.object(redis_service.settings, "REDIS_URL", ""):
        res = await redis_service.publish_ws_event({"type": "test_event", "data": {}})
        assert res is False


@pytest.mark.asyncio
async def test_redis_presence_registration_mocked():
    """Testa registro e remoção de presença de socket via pipeline Redis simulada."""
    mock_redis = MagicMock()
    mock_pipe = MagicMock()
    mock_pipe.execute = AsyncMock()
    mock_redis.pipeline = MagicMock(return_value=mock_pipe)
    mock_redis.srem = AsyncMock()
    mock_redis.scard = AsyncMock(return_value=0)

    with patch("app.services.redis_service.get_async_redis", AsyncMock(return_value=mock_redis)):
        # Registra
        reg_ok = await redis_service.register_online_connection(user_id=123, role="aluno", conn_id="conn_abc")
        assert reg_ok is True
        assert mock_pipe.sadd.call_count >= 2

        # Desregistra
        unreg_ok = await redis_service.unregister_online_connection(user_id=123, conn_id="conn_abc")
        assert unreg_ok is True
        mock_redis.srem.assert_called_once()


@pytest.mark.asyncio
async def test_chat_manager_multi_worker_broadcast():
    """Valida que o ChatConnectionManager publica no Redis quando configurado."""
    manager = ChatConnectionManager()

    with patch("app.services.redis_service.is_redis_configured", return_value=True):
        with patch("app.services.redis_service.publish_ws_event", AsyncMock(return_value=True)) as mock_pub:
            await manager.broadcast_event("new_message", {"id": 1, "text": "Olá"})
            mock_pub.assert_called_once()
            call_arg = mock_pub.call_args[0][0]
            assert call_arg["scope"] == "broadcast"
            assert "new_message" in call_arg["payload"]


@pytest.mark.asyncio
async def test_chat_manager_send_to_user_distributed():
    """Valida que o envio direto para usuário publica evento direcionado no Redis."""
    manager = ChatConnectionManager()

    with patch("app.services.redis_service.is_redis_configured", return_value=True):
        with patch("app.services.redis_service.publish_ws_event", AsyncMock(return_value=True)) as mock_pub:
            await manager.send_to_user(user_id=456, event_type="dm_received", data={"msg": "privada"})
            mock_pub.assert_called_once()
            call_arg = mock_pub.call_args[0][0]
            assert call_arg["scope"] == "user"
            assert call_arg["user_id"] == 456


def test_presence_service_fallback_to_local_sockets():
    """Valida fallback limpo do presence_service quando Redis não está ativo."""
    with patch("app.services.redis_service.is_redis_configured", return_value=False):
        online_ids = presence_service.get_online_user_ids()
        assert isinstance(online_ids, set)

        summary = presence_service.get_online_summary()
        assert "total_online" in summary
        assert "students_online" in summary
