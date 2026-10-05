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

