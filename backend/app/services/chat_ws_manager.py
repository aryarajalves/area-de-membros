import json
import uuid
import asyncio
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket
from app.core.logger import logger
from app.services import redis_service


class ChatConnectionManager:
    def __init__(self):
        # Mapeia websocket -> dict de metadados { "user_id": int, "role": str, "name": str, "conn_id": str }
        self.active_connections: Dict[WebSocket, Dict[str, Any]] = {}
        self._lock: Optional[asyncio.Lock] = None
        self.main_loop: Optional[asyncio.AbstractEventLoop] = None
        self.instance_id: str = uuid.uuid4().hex[:8]
        self._listener_task: Optional[asyncio.Task] = None
        self._is_listening: bool = False

    def _get_lock(self) -> asyncio.Lock:
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    async def connect(self, websocket: WebSocket, user_id: int, role: str, name: str):
        """Aceita a conexão e registra os metadados do usuário local e no Redis."""
        try:
            self.main_loop = asyncio.get_running_loop()
        except RuntimeError:
            pass

        await websocket.accept()
        conn_id = f"{self.instance_id}_{uuid.uuid4().hex[:8]}"

        lock = self._get_lock()
        async with lock:
            self.active_connections[websocket] = {
                "user_id": user_id,
                "role": role,
                "name": name,
                "conn_id": conn_id,
            }

        # Registra no Redis distribuído (se ativo)
        if redis_service.is_redis_configured():
            try:
                await redis_service.register_online_connection(user_id, role, conn_id)
            except Exception as exc:
                logger.debug(f"[WS] Falha ao registrar conexão no Redis: {exc}")

        logger.info(
            f"WebSocket Chat conectado [Worker {self.instance_id}]: User {name} "
            f"(ID {user_id}, Role {role}). Conexões locais: {len(self.active_connections)}"
        )

    async def disconnect(self, websocket: WebSocket):
        """Remove o websocket desconectado de forma segura localmente e no Redis."""
        lock = self._get_lock()
        async with lock:
            user_data = self.active_connections.pop(websocket, None)

        if user_data:
            user_id = user_data.get("user_id")
            conn_id = user_data.get("conn_id", "")
            if user_id and redis_service.is_redis_configured():
                try:
                    await redis_service.unregister_online_connection(int(user_id), conn_id)
                except Exception as exc:
                    logger.debug(f"[WS] Falha ao desregistrar conexão no Redis: {exc}")

            logger.info(
                f"WebSocket Chat desconectado [Worker {self.instance_id}]: "
                f"User {user_data.get('name')} (ID {user_id}). Restantes locais: {len(self.active_connections)}"
            )

    def get_online_user_ids(self) -> Set[int]:
        """Retorna os IDs de usuários atualmente conectados neste worker local."""
        return {
            int(meta.get("user_id"))
            for meta in self.active_connections.values()
            if meta.get("user_id") is not None
        }

    async def _local_broadcast(self, message_payload: str):
        """Dispara mensagem diretamente para os WebSockets conectados neste worker."""
        lock = self._get_lock()
        async with lock:
            sockets = list(self.active_connections.keys())

        if not sockets:
            return

        dead_sockets = []
        for ws in sockets:
            try:
                await ws.send_text(message_payload)
            except Exception as exc:
                logger.warning(f"Erro ao transmitir via WebSocket local: {exc}. Agendando remoção.")
                dead_sockets.append(ws)

        if dead_sockets:
            async with lock:
                for ws in dead_sockets:
                    self.active_connections.pop(ws, None)

    async def _local_send_to_user(self, user_id: int, message_payload: str):
        """Dispara mensagem para as conexões ativas do usuário neste worker."""
        lock = self._get_lock()
        async with lock:
            sockets = [ws for ws, meta in self.active_connections.items() if meta.get("user_id") == user_id]

        if not sockets:
            return

        dead_sockets = []
        for ws in sockets:
            try:
                await ws.send_text(message_payload)
            except Exception as exc:
                logger.warning(f"Erro ao transmitir via WebSocket para usuário {user_id}: {exc}")
                dead_sockets.append(ws)

        if dead_sockets:
            async with lock:
                for ws in dead_sockets:
                    self.active_connections.pop(ws, None)

    async def broadcast_event(
        self,
        event_type: str,
        data: Dict[str, Any],
        channel_type: Optional[str] = None,
        course_id: Optional[int] = None
    ):
        """
        Envia uma notificação em tempo real para todos os clientes conectados.
        Publica no Redis Pub/Sub se configurado para alcançar todas as réplicas/workers,
        com fallback imediato para envio local.
        """
        message_payload = json.dumps({
            "type": event_type,
            "channel_type": channel_type,
            "course_id": course_id,
            "data": data,
        }, default=str)

        # 1. Entrega local imediata aos clientes conectados diretamente a este worker
        await self._local_broadcast(message_payload)

        # 2. Publica no Redis Pub/Sub para alcançar réplicas e outros workers
        if redis_service.is_redis_configured():
            envelope = {
                "scope": "broadcast",
                "origin_instance": self.instance_id,
                "payload": message_payload,
            }
            await redis_service.publish_ws_event(envelope)

    async def send_to_user(self, user_id: int, event_type: str, data: Dict[str, Any]):
        """
        Envia uma notificação em tempo real exclusivamente para o usuário especificado.
        Entrega localmente se conectado neste worker e propaga via Redis para outros workers.
        """
        message_payload = json.dumps({
            "type": event_type,
            "data": data,
        }, default=str)

        # 1. Entrega local se o usuário estiver neste worker
        await self._local_send_to_user(user_id, message_payload)

        # 2. Publica no Redis Pub/Sub para alcançar o worker onde o usuário pode estar conectado
        if redis_service.is_redis_configured():
            envelope = {
                "scope": "user",
                "user_id": user_id,
                "origin_instance": self.instance_id,
                "payload": message_payload,
            }
            await redis_service.publish_ws_event(envelope)

    def send_to_user_sync(self, user_id: int, event_type: str, data: Dict[str, Any]):
        """Helper síncrono para enviar evento para um usuário a partir de rotas FastAPI."""
        try:
            loop = self.main_loop
            if loop and loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    self.send_to_user(user_id, event_type, data),
                    loop
                )
            else:
                try:
                    cur_loop = asyncio.get_running_loop()
                    cur_loop.create_task(self.send_to_user(user_id, event_type, data))
                except RuntimeError:
                    pass
        except Exception as exc:
            logger.error(f"Falha ao acionar envio síncrono para usuário {user_id}: {exc}")

    def broadcast_sync(
        self,
        event_type: str,
        data: Dict[str, Any],
        channel_type: Optional[str] = None,
        course_id: Optional[int] = None
    ):
        """Helper síncrono para chamar broadcast a partir de rotas FastAPI síncronas."""
        try:
            loop = self.main_loop
            if loop and loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    self.broadcast_event(event_type, data, channel_type, course_id),
                    loop
                )
            else:
                try:
                    cur_loop = asyncio.get_running_loop()
                    cur_loop.create_task(self.broadcast_event(event_type, data, channel_type, course_id))
                except RuntimeError:
                    pass
        except Exception as exc:
            logger.error(f"Falha ao acionar broadcast síncrono do chat: {exc}")

    async def start_redis_listener(self):
        """
        Inicia a escuta em background de eventos do Redis Pub/Sub para sincronização multi-worker.
        """
        if not redis_service.is_redis_configured():
            logger.info("[WS REDIS] REDIS_URL não configurado. Listener multi-worker dispensado.")
            return

        if self._is_listening:
            return

        self._is_listening = True
        self._listener_task = asyncio.create_task(self._redis_pubsub_loop())
        logger.info(f"[WS REDIS] Listener Pub/Sub iniciado no Worker {self.instance_id}.")

    async def stop_redis_listener(self):
        """Cancela a tarefa de escuta do Redis Pub/Sub."""
        self._is_listening = False
        if self._listener_task and not self._listener_task.done():
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass
        self._listener_task = None
        await redis_service.close_async_redis()

    async def _redis_pubsub_loop(self):
        """Loop contínuo de consumo do canal Redis Pub/Sub com auto-reconexão resiliente."""
        while self._is_listening:
            try:
                client = await redis_service.get_async_redis()
                if not client:
                    await asyncio.sleep(5)
                    continue

                pubsub = client.pubsub()
                await pubsub.subscribe(redis_service.REDIS_CHANNEL_EVENTS)

                logger.info(f"[WS REDIS] Inscrito no canal {redis_service.REDIS_CHANNEL_EVENTS}.")
                async for raw_message in pubsub.listen():
                    if not self._is_listening:
                        break
                    if raw_message.get("type") != "message":
                        continue

                    try:
                        envelope = json.loads(raw_message.get("data", "{}"))
                        # Evita reprocessar eventos originados pelo próprio worker (já entregues localmente)
                        if envelope.get("origin_instance") == self.instance_id:
                            continue

                        scope = envelope.get("scope")
                        payload_str = envelope.get("payload", "{}")

                        if scope == "broadcast":
                            await self._local_broadcast(payload_str)
                        elif scope == "user":
                            target_uid = envelope.get("user_id")
                            if target_uid is not None:
                                await self._local_send_to_user(int(target_uid), payload_str)
                    except Exception as parse_err:
                        logger.debug(f"[WS REDIS] Erro ao processar mensagem do Pub/Sub: {parse_err}")

            except asyncio.CancelledError:
                break
            except Exception as loop_err:
                logger.warning(f"[WS REDIS] Desconexão no loop Pub/Sub: {loop_err}. Reconectando em 3s...")
                await asyncio.sleep(3)


chat_manager = ChatConnectionManager()
