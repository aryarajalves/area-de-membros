import pytest
from tests.conftest import client
from app.core.config import settings

def get_superadmin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_generate_video_upload_url_requires_auth():
    response = client.post(
        "/api/v1/courses/generate-video-upload-url",
        json={"filename": "aula1.mp4", "content_type": "video/mp4"}
    )
    assert response.status_code == 401

def test_generate_video_upload_url_invalid_extension():
    headers = get_superadmin_headers()
    response = client.post(
        "/api/v1/courses/generate-video-upload-url",
        headers=headers,
        json={"filename": "arquivo.exe", "content_type": "application/x-msdownload"}
    )
    assert response.status_code == 400
    assert "Formato de vídeo inválido" in response.json()["detail"]

def test_generate_video_upload_url_fallback_when_no_b2():
    from unittest.mock import patch
    headers = get_superadmin_headers()
    with patch("app.api.v1.endpoints.media_uploads.generate_presigned_upload_url", return_value=None):
        response = client.post(
            "/api/v1/courses/generate-video-upload-url",
            headers=headers,
            json={"filename": "aula_segura.mp4", "content_type": "video/mp4"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "direct_upload" in data
        assert "upload_url" in data
        assert "method" in data



def test_effective_b2_endpoint_url_derivation(monkeypatch):
    # Caso 1: B2_ENDPOINT_URL vazia e BACKBLAZE_CDN_URL com path
    monkeypatch.setattr(settings, "B2_ENDPOINT_URL", "")
    monkeypatch.setattr(settings, "BACKBLAZE_CDN_URL", "https://s3.us-west-004.backblazeb2.com/zap-voice")
    assert settings.EFFECTIVE_B2_ENDPOINT_URL == "https://s3.us-west-004.backblazeb2.com"

    # Caso 2: B2_ENDPOINT_URL já configurada explicitamente
    monkeypatch.setattr(settings, "B2_ENDPOINT_URL", "https://s3.us-east-005.backblazeb2.com")
    assert settings.EFFECTIVE_B2_ENDPOINT_URL == "https://s3.us-east-005.backblazeb2.com"


def test_upload_attachment_requires_auth():
    response = client.post(
        "/api/v1/courses/upload-attachment",
        files={"file": ("documento.pdf", b"%PDF-1.4 mock content", "application/pdf")}
    )
    assert response.status_code == 401


def test_upload_attachment_invalid_extension():
    headers = get_superadmin_headers()
    response = client.post(
        "/api/v1/courses/upload-attachment",
        headers=headers,
        files={"file": ("virus.exe", b"binary content", "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "não suportado" in response.json()["detail"]


def test_upload_attachment_success():
    headers = get_superadmin_headers()
    response = client.post(
        "/api/v1/courses/upload-attachment",
        headers=headers,
        files={"file": ("Apostila_Modulo1.pdf", b"%PDF-1.4 mock content for lesson", "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "file_url" in data
    assert "attachment_url" in data
    assert data["file_url"] == data["attachment_url"]
    assert data["file_name"] == "Apostila_Modulo1.pdf"
    assert data["title"] == "Apostila_Modulo1.pdf"
    assert data["file_type"] == "pdf"
    assert data["file_size"] > 0
    assert data["file_size_bytes"] == data["file_size"]


def test_lesson_schemas_resolve_video_cdn_url(monkeypatch):
    from datetime import datetime, timezone
    from app.schemas.course import LessonResponse, LessonVideoResponse

    monkeypatch.setattr(settings, "VIDEO_CDN_URL", "https://cdn-sp.aryaraj.shop")
    monkeypatch.setattr(settings, "BACKBLAZE_CDN_URL", "")
    monkeypatch.setattr(settings, "B2_BUCKET_NAME", "meu-bucket")
    monkeypatch.setattr(settings, "STREAMING_CACHE_ENABLED", True)

    now = datetime.now(timezone.utc)
    raw_b2_url = "https://s3.us-west-004.backblazeb2.com/meu-bucket/AreaDeMembros/videos/aula01.mp4"

    vid_schema = LessonVideoResponse(
        id=1,
        lesson_id=10,
        language="pt",
        language_label="Português",
        video_url=raw_b2_url,
        video_type="upload",
        created_at=now
    )
    assert vid_schema.video_url == "https://cdn-sp.aryaraj.shop/meu-bucket/AreaDeMembros/videos/aula01.mp4"

    lesson_schema = LessonResponse(
        id=10,
        module_id=2,
        title="Aula Teste CDN",
        video_url=raw_b2_url,
        video_type="upload",
        created_at=now,
        updated_at=now,
        videos=[vid_schema]
    )
    assert lesson_schema.video_url == "https://cdn-sp.aryaraj.shop/meu-bucket/AreaDeMembros/videos/aula01.mp4"


def test_generate_presigned_upload_url_applies_video_cdn_url(monkeypatch):
    from unittest.mock import MagicMock, patch
    from app.services.storage import generate_presigned_upload_url

    monkeypatch.setattr(settings, "VIDEO_CDN_URL", "https://cdn-sp.aryaraj.shop")
    monkeypatch.setattr(settings, "BACKBLAZE_CDN_URL", "")
    monkeypatch.setattr(settings, "B2_ENDPOINT_URL", "https://s3.us-west-004.backblazeb2.com")
    monkeypatch.setattr(settings, "B2_BUCKET_NAME", "meu-bucket")
    monkeypatch.setattr(settings, "STREAMING_CACHE_ENABLED", True)

    fake_s3 = MagicMock()
    fake_s3.generate_presigned_url.return_value = "https://s3.us-west-004.backblazeb2.com/presigned"

    with patch("app.services.storage.get_s3_client", return_value=fake_s3):
        result = generate_presigned_upload_url("vid_abc.mp4", "video/mp4")

    assert result is not None
    assert result["video_url"] == "https://cdn-sp.aryaraj.shop/meu-bucket/AreaDeMembros/videos/vid_abc.mp4"


def test_video_telemetry_endpoint_logs_diagnostic_details():
    from unittest.mock import patch
    headers = get_superadmin_headers()

    with patch("app.api.v1.endpoints.logs.logger") as mock_logger:
        res = client.post(
            "/api/v1/logs/video-telemetry",
            headers=headers,
            json={
                "event_type": "BUFFERING_STALL_8S",
                "lesson_title": "Aula 03 - Mapa Astral",
                "video_url": "https://cdn.aryaraj.shop/videos/aula03.mp4",
                "current_time": 12.5,
                "ready_state": 1,
                "network_state": 2,
                "error_code": None,
                "retry_attempt": 1,
                "user_agent": "Mozilla/5.0 iPhone"
            }
        )
        assert res.status_code == 200
        assert res.json() == {"status": "logged", "event_type": "BUFFERING_STALL_8S"}
        mock_logger.warning.assert_called_once()
        logged_text = mock_logger.warning.call_args[0][0]
        assert "[VIDEO PLAYER]" in logged_text
        assert "BUFFERING_STALL_8S" in logged_text
        assert "HAVE_METADATA" in logged_text
        assert "NETWORK_LOADING" in logged_text

        res_err = client.post(
            "/api/v1/logs/video-telemetry",
            headers=headers,
            json={
                "event_type": "VIDEO_STREAM_ERROR",
                "lesson_title": "Aula 03 - Mapa Astral",
                "video_url": "https://cdn.aryaraj.shop/videos/aula03.mp4",
                "ready_state": 0,
                "network_state": 3,
                "error_code": 4,
                "retry_attempt": 1
            }
        )
        assert res_err.status_code == 200
        mock_logger.error.assert_called_once()
        err_text = mock_logger.error.call_args[0][0]
        assert "MEDIA_ERR_SRC_NOT_SUPPORTED" in err_text


def test_resolve_video_cdn_url_same_domain_path(monkeypatch):
    from app.services.cdn_service import resolve_video_cdn_url, build_same_domain_proxy_url

    monkeypatch.setattr(settings, "VIDEO_CDN_URL", "/cdn-videos")
    monkeypatch.setattr(settings, "BACKBLAZE_CDN_URL", "")
    monkeypatch.setattr(settings, "B2_BUCKET_NAME", "meu-bucket")
    monkeypatch.setattr(settings, "STREAMING_CACHE_ENABLED", True)

    raw_b2_url = "https://s3.us-west-004.backblazeb2.com/meu-bucket/AreaDeMembros/videos/vid_samedomain.mp4"
    assert resolve_video_cdn_url(raw_b2_url) == "/cdn-videos/AreaDeMembros/videos/vid_samedomain.mp4"
    assert resolve_video_cdn_url("/api/v1/courses/videos/vid_local.mp4") == "/cdn-videos/AreaDeMembros/videos/vid_local.mp4"

    proxy_url = build_same_domain_proxy_url(raw_b2_url)
    assert proxy_url.startswith("/api/v1/courses/video-proxy?video_url=")


def test_video_stream_probe_and_proxy_range_streaming(monkeypatch):
    import io
    from unittest.mock import patch

    monkeypatch.setattr(settings, "B2_BUCKET_NAME", "meu-bucket")
    target_url = "https://s3.us-west-004.backblazeb2.com/meu-bucket/AreaDeMembros/videos/vid_probe_test.mp4"

    # 1. Bloqueio de segurança (SSRF / path traversal)
    bad_res = client.get("/api/v1/courses/video-proxy?video_url=https://evil.com/secret.mp4")
    assert bad_res.status_code == 400

    trav_res = client.get("/api/v1/courses/video-stream-probe?video_url=../etc/passwd")
    assert trav_res.status_code == 400

    # 2. Sonda diagnóstica quando vídeo está acessível pelo servidor no B2
    with patch(
        "app.api.v1.endpoints.media_uploads.head_media_object",
        return_value={"s3_key": "AreaDeMembros/videos/vid_probe_test.mp4", "content_length": 1024, "content_type": "video/mp4"},
    ):
        probe_res = client.get(f"/api/v1/courses/video-stream-probe?video_url={target_url}")
        assert probe_res.status_code == 200
        probe_data = probe_res.json()
        assert probe_data["reachable_from_server"] is True
        assert probe_data["storage"] == "b2"
        assert probe_data["content_length"] == 1024
        assert probe_data["proxy_url"].startswith("/api/v1/courses/video-proxy?video_url=")

    # 3. Streaming via proxy com suporte a Byte-Range (206 Partial Content)
    sample_bytes = b"0123456789ABCDEF"
    with patch(
        "app.api.v1.endpoints.media_uploads.fetch_media_object",
        return_value={
            "body": io.BytesIO(sample_bytes[:10]),
            "content_type": "video/mp4",
            "content_length": 10,
            "content_range": "bytes 0-9/16",
            "accept_ranges": "bytes",
            "status_code": 206,
        },
    ) as mock_fetch:
        proxy_res = client.get(
            f"/api/v1/courses/video-proxy?video_url={target_url}",
            headers={"Range": "bytes=0-9"},
        )
        assert proxy_res.status_code == 206
        assert proxy_res.headers.get("accept-ranges") == "bytes"
        assert proxy_res.headers.get("content-range") == "bytes 0-9/16"
        assert proxy_res.content == sample_bytes[:10]
        mock_fetch.assert_called_once()
        assert mock_fetch.call_args.kwargs.get("range_header") == "bytes=0-9"

    # 4. Streaming via path direto (/video-proxy/{s3_path}) usado pelo Nginx /cdn-videos/
    with patch(
        "app.api.v1.endpoints.media_uploads.fetch_media_object",
        return_value={
            "body": io.BytesIO(sample_bytes),
            "content_type": "video/mp4",
            "content_length": 16,
            "content_range": None,
            "accept_ranges": "bytes",
            "status_code": 200,
        },
    ):
        cdn_res = client.get("/api/v1/courses/video-proxy/AreaDeMembros/videos/vid_probe_test.mp4")
        assert cdn_res.status_code == 200
        assert cdn_res.headers.get("accept-ranges") == "bytes"
        assert cdn_res.content == sample_bytes


