from typing import List, Optional
from app.schemas.student import StudentListItem


def get_target_progress_percent(student: StudentListItem, course_id: Optional[int] = None) -> int:
    """Retorna o progresso (%) no curso específico (se informado) ou o progresso geral do aluno."""
    if course_id is not None:
        for course in student.courses:
            if course.course_id == course_id:
                return int(course.progress_percent or 0)
        return 0
    return int(student.overall_progress_percent or 0)


def get_engagement_tier(progress_percent: int) -> str:
    """Classifica o engajamento: low (0-35%), medium (36-70%), high (71-100%)."""
    if progress_percent <= 35:
        return "low"
    if progress_percent <= 70:
        return "medium"
    return "high"


def filter_students_by_progress(
    items: List[StudentListItem],
    course_id: Optional[int] = None,
    engagement_level: Optional[str] = None,
    min_progress: Optional[int] = None,
    max_progress: Optional[int] = None,
) -> List[StudentListItem]:
    """Filtra a lista de alunos por nível de engajamento e/ou faixa percentual de progresso."""
    normalized_level = engagement_level.strip().lower() if engagement_level else None
    valid_level = normalized_level if normalized_level in ("low", "medium", "high") else None

    if valid_level is None and min_progress is None and max_progress is None:
        return items

    filtered: List[StudentListItem] = []
    for student in items:
        progress = get_target_progress_percent(student, course_id)
        if valid_level is not None and get_engagement_tier(progress) != valid_level:
            continue
        if min_progress is not None and progress < min_progress:
            continue
        if max_progress is not None and progress > max_progress:
            continue
        filtered.append(student)

    return filtered
