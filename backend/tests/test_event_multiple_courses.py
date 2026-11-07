"""
Testes unitários para eventos exclusivos com múltiplos cursos selecionados.
"""
from datetime import datetime, timezone
from types import SimpleNamespace
from app.api.v1.endpoints.events import (
    _extract_event_course_ids,
    _normalize_requested_course_ids,
    _build_event_response,
)


def test_extract_event_course_ids_with_multiple_courses():
    ev = SimpleNamespace(
        target_type="course",
        course_id=1,
        course_ids_json="[1, 3, 5]"
    )
    assert _extract_event_course_ids(ev) == [1, 3, 5]


def test_extract_event_course_ids_legacy_single_course():
    ev = SimpleNamespace(
        target_type="course",
        course_id=7,
        course_ids_json=None
    )
    assert _extract_event_course_ids(ev) == [7]


def test_normalize_requested_course_ids_deduplicates():
    result = _normalize_requested_course_ids([2, 4, 2, "5"], 4)
    assert result == [2, 4, 5]


def test_build_event_response_grants_access_if_student_has_any_selected_course():
    ev = SimpleNamespace(
        id=10,
        title="Mentoria Especial",
        description="Desc",
        start_time=datetime.now(timezone.utc),
        end_time=None,
        meeting_url="https://zoom.us/j/999",
        recording_url=None,
        thumbnail_url=None,
        target_type="course",
        course_id=1,
        course_ids_json="[1, 2]",
        is_active=True,
        course=SimpleNamespace(id=1, title="AstroWake", sales_page_url="https://sales/1"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    courses_map = {
        1: SimpleNamespace(id=1, title="AstroWake", sales_page_url="https://sales/1"),
        2: SimpleNamespace(id=2, title="Bússola Astrológica", sales_page_url="https://sales/2"),
    }
    student = SimpleNamespace(id=50, role="aluno")

    # Aluno possui apenas o curso 2 -> Deve ter acesso liberado!
    resp_allowed = _build_event_response(ev, student, active_course_ids={2}, courses_map=courses_map)
    assert resp_allowed.has_access is True
    assert resp_allowed.meeting_url == "https://zoom.us/j/999"
    assert resp_allowed.course_ids == [1, 2]
    assert resp_allowed.course_titles == ["AstroWake", "Bússola Astrológica"]
    assert resp_allowed.course_title == "AstroWake, Bússola Astrológica"

    # Aluno possui apenas o curso 9 -> Acesso bloqueado e link oculto
    resp_blocked = _build_event_response(ev, student, active_course_ids={9}, courses_map=courses_map)
    assert resp_blocked.has_access is False
    assert resp_blocked.meeting_url is None
