import os
import uuid
from typing import Dict, Any, Optional
from fastapi import UploadFile, HTTPException, status
from app.services.storage import upload_media_file
from app.core.logger import logger

BASE_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads"
)
FUNNEL_MEDIA_DIR = os.path.join(BASE_UPLOAD_DIR, "funnel_media")
os.makedirs(FUNNEL_MEDIA_DIR, exist_ok=True)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
AUDIO_EXTS = {".mp3", ".wav", ".ogg", ".m4a", ".webm", ".aac"}
VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".webm"}
DOC_EXTS = {".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt", ".txt", ".zip", ".rar", ".csv"}
ALLOWED_EXTS = IMAGE_EXTS | AUDIO_EXTS | VIDEO_EXTS | DOC_EXTS

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


async def process_funnel_media_upload(file: UploadFile, media_type_hint: Optional[str] = None) -> Dict[str, Any]:
    """Processa o upload de mídias para nós de funil (imagem, vídeo, áudio, documentos)."""
    filename = file.filename or "arquivo"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensão de arquivo '{ext}' não suportada. Envie imagens, vídeos, áudios ou documentos válidos."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo excede o limite máximo permitido de 50 MB."
        )

    content_type = file.content_type or ""

    # Determinar tipo de mídia
    if media_type_hint in ["audio", "video", "image", "file"]:
        detected_type = media_type_hint
    elif ext in AUDIO_EXTS:
        detected_type = "audio"
    elif ext in VIDEO_EXTS:
        detected_type = "video"
    elif ext in IMAGE_EXTS:
        detected_type = "image"
    else:
        detected_type = "file"

    unique_name = f"funnel_{uuid.uuid4().hex[:14]}{ext}"
    final_content_type = content_type or "application/octet-stream"

    # 1. Enviar para Backblaze B2
    try:
        b2_url = upload_media_file(
            file_bytes=content,
            filename=unique_name,
            content_type=final_content_type,
            folder="AreaDeMembros/funnel_media/"
        )
        if b2_url:
            logger.info(f"[Funnel Media] Upload concluído no B2: {b2_url}")
            return {
                "media_url": b2_url,
                "media_type": detected_type,
                "filename": filename,
                "size_bytes": len(content)
            }
    except Exception as e:
        logger.warning(f"[Funnel Media] Falha ao enviar para B2, usando armazenamento local: {e}")

    # 2. Armazenamento local de fallback
    target_path = os.path.join(FUNNEL_MEDIA_DIR, unique_name)
    with open(target_path, "wb") as f:
        f.write(content)

    local_url = f"/api/v1/funnels/media/{unique_name}"
    logger.info(f"[Funnel Media] Arquivo salvo localmente: {local_url}")
    return {
        "media_url": local_url,
        "media_type": detected_type,
        "filename": filename,
        "size_bytes": len(content)
    }
