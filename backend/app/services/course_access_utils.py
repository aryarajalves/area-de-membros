"""
Utilitários de Cálculo de Duração e Validade de Acesso a Cursos e Convites.
"""
import json
from datetime import datetime, timedelta, timezone
from typing import List, Tuple
from app.schemas.user import CourseAccessItem

ACCESS_DURATION_DAYS = {
    "lifetime": None,
    "1_month": 30,
    "3_months": 90,
    "6_months": 180,
    "1_year": 365,
    "2_years": 730,
    "3_years": 1095,
}


def calculate_course_expiration(access_duration: str = "lifetime", base_time: datetime = None):
    if not access_duration or access_duration == "lifetime":
        return None
    days = ACCESS_DURATION_DAYS.get(access_duration)
    if not days:
        return None
    now = base_time or datetime.now(timezone.utc)
    return now + timedelta(days=days)


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
