"""
Serviço de verificação de permissões, vigência de acesso e bloqueio programado de cursos.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.course import Course, UserCourse
from app.services.course_bundle_service import get_effective_user_course_ids, sync_course_bundles
from app.services.chat_ws_manager import chat_manager
from app.services.storage import delete_media_file
from app.core.logger import logger


def is_user_course_active(uc: UserCourse) -> bool:
    """Verifica se o acesso do aluno ao curso está ativo (vitalício ou dentro do prazo de validade)."""
    if not uc.expires_at:
        return True
    now = datetime.now(timezone.utc)
    exp = uc.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    return exp > now


def is_course_locked_by_schedule(course: Optional[Course]) -> Tuple[bool, Optional[datetime]]:
    """
    Verifica se o curso está fechado para todos os alunos ou aguardando data/hora programada.
    Retorna (is_locked, release_date_utc).
    """
    if not course:
        return False, None

    release_type = getattr(course, "release_type", None) or "immediate"
    if release_type == "closed":
        return True, None

    if release_type == "specific_date":
        rel_date = getattr(course, "release_date", None)
        if not rel_date:
            return False, None
        now = datetime.now(timezone.utc)
        unlock_at = rel_date if rel_date.tzinfo is not None else rel_date.replace(tzinfo=timezone.utc)
        unlock_at = unlock_at.astimezone(timezone.utc)
        if now < unlock_at:
            return True, unlock_at
        return False, unlock_at

    return False, None


def attach_course_schedule_state(courses: List[Course]) -> None:
    """Atribui dinamicamente `is_course_locked` a cada curso da lista."""
    for c in courses:
        locked, _ = is_course_locked_by_schedule(c)
        setattr(c, "is_course_locked", locked)


def verify_student_course_access(db: Session, user_id: int, course_id: int) -> None:
    """Valida se o aluno possui acesso liberado e vigente ao curso e se o curso não está fechado/agendado."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if course:
        locked, unlock_at = is_course_locked_by_schedule(course)
        if locked:
            if unlock_at:
                from datetime import timedelta
                brt_dt = unlock_at.astimezone(timezone(timedelta(hours=-3)))
                formatted = brt_dt.strftime("%d/%m/%Y às %H:%M")
                raise HTTPException(
                    status_code=403,
                    detail=f"Este curso será liberado em {formatted}."
                )
            raise HTTPException(
                status_code=403,
                detail="Este curso está temporariamente fechado pelo instrutor e será liberado em breve."
            )

    uc = db.query(UserCourse).filter(
        UserCourse.user_id == user_id,
        UserCourse.course_id == course_id
    ).first()
    if uc and is_user_course_active(uc):
        return

    # Se não tem direto, verifica se possui acesso ativo via pacote/combo
    effective_ids = get_effective_user_course_ids(db, user_id)
    if course_id in effective_ids:
        return

    if uc and not is_user_course_active(uc):
        raise HTTPException(status_code=403, detail="O seu período de acesso a este curso expirou.")
    raise HTTPException(status_code=403, detail="Você não possui acesso liberado a este curso.")


def apply_course_update_fields(db: Session, course: Course, course_update: Any) -> None:
    """Aplica atualizações de campos do CourseUpdate na instância do modelo Course."""
    if course_update.title is not None:
        course.title = course_update.title.strip()
    if course_update.description is not None:
        course.description = course_update.description
    if course_update.thumbnail_url is not None:
        if course.thumbnail_url and course.thumbnail_url != course_update.thumbnail_url:
            delete_media_file(course.thumbnail_url)
        course.thumbnail_url = course_update.thumbnail_url or None
    if course_update.cover_image_url is not None:
        if course.cover_image_url and course.cover_image_url != course_update.cover_image_url:
            delete_media_file(course.cover_image_url)
        course.cover_image_url = course_update.cover_image_url or None
    if course_update.cover_image_position is not None:
        course.cover_image_position = max(0, min(100, int(course_update.cover_image_position)))
    if course_update.bg_color is not None:
        course.bg_color = course_update.bg_color or "#090d16"
    if course_update.is_published is not None:
        course.is_published = course_update.is_published
    if course_update.sales_page_url is not None:
        course.sales_page_url = course_update.sales_page_url.strip() if course_update.sales_page_url else None
    if course_update.order_index is not None:
        course.order_index = course_update.order_index
    if course_update.agentflow_kb_id is not None:
        course.agentflow_kb_id = course_update.agentflow_kb_id if course_update.agentflow_kb_id > 0 else None
    if course_update.agentflow_kb_name is not None:
        course.agentflow_kb_name = course_update.agentflow_kb_name or None
    if course_update.item_type is not None:
        course.item_type = course_update.item_type
    if course_update.tool_url is not None:
        course.tool_url = course_update.tool_url.strip() if course_update.tool_url else None
    if course_update.bundle_title is not None:
        course.bundle_title = course_update.bundle_title.strip() if course_update.bundle_title else None
    if course_update.watermark_enabled is not None:
        course.watermark_enabled = bool(course_update.watermark_enabled)
    if getattr(course_update, "release_type", None) is not None:
        course.release_type = course_update.release_type or "immediate"
        if course.release_type != "specific_date":
            course.release_date = None
    if getattr(course_update, "release_date", None) is not None or getattr(course_update, "release_type", None) == "specific_date":
        if getattr(course_update, "release_type", course.release_type) == "specific_date":
            course.release_date = course_update.release_date
    if course_update.bundled_course_ids is not None:
        sync_course_bundles(db, course.id, course_update.bundled_course_ids)


def notify_user_course_access_updated(user_id: int, course_ids: Optional[List[int]] = None, message: str = "Seus acessos a cursos foram atualizados!") -> None:
    """
    Notifica o usuário via WebSocket em tempo real que seu acesso a cursos foi atualizado/liberado.
    Permite que o frontend destranque os cards na hora sem F5.
    """
    try:
        payload: Dict[str, Any] = {
            "user_id": user_id,
            "course_ids": course_ids or [],
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        chat_manager.send_to_user_sync(user_id, "courses_access_updated", payload)
        logger.info(f"[WebSocket] Notificação courses_access_updated enviada para o usuário ID {user_id}")
    except Exception as exc:
        logger.error(f"[WebSocket] Falha ao notificar courses_access_updated para usuário ID {user_id}: {exc}")
