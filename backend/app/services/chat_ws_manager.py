import json
import asyncio
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket
from app.core.logger import logger


class ChatConnectionManager:
    def __init__(self):
        # Mapeia websocket -> dict de metadados { "user_id": int, "role": str, "name": str }
        self.active_connections: Dict[WebSocket, Dict[str, Any]] = {}
        self._lock: Optional[asyncio.Lock] = None
        self.main_loop: Optional[asyncio.AbstractEventLoop] = None

    def _get_lock(self) -> asyncio.Lock:
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    async def connect(self, websocket: WebSocket, user_id: int, role: str, name: str):
        """Aceita a conexão e registra os metadados do usuário."""
        try:
            self.main_loop = asyncio.get_running_loop()
        except RuntimeError:
            pass

        await websocket.accept()
        lock = self._get_lock()
        async with lock:
            self.active_connections[websocket] = {
                "user_id": user_id,
                "role": role,
                "name": name,
            }
        logger.info(f"WebSocket Chat conectado: User {name} (ID {user_id}, Role {role}). Conexões ativas: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        """Remove o websocket desconectado de forma segura."""
        lock = self._get_lock()
        async with lock:
            user_data = self.active_connections.pop(websocket, None)
        if user_data:
            logger.info(f"WebSocket Chat desconectado: User {user_data.get('name')} (ID {user_data.get('user_id')}). Restantes: {len(self.active_connections)}")

    async def broadcast_event(self, event_type: str, data: Dict[str, Any], channel_type: Optional[str] = None, course_id: Optional[int] = None):
        """
        Envia uma notificação em tempo real para todos os clientes conectados.
        Payload padrão: { "type": event_type, "data": data, "channel_type": ..., "course_id": ... }
        """
        message_payload = json.dumps({
            "type": event_type,
            "channel_type": channel_type,
            "course_id": course_id,
            "data": data,
        }, default=str)

        lock = self._get_lock()
        async with lock:
            sockets = list(self.active_connections.keys())

        dead_sockets = []
        for ws in sockets:
            try:
                await ws.send_text(message_payload)
            except Exception as exc:
                logger.warning(f"Erro ao transmitir via WebSocket: {exc}. Agendando remoção da conexão.")
                dead_sockets.append(ws)

        if dead_sockets:
            async with lock:
                for ws in dead_sockets:
                    self.active_connections.pop(ws, None)

    async def send_to_user(self, user_id: int, event_type: str, data: Dict[str, Any]):
        """
        Envia uma notificação em tempo real exclusivamente para as conexões ativas do usuário especificado.
        """
        message_payload = json.dumps({
            "type": event_type,
            "data": data,
        }, default=str)

        lock = self._get_lock()
        async with lock:
            sockets = [ws for ws, meta in self.active_connections.items() if meta.get("user_id") == user_id]

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

    def send_to_user_sync(self, user_id: int, event_type: str, data: Dict[str, Any]):
        """
        Helper síncrono para enviar evento para um usuário específico a partir de rotas FastAPI.
        """
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

    def broadcast_sync(self, event_type: str, data: Dict[str, Any], channel_type: Optional[str] = None, course_id: Optional[int] = None):
        """
        Helper síncrono para chamar broadcast a partir de rotas FastAPI (threads síncronas do threadpool).
        """
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


chat_manager = ChatConnectionManager()

