import json
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from tests.conftest import client
from app.core.config import settings
from app.core.sentry_setup import parse_sentry_dsn, init_sentry, _scrub_sensitive_data


def test_parse_sentry_dsn_valid_and_invalid():
    assert parse_sentry_dsn("https://abc123@o450123.ingest.us.sentry.io/450987654") == (
        "o450123.ingest.us.sentry.io",
        "450987654",
    )
    assert parse_sentry_dsn("https://key@sentry.exemplo.com:8443/12345") == (
        "sentry.exemplo.com:8443",
        "12345",
    )
    assert parse_sentry_dsn("") is None
    assert parse_sentry_dsn("not-a-url") is None
    assert parse_sentry_dsn("https://key@sentry.io/not-numeric") is None


def test_init_sentry_disabled_when_dsn_empty(monkeypatch):
    monkeypatch.setattr(settings, "SENTRY_DSN_BACKEND", "")
    assert init_sentry("backend") is False


def test_init_sentry_enabled_and_scrubs_sensitive_data(monkeypatch):
    monkeypatch.setattr(settings, "SENTRY_DSN_BACKEND", "https://pub123@o1.ingest.sentry.io/999")
    monkeypatch.setattr(settings, "SENTRY_ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "SENTRY_TRACES_SAMPLE_RATE", 0.25)

    with patch("sentry_sdk.init") as mock_init, patch("sentry_sdk.set_tag") as mock_tag:
        assert init_sentry("worker") is True
        mock_init.assert_called_once()
        mock_tag.assert_called_once_with("service", "worker")

    # Valida mascaramento de headers e campos sensíveis
    event = {
        "request": {
            "headers": {
                "authorization": "Bearer segredo-jwt",
                "cookie": "session=abc",
                "user-agent": "Mozilla/5.0",
            },
            "data": {
                "email": "aluna@teste.com",
                "password": "MinhaSenhaSecreta",
            },
        }
    }
    cleaned = _scrub_sensitive_data(event, {})
    assert cleaned["request"]["headers"]["authorization"] == "[Filtered]"
    assert cleaned["request"]["headers"]["cookie"] == "[Filtered]"
    assert cleaned["request"]["headers"]["user-agent"] == "Mozilla/5.0"
    assert cleaned["request"]["data"]["password"] == "[Filtered]"
    assert cleaned["request"]["data"]["email"] == "aluna@teste.com"


def test_sentry_config_endpoint(monkeypatch):
    monkeypatch.setattr(settings, "SENTRY_DSN_FRONTEND", "")
    res_off = client.get("/api/v1/logs/sentry-config")
    assert res_off.status_code == 200
    assert res_off.json() == {"enabled": False, "dsn": ""}

    monkeypatch.setattr(settings, "SENTRY_DSN_FRONTEND", "https://frontkey@o1.ingest.sentry.io/12345")
    monkeypatch.setattr(settings, "SENTRY_ENVIRONMENT", "production")
    res_on = client.get("/api/v1/logs/sentry-config")
    assert res_on.status_code == 200
    data = res_on.json()
    assert data["enabled"] is True
    assert data["dsn"] == "https://frontkey@o1.ingest.sentry.io/12345"
    assert data["tunnel"] == "/api/v1/logs/sentry-tunnel"


def test_sentry_tunnel_blocks_unauthorized_dsn_and_forwards_valid(monkeypatch):
    monkeypatch.setattr(settings, "SENTRY_DSN_FRONTEND", "https://frontkey@o1.ingest.sentry.io/12345")

    # 1. Envelope inválido
    res_bad = client.post("/api/v1/logs/sentry-tunnel", content=b"not-json")
    assert res_bad.status_code == 400

    # 2. Tentativa de SSRF para outro host/projeto deve ser bloqueada com 403
    evil_envelope = json.dumps({"dsn": "https://evil@attacker.com/99999"}).encode() + b"\n{}"
    res_ssrf = client.post("/api/v1/logs/sentry-tunnel", content=evil_envelope)
    assert res_ssrf.status_code == 403

    # 3. Envelope válido encaminhado para o host autorizado
    valid_envelope = json.dumps({"dsn": "https://frontkey@o1.ingest.sentry.io/12345"}).encode() + b"\n{}"
    mock_upstream_res = MagicMock(status_code=200, content=b'{"id":"evt1"}')
    mock_post = AsyncMock(return_value=mock_upstream_res)

    with patch("app.api.v1.endpoints.logs.httpx.AsyncClient") as mock_client_cls:
        mock_instance = AsyncMock()
        mock_instance.post = mock_post
        mock_client_cls.return_value.__aenter__.return_value = mock_instance

        res_ok = client.post("/api/v1/logs/sentry-tunnel", content=valid_envelope)

    assert res_ok.status_code == 200
    mock_post.assert_awaited_once()
    called_url = mock_post.call_args[0][0]
    assert called_url == "https://o1.ingest.sentry.io/api/12345/envelope/"
