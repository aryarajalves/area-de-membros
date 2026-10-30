"""
Endpoints de Upload e Streaming de Mídias (Vídeos, Capas e Anexos) com suporte a Presigned URL para o Backblaze B2.
"""
import os
import uuid
import threading
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from app.models.user import User
from app.schemas.course import VideoUploadUrlRequest, VideoUploadUrlResponse
from app.api.v1.endpoints.users import require_admin_or_superadmin
from app.core.file_validation import validate_file_magic_bytes
from app.core.logger import logger
from app.services.image_optimizer import optimize_image
from app.services.video_optimizer import (
    optimize_video_bytes,
    trigger_background_video_optimization,
    run_pending_media_optimizations,
    get_video_optimization_info
)
from app.services.storage import (
    upload_media_file,
    delete_media_file,
    generate_presigned_upload_url
)


class OptimizeVideoPayload(BaseModel):
    video_url: str

router = APIRouter(prefix="/courses", tags=["Mídias e Conteúdos"])

BASE_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "uploads"
)
THUMBNAILS_DIR = os.path.join(BASE_UPLOAD_DIR, "thumbnails")
VIDEOS_DIR = os.path.join(BASE_UPLOAD_DIR, "videos")
ATTACHMENTS_DIR = os.path.join(BASE_UPLOAD_DIR, "attachments")

os.makedirs(THUMBNAILS_DIR, exist_ok=True)
os.makedirs(VIDEOS_DIR, exist_ok=True)
os.makedirs(ATTACHMENTS_DIR, exist_ok=True)


@router.post(
    "/generate-video-upload-url",
    response_model=VideoUploadUrlResponse,
    tags=["Aulas e Conteúdos"],
    summary="Gerar URL Pré-Assinada de Upload de Vídeo",
    description="Gera URL pré-assinada temporária para upload direto do navegador ao Backblaze B2 sem passar pela VPS."
)
def create_video_presigned_url(
    payload: VideoUploadUrlRequest,
    current_user: User = Depends(require_admin_or_superadmin)
):
    """
    Gera uma URL pré-assinada segura para upload direto do navegador ao Backblaze B2.
    Se o Backblaze B2 não estiver configurado (ex: dev local sem credenciais),
    retorna direct_upload=False indicando que o frontend deve usar o endpoint local /upload-video.
    """
    allowed_extensions = {".mp4", ".webm", ".mov", ".mkv"}
    filename = payload.filename or ""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de vídeo inválido. Utilize MP4, WebM, MOV ou MKV."
        )

    unique_name = f"vid_{uuid.uuid4().hex[:14]}{ext}"
    video_content_type_map = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".mkv": "video/x-matroska"
    }
    content_type = payload.content_type or video_content_type_map.get(ext, "video/mp4")

    # 1. Tentar gerar presigned URL direta do Backblaze B2
    presigned = generate_presigned_upload_url(
        filename=unique_name,
        content_type=content_type,
        folder="AreaDeMembros/videos/"
    )

    if presigned:
        return {
            "direct_upload": True,
            "upload_url": presigned["upload_url"],
            "video_url": presigned["video_url"],
            "final_url": presigned["video_url"],
            "method": "PUT"
        }

    # 2. Fallback para upload tradicional no backend local se Backblaze B2 não estiver ativo
    logger.warning(
        f"[Upload de Vídeo] Backblaze B2 não está totalmente configurado para presigned upload do arquivo '{filename}'. "
        f"Realizando fallback para upload local em /upload-video. "
        f"Para habilitar upload direto de grandes arquivos, verifique BACKBLAZE_CDN_URL / BACKBLAZE_ENDPOINT_URL e chaves B2."
    )
    return {
        "direct_upload": False,
        "upload_url": "/api/v1/courses/upload-video",
        "video_url": None,
        "final_url": None,
        "method": "POST"
    }


@router.post(
    "/upload-thumbnail",
    tags=["Cursos e Módulos"],
    summary="Upload de Capa/Thumbnail do Curso",
    description="Envia imagem de capa do curso (JPG, PNG, WEBP até 5 MB) com upload para Backblaze B2 ou armazenamento local."
)
async def upload_thumbnail(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """
    Faz upload de imagem de thumbnail para o Backblaze B2 (ou fallback local).
    Tamanho recomendado: 1280x720 pixels (16:9), até 5MB. Formatos aceitos: JPG, PNG, WEBP.
    """
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de imagem inválido. Use apenas JPG, PNG ou WEBP."
        )

    content = await file.read()
    validate_file_magic_bytes(content, filename)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo excede o limite máximo permitido de 5 MB."
        )

    # Otimiza e comprime para WebP para carregamento quase instantâneo
    final_content, final_content_type, final_ext = optimize_image(
        image_bytes=content,
        max_width=1280,
        quality=82
    )
    unique_name = f"thumb_{uuid.uuid4().hex[:12]}{final_ext}"

    # 1. Tentar salvar diretamente no Backblaze B2 com cache agressivo
    b2_url = upload_media_file(
        file_bytes=final_content,
        filename=unique_name,
        content_type=final_content_type,
        folder="AreaDeMembros/thumbnails/",
        cache_control="public, max-age=31536000, immutable"
    )
    if b2_url:
        return {"thumbnail_url": b2_url}

    # 2. Fallback local se Backblaze B2 não estiver configurado
    target_path = os.path.join(THUMBNAILS_DIR, unique_name)
    with open(target_path, "wb") as f:
        f.write(final_content)

    return {"thumbnail_url": f"/api/v1/courses/thumbnails/{unique_name}"}


@router.get("/thumbnails/{filename}", include_in_schema=False)
def get_thumbnail(filename: str):
    """Serve uma imagem de thumbnail de curso armazenada localmente no servidor."""
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(THUMBNAILS_DIR, safe_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Imagem não encontrada.")
    return FileResponse(filepath, headers={"Cache-Control": "public, max-age=31536000, immutable"})


@router.post(
    "/upload-video",
    tags=["Aulas e Conteúdos"],
    summary="Upload de Vídeo de Aula",
    description="Envia arquivo de vídeo (MP4, WebM, MOV, MKV até 2 GB) para a nuvem Backblaze B2 ou servidor local."
)
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """
    Faz upload de arquivo de vídeo da aula diretamente para o Backblaze B2 (ou fallback local).
    Limite máximo: 2 GB (2048 MB). Suporta MP4, WebM, MOV, MKV.
    """
    allowed_extensions = {".mp4", ".webm", ".mov", ".mkv"}
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de vídeo inválido. Utilize MP4, WebM, MOV ou MKV."
        )

    content = await file.read()
    validate_file_magic_bytes(content, filename)
    if len(content) > 2048 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo de vídeo excede o limite máximo de 2 GB."
        )

    # Otimiza automaticamente para MP4 H.264 com +faststart (se for vídeo real completo)
    final_content, final_content_type, final_ext = optimize_video_bytes(
        video_bytes=content,
        original_ext=ext
    )
    unique_name = f"vid_{uuid.uuid4().hex[:14]}{final_ext}"

    # 1. Tentar salvar diretamente no Backblaze B2 com Cache-Control de 1 ano
    b2_url = upload_media_file(
        file_bytes=final_content,
        filename=unique_name,
        content_type=final_content_type,
        folder="AreaDeMembros/videos/",
        cache_control="public, max-age=31536000, immutable"
    )
    if b2_url:
        return {"video_url": b2_url}

    # 2. Fallback local se Backblaze B2 não estiver configurado
    target_path = os.path.join(VIDEOS_DIR, unique_name)
    with open(target_path, "wb") as f:
        f.write(final_content)

    return {"video_url": f"/api/v1/courses/videos/{unique_name}"}


@router.get(
    "/video-info",
    tags=["Aulas e Conteúdos"],
    summary="Consultar Tamanho e Status de Otimização do Vídeo (Exclusivo Super Admin)",
    description="Retorna tamanho em MB, formato e status de otimização FastStart de um vídeo no Backblaze B2 ou local."
)
def get_video_info(
    video_url: str,
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Retorna metadados de tamanho e otimização do arquivo de vídeo exclusivamente para o Super Admin."""
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o Super Administrador pode consultar informações técnicas de tamanho de vídeo."
        )
    return get_video_optimization_info(video_url)


from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.services.video_optimizer import (
    audit_course_lessons_for_superadmin,
    cancel_video_optimization
)


class StopVideoOptimizationPayload(BaseModel):
    video_url: Optional[str] = None


@router.post(
    "/stop-video-optimization",
    tags=["Aulas e Conteúdos"],
    summary="Interromper Otimização de Vídeo em Andamento (Exclusivo Super Admin)"
)
def stop_video_optimization(
    payload: StopVideoOptimizationPayload,
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Interrompe imediatamente a otimização de vídeo ativa na fila do Super Admin."""
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o Super Administrador pode interromper a fila de otimização."
        )
    return cancel_video_optimization(payload.video_url)


@router.get(
    "/{course_id}/superadmin-audit",
    tags=["Aulas e Conteúdos"],
    summary="Auditoria Rápida de Aulas do Curso (Exclusivo Super Admin)",
    description="Retorna diagnóstico de otimização de vídeo, descrição IA, capítulos IA, thumbnail e qualidade de título para todas as aulas do curso."
)
def get_course_superadmin_audit(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Retorna o mapa de pendências de auditoria de todas as aulas do curso (exclusivo para o Super Admin)."""
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas o Super Administrador pode consultar a auditoria técnica das aulas."
        )
    return audit_course_lessons_for_superadmin(course_id, db)


@router.post(
    "/optimize-video",
    tags=["Aulas e Conteúdos"],
    summary="Otimizar Vídeo no Backblaze B2 (FastStart + H.264)",
    description="Aciona em background a transcodificação automática para MP4 H.264 com +faststart após upload direto para o B2."
)
def trigger_video_optimization(
    payload: OptimizeVideoPayload,
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Inicia a otimização assíncrona de um vídeo recém-enviado ao Backblaze B2."""
    if not payload.video_url:
        raise HTTPException(status_code=400, detail="URL do vídeo é obrigatória.")
    trigger_background_video_optimization(payload.video_url)
    return {
        "status": "processing",
        "message": "Otimização do vídeo iniciada automaticamente em segundo plano."
    }


@router.post(
    "/optimize-all-media",
    tags=["Aulas e Conteúdos"],
    summary="Otimizar Todas as Mídias Existentes em Segundo Plano",
    description="Varre e otimiza todos os vídeos (.mov/mp4) e imagens (png/jpg) existentes no banco e B2."
)
def trigger_all_media_optimization(
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Dispara em background a otimização de todas as imagens e vídeos pendentes na plataforma."""
    t = threading.Thread(target=run_pending_media_optimizations, daemon=True)
    t.start()
    return {
        "status": "processing",
        "message": "Otimização em lote de todos os vídeos e imagens iniciada em segundo plano."
    }


@router.get("/videos/{filename}", include_in_schema=False)
def get_video(filename: str):
    """Serve um arquivo de vídeo de aula armazenado localmente com streaming de mídia e Range Requests."""
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(VIDEOS_DIR, safe_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Vídeo não encontrado.")

    ext = os.path.splitext(safe_filename)[1].lower()
    content_type_map = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".mkv": "video/x-matroska"
    }
    media_type = content_type_map.get(ext, "video/mp4")
    return FileResponse(
        filepath,
        media_type=media_type,
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=31536000, immutable"
        }
    )


@router.post(
    "/upload-attachment",
    tags=["Aulas e Conteúdos"],
    summary="Upload de Material Complementar",
    description="Envia documento ou arquivo anexo da aula (PDF, Word, Excel, ZIP até 100 MB)."
)
async def upload_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Faz upload de material complementar para Backblaze B2 ou pasta local."""
    allowed_extensions = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".rar", ".txt", ".csv"}
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato de anexo '{ext}' não suportado. Formatos aceitos: PDF, DOC, XLS, PPT, ZIP, TXT, CSV."
        )

    content = await file.read()
    validate_file_magic_bytes(content, filename)
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo anexo excede o limite máximo permitido de 100 MB."
        )

    unique_name = f"att_{uuid.uuid4().hex[:12]}{ext}"

    # 1. Tentar salvar diretamente no Backblaze B2
    b2_url = upload_media_file(
        file_bytes=content,
        filename=unique_name,
        content_type=file.content_type or "application/octet-stream",
        folder="AreaDeMembros/attachments/"
    )
    if b2_url:
        return {
            "attachment_url": b2_url,
            "file_url": b2_url,
            "file_name": filename,
            "title": filename,
            "file_type": ext.lstrip("."),
            "file_size": len(content),
            "file_size_bytes": len(content)
        }

    # 2. Fallback local
    target_path = os.path.join(ATTACHMENTS_DIR, unique_name)
    with open(target_path, "wb") as f:
        f.write(content)

    return {
        "attachment_url": f"/api/v1/courses/attachments/{unique_name}",
        "file_url": f"/api/v1/courses/attachments/{unique_name}",
        "file_name": filename,
        "title": filename,
        "file_type": ext.lstrip("."),
        "file_size": len(content),
        "file_size_bytes": len(content)
    }


@router.get("/attachments/{filename}", include_in_schema=False)
def get_attachment(filename: str):
    """Serve um arquivo anexo armazenado localmente para download seguro."""
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(ATTACHMENTS_DIR, safe_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Arquivo anexo não encontrado.")
    return FileResponse(filepath, filename=safe_filename)
