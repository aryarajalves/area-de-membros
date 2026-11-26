"""
Configuração centralizada do Sentry para Backend (FastAPI) e Worker.
Inclui sanitização de headers e credenciais antes do envio (LGPD/Segurança).
"""
import logging
from typing import Optional, Tuple, Dict, Any
from urllib.parse import urlparse

from app.core.config import settings
from app.core.logger import logger

_sentry_initialized = False

SENSITIVE_HEADERS = {"authorization", "cookie", "set-cookie", "x-api-key", "x-csrf-token"}
SENSITIVE_FIELDS = {"password", "hashed_password", "token", "access_token", "refresh_token", "secret", "secret_key"}


def parse_sentry_dsn(dsn: str) -> Optional[Tuple[str, str]]:
    """Extrai (host, project_id) de uma URL DSN válida do Sentry."""
    if not dsn or not isinstance(dsn, str):
        return None
    try:
        parsed = urlparse(dsn.strip())
        if parsed.scheme not in ("http", "https") or not parsed.hostname:
            return None
        path_parts = [p for p in parsed.path.strip("/").split("/") if p]
        if not path_parts:
            return None
        project_id = path_parts[-1]
        if not project_id.isdigit():
            return None
        host = parsed.hostname
        if parsed.port:
            host = f"{host}:{parsed.port}"
        return host, project_id
    except Exception:
        return None


def _mask_dict_fields(data: Any) -> Any:
    """Mascara recursivamente campos sensíveis de dicionários de payload."""
    if not isinstance(data, dict):
        return data
    masked = {}
    for k, v in data.items():
        if str(k).lower() in SENSITIVE_FIELDS:
            masked[k] = "[Filtered]"
        elif isinstance(v, dict):
            masked[k] = _mask_dict_fields(v)
        else:
            masked[k] = v
    return masked


def _scrub_sensitive_data(event: Dict[str, Any], hint: Dict[str, Any]) -> Dict[str, Any]:
    """Remove headers de autenticação e campos sensíveis antes de enviar ao Sentry."""
    req = event.get("request")
    if isinstance(req, dict):
        headers = req.get("headers")
        if isinstance(headers, dict):
            req["headers"] = {
                k: ("[Filtered]" if str(k).lower() in SENSITIVE_HEADERS else v)
                for k, v in headers.items()
            }
        if isinstance(req.get("data"), dict):
            req["data"] = _mask_dict_fields(req["data"])
    return event


def init_sentry(service_name: str = "backend") -> bool:
    """Inicializa o Sentry SDK caso SENTRY_DSN_BACKEND esteja configurado."""
    global _sentry_initialized
    dsn = (settings.SENTRY_DSN_BACKEND or "").strip()
    if not dsn:
        logger.info("[SENTRY] SENTRY_DSN_BACKEND não configurado — monitoramento desativado.")
        return False

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration

        sentry_logging = LoggingIntegration(
            level=logging.INFO,
            event_level=logging.ERROR,
        )

        sentry_sdk.init(
            dsn=dsn,
            environment=settings.SENTRY_ENVIRONMENT or "production",
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            send_default_pii=False,
            before_send=_scrub_sensitive_data,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
                sentry_logging,
            ],
        )
        sentry_sdk.set_tag("service", service_name)
        _sentry_initialized = True
        logger.info(f"[SENTRY] Monitoramento inicializado com sucesso para '{service_name}' (env={settings.SENTRY_ENVIRONMENT}).")
        return True
    except Exception as exc:
        logger.warning(f"[SENTRY] Falha ao inicializar monitoramento ({service_name}): {exc}")
        return False


def capture_sentry_exception(exc: Exception, extra: Optional[dict] = None) -> None:
    """Captura manualmente uma exceção no Sentry quando inicializado."""
    if not _sentry_initialized:
        return
    try:
        import sentry_sdk
        if extra:
            with sentry_sdk.push_scope() as scope:
                for k, v in extra.items():
                    scope.set_extra(k, v)
                sentry_sdk.capture_exception(exc)
        else:
            sentry_sdk.capture_exception(exc)
    except Exception:
        pass
