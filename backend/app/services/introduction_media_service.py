"""
Serviço para upload e processamento de mídias e embeds para a aba Apresente-se (Introductions).
"""
import os
import re
import uuid
from typing import Dict, Any, Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from app.services.storage import upload_media_file
from app.core.logger import logger

BASE_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads"
)
INTRO_MEDIA_DIR = os.path.join(BASE_UPLOAD_DIR, "introductions")
os.makedirs(INTRO_MEDIA_DIR, exist_ok=True)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".webm"}
ALLOWED_EXTS = IMAGE_EXTS | VIDEO_EXTS


def parse_video_embed(url: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    Identifica provedor de vídeo externo (YouTube, Loom, Vimeo) e retorna:
    (embed_url, provider) ou (None, None) se não for reconhecido.
    """
    if not url:
        return None, None

    clean_url = url.strip()

    # YouTube: youtube.com/watch?v=ID ou youtu.be/ID ou youtube.com/embed/ID
    yt_match = re.search(r'(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})', clean_url)
    if yt_match:
        video_id = yt_match.group(1)
        return f"https://www.youtube.com/embed/{video_id}", "youtube"

    # Loom: loom.com/share/ID ou loom.com/embed/ID
    loom_match = re.search(r'loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)', clean_url)
    if loom_match:
        video_id = loom_match.group(1)
        return f"https://www.loom.com/embed/{video_id}", "loom"

    # Vimeo: vimeo.com/ID ou player.vimeo.com/video/ID
    vimeo_match = re.search(r'(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)', clean_url)
    if vimeo_match:
        video_id = vimeo_match.group(1)
        return f"https://player.vimeo.com/video/{video_id}", "vimeo"

    # Caso seja URL direta de vídeo MP4 / WebM
    if clean_url.endswith((".mp4", ".webm", ".mov")):
        return clean_url, "video"

    return clean_url, "external_link"


async def process_introduction_media_upload(file: UploadFile) -> Dict[str, Any]:
    """
    Processa upload de imagem (até 15MB) ou vídeo curto (até 50MB) para apresentação.
    Salva no Backblaze B2 ou fallback local.
    """
    filename = file.filename or "arquivo"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de arquivo não suportado. Formatos válidos: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV."
        )

    content = await file.read()
    max_size = 50 * 1024 * 1024  # 50MB

    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo ultrapassa o limite máximo permitido de 50 MB."
        )

    content_type = file.content_type or ""
    if content_type.startswith("video/") or ext in VIDEO_EXTS:
        media_type = "video"
        default_mime = "video/webm" if ext == ".webm" else "video/mp4"
    else:
        media_type = "image"
        default_mime = "image/jpeg"

    final_content_type = content_type or default_mime
    unique_name = f"intro_{uuid.uuid4().hex[:14]}{ext}"

    # 1. Backblaze B2 Storage
    b2_url = upload_media_file(
        file_bytes=content,
        filename=unique_name,
        content_type=final_content_type,
        folder="AreaDeMembros/introductions/"
    )
    if b2_url:
        logger.info(f"[Intro Media] Upload concluído no Backblaze B2: {b2_url}")
        return {
            "url": b2_url,
            "media_type": media_type,
            "filename": filename
        }

    # 2. Armazenamento Local de Fallback
    target_path = os.path.join(INTRO_MEDIA_DIR, unique_name)
    with open(target_path, "wb") as f:
        f.write(content)

    logger.info(f"[Intro Media] Upload salvo localmente em: {target_path}")
    return {
        "url": f"/api/v1/introductions/media/{unique_name}",
        "media_type": media_type,
        "filename": filename
    }
