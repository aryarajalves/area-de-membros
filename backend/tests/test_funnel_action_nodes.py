import json
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime, timezone, timedelta
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.gamification import GamificationPoint
from app.models.chat import ChatMessage
from app.models.funnel import Funnel, FunnelExecution
from app.services.funnel_action_node_service import (
    execute_action_node,
    execute_webhook_node,
    execute_enrollment_node,
    execute_gamification_xp_node,
    execute_internal_notify_node,
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


@pytest.fixture
def seed_action_data(db_session):
    db = db_session
    db.query(FunnelExecution).delete()
    db.query(Funnel).delete()
    db.query(UserCourse).delete()
    db.query(GamificationPoint).delete()
    db.query(ChatMessage).delete()
    db.query(Course).delete()

    aluno = db.query(User).filter(User.email == "aluno_action_test@test.com").first()
    if not aluno:
        aluno = User(
            email="aluno_action_test@test.com",
            name="Aluno Ações Teste",
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
            email="admin_action_test@test.com",
            name="Super Admin Funil",
            hashed_password=get_password_hash("pass123"),
            role="superadmin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    curso = Course(
        title="Curso Bônus do Funil",
        description="Curso liberado automaticamente por nó do funil",
        is_published=True,
    )
    db.add(curso)
    db.commit()
    db.refresh(curso)

    return {
        "student": aluno,
        "admin": admin,
        "course": curso,
    }


@pytest.mark.asyncio
async def test_execute_webhook_node_success(seed_action_data):
    """Valida disparo de webhook externo com POST e payload de dados do aluno."""
    student = seed_action_data["student"]
    node_data = {
        "method": "POST",
        "url": "https://api.externa.com/webhook-receber",
    }

    mock_response = MagicMock()
    mock_response.status_code = 200

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        log_result = await execute_webhook_node(student, node_data, "node_webhook_1", funnel_id=10)

        assert "[WEBHOOK] Disparado" in log_result
        assert "HTTP 200" in log_result
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args.kwargs
        assert "json" in call_kwargs
        payload = call_kwargs["json"]
        assert payload["student"]["id"] == student.id
        assert payload["student"]["email"] == student.email


def test_execute_enrollment_node_grants_access(db_session, seed_action_data):
    """Valida concessão de matrícula automática em curso bônus."""
    db = db_session
    student = seed_action_data["student"]
    course = seed_action_data["course"]

    node_data = {
        "course_id": course.id,
        "access_duration": "1_year",
    }

    log_result = execute_enrollment_node(db, student, node_data, "node_enroll_1", funnel_id=10)
    assert "[MATRÍCULA] Acesso" in log_result
    assert course.title in log_result

    # Verificar que o registro foi criado em UserCourse
    uc = db.query(UserCourse).filter(
        UserCourse.user_id == student.id,
        UserCourse.course_id == course.id,
    ).first()
    assert uc is not None
    assert uc.access_duration == "1_year"
    assert uc.expires_at is not None


def test_execute_gamification_xp_node_credits_points(db_session, seed_action_data):
    """Valida crédito de pontuação XP diretamente no perfil do aluno."""
    db = db_session
    student = seed_action_data["student"]

    node_data = {
        "xp_amount": 150,
        "reason": "Desafio VIP Concluído",
    }

    log_result = execute_gamification_xp_node(db, student, node_data, "node_xp_1", funnel_id=10)
    assert "[XP RPG] +150 XP concedido" in log_result

    point_entry = db.query(GamificationPoint).filter(
        GamificationPoint.user_id == student.id,
        GamificationPoint.action == "funnel_reward",
    ).first()
    assert point_entry is not None
    assert point_entry.points == 150
    assert "Desafio VIP Concluído" in point_entry.description


@pytest.mark.asyncio
async def test_execute_internal_notify_node_creates_dm_for_admins(db_session, seed_action_data):
    """Valida envio de notificação interna e DM para os administradores."""
    db = db_session
    student = seed_action_data["student"]
    admin = seed_action_data["admin"]

    node_data = {
        "notify_target": "admins",
        "message": "Atenção: O aluno {aluno} ({email}) concluiu o funil!",
    }

    with patch("app.services.chat_ws_manager.chat_manager.broadcast_event", new_callable=AsyncMock):
        log_result = await execute_internal_notify_node(db, student, node_data, "node_notify_1", funnel_id=10)
        assert "[NOTIFICAÇÃO INTERNA]" in log_result

        # Checar se a mensagem DM foi salva para o admin
        dm_msg = db.query(ChatMessage).filter(
            ChatMessage.channel_type == "dm",
            ChatMessage.recipient_id == admin.id,
        ).first()
        assert dm_msg is not None


@pytest.mark.asyncio
async def test_funnel_execution_flow_with_all_action_nodes(db_session, seed_action_data):
    """Valida o fluxo completo de um funil encadeando os 4 nós de ação."""
    db = db_session
    student = seed_action_data["student"]
    course = seed_action_data["course"]

    flow_data = {
        "nodes": [
            {
                "id": "node_trig",
                "type": "trigger",
                "data": {"trigger_event": "student_created", "days_after": 0},
            },
            {
                "id": "node_enroll",
                "type": "action_enrollment",
                "data": {"course_id": course.id, "access_duration": "lifetime"},
            },
            {
                "id": "node_xp",
                "type": "action_gamification_xp",
                "data": {"xp_amount": 75, "reason": "Bônus de Boas-vindas"},
            },
            {
                "id": "node_notify",
                "type": "action_internal_notify",
                "data": {"notify_target": "admins", "message": "Novo aluno {aluno} onboarded!"},
            },
        ],
        "edges": [
            {"id": "e1", "source": "node_trig", "target": "node_enroll"},
            {"id": "e2", "source": "node_enroll", "target": "node_xp"},
            {"id": "e3", "source": "node_xp", "target": "node_notify"},
        ],
    }

    funnel = Funnel(
        name="Funil de Ações Automatizadas",
        flow_data=json.dumps(flow_data),
        is_active=True,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    execution = FunnelExecution(
        funnel_id=funnel.id,
        user_id=student.id,
        triggered_by="manual_test",
        status="running",
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    with patch("app.services.chat_ws_manager.chat_manager.broadcast_event", new_callable=AsyncMock):
        res = await execute_funnel_flow(
            funnel_id=funnel.id,
            student_id=student.id,
            sender_id=seed_action_data["admin"].id,
            triggered_by="manual_test",
            execution_id=execution.id,
        )

        assert res.success is True
        db.refresh(execution)
        assert execution.status == "completed"
        assert "[MATRÍCULA]" in execution.logs
        assert "[XP RPG]" in execution.logs
        assert "[NOTIFICAÇÃO INTERNA]" in execution.logs
