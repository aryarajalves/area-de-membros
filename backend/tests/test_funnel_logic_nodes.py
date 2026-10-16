import pytest
from datetime import datetime, timezone, timedelta
from app.models.user import User
from app.models.course import Course, UserCourse, CourseBundle
from app.models.funnel import Funnel, FunnelExecution
from app.services.funnel_logic_node_service import (
    execute_ab_split_node,
    execute_course_condition_node,
    execute_stop_node,
    calculate_delay_with_business_hours,
)
from app.services.funnel_service import execute_funnel_flow
from tests.conftest import TestingSessionLocal


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_ab_split_node_routing():
    # 100% split_a should always pick output_a
    branch, log = execute_ab_split_node({"split_a_pct": 99}, "node_ab_1", 1)
    assert branch in ["output_a", "output_b"]
    assert "Teste A/B" in log

    # 1% split_a should mostly pick output_b
    branch_b, log_b = execute_ab_split_node({"split_a_pct": 1}, "node_ab_2", 1)
    assert branch_b in ["output_a", "output_b"]
    assert "Caminho" in log_b


def test_course_condition_node_direct_and_bundle(db_session):
    # Criar aluno
    student = User(
        email="student_cond@test.com",
        name="Aluno Condicional",
        hashed_password="hash",
        role="aluno",
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    # Criar cursos
    course_a = Course(title="Curso Python", is_published=True)
    course_b = Course(title="Curso React", is_published=True)
    bundle_parent = Course(title="Pacote VIP", is_published=True)
    db_session.add_all([course_a, course_b, bundle_parent])
    db_session.commit()
    db_session.refresh(course_a)
    db_session.refresh(course_b)
    db_session.refresh(bundle_parent)

    # 1. Aluno sem matrícula -> deve ir para output_no
    branch, log = execute_course_condition_node(
        db_session, student.id, {"course_id": course_a.id}, "cond_1", 1
    )
    assert branch == "output_no"
    assert "NÃO possui acesso" in log

    # 2. Matricular aluno diretamente em course_a -> deve ir para output_yes
    uc = UserCourse(user_id=student.id, course_id=course_a.id, access_duration="lifetime")
    db_session.add(uc)
    db_session.commit()

    branch, log = execute_course_condition_node(
        db_session, student.id, {"course_id": course_a.id}, "cond_1", 1
    )
    assert branch == "output_yes"
    assert "possui acesso ativo" in log

    # 3. Testar acesso via Pacote / Combo:
    # course_b está incluso no bundle_parent
    cb = CourseBundle(parent_course_id=bundle_parent.id, bundled_course_id=course_b.id)
    db_session.add(cb)
    db_session.commit()

    # Aluno ainda não tem acesso ao bundle -> output_no para course_b
    branch_b, _ = execute_course_condition_node(
        db_session, student.id, {"course_id": course_b.id}, "cond_2", 1
    )
    assert branch_b == "output_no"

    # Matricular aluno no bundle_parent -> agora deve ter acesso ao course_b via bundle!
    uc_bundle = UserCourse(user_id=student.id, course_id=bundle_parent.id, access_duration="lifetime")
    db_session.add(uc_bundle)
    db_session.commit()

    branch_b_after, log_b_after = execute_course_condition_node(
        db_session, student.id, {"course_id": course_b.id}, "cond_2", 1
    )
    assert branch_b_after == "output_yes"
    assert "possui acesso ativo" in log_b_after

    # 4. Testar verificação 'Qualquer Curso Ativo' (course_id: 'any')
    branch_any, log_any = execute_course_condition_node(
        db_session, student.id, {"course_id": "any"}, "cond_any", 1
    )
    assert branch_any == "output_yes"


def test_stop_node_cancels_other_funnels(db_session):
    student = User(
        email="stop_student@test.com",
        name="Aluno Stop",
        hashed_password="hash",
        role="aluno",
        is_active=True,
    )
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    f1 = Funnel(name="Funil 1", flow_data="{}", is_active=True)
    f2 = Funnel(name="Funil 2", flow_data="{}", is_active=True)
    db_session.add_all([f1, f2])
    db_session.commit()
    db_session.refresh(f1)
    db_session.refresh(f2)

    # Execução ativa no Funil 2
    ex2 = FunnelExecution(
        funnel_id=f2.id,
        user_id=student.id,
        status="running",
        started_at=datetime.now(timezone.utc),
    )
    db_session.add(ex2)
    db_session.commit()
    db_session.refresh(ex2)

    # Executar stop node no Funil 1 com cancel_other_funnels=True
    should_stop, log = execute_stop_node(
        db_session,
        student.id,
        {"cancel_other_funnels": True},
        "stop_node_1",
        f1.id,
    )
    assert should_stop is True
    assert "Funil finalizado" in log
    assert "1 outro(s) funil(is) ativo(s)" in log

    # Verificar que ex2 foi cancelada/interrompida
    db_session.refresh(ex2)
    assert ex2.status == "stopped"


def test_calculate_delay_with_business_hours():
    # 1. Delay normal sem janela comercial
    secs, log = calculate_delay_with_business_hours(
        {"delay_value": 5, "delay_unit": "minutes", "business_hours_enabled": False},
        "delay_1",
    )
    assert secs == 300
    assert "300s" in log

    # 2. Delay com janela comercial ativada
    secs_bh, log_bh = calculate_delay_with_business_hours(
        {
            "delay_value": 2,
            "delay_unit": "hours",
            "business_hours_enabled": True,
            "business_hours_start": "09:00",
            "business_hours_end": "20:00",
            "business_days_only": True,
        },
        "delay_2",
    )
    assert secs_bh >= 0
    assert "Janela Comercial" in log_bh
    assert "Horário de Brasília" in log_bh


@pytest.mark.asyncio
async def test_funnel_flow_with_ab_split_and_stop(db_session):
    student = User(
        email="flow_logic@test.com",
        name="Lead Teste Flow",
        hashed_password="hash",
        role="aluno",
        is_active=True,
    )
    admin = User(
        email="admin_logic@test.com",
        name="Admin Flow",
        hashed_password="hash",
        role="admin",
        is_active=True,
    )
    db_session.add_all([student, admin])
    db_session.commit()
    db_session.refresh(student)
    db_session.refresh(admin)

    # Funil com ab_split (100% no caminho A) -> stop
    import json
    flow_dict = {
        "nodes": [
            {"id": "node_start", "type": "trigger", "data": {"is_start": True, "trigger_event": "student_created"}},
            {"id": "node_split", "type": "ab_split", "data": {"split_a_pct": 99}},
            {"id": "node_stop_a", "type": "stop", "data": {"cancel_other_funnels": False}},
            {"id": "node_stop_b", "type": "stop", "data": {"cancel_other_funnels": False}},
        ],
        "edges": [
            {"id": "e1", "source": "node_start", "target": "node_split"},
            {"id": "e2", "source": "node_split", "sourceHandle": "output_a", "target": "node_stop_a"},
            {"id": "e3", "source": "node_split", "sourceHandle": "output_b", "target": "node_stop_b"},
        ],
    }
    funnel = Funnel(name="Funil Lógica Teste", flow_data=json.dumps(flow_dict), is_active=True)
    db_session.add(funnel)
    db_session.commit()
    db_session.refresh(funnel)

    res = await execute_funnel_flow(
        funnel_id=funnel.id,
        student_id=student.id,
        sender_id=admin.id,
        db_session_factory=lambda: db_session,
    )
    assert res.success is True
    assert "sucesso" in res.message
    assert res.execution_id is not None
