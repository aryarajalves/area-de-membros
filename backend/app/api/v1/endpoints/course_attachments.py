import mimetypes
import os
import re
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.api.v1.endpoints.users import get_current_user
from app.core.database import get_db
from app.core.logger import logger
from app.models.course import Lesson, LessonAttachment, Module, UserCourse
from app.models.user import User
from app.services.storage import fetch_media_object

router = APIRouter()

_ATTACHMENT_MIME_MAP = {
    "pdf": "application/pdf",
    "html": "text/html; charset=utf-8",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
    "gif": "image/gif",
    "txt": "text/plain; charset=utf-8",
    "csv": "text/csv; charset=utf-8",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "zip": "application/zip",
}

UPLOADS_BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads"))


def _resolve_content_type(att: LessonAttachment, fallback: str | None = None) -> str:
    ext = (att.file_type or os.path.splitext((att.file_url or "").split("?")[0])[1].lstrip(".")).lower()
    if ext in _ATTACHMENT_MIME_MAP:
        return _ATTACHMENT_MIME_MAP[ext]
    if fallback and fallback != "application/octet-stream":
        return fallback
    guessed, _ = mimetypes.guess_type(f"file.{ext}") if ext else (None, None)
    return guessed or "application/octet-stream"


def _build_safe_filename(att: LessonAttachment) -> str:
    raw_name = (att.title or "material").strip()
    ext = (att.file_type or os.path.splitext((att.file_url or "").split("?")[0])[1].lstrip(".")).lower()
    safe_base = re.sub(r"[^A-Za-z0-9À-ÿ._ -]+", "_", raw_name).strip() or "material"
    if ext and not safe_base.lower().endswith(f".{ext}"):
        return f"{safe_base}.{ext}"
    return safe_base


@router.get("/attachments/{attachment_id}/access", summary="Acessar Material Complementar via Proxy Seguro")
def access_lesson_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Entrega o material complementar pelo próprio domínio para evitar bloqueios de SmartScreen em hosts S3 públicos."""
    att = db.query(LessonAttachment).filter(LessonAttachment.id == attachment_id).first()
    if not att:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material não encontrado.")

    lesson = db.query(Lesson).filter(Lesson.id == att.lesson_id).first()
    module = db.query(Module).filter(Module.id == lesson.module_id).first() if lesson else None
    if not lesson or not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aula associada não encontrada.")

    if current_user.role == "aluno":
        enrolled = (
            db.query(UserCourse.id)
            .filter(UserCourse.user_id == current_user.id, UserCourse.course_id == module.course_id)
            .first()
        )
        if not enrolled:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você não possui acesso a este curso.")

    file_url = att.file_url or ""
    filename = _build_safe_filename(att)
    encoded_name = quote(filename)

    if file_url.startswith("/uploads/"):
        rel_path = file_url.lstrip("/").replace("uploads/", "", 1)
        local_path = os.path.abspath(os.path.join(UPLOADS_BASE_DIR, rel_path))
        if local_path.startswith(UPLOADS_BASE_DIR) and os.path.isfile(local_path):
            content_type = _resolve_content_type(att)
            return FileResponse(
                local_path,
                media_type=content_type,
                headers={"Content-Disposition": f"inline; filename*=UTF-8''{encoded_name}"},
            )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arquivo local não encontrado.")

    b2_obj = fetch_media_object(file_url)
    if b2_obj:
        content_type = _resolve_content_type(att, b2_obj.get("content_type"))
        headers = {"Content-Disposition": f"inline; filename*=UTF-8''{encoded_name}"}
        if b2_obj.get("content_length"):
            headers["Content-Length"] = str(b2_obj["content_length"])
        logger.info(f"[ATTACHMENT PROXY] Entregando anexo {att.id} para usuário {current_user.id}.")
        return StreamingResponse(b2_obj["body"].iter_chunks(chunk_size=65536), media_type=content_type, headers=headers)

    if file_url:
        return RedirectResponse(url=file_url)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="URL do material indisponível.")
