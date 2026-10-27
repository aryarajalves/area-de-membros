import json
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime, timezone, timedelta

from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.event import Event, EventAttendee
from app.models.testimonial import Testimonial
from app.models.introduction import IntroductionPost
from app.models.gamification import GamificationPoint
from app.models.funnel import Funnel, FunnelExecution
from app.services.gamification_service import award_points
from app.services.funnel_community_triggers_service import (
    dispatch_first_testimonial_funnels,
    dispatch_first_presentation_funnels,
    dispatch_level_up_funnels,
    dispatch_event_attendance_funnels,
)
from tests.conftest import TestingSessionLocal


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def seed_triggers_data(db_session):
    db = db_session
    db.query(FunnelExecution).delete()
    db.query(Funnel).delete()
    db.query(EventAttendee).delete()
    db.query(Event).delete()
    db.query(Testimonial).delete()
    db.query(IntroductionPost).delete()
    db.query(GamificationPoint).delete()
    db.query(UserCourse).delete()
    db.query(Course).delete()

    aluno = db.query(User).filter(User.email == "aluno_gatilhos_novos@test.com").first()
    if not aluno:
        aluno = User(
            email="aluno_gatilhos_novos@test.com",
            name="Aluno Novos Gatilhos",
            hashed_password=get_password_hash("pass123"),
            role="aluno",
            is_active=True,
        )
        db.add(aluno)
        db.commit()
        db.refresh(aluno)

    admin = db.query(User).filter(User.role == "superadmin").first()
    if not admin:
        admin = User(
            email="admin_gatilhos_novos@test.com",
            name="Admin Novos Gatilhos",
            hashed_password=get_password_hash("pass123"),
            role="superadmin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    curso = Course(
        title="Curso de Automação e IA",
        description="Aulas de teste de funil",
        is_published=True,
    )
    db.add(curso)
    db.commit()
    db.refresh(curso)

    evento = Event(
        title="Mentoria Ao Vivo de Lançamento",
        description="Encontro exclusivo com a turma",
        start_time=datetime.now(timezone.utc) + timedelta(days=2),
        target_type="all",
        is_active=True,
    )
    db.add(evento)
    db.commit()
    db.refresh(evento)

    return {
        "student": aluno,
        "admin": admin,
        "course": curso,
        "event": evento,
    }


def test_first_testimonial_trigger_dispatches_funnel(db_session, seed_triggers_data):
    """Gatilho 1: Valida disparo automático de funil quando aluno posta seu primeiro depoimento."""
    db = db_session
    student = seed_triggers_data["student"]
    course = seed_triggers_data["course"]

    flow_data = {
        "nodes": [
            {
                "id": "trig_depoimento",
                "type": "trigger",
                "data": {
                    "trigger_event": "first_testimonial",
                    "course_id": course.id,
                },
            },
            {
                "id": "msg_obrigado",
                "type": "message",
                "data": {"text": "Muito obrigado pelo seu primeiro depoimento, {aluno}!"},
            },
        ],
        "edges": [{"id": "e1", "source": "trig_depoimento", "target": "msg_obrigado"}],
    }

    funnel = Funnel(
        name="Funil de Agradecimento por Primeiro Depoimento",
        flow_data=json.dumps(flow_data),
        is_active=True,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    with patch("app.services.chat_ws_manager.chat_manager.broadcast_event", new_callable=AsyncMock):
        count = dispatch_first_testimonial_funnels(db, student.id, course_id=course.id)
        assert count == 1

        exec_entry = db.query(FunnelExecution).filter(
            FunnelExecution.funnel_id == funnel.id,
            FunnelExecution.user_id == student.id,
        ).first()
        assert exec_entry is not None
        assert exec_entry.triggered_by == "trigger_first_testimonial"


def test_first_presentation_trigger_dispatches_funnel(db_session, seed_triggers_data):
    """Gatilho 2: Valida disparo automático de funil quando aluno posta primeira apresentação."""
    db = db_session
    student = seed_triggers_data["student"]

    flow_data = {
        "nodes": [
            {
                "id": "trig_apresentacao",
                "type": "trigger",
                "data": {
                    "trigger_event": "first_presentation",
                },
            },
            {
                "id": "msg_boas_vindas",
                "type": "message",
                "data": {"text": "Adoramos conhecer você na sua apresentação, {aluno}!"},
            },
        ],
        "edges": [{"id": "e1", "source": "trig_apresentacao", "target": "msg_boas_vindas"}],
    }

    funnel = Funnel(
        name="Funil de Boas-vindas da Apresentação",
        flow_data=json.dumps(flow_data),
        is_active=True,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    with patch("app.services.chat_ws_manager.chat_manager.broadcast_event", new_callable=AsyncMock):
        count = dispatch_first_presentation_funnels(db, student.id)
        assert count == 1

        exec_entry = db.query(FunnelExecution).filter(
            FunnelExecution.funnel_id == funnel.id,
            FunnelExecution.user_id == student.id,
        ).first()
        assert exec_entry is not None
        assert exec_entry.triggered_by == "trigger_first_presentation"


def test_level_up_trigger_dispatches_funnel(db_session, seed_triggers_data):
    """Gatilho 3: Valida disparo de funil na subida de nível de RPG (Level Up)."""
    db = db_session
    student = seed_triggers_data["student"]

    # Funil para qualquer subida de nível
    flow_data = {
        "nodes": [
            {
                "id": "trig_lvl",
                "type": "trigger",
                "data": {
                    "trigger_event": "level_up",
                    "target_level": "any",
                },
            },
            {
                "id": "msg_parabens",
                "type": "message",
                "data": {"text": "Parabéns pelo Level Up, {aluno}!"},
            },
        ],
        "edges": [{"id": "e1", "source": "trig_lvl", "target": "msg_parabens"}],
    }

    funnel = Funnel(
        name="Funil de Comemoração de Level Up",
        flow_data=json.dumps(flow_data),
        is_active=True,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    with patch("app.services.chat_ws_manager.chat_manager.broadcast_event", new_callable=AsyncMock):
        # Dispara passando old_level=1 e new_level=2
        count = dispatch_level_up_funnels(db, student.id, new_level=2, old_level=1)
        assert count == 1

        exec_entry = db.query(FunnelExecution).filter(
            FunnelExecution.funnel_id == funnel.id,
            FunnelExecution.user_id == student.id,
        ).first()
        assert exec_entry is not None
        assert "trigger_level_up_lvl2" in exec_entry.triggered_by


def test_level_up_trigger_multiple_specific_levels(db_session, seed_triggers_data):
    """Gatilho 3: Valida disparo com seleção de múltiplos níveis específicos (ex: [5, 10])."""
    db = db_session
    student = seed_triggers_data["student"]

    flow_data = {
        "nodes": [
            {
                "id": "trig_multi_lvl",
                "type": "trigger",
                "data": {
                    "trigger_event": "level_up",
                    "criterion_type": "specific",
                    "target_levels": [5, 10],
                },
            },
            {
                "id": "msg_multi",
                "type": "message",
                "data": {"text": "Marco de Elo atingido!"},
            },
        ],
        "edges": [{"id": "e1", "source": "trig_multi_lvl", "target": "msg_multi"}],
    }

    funnel = Funnel(
        name="Funil de Marco de Níveis (5 e 10)",
        flow_data=json.dumps(flow_data),
        is_active=True,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    with patch("app.services.chat_ws_manager.chat_manager.broadcast_event", new_callable=AsyncMock):
        # Nível 4 não deve disparar
        count_lvl4 = dispatch_level_up_funnels(db, student.id, new_level=4, old_level=3)
        assert count_lvl4 == 0

        # Nível 5 deve disparar!
        count_lvl5 = dispatch_level_up_funnels(db, student.id, new_level=5, old_level=4)
        assert count_lvl5 == 1

        exec_entry = db.query(FunnelExecution).filter(
            FunnelExecution.funnel_id == funnel.id,
            FunnelExecution.user_id == student.id,
        ).first()
        assert exec_entry is not None
        assert "trigger_level_up_lvl5" in exec_entry.triggered_by


def test_event_attendance_trigger_dispatches_funnel(db_session, seed_triggers_data):
    """Gatilho 4: Valida disparo de funil na confirmação de presença em evento."""
    db = db_session
    student = seed_triggers_data["student"]
    event = seed_triggers_data["event"]

    flow_data = {
        "nodes": [
            {
                "id": "trig_evento",
                "type": "trigger",
                "data": {
                    "trigger_event": "event_attendance",
                    "event_id": event.id,
                },
            },
            {
                "id": "msg_lembrete",
                "type": "message",
                "data": {"text": "Presença confirmada! Nos vemos no evento ao vivo, {aluno}."},
            },
        ],
        "edges": [{"id": "e1", "source": "trig_evento", "target": "msg_lembrete"}],
    }

    funnel = Funnel(
        name="Funil de Inscrição no Evento",
        flow_data=json.dumps(flow_data),
        is_active=True,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    with patch("app.services.chat_ws_manager.chat_manager.broadcast_event", new_callable=AsyncMock):
        count = dispatch_event_attendance_funnels(db, student.id, event_id=event.id)
        assert count == 1

        exec_entry = db.query(FunnelExecution).filter(
            FunnelExecution.funnel_id == funnel.id,
            FunnelExecution.user_id == student.id,
        ).first()
        assert exec_entry is not None
        assert f"trigger_event_attendance_evt{event.id}" in exec_entry.triggered_by


def test_event_attendance_count_mode_trigger_dispatches_funnel(db_session, seed_triggers_data):
    """Gatilho 4 (Modo Meta X Eventos): Dispara funil apenas quando o aluno atinge a meta de X eventos confirmados."""
    db = db_session
    student = seed_triggers_data["student"]

    # Cria 2 eventos
    now = datetime.now(timezone.utc)
    ev1 = Event(title="Evento Meta 1", start_time=now + timedelta(days=2), target_type="all", is_active=True)
    ev2 = Event(title="Evento Meta 2", start_time=now + timedelta(days=5), target_type="all", is_active=True)
    db.add_all([ev1, ev2])
    db.commit()
    db.refresh(ev1)
    db.refresh(ev2)

    # Limpa presenças anteriores
    db.query(EventAttendee).filter(EventAttendee.user_id == student.id).delete()
    db.commit()

    # Cria funil configurado para disparar na meta de 2 eventos confirmados
    flow_data = {
        "nodes": [
            {
                "id": "trig_meta_2",
                "type": "trigger",
                "data": {
                    "trigger_event": "event_attendance",
                    "attendance_mode": "count",
                    "target_count": 2,
                },
            },
            {
                "id": "msg_premio",
                "type": "message",
                "data": {"text": "Parabéns, você confirmou presença em 2 eventos!"},
            },
        ],
        "edges": [{"id": "e1", "source": "trig_meta_2", "target": "msg_premio"}],
    }

    funnel = Funnel(
        name="Funil Meta de 2 Eventos",
        flow_data=json.dumps(flow_data),
        is_active=True,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    with patch("app.services.chat_ws_manager.chat_manager.broadcast_event", new_callable=AsyncMock):
        # 1. Aluno confirma presença no evento 1 (total = 1 evento, meta é 2)
        att1 = EventAttendee(event_id=ev1.id, user_id=student.id)
        db.add(att1)
        db.commit()

        count_ev1 = dispatch_event_attendance_funnels(db, student.id, event_id=ev1.id)
        # Não deve disparar ainda pois total_confirmed (1) != target_count (2)
        assert count_ev1 == 0

        # 2. Aluno confirma presença no evento 2 (total = 2 eventos, meta é 2!)
        att2 = EventAttendee(event_id=ev2.id, user_id=student.id)
        db.add(att2)
        db.commit()

        count_ev2 = dispatch_event_attendance_funnels(db, student.id, event_id=ev2.id)
        # Agora DEVE disparar com sucesso!
        assert count_ev2 == 1

        exec_entry = db.query(FunnelExecution).filter(
            FunnelExecution.funnel_id == funnel.id,
            FunnelExecution.user_id == student.id,
        ).first()
        assert exec_entry is not None
        assert "trigger_event_attendance_count2" in exec_entry.triggered_by
