import io
import os
import uuid
from typing import Tuple
from PIL import Image, ImageOps
from app.core.logger import logger


def optimize_image(
    image_bytes: bytes,
    max_width: int = 1280,
    quality: int = 82,
    output_format: str = "WEBP"
) -> Tuple[bytes, str, str]:
    """
    Otimiza e comprime uma imagem para carregamento ultra rápido na Área de Membros.
    
    1. Corrige orientação EXIF (ex: fotos de celulares).
    2. Redimensiona proporcionalmente para no máximo max_width pixels de largura.
    3. Preserva transparência quando presente (RGBA) ou converte para RGB otimizado.
    4. Converte para formato WebP com qualidade equilibrada (82%), reduzindo o tamanho em até 95%.
    5. Retorna uma tupla contendo (bytes_otimizados, content_type, extensao).
    """
    if not image_bytes:
        return image_bytes, "image/jpeg", ".jpg"

    try:
        img = Image.open(io.BytesIO(image_bytes))

        # Corrige rotação automática de câmeras/celulares via EXIF
        try:
            img = ImageOps.exif_transpose(img)
        except Exception as exif_err:
            logger.debug(f"Aviso ao transpor EXIF da imagem: {exif_err}")

        # Redimensiona mantendo proporção original caso a largura exceda o limite máximo
        if img.width > max_width:
            ratio = max_width / float(img.width)
            new_height = max(1, int(img.height * ratio))
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        # Trata canal alfa / transparência
        fmt = output_format.upper()
        if fmt == "WEBP":
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                img = img.convert("RGBA")
            else:
                img = img.convert("RGB")
            
            output_buffer = io.BytesIO()
            img.save(
                output_buffer,
                format="WEBP",
                quality=quality,
                method=6
            )
            optimized_bytes = output_buffer.getvalue()
            return optimized_bytes, "image/webp", ".webp"
        else:
            # Fallback para JPEG caso requisitado explicitamente
            img = img.convert("RGB")
            output_buffer = io.BytesIO()
            img.save(output_buffer, format="JPEG", quality=quality, optimize=True)
            return output_buffer.getvalue(), "image/jpeg", ".jpg"

    except Exception as e:
        logger.error(f"Erro ao otimizar imagem com Pillow: {e}. Mantendo bytes originais.")
        return image_bytes, "image/jpeg", ".jpg"
