"""
Serviço de Liberação Programada de Módulos (Drip Content) e Recompensas Pedagógicas por Elo.

Regras de negócio:
- Superadmin e Admin têm acesso irrestrito imediato a todos os módulos e aulas.
- Aluno:
  1. Requisito de Elo RPG (Recompensa Pedagógica):
     - Se 'required_tier' estiver configurado (ex: 'Ouro'), o aluno deve ter atingido no mínimo aquele Elo no ranking.
     - Caso não tenha o Elo necessário, o módulo fica travado com locked_reason='elo'.
  2. Drip Content:
     - 'immediate': Liberado imediatamente.
     - 'days_after': Liberado X dias após a data de matrícula do aluno.
     - 'specific_date': Liberado a partir de data e hora fixa especificada pelo instrutor.
- Quando bloqueado, 'is_locked' é True e os links de mídia das aulas são sanitizados contra inspeção.
"""
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.logger import logger
from app.models.user import User
from app.models.course import Module, UserCourse
from app.models.gamification import GamificationPoint
from app.services.gamification_level_service import calculate_student_level


TIER_HIERARCHY: Dict[str, int] = {
    "Bronze": 1,
    "Prata": 2,
    "Ouro": 3,
    "Diamante": 4,
    "Lenda": 5,
}

TIER_COLORS: Dict[str, str] = {
    "Bronze": "#cd7f32",
    "Prata": "#94a3b8",
    "Ouro": "#f59e0b",
    "Diamante": "#38bdf8",
    "Lenda": "#ec4899",
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def get_student_enrollment_date(db: Session, user_id: int, course_id: int) -> datetime:
    """
    Retorna a data em que o aluno foi matriculado no curso.
    Fallback para a data de cadastro do usuário ou momento atual.
    """
    enrollment = db.query(UserCourse).filter(
        UserCourse.user_id == user_id,
        UserCourse.course_id == course_id
    ).first()

    if enrollment and enrollment.created_at:
        return ensure_utc(enrollment.created_at)

    user = db.query(User).filter(User.id == user_id).first()
    if user and user.created_at:
        return ensure_utc(user.created_at)

    return utc_now()


def get_student_gamification_tier(db: Session, user_id: int) -> str:
    """
    Calcula e retorna o Elo RPG atual do aluno baseado no total acumulado de pontos.
    """
    pts = db.query(
        func.coalesce(func.sum(GamificationPoint.points), 0)
    ).filter(GamificationPoint.user_id == user_id).scalar() or 0

    level_info = calculate_student_level(pts)
    return level_info.get("level_tier", "Bronze")


def is_module_locked_for_user(
    module: Module,
    user: User,
    enrollment_date: Optional[datetime] = None,
    student_tier: Optional[str] = None
) -> Tuple[bool, Optional[datetime], Optional[str]]:
    """
    Determina se o módulo está bloqueado para o usuário especificado.
    Retorna (is_locked, available_at, locked_reason).
    locked_reason pode ser 'elo' ou 'drip'.
    """
    if getattr(user, "role", None) in ["superadmin", "admin"]:
        avail_date = ensure_utc(module.release_date) if module.release_type == "specific_date" else None
        return False, avail_date, None

    # 1. Validação de Elo RPG (Recompensa Pedagógica)
    required_tier = getattr(module, "required_tier", None)
    if required_tier and required_tier in TIER_HIERARCHY:
        student_rank = TIER_HIERARCHY.get(student_tier or "Bronze", 1)
        req_rank = TIER_HIERARCHY.get(required_tier, 1)

        if student_rank < req_rank:
            return True, None, "elo"

    # 2. Validação de Liberação Programada (Drip Content)
    now = utc_now()
    release_type = module.release_type or "immediate"

    if release_type == "immediate":
        return False, None, None

    if release_type == "days_after":
        days = module.release_days or 0
        if days <= 0:
            return False, None, None

        base_date = enrollment_date or now
        unlock_at = base_date + timedelta(days=days)

        if now >= unlock_at:
            return False, unlock_at, None
        return True, unlock_at, "drip"

    if release_type == "specific_date":
        if not module.release_date:
            return False, None, None

        unlock_at = ensure_utc(module.release_date)
        if now >= unlock_at:
            return False, unlock_at, None
        return True, unlock_at, "drip"

    return False, None, None


def apply_drip_content_to_course_modules(
    db: Session,
    user: User,
    course_id: int,
    modules: List[Module]
) -> None:
    """
    Calcula e atribui os campos dinâmicos `is_locked`, `available_at`, `locked_reason`
    e `required_tier_color` aos módulos do curso.
    Para módulos bloqueados, sanitiza as aulas para não vazar mídias.
    """
    is_admin = getattr(user, "role", None) in ["superadmin", "admin"]

    enrollment_date = None
    student_tier = None
    if not is_admin:
        enrollment_date = get_student_enrollment_date(db, user.id, course_id)
        student_tier = get_student_gamification_tier(db, user.id)

    for m in modules:
        locked, avail_at, reason = is_module_locked_for_user(m, user, enrollment_date, student_tier)
        setattr(m, "is_locked", locked)
        setattr(m, "available_at", avail_at)
        setattr(m, "locked_reason", reason)
        setattr(m, "required_tier_color", TIER_COLORS.get(getattr(m, "required_tier", None)))

        if locked:
            # Protege os dados de mídia das aulas deste módulo bloqueado
            for lesson in getattr(m, "lessons", []):
                setattr(lesson, "video_url", None)
                setattr(lesson, "attachments", [])


def check_module_access(
    db: Session,
    user: User,
    module: Module
) -> None:
    """
    Valida se o usuário tem permissão para acessar o conteúdo de um módulo.
    Lança HTTPException(403) se o módulo estiver bloqueado por Elo ou por Drip Content.
    """
    if getattr(user, "role", None) in ["superadmin", "admin"]:
        return

    enrollment_date = get_student_enrollment_date(db, user.id, module.course_id)
    student_tier = get_student_gamification_tier(db, user.id)
    is_locked, available_at, reason = is_module_locked_for_user(module, user, enrollment_date, student_tier)

    if is_locked:
        if reason == "elo":
            detail = (
                f"Este módulo é exclusivo para alunos com Elo {module.required_tier} ou superior. "
                f"Acumule mais XP na comunidade para desbloquear esta masterclass!"
            )
        elif available_at:
            formatted_date = available_at.strftime("%d/%m/%Y às %H:%M")
            detail = f"Este módulo estará disponível apenas em {formatted_date}."
        else:
            detail = "Este módulo ainda não está disponível."

        logger.warning(
            f"[ACESSO MÓDULO] Acesso bloqueado para o usuário #{user.id} ao módulo #{module.id} "
            f"(Motivo: {reason}, Elo exigido: {module.required_tier}, Liberado em: {available_at})"
        )
        raise HTTPException(status_code=403, detail=detail)
