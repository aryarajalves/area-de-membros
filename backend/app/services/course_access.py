"""
Serviço de verificação de permissões e vigência de acesso a cursos.
"""
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.course import UserCourse
from app.services.course_bundle_service import get_effective_user_course_ids


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
