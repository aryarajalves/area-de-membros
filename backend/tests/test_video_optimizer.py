"""
Testes unitários para o serviço de otimização de vídeo (FFmpeg + FastStart)
e endpoints de otimização automática de mídias no Backblaze B2.
"""
import os
from unittest.mock import patch, MagicMock
from app.services.video_optimizer import (
    extract_s3_key_from_url,
    optimize_video_file,
    optimize_video_bytes,
    optimize_b2_video_by_url,
    optimize_b2_image_by_url,
    trigger_background_video_optimization
)


def test_extract_s3_key_from_url():
    url = "https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/videos/vid_12345.mov?token=abc"
    assert extract_s3_key_from_url(url) == "AreaDeMembros/videos/vid_12345.mov"
    assert extract_s3_key_from_url("") is None
    assert extract_s3_key_from_url("https://youtube.com/watch?v=123") is None


def test_optimize_video_bytes_small_or_empty_fallback():
    raw = b"small_mock_bytes"
    out_bytes, ctype, ext = optimize_video_bytes(raw, original_ext=".mov")
    assert out_bytes == raw
    assert ext == ".mov"


@patch("app.services.video_optimizer.subprocess.run")
def test_optimize_video_file_success(mock_run, tmp_path):
    in_file = tmp_path / "input.mov"
    out_file = tmp_path / "output.mp4"
    in_file.write_bytes(b"0" * 2048)

    def side_effect(*args, **kwargs):
        out_file.write_bytes(b"1" * 1024)
        res = MagicMock()
        res.returncode = 0
        return res

    mock_run.side_effect = side_effect
    ok = optimize_video_file(str(in_file), str(out_file))
    assert ok is True
    assert out_file.exists()
    cmd_called = mock_run.call_args[0][0]
    assert "-movflags" in cmd_called
    assert "+faststart" in cmd_called
    assert "libx264" in cmd_called


@patch("app.services.video_optimizer.optimize_video_file")
def test_optimize_video_bytes_with_ffmpeg_success(mock_opt_file):
    raw_input = b"A" * 4096

    def fake_opt(in_p, out_p, **kwargs):
        with open(out_p, "wb") as f:
            f.write(b"OPTIMIZED_MP4_FASTSTART")
        return True

    mock_opt_file.side_effect = fake_opt
    out_bytes, ctype, ext = optimize_video_bytes(raw_input, original_ext=".mov")
    assert out_bytes == b"OPTIMIZED_MP4_FASTSTART"
    assert ctype == "video/mp4"
    assert ext == ".mp4"


@patch("app.services.video_optimizer._update_video_url_in_db")
@patch("app.services.video_optimizer.optimize_video_file")
@patch("app.services.video_optimizer.get_s3_client")
def test_optimize_b2_video_by_url_converts_and_uploads(mock_get_s3, mock_opt_file, mock_update_db):
    mock_s3 = MagicMock()
    mock_s3.head_object.return_value = {
        "ContentLength": 285 * 1024 * 1024,
        "Metadata": {}
    }

    def fake_download(bucket, key, dest_path, **kwargs):
        cb = kwargs.get("Callback")
        if cb:
            cb(100 * 1024 * 1024)
            cb(185 * 1024 * 1024)
        with open(dest_path, "wb") as f:
            f.write(b"RAW_MOV_DATA" * 200)

    def fake_opt(in_p, out_p, **kwargs):
        with open(out_p, "wb") as f:
            f.write(b"OPT_MP4_DATA" * 50)
        return True

    def fake_upload(src_path, bucket, key, **kwargs):
        cb = kwargs.get("Callback")
        if cb:
            cb(300)
            cb(300)

    mock_s3.download_file.side_effect = fake_download
    mock_s3.upload_file.side_effect = fake_upload
    mock_opt_file.side_effect = fake_opt
    mock_get_s3.return_value = mock_s3
    mock_update_db.return_value = 1

    url = "https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/videos/vid_test123.mov"
    new_url = optimize_b2_video_by_url(url)

    assert new_url is not None
    assert new_url.endswith("vid_test123.mp4")
    assert mock_s3.upload_file.called
    upload_kwargs = mock_s3.upload_file.call_args[1]
    assert upload_kwargs["ExtraArgs"]["ContentType"] == "video/mp4"
    assert upload_kwargs["ExtraArgs"]["Metadata"]["zv-optimized"] == "1"
    assert "max-age=31536000" in upload_kwargs["ExtraArgs"]["CacheControl"]


@patch("app.services.video_optimizer.get_s3_client")
def test_optimize_b2_video_skips_if_already_optimized(mock_get_s3):
    mock_s3 = MagicMock()
    mock_s3.head_object.return_value = {
        "ContentLength": 25 * 1024 * 1024,
        "Metadata": {"zv-optimized": "1"}
    }
    mock_get_s3.return_value = mock_s3

    url = "https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/videos/vid_done.mp4"
    result = optimize_b2_video_by_url(url)
    assert result == url
    assert not mock_s3.download_file.called


from tests.conftest import client
from app.core.config import settings


def get_superadmin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@patch("app.api.v1.endpoints.media_uploads.trigger_background_video_optimization")
def test_optimize_video_endpoint(mock_trigger):
    headers = get_superadmin_headers()
    res = client.post(
        "/api/v1/courses/optimize-video",
        json={"video_url": "https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/videos/vid_abc.mov"},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "processing"
    mock_trigger.assert_called_once()


@patch("app.services.video_optimizer.get_s3_client")
def test_video_info_endpoint_superadmin_only(mock_get_s3):
    mock_s3 = MagicMock()
    mock_s3.head_object.return_value = {
        "ContentLength": 299262976,
        "ContentType": "video/quicktime",
        "Metadata": {}
    }
    mock_get_s3.return_value = mock_s3

    headers = get_superadmin_headers()
    res = client.get(
        "/api/v1/courses/video-info",
        params={"video_url": "https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/videos/vid_raw.mov"},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["size_mb"] == 285.4
    assert data["format"] == "MOV"
    assert data["is_optimized"] is False


def test_is_bad_or_raw_lesson_title():
    from app.services.video_optimizer import is_bad_or_raw_lesson_title

    assert is_bad_or_raw_lesson_title("2a8bcc96-3336-462f-a0a0-cacde04f86b9") is True
    assert is_bad_or_raw_lesson_title("vid_123456.mov") is True
    assert is_bad_or_raw_lesson_title("Aula 1") is True
    assert is_bad_or_raw_lesson_title("Trânsitos da Lua: Emoções e Necessidades Emocionais", has_description=True) is False


def test_superadmin_course_audit_endpoint():
    headers = get_superadmin_headers()
    res = client.get("/api/v1/courses/999999/superadmin-audit", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["course_id"] == 999999
    assert "counts" in data
    assert "lessons" in data


def test_stop_video_optimization_endpoint():
    headers = get_superadmin_headers()
    res = client.post(
        "/api/v1/courses/stop-video-optimization",
        json={"video_url": "https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/videos/vid_raw.mov"},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "cancelled"


@patch("app.services.video_optimizer.subprocess.run")
def test_optimize_video_file_fast_remux_when_already_h264(mock_run, tmp_path):
    in_file = tmp_path / "input.mp4"
    out_file = tmp_path / "output.mp4"
    in_file.write_bytes(b"0" * 4096)

    def side_effect(*args, **kwargs):
        out_file.write_bytes(b"1" * 2048)
        res = MagicMock()
        res.returncode = 0
        return res

    mock_run.side_effect = side_effect
    probe_info = {
        "video_codec": "h264",
        "audio_codec": "aac",
        "height": 1080,
        "bitrate_kbps": 750.0,
        "can_fast_remux": True
    }
    ok = optimize_video_file(str(in_file), str(out_file), probe_info=probe_info)
    assert ok is True
    cmd_called = mock_run.call_args[0][0]
    assert "-c:v" in cmd_called
    assert "copy" in cmd_called
    assert "+faststart" in cmd_called
    assert "libx264" not in cmd_called


@patch("app.services.video_optimizer.subprocess.run")
def test_optimize_video_file_fallback_to_remux_on_mp4_timeout(mock_run, tmp_path):
    import subprocess
    in_file = tmp_path / "heavy_lesson.mp4"
    out_file = tmp_path / "output.mp4"
    # Arquivo >= 64 KB para habilitar fallback de remux em MP4 real
    in_file.write_bytes(b"0" * (70 * 1024))

    calls = {"count": 0}

    def side_effect(cmd, *args, **kwargs):
        calls["count"] += 1
        if "libx264" in cmd:
            raise subprocess.TimeoutExpired(cmd, 3600)
        out_file.write_bytes(b"FASTSTART_REMUX_OK" * 100)
        res = MagicMock()
        res.returncode = 0
        return res

    mock_run.side_effect = side_effect
    probe_info = {
        "video_codec": "h264",
        "audio_codec": "aac",
        "height": 1080,
        "bitrate_kbps": 2500.0,
        "can_fast_remux": False
    }
    ok = optimize_video_file(str(in_file), str(out_file), probe_info=probe_info)
    assert ok is True
    assert calls["count"] == 2
    assert out_file.exists()


def test_cancel_video_optimization_terminates_active_ffmpeg_process():
    from app.services.video_optimizer import (
        cancel_video_optimization,
        _active_ffmpeg_procs,
        _active_optimizations
    )

    s3_key = "AreaDeMembros/videos/vid_running.mp4"
    fake_proc = MagicMock()
    _active_optimizations.add(s3_key)
    _active_ffmpeg_procs[s3_key] = fake_proc

    res = cancel_video_optimization(
        "https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/videos/vid_running.mp4"
    )
    assert res["status"] == "cancelled"
    assert s3_key in res["cancelled_keys"]
    fake_proc.terminate.assert_called_once()
    assert s3_key not in _active_ffmpeg_procs

