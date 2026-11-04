"""
Utilitários de Cálculo de Duração e Validade de Acesso a Cursos e Convites.
"""
import json
import re
from datetime import datetime, timedelta, timezone
from typing import List, Tuple
from app.schemas.user import CourseAccessItem

ACCESS_DURATION_DAYS = {
    "lifetime": None,
    "1_day": 1,
    "2_days": 2,
    "3_days": 3,
    "4_days": 4,
    "5_days": 5,
    "6_days": 6,
    "7_days": 7,
    "1_month": 30,
    "3_months": 90,
    "6_months": 180,
    "1_year": 365,
    "2_years": 730,
    "3_years": 1095,
}

ACCESS_DURATION_HOURS = {
    "1_hour": 1,
    "2_hours": 2,
    "4_hours": 4,
    "6_hours": 6,
    "12_hours": 12,
}

SHORT_TRIAL_DURATIONS = {
    "1_hour",
    "2_hours",
    "4_hours",
    "6_hours",
    "12_hours",
    "1 hora",
    "2 horas",
    "4 horas",
    "6 horas",
    "12 horas",
    "1_day",
    "2_days",
    "3_days",
    "4_days",
    "5_days",
    "6_days",
    "7_days",
    "1 dia",
    "2 dias",
    "3 dias",
    "4 dias",
    "5 dias",
    "6 dias",
    "7 dias",
}


def is_short_trial_access(user_course) -> bool:
    """
    Retorna True se o acesso do aluno ao curso for de curta duração (horas ou 1 a 7 dias),
    caso em que o gatilho de Aviso de Expiração nos funis não deve ser ativado.
    """
    if not user_course:
        return False

    dur = (getattr(user_course, "access_duration", None) or "").strip().lower()
    if dur in SHORT_TRIAL_DURATIONS:
        return True

    if dur.startswith("custom:"):
        match = re.match(r"^custom:(?:(\d+)d)?(?:_)?(?:(\d+)h)?$", dur)
        if match:
            d = int(match.group(1)) if match.group(1) else 0
            h = int(match.group(2)) if match.group(2) else 0
            total_days = d + (h / 24.0)
            if 0 < total_days <= 7.5:
                return True

    created_at = getattr(user_course, "created_at", None)
    expires_at = getattr(user_course, "expires_at", None)
    if created_at and expires_at:
        c_dt = created_at if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc)
        e_dt = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=timezone.utc)
        total_days = (e_dt - c_dt).total_seconds() / 86400.0
        if 0 <= total_days <= 7.5:
            return True

    return False


def calculate_course_expiration(access_duration: str = "lifetime", base_time: datetime = None):
    if not access_duration or access_duration == "lifetime":
        return None

    now = base_time or datetime.now(timezone.utc)

    # 1. Preset de horas
    if access_duration in ACCESS_DURATION_HOURS:
        return now + timedelta(hours=ACCESS_DURATION_HOURS[access_duration])

    # 2. Preset de dias, meses e anos
    days = ACCESS_DURATION_DAYS.get(access_duration)
    if days is not None:
        return now + timedelta(days=days)

    # 3. Formato customizado: custom:Xd_Yh, custom:Xh, custom:Xd
    if access_duration.startswith("custom:"):
        match = re.match(r"^custom:(?:(\d+)d)?(?:_)?(?:(\d+)h)?$", access_duration)
        if match:
            d = int(match.group(1)) if match.group(1) else 0
            h = int(match.group(2)) if match.group(2) else 0
            if d > 0 or h > 0:
                return now + timedelta(days=d, hours=h)
            # Se ambos forem zero, garante expiração mínima de 1 hora
            return now + timedelta(hours=1)

    return None


def _parse_invite_courses(raw_json: str) -> Tuple[List[int], List[CourseAccessItem]]:
    """Retorna (allowed_course_ids: List[int], course_access: List[CourseAccessItem])."""
    if not raw_json:
        return [], []
    try:
        parsed = json.loads(raw_json)
    except Exception:
        return [], []
    if not isinstance(parsed, list):
        return [], []
    c_ids = []
    c_access = []
    for item in parsed:
        if isinstance(item, dict) and "course_id" in item:
            cid = int(item["course_id"])
            dur = item.get("access_duration") or "lifetime"
            c_ids.append(cid)
            c_access.append(CourseAccessItem(course_id=cid, access_duration=dur))
        elif isinstance(item, int):
            c_ids.append(item)
            c_access.append(CourseAccessItem(course_id=item, access_duration="lifetime"))
    return c_ids, c_access
