"""
Testes unitários para o fechamento temporário e liberação programada por data e hora de cursos
e para o bloqueio independente de canais, chats e suporte por curso.
"""
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock
import pytest

from app.services.course_access import (
    is_course_locked_by_schedule,
    is_course_channels_locked_by_schedule,
    is_course_channel_locked_for_user,
    is_global_channel_locked_for_user,
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
    c1 = SimpleNamespace(
        release_type="immediate",
        release_date=None,
        channel_release_type="closed",
        channel_release_date=None,
        locked_channels=["course_chat", "support"],
    )
    c2 = SimpleNamespace(
        release_type="closed",
        release_date=None,
        channel_release_type="immediate",
        channel_release_date=None,
        locked_channels=[],
    )
    attach_course_schedule_state([c1, c2])
    assert c1.is_course_locked is False
    assert c1.is_channel_locked is True
    assert c2.is_course_locked is True
    assert c2.is_channel_locked is False


def test_is_course_channels_locked_by_schedule_modes():
    future_dt = datetime.now(timezone.utc) + timedelta(hours=3)
    c_closed = SimpleNamespace(
        channel_release_type="closed",
        channel_release_date=None,
        locked_channels=["course_chat", "support"],
    )
    locked, ch_list, unlock_at = is_course_channels_locked_by_schedule(c_closed)
    assert locked is True
    assert ch_list == ["course_chat", "support"]
    assert unlock_at is None

    c_scheduled = SimpleNamespace(
        channel_release_type="specific_date",
        channel_release_date=future_dt,
        locked_channels=["general_chat", "dm"],
    )
    locked2, ch_list2, unlock_at2 = is_course_channels_locked_by_schedule(c_scheduled)
    assert locked2 is True
    assert "general_chat" in ch_list2
    assert unlock_at2 == future_dt


def test_is_course_channel_locked_for_user_student_vs_admin():
    course = SimpleNamespace(
        id=10,
        title="Bússola Astrológica",
        channel_release_type="closed",
        channel_release_date=None,
        locked_channels=["course_chat", "support"],
    )
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = course

    student = SimpleNamespace(id=5, role="aluno")
    admin = SimpleNamespace(id=1, role="superadmin")

    locked_s, _, reason_s = is_course_channel_locked_for_user(db, student, 10, "support")
    assert locked_s is True
    assert "Bússola Astrológica" in reason_s

    locked_admin, _, _ = is_course_channel_locked_for_user(db, admin, 10, "support")
    assert locked_admin is False


def test_is_global_channel_locked_veteran_vs_single_course_student(monkeypatch):
    import app.services.course_access as ca

    course_open = SimpleNamespace(
        id=1,
        title="Curso Veterano Aberto",
        item_type="course",
        release_type="immediate",
        release_date=None,
        channel_release_type="immediate",
        channel_release_date=None,
        locked_channels=[],
    )
    course_locked = SimpleNamespace(
        id=2,
        title="Curso Lançamento Fechado",
        item_type="course",
        release_type="immediate",
        release_date=None,
        channel_release_type="closed",
        channel_release_date=None,
        locked_channels=["general_chat", "dm", "course_chat"],
    )

    student = SimpleNamespace(id=7, role="aluno")
    db = MagicMock()

    # Caso 1: Aluno possui apenas o curso com Chat Geral bloqueado -> deve bloquear
    monkeypatch.setattr(ca, "get_effective_user_course_ids", lambda _db, _uid: [2])
    db.query.return_value.filter.return_value.all.return_value = [course_locked]
    locked_single, _, reason = is_global_channel_locked_for_user(db, student, "general_chat")
    assert locked_single is True
    assert "Chat Geral da Comunidade" in reason

    # Caso 2: Aluno veterano possui o Curso 1 (aberto) + Curso 2 (bloqueado) -> Chat Geral liberado!
    monkeypatch.setattr(ca, "get_effective_user_course_ids", lambda _db, _uid: [1, 2])
    db.query.return_value.filter.return_value.all.return_value = [course_open, course_locked]
    locked_vet, _, _ = is_global_channel_locked_for_user(db, student, "general_chat")
    assert locked_vet is False


def test_apply_course_update_fields_updates_release_and_channels_schedule():
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
        channel_release_type="immediate",
        channel_release_date=None,
        locked_channels_json=None,
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
        release_type="immediate",
        release_date=None,
        channel_release_type="specific_date",
        channel_release_date=target_date,
        locked_channels=["course_chat", "support", "general_chat"],
        bundled_course_ids=None,
    )
    apply_course_update_fields(None, course, update_in)
    assert course.channel_release_type == "specific_date"
    assert course.channel_release_date == target_date
    assert '"support"' in course.locked_channels_json
