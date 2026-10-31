"""
Serviço de verificação de permissões e vigência de acesso a cursos.
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.course import UserCourse
from app.services.course_bundle_service import get_effective_user_course_ids
from app.services.chat_ws_manager import chat_manager
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


def verify_student_course_access(db: Session, user_id: int, course_id: int) -> None:
    """Valida se o aluno possui acesso liberado e vigente ao curso (direto ou via pacote/combo)."""
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
