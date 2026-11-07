import json
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonProgress
from app.models.funnel import Funnel, FunnelExecution
from app.services.funnel_trigger_service import (
    dispatch_progress_milestone_funnels,
    dispatch_lesson_module_funnels,
    dispatch_tutor_ia_lifecycle_funnels,
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
def seed_multi_trigger_data(db_session):
    db = db_session
    db.query(FunnelExecution).delete()
    db.query(Funnel).delete()
    db.query(LessonProgress).delete()
    db.query(Lesson).delete()
    db.query(Module).delete()
    db.query(Course).delete()

    aluno = db.query(User).filter(User.email == "aluno_multitrig@test.com").first()
    if not aluno:
        aluno = User(
            email="aluno_multitrig@test.com",
            name="Aluno MultiTrig Teste",
            hashed_password=get_password_hash("pass123"),
            role="aluno",
            is_active=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=10),
        )
        db.add(aluno)
        db.commit()
        db.refresh(aluno)

    curso = Course(
        title="Curso Multi Handles",
        description="Aprenda funis ramificados",
        is_published=True,
    )
    db.add(curso)
    db.commit()
    db.refresh(curso)

    modulo = Module(
        course_id=curso.id,
        title="Módulo 1 Multi",
        order_index=1,
    )
    db.add(modulo)
    db.commit()
    db.refresh(modulo)

    aula = Lesson(
        module_id=modulo.id,
        title="Aula 1 Multi",
        order_index=1,
    )
    db.add(aula)
    db.commit()
    db.refresh(aula)

    return {
        "aluno": aluno,
        "curso": curso,
        "modulo": modulo,
        "aula": aula,
    }


def test_progress_milestone_multi_handle_dispatch(db_session, seed_multi_trigger_data):
    data = seed_multi_trigger_data
    aluno = data["aluno"]
    curso = data["curso"]

    flow_data = {
        "nodes": [
            {
                "id": "node_trig_1",
                "type": "trigger",
                "data": {
                    "trigger_event": "progress_milestone",
                    "milestones": ["25", "50", "100"],
                    "course_id": curso.id,
                },
            },
            {
                "id": "node_msg_50",
                "type": "message",
                "data": {"text": "Parabéns por alcançar a metade do curso!"},
            },
        ],
        "edges": [
            {
                "id": "edge_50",
                "source": "node_trig_1",
                "sourceHandle": "output_50",
                "target": "node_msg_50",
            }
        ],
    }

    funnel = Funnel(
        name="Funil de Marco 50% Multi",
        is_active=True,
        flow_data=json.dumps(flow_data),
    )
    db_session.add(funnel)
    db_session.commit()

    with patch("app.services.funnel_trigger_service._launch_funnel_execution") as mock_launch:
        dispatched = dispatch_progress_milestone_funnels(
            db=db_session,
            student_id=aluno.id,
            course_id=curso.id,
            previous_pct=40,
            current_pct=55,
        )

        assert dispatched >= 1
        assert mock_launch.called
        call_args = mock_launch.call_args[0]
        assert call_args[0] == funnel.id
        assert call_args[1] == aluno.id
        assert "50pct" in call_args[3]


def test_lesson_module_activity_dispatch(db_session, seed_multi_trigger_data):
    data = seed_multi_trigger_data
    aluno = data["aluno"]
    curso = data["curso"]
    aula = data["aula"]

    flow_data = {
        "nodes": [
            {
                "id": "node_lm_trig",
                "type": "trigger",
                "data": {
                    "trigger_event": "lesson_module_activity",
                    "active_options": ["lesson", "module"],
                    "course_id": curso.id,
                    "lesson_id": aula.id,
                },
            },
            {
                "id": "node_msg_lesson",
                "type": "message",
                "data": {"text": "Você completou a Aula 1!"},
            },
        ],
        "edges": [
            {
                "id": "edge_lm",
                "source": "node_lm_trig",
                "sourceHandle": "output_lesson",
                "target": "node_msg_lesson",
            }
        ],
    }

    funnel = Funnel(
        name="Funil de Aula Concluída Multi",
        is_active=True,
        flow_data=json.dumps(flow_data),
    )
    db_session.add(funnel)
    db_session.commit()

    with patch("app.services.funnel_trigger_service._launch_funnel_execution") as mock_launch:
        dispatched = dispatch_lesson_module_funnels(
            db=db_session,
            student_id=aluno.id,
            course_id=curso.id,
            event_type="lesson",
            lesson_id=aula.id,
        )

        assert dispatched >= 1
        assert mock_launch.called
        call_args = mock_launch.call_args[0]
        assert "trigger_lesson_activity" in call_args[3]


def test_tutor_ia_lifecycle_dispatch(db_session, seed_multi_trigger_data):
    data = seed_multi_trigger_data
    aluno = data["aluno"]

    flow_data = {
        "nodes": [
            {
                "id": "node_tut_trig",
                "type": "trigger",
                "data": {
                    "trigger_event": "tutor_ia_lifecycle",
                    "active_events": ["first_chat", "quota_exhausted"],
                },
            },
            {
                "id": "node_msg_tut",
                "type": "message",
                "data": {"text": "Bem-vindo ao Tutor IA!"},
            },
        ],
        "edges": [
            {
                "id": "edge_tut",
                "source": "node_tut_trig",
                "sourceHandle": "output_first_chat",
                "target": "node_msg_tut",
            }
        ],
    }

    funnel = Funnel(
        name="Funil Tutor IA Onboarding Multi",
        is_active=True,
        flow_data=json.dumps(flow_data),
    )
    db_session.add(funnel)
    db_session.commit()

    with patch("app.services.funnel_trigger_service._launch_funnel_execution") as mock_launch:
        dispatched = dispatch_tutor_ia_lifecycle_funnels(
            db=db_session,
            student_id=aluno.id,
            event_type="first_chat",
        )

        assert dispatched >= 1
        assert mock_launch.called
        call_args = mock_launch.call_args[0]
        assert "trigger_tutor_ia_first_chat" in call_args[3]
