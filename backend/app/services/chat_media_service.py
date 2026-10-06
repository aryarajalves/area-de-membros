import os
import uuid
from typing import Dict, Any
from fastapi import UploadFile, HTTPException, status
from app.services.storage import upload_media_file

BASE_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads"
)
CHAT_MEDIA_DIR = os.path.join(BASE_UPLOAD_DIR, "chat_media")
os.makedirs(CHAT_MEDIA_DIR, exist_ok=True)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
AUDIO_EXTS = {".mp3", ".wav", ".ogg", ".m4a", ".webm", ".aac"}
VIDEO_EXTS = {".mp4", ".mov", ".mkv"}
DOC_EXTS = {".pdf", ".docx", ".xlsx", ".pptx", ".txt", ".zip", ".rar", ".csv"}
ALLOWED_EXTS = IMAGE_EXTS | AUDIO_EXTS | VIDEO_EXTS | DOC_EXTS

async def process_chat_media_upload(file: UploadFile) -> Dict[str, Any]:
    """Processa o upload de mídia para o chat salvando no B2 ou armazenamento local."""
    filename = file.filename or "arquivo"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de arquivo inválido. Suportados: imagens, vídeos, áudios e documentos."
        )

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo excede o limite máximo permitido de 25 MB."
        )

    content_type = file.content_type or ""
    if (content_type.startswith("audio/") or ext in AUDIO_EXTS) and not content_type.startswith("video/"):
        media_type = "audio"
        default_mime = "audio/webm" if ext == ".webm" else "audio/mpeg"
    elif content_type.startswith("video/") or ext in VIDEO_EXTS:
        media_type = "video"
        default_mime = "video/mp4"
    elif content_type.startswith("image/") or ext in IMAGE_EXTS:
        media_type = "image"
        default_mime = "image/jpeg"
    else:
        media_type = "file"
        default_mime = "application/pdf" if ext == ".pdf" else "application/octet-stream"

    final_content_type = content_type or default_mime
    unique_name = f"chat_{uuid.uuid4().hex[:14]}{ext}"

    # 1. Backblaze B2
    b2_url = upload_media_file(
        file_bytes=content,
        filename=unique_name,
        content_type=final_content_type,
        folder="AreaDeMembros/chat_media/"
    )
    if b2_url:
        return {
            "media_url": b2_url,
            "media_type": media_type,
            "filename": filename
        }

    # 2. Local fallback
    target_path = os.path.join(CHAT_MEDIA_DIR, unique_name)
    with open(target_path, "wb") as f:
        f.write(content)

    return {
        "media_url": f"/api/v1/chat/media/{unique_name}",
        "media_type": media_type,
        "filename": filename
    }
