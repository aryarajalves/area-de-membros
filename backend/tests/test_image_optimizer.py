import io
import pytest
from PIL import Image
from app.services.image_optimizer import optimize_image


def test_optimize_image_resizes_large_image():
    # Cria imagem grande (2000 x 1000)
    img = Image.new("RGB", (2000, 1000), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    raw_bytes = buf.getvalue()

    opt_bytes, mime, ext = optimize_image(raw_bytes, max_width=1280, quality=82)

    assert mime == "image/webp"
    assert ext == ".webp"
    assert len(opt_bytes) < len(raw_bytes)

    # Verifica dimensões da imagem otimizada
    res_img = Image.open(io.BytesIO(opt_bytes))
    assert res_img.width == 1280
    assert res_img.height == 640
    assert res_img.format == "WEBP"


def test_optimize_image_does_not_upscale_small_image():
    # Cria imagem pequena (600 x 400)
    img = Image.new("RGB", (600, 400), color=(50, 80, 120))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    raw_bytes = buf.getvalue()

    opt_bytes, mime, ext = optimize_image(raw_bytes, max_width=1280, quality=80)

    assert mime == "image/webp"
    res_img = Image.open(io.BytesIO(opt_bytes))
    assert res_img.width == 600
    assert res_img.height == 400


def test_optimize_image_handles_rgba_transparency():
    # Cria imagem RGBA com canal alfa transparente
    img = Image.new("RGBA", (500, 500), color=(255, 0, 0, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    raw_bytes = buf.getvalue()

    opt_bytes, mime, ext = optimize_image(raw_bytes, max_width=1280, quality=85)

    assert mime == "image/webp"
    res_img = Image.open(io.BytesIO(opt_bytes))
    assert res_img.mode == "RGBA"


def test_optimize_image_handles_invalid_bytes_gracefully():
    corrupted_data = b"not-a-valid-image-data-payload"
    opt_bytes, mime, ext = optimize_image(corrupted_data)

    # Deve retornar os bytes originais de fallback sem lançar exceção não tratada
    assert opt_bytes == corrupted_data
    assert mime == "image/jpeg"
    assert ext == ".jpg"


def test_optimize_image_handles_empty_bytes():
    opt_bytes, mime, ext = optimize_image(b"")
    assert opt_bytes == b""
