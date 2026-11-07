"""
Testes unitários para o fechamento temporário e liberação programada por data e hora de cursos.
"""
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
import pytest
from fastapi import HTTPException

from app.services.course_access import (
    is_course_locked_by_schedule,
    attach_course_schedule_state,
    apply_course_update_fields,
)


def test_is_course_locked_by_schedule_immediate():
    course = SimpleNamespace(release_type="immediate", release_date=None)
    locked, unlock_at = is_course_locked_by_schedule(course)
    assert locked is False
    assert unlock_at is None


def test_is_course_locked_by_schedule_closed():
    course = SimpleNamespace(release_type="closed", release_date=None)
    locked, unlock_at = is_course_locked_by_schedule(course)
    assert locked is True
    assert unlock_at is None


def test_is_course_locked_by_schedule_future_date():
    future_dt = datetime.now(timezone.utc) + timedelta(hours=5)
    course = SimpleNamespace(release_type="specific_date", release_date=future_dt)
    locked, unlock_at = is_course_locked_by_schedule(course)
    assert locked is True
    assert unlock_at == future_dt


def test_is_course_locked_by_schedule_past_date():
    past_dt = datetime.now(timezone.utc) - timedelta(hours=2)
    course = SimpleNamespace(release_type="specific_date", release_date=past_dt)
    locked, unlock_at = is_course_locked_by_schedule(course)
    assert locked is False
    assert unlock_at == past_dt


def test_attach_course_schedule_state_sets_flag():
    c1 = SimpleNamespace(release_type="immediate", release_date=None)
    c2 = SimpleNamespace(release_type="closed", release_date=None)
    attach_course_schedule_state([c1, c2])
    assert c1.is_course_locked is False
    assert c2.is_course_locked is True


def test_apply_course_update_fields_updates_release_schedule():
    course = SimpleNamespace(
        id=1,
        title="Curso Original",
        description="Desc",
        thumbnail_url=None,
        cover_image_url=None,
        cover_image_position=50,
        bg_color="#090d16",
        is_published=True,
        sales_page_url=None,
        order_index=0,
        agentflow_kb_id=None,
        agentflow_kb_name=None,
        item_type="course",
        tool_url=None,
        bundle_title=None,
        watermark_enabled=True,
        release_type="immediate",
        release_date=None,
    )
    target_date = datetime(2027, 5, 10, 14, 30, tzinfo=timezone.utc)
    update_in = SimpleNamespace(
        title=None,
        description=None,
        thumbnail_url=None,
        cover_image_url=None,
        cover_image_position=None,
        bg_color=None,
        is_published=None,
        sales_page_url=None,
        order_index=None,
        agentflow_kb_id=None,
        agentflow_kb_name=None,
        item_type=None,
        tool_url=None,
        bundle_title=None,
        watermark_enabled=None,
        release_type="specific_date",
        release_date=target_date,
        bundled_course_ids=None,
    )
    apply_course_update_fields(None, course, update_in)
    assert course.release_type == "specific_date"
    assert course.release_date == target_date

    # Ao mudar para 'closed', release_date deve ser limpo
    update_closed = SimpleNamespace(**{**update_in.__dict__, "release_type": "closed", "release_date": None})
    apply_course_update_fields(None, course, update_closed)
    assert course.release_type == "closed"
    assert course.release_date is None
