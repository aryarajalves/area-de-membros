"""
Endpoints de API para Gerenciamento de Logs dos Contêineres Docker.
Exclusivo para Super Administradores.
"""
import json
from typing import Dict, Any, List, Optional
import httpx
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from app.core.config import settings
from app.core.logger import logger
from app.core.sentry_setup import parse_sentry_dsn
from app.models.user import User
from app.api.v1.endpoints.users import require_superadmin, get_current_user
from app.services.docker_logs_service import fetch_container_logs, CONTAINER_SERVICES

MAX_SENTRY_ENVELOPE_BYTES = 5 * 1024 * 1024  # 5 MB

router = APIRouter(prefix="/logs", tags=["Logs dos Contêineres"])

READY_STATE_LABELS = {
    0: "0 (HAVE_NOTHING - nenhum metadado/frame recebido da CDN)",
    1: "1 (HAVE_METADATA - cabeçalho recebido, aguardando frames de vídeo)",
    2: "2 (HAVE_CURRENT_DATA - frame atual disponível, mas sem buffer suficiente para continuar)",
    3: "3 (HAVE_FUTURE_DATA)",
    4: "4 (HAVE_ENOUGH_DATA)",
}

NETWORK_STATE_LABELS = {
    0: "0 (NETWORK_EMPTY)",
    1: "1 (NETWORK_IDLE)",
    2: "2 (NETWORK_LOADING - conexão aberta aguardando bytes da CDN/rede lenta)",
    3: "3 (NETWORK_NO_SOURCE - falha ao acessar URL na CDN/bloqueio/formato não suportado)",
}

MEDIA_ERROR_LABELS = {
    1: "MEDIA_ERR_ABORTED (1 - download abortado pelo navegador)",
    2: "MEDIA_ERR_NETWORK (2 - falha de rede/queda na conexão durante streaming)",
    3: "MEDIA_ERR_DECODE (3 - erro ao decodificar codec de vídeo no dispositivo)",
    4: "MEDIA_ERR_SRC_NOT_SUPPORTED (4 - URL inacessível 403/404, bloqueio CORS/Firewall ou formato .MOV incompatível)",
}


class VideoTelemetryLogPayload(BaseModel):
    event_type: str
    lesson_title: Optional[str] = None
    video_url: Optional[str] = None
    current_time: Optional[float] = 0.0
    ready_state: Optional[int] = None
    network_state: Optional[int] = None
    error_code: Optional[int] = None
    error_message: Optional[str] = None
    retry_attempt: Optional[int] = 0
    user_agent: Optional[str] = None


@router.post("/video-telemetry")
def report_video_telemetry(
    payload: VideoTelemetryLogPayload,
    request: Request,
    current_user: User = Depends(get_current_user),
) -> Dict[str, str]:
    """Registra no log do backend falhas, travamentos de buffering e reconexões no player de vídeo dos alunos."""
    ready_label = READY_STATE_LABELS.get(payload.ready_state, str(payload.ready_state))
    net_label = NETWORK_STATE_LABELS.get(payload.network_state, str(payload.network_state))
    err_label = MEDIA_ERROR_LABELS.get(payload.error_code, "Nenhum (conexão pendurada)")
    if payload.error_message:
        err_label = f"{err_label} [{payload.error_message}]"

    client_ip = request.client.host if request.client else "desconhecido"
    ua = payload.user_agent or request.headers.get("user-agent", "N/A")

    log_msg = (
        f"[VIDEO PLAYER] [{payload.event_type}] Aluno: {current_user.name} ({current_user.email}, ID #{current_user.id}) | "
        f"Aula: \"{payload.lesson_title or 'N/A'}\" | Posição: {round(payload.current_time or 0.0, 1)}s | "
        f"Tentativa: #{payload.retry_attempt or 0} | "
        f"Diagnóstico: readyState={ready_label}, networkState={net_label}, erroHTML5={err_label} | "
        f"URL: {payload.video_url or 'N/A'} | IP: {client_ip} | Dispositivo: {ua}"
    )

    if payload.event_type == "VIDEO_STREAM_ERROR":
        logger.error(log_msg)
    else:
        logger.warning(log_msg)

    return {"status": "logged", "event_type": payload.event_type}


@router.get("/sentry-config")
def get_sentry_frontend_config() -> Dict[str, Any]:
    """Retorna a configuração pública do Sentry para o frontend (sem expor segredos)."""
    dsn = (settings.SENTRY_DSN_FRONTEND or "").strip()
    if not dsn:
        return {"enabled": False, "dsn": ""}
    return {
        "enabled": True,
        "dsn": dsn,
        "environment": settings.SENTRY_ENVIRONMENT or "production",
        "tunnel": "/api/v1/logs/sentry-tunnel",
        "traces_sample_rate": settings.SENTRY_TRACES_SAMPLE_RATE,
        "replays_session_sample_rate": settings.SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
        "replays_on_error_sample_rate": settings.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
    }


@router.post("/sentry-tunnel")
async def sentry_tunnel(request: Request) -> Response:
    """
    Túnel proxy reverso para envelopes do Sentry no frontend.
    Evita bloqueios de AdBlock e firewalls corporativos contra sentry.io.
    """
    configured_dsn = (settings.SENTRY_DSN_FRONTEND or "").strip()
    expected = parse_sentry_dsn(configured_dsn)
    if not expected:
        raise HTTPException(status_code=503, detail="Monitoramento Sentry não configurado no servidor.")

    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="Envelope Sentry vazio.")
    if len(body) > MAX_SENTRY_ENVELOPE_BYTES:
        raise HTTPException(status_code=413, detail="Envelope Sentry excede o limite permitido.")

    try:
        header_line = body.split(b"\n", 1)[0].decode("utf-8")
        header = json.loads(header_line)
        envelope_dsn = header.get("dsn") or ""
    except Exception:
        raise HTTPException(status_code=400, detail="Cabeçalho do envelope Sentry inválido.")

    received = parse_sentry_dsn(envelope_dsn)
    if not received or received != expected:
        raise HTTPException(status_code=403, detail="DSN não autorizado para este túnel.")

    expected_host, expected_project_id = expected
    upstream_url = f"https://{expected_host}/api/{expected_project_id}/envelope/"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            upstream_res = await client.post(
                upstream_url,
                content=body,
                headers={"Content-Type": "application/x-sentry-envelope"},
            )
        return Response(status_code=upstream_res.status_code, content=upstream_res.content)
    except Exception as exc:
        logger.warning(f"[SENTRY TUNNEL] Falha ao encaminhar envelope ao Sentry: {exc}")
        raise HTTPException(status_code=502, detail="Falha ao encaminhar telemetria ao Sentry.")


@router.get("/services")
def list_available_services(
    current_user: User = Depends(require_superadmin)
) -> List[Dict[str, str]]:
    """Retorna os serviços disponíveis para visualização de logs."""
    labels = {
        "backend": "Backend (FastAPI)",
        "frontend": "Frontend (Nginx / Vite)",
    }
    return [
        {"id": key, "name": labels.get(key, key), "container": container}
        for key, container in CONTAINER_SERVICES.items()
    ]

@router.get("/{service_name}")
def get_service_logs(
    service_name: str,
    tail: int = Query(100, ge=10, le=1000, description="Quantidade de linhas de log a retornar"),
    date: str = Query(None, description="Data específica no formato YYYY-MM-DD"),
    start_time: str = Query(None, description="Hora inicial no formato HH:MM"),
    end_time: str = Query(None, description="Hora final no formato HH:MM"),
    current_user: User = Depends(require_superadmin)
) -> Dict[str, Any]:
    """Retorna as linhas de log de um contêiner específico com suporte a filtro por data e horário de Brasília."""
    return fetch_container_logs(
        service_name=service_name.lower(),
        tail=tail,
        target_date=date,
        start_time=start_time,
        end_time=end_time
    )
