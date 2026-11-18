import os
from unittest.mock import patch

from tests.conftest import client


def test_serve_feed_media_returns_explicit_mime_types(tmp_path):
    webp_file = tmp_path / "sample.webp"
    webp_file.write_bytes(b"RIFF\x00\x00\x00\x00WEBP")

    png_file = tmp_path / "sample.png"
    png_file.write_bytes(b"\x89PNG\r\n\x1a\n")

    mp4_file = tmp_path / "sample.mp4"
    mp4_file.write_bytes(b"\x00\x00\x00\x18ftypmp42")

    with patch("app.api.v1.endpoints.community_feed.COMMUNITY_UPLOAD_DIR", str(tmp_path)):
        res_webp = client.get("/api/v1/community/feed/media/sample.webp")
        assert res_webp.status_code == 200
        assert res_webp.headers["content-type"].startswith("image/webp")

        res_png = client.get("/api/v1/community/feed/media/sample.png")
        assert res_png.status_code == 200
        assert res_png.headers["content-type"].startswith("image/png")

        res_mp4 = client.get("/api/v1/community/feed/media/sample.mp4")
        assert res_mp4.status_code == 200
        assert res_mp4.headers["content-type"].startswith("video/mp4")

        res_missing = client.get("/api/v1/community/feed/media/nao_existe.png")
        assert res_missing.status_code == 404
