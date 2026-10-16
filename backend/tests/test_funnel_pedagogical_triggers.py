import json
import pytest
from datetime import datetime, timezone, timedelta
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonProgress
from app.models.funnel import Funnel, FunnelExecution
from app.services.funnel_trigger_service import (
    dispatch_progress_milestone_funnels,
    dispatch_renewal_warning_funnels,
    dispatch_student_inactivity_funnels,
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
def seed_pedagogical_data(db_session):
    db = db_session
    db.query(FunnelExecution).delete()
    db.query(Funnel).delete()
    db.query(LessonProgress).delete()
    db.query(Lesson).delete()
    db.query(Module).delete()
    db.query(Course).delete()

    aluno = db.query(User).filter(User.email == "aluno_pedagogico@test.com").first()
    if not aluno:
        aluno = User(
            email="aluno_pedagogico@test.com",
            name="Aluno Pedagógico Teste",
            hashed_password=get_password_hash("pass123"),
            role="aluno",
            is_active=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=15),
        )
        db.add(aluno)
        db.commit()
        db.refresh(aluno)

    instrutor = db.query(User).filter(User.role == "admin").first()
    if not instrutor:
        instrutor = User(
            email="admin_funil@test.com",
            name="Admin Funil",
            hashed_password=get_password_hash("pass123"),
            role="admin",
            is_active=True,
        )
        db.add(instrutor)
        db.commit()
        db.refresh(instrutor)

    curso = Course(
        title="Curso de Testes Automatizados",
        description="Aprenda a testar tudo",
        is_published=True,
    )
    db.add(curso)
    db.commit()
    db.refresh(curso)

    modulo = Module(title="Módulo 1", course_id=curso.id, order_index=1)
    db.add(modulo)
    db.commit()
    db.refresh(modulo)

    aula = Lesson(title="Aula 1", module_id=modulo.id, order_index=1)
    db.add(aula)
    db.commit()
    db.refresh(aula)

    return {
        "student_id": aluno.id,
        "course_id": curso.id,
        "lesson_id": aula.id,
        "admin_id": instrutor.id,
    }


def test_dispatch_progress_milestone_funnels_triggers_and_deduplicates(db_session, seed_pedagogical_data):
    """Valida o disparo do funil de marco de progresso (50%) e evita duplicidade."""
    db = db_session
    student_id = seed_pedagogical_data["student_id"]
    course_id = seed_pedagogical_data["course_id"]

    flow_data = {
        "nodes": [
            {
                "id": "trigger_progress",
                "type": "trigger",
                "data": {
                    "trigger_event": "progress_milestone",
                    "milestone": "50",
                    "course_id": course_id,
                },
            },
            {
                "id": "msg_step_1",
                "type": "message",
                "data": {
                    "text": "Parabéns, você atingiu 50% do curso!",
                },
            },
        ],
        "edges": [
            {"id": "e1", "source": "trigger_progress", "target": "msg_step_1"},
        ],
    }

    funnel = Funnel(
        name="Funil Meio de Curso",
        flow_data=json.dumps(flow_data),
        is_active=True,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    # 1. Quando o aluno cruza de 20% para 40%, o marco de 50% NÃO deve ser disparado
    count_0 = dispatch_progress_milestone_funnels(
        db, student_id=student_id, course_id=course_id, previous_pct=20, current_pct=40
    )
    assert count_0 == 0

    # 2. Quando o aluno cruza de 40% para 55%, cruza o marco de 50% -> DEVE disparar 1 vez
    count_1 = dispatch_progress_milestone_funnels(
        db, student_id=student_id, course_id=course_id, previous_pct=40, current_pct=55
    )
    assert count_1 == 1

    execution = db.query(FunnelExecution).filter(
        FunnelExecution.funnel_id == funnel.id,
        FunnelExecution.user_id == student_id,
    ).first()
    assert execution is not None
    assert execution.triggered_by == f"trigger_progress_{course_id}_50pct"

    # 3. Disparo redundante no mesmo marco não deve gerar nova execução
    count_2 = dispatch_progress_milestone_funnels(
        db, student_id=student_id, course_id=course_id, previous_pct=45, current_pct=55
    )
    assert count_2 == 0


def test_dispatch_renewal_warning_funnels_triggers_and_filters_days(db_session, seed_pedagogical_data):
    """Valida o disparo do funil de renovação com base na antecedência de dias configurada."""
    db = db_session
    student_id = seed_pedagogical_data["student_id"]
    course_id = seed_pedagogical_data["course_id"]

    flow_data = {
        "nodes": [
            {
                "id": "trigger_renewal",
                "type": "trigger",
                "data": {
                    "trigger_event": "renewal_warning",
                    "days_before": 7,
                    "course_id": course_id,
                },
            },
            {
                "id": "msg_renewal",
                "type": "message",
                "data": {
                    "text": "Seu curso expira em 7 dias! Renove com desconto.",
                },
            },
        ],
        "edges": [
            {"id": "e_r1", "source": "trigger_renewal", "target": "msg_renewal"},
        ],
    }

    funnel = Funnel(
        name="Funil Aviso 7 Dias",
        flow_data=json.dumps(flow_data),
        is_active=True,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    # 1. Chamada para 3 dias antes não deve disparar o funil de 7 dias
    count_diff_days = dispatch_renewal_warning_funnels(
        db, student_id=student_id, course_id=course_id, days_before=3
    )
    assert count_diff_days == 0

    # 2. Chamada para 7 dias antes deve disparar
    count_matched = dispatch_renewal_warning_funnels(
        db, student_id=student_id, course_id=course_id, days_before=7
    )
    assert count_matched == 1

    # 3. Não dispara em duplicidade
    count_dup = dispatch_renewal_warning_funnels(
        db, student_id=student_id, course_id=course_id, days_before=7
    )
    assert count_dup == 0


def test_dispatch_student_inactivity_funnels_detects_inactive_students(db_session, seed_pedagogical_data):
    """Valida a detecção e disparo de funil para alunos sem conclusão de aula há mais de X dias."""
    db = db_session
    student_id = seed_pedagogical_data["student_id"]
    course_id = seed_pedagogical_data["course_id"]

    flow_data = {
        "nodes": [
            {
                "id": "trigger_inactivity",
                "type": "trigger",
                "data": {
                    "trigger_event": "student_inactivity",
                    "inactive_days": 7,
                    "course_id": None,
                },
            },
            {
                "id": "msg_inactivity",
                "type": "message",
                "data": {
                    "text": "Sentimos sua falta! Volte e continue aprendendo.",
                },
            },
        ],
        "edges": [
            {"id": "e_i1", "source": "trigger_inactivity", "target": "msg_inactivity"},
        ],
    }

    funnel = Funnel(
        name="Funil Resgate de Inativos",
        flow_data=json.dumps(flow_data),
        is_active=True,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    # O aluno foi criado há 15 dias e não tem nenhum LessonProgress -> inativo há mais de 7 dias
    dispatched = dispatch_student_inactivity_funnels(db)
    assert dispatched >= 1

    exec_record = db.query(FunnelExecution).filter(
        FunnelExecution.funnel_id == funnel.id,
        FunnelExecution.user_id == student_id,
    ).first()
    assert exec_record is not None
    assert "trigger_inactivity_7d" in exec_record.triggered_by
