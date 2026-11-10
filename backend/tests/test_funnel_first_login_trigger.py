import json
import pytest
from datetime import datetime, timezone
from app.core.security import get_password_hash
from app.models.user import User
from app.models.funnel import Funnel, FunnelExecution
from app.services.funnel_trigger_service import dispatch_first_login_funnels
from tests.conftest import TestingSessionLocal, client


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def seed_first_login_data(db_session):
    db = db_session
    db.query(FunnelExecution).delete()
    db.query(Funnel).delete()

    student = db.query(User).filter(User.email == "aluno_1login@test.com").first()
    if not student:
        student = User(
            email="aluno_1login@test.com",
            name="Aluno Primeiro Acesso",
            hashed_password=get_password_hash("senhaValida123!"),
            role="aluno",
            is_active=True,
            first_login_at=None,
            login_count=0,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    else:
        student.first_login_at = None
        student.login_count = 0
        student.hashed_password = get_password_hash("senhaValida123!")
        db.commit()
        db.refresh(student)

    admin = db.query(User).filter(User.role == "superadmin").first()
    admin_id = admin.id if admin else 1

    return {
        "student_id": student.id,
        "admin_id": admin_id,
        "email": student.email,
        "password": "senhaValida123!",
    }


def test_dispatch_first_login_funnels_triggers_and_deduplicates(db_session, seed_first_login_data):
    """Valida que funis com gatilho de primeiro login disparam na primeira vez e não duplicam."""
    db = db_session
    student_id = seed_first_login_data["student_id"]
    admin_id = seed_first_login_data["admin_id"]

    flow_data = {
        "nodes": [
            {
                "id": "trigger_node_1",
                "type": "trigger",
                "position": {"x": 50, "y": 50},
                "data": {
                    "trigger_event": "first_login",
                    "is_start": True,
                },
            },
            {
                "id": "msg_boas_vindas",
                "type": "message",
                "position": {"x": 300, "y": 50},
                "data": {
                    "text": "Olá {aluno}, seja bem-vindo ao seu primeiro acesso!",
                    "destination_type": "dm",
                },
            },
        ],
        "edges": [
            {"id": "e_trig_msg", "source": "trigger_node_1", "target": "msg_boas_vindas"},
        ],
    }

    funnel = Funnel(
        name="Boas-Vindas no 1º Login",
        description="Disparo automático ao entrar pela 1ª vez",
        trigger_type="trigger",
        flow_data=json.dumps(flow_data),
        is_active=True,
        created_by_user_id=admin_id,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    # 1. Primeiro disparo deve ser executado
    dispatched = dispatch_first_login_funnels(db, student_id=student_id)
    assert dispatched == 1

    exec_record = db.query(FunnelExecution).filter(
        FunnelExecution.funnel_id == funnel.id,
        FunnelExecution.user_id == student_id,
    ).first()
    assert exec_record is not None
    assert exec_record.triggered_by == "trigger_first_login"
    assert "first_login" in (exec_record.logs or "").lower()

    # 2. Segundo disparo para o mesmo aluno deve ser deduplicado (0 disparos)
    dispatched_dup = dispatch_first_login_funnels(db, student_id=student_id)
    assert dispatched_dup == 0


def test_login_endpoint_tracks_first_login_and_fires_trigger(db_session, seed_first_login_data):
    """Valida que o endpoint de login atualiza first_login_at, login_count e aciona o funil."""
    email = seed_first_login_data["email"]
    password = seed_first_login_data["password"]
    student_id = seed_first_login_data["student_id"]
    admin_id = seed_first_login_data["admin_id"]

    # Cria funil de 1º login
    flow_data = {
        "nodes": [
            {
                "id": "trig_login",
                "type": "trigger",
                "data": {"trigger_event": "first_login"},
            },
            {
                "id": "msg_login",
                "type": "message",
                "data": {"text": "Bem-vindo ao sistema!"},
            },
        ],
        "edges": [{"id": "e1", "source": "trig_login", "target": "msg_login"}],
    }
    funnel = Funnel(
        name="Funil Teste Login",
        trigger_type="trigger",
        flow_data=json.dumps(flow_data),
        is_active=True,
        created_by_user_id=admin_id,
    )
    db_session.add(funnel)
    db_session.commit()
    db_session.refresh(funnel)

    # 1. Primeiro Login via API
    res1 = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res1.status_code == 200, res1.text
    data1 = res1.json()
    assert "access_token" in data1

    # Verifica no banco se first_login_at foi preenchido e login_count == 1
    db_session.expire_all()
    user_db = db_session.query(User).filter(User.id == student_id).first()
    assert user_db.first_login_at is not None
    initial_first_login = user_db.first_login_at
    assert user_db.login_count == 1
    assert user_db.last_login_at is not None

    # Verifica se a execução do funil foi registrada
    exec_record = db_session.query(FunnelExecution).filter_by(funnel_id=funnel.id, user_id=student_id).first()
    assert exec_record is not None

    # 2. Segundo Login via API (não é mais primeiro login)
    res2 = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res2.status_code == 200
    db_session.expire_all()
    user_db2 = db_session.query(User).filter(User.id == student_id).first()
    assert user_db2.first_login_at == initial_first_login
    assert user_db2.login_count == 2


def test_public_register_tracks_first_login_and_fires_funnel(db_session):
    """Valida que cadastro público já inicializa first_login_at e login_count = 1."""
    unique_email = f"aluno_pub_{datetime.now().timestamp()}@test.com"
    payload = {
        "name": "Aluno Cadastro Publico",
        "email": unique_email,
        "password": "SenhaForte123!@",
    }
    res = client.post("/api/v1/auth/public-register", json=payload)
    assert res.status_code == 201, res.text
    data = res.json()
    assert "access_token" in data

    db_session.expire_all()
    user_created = db_session.query(User).filter(User.email == unique_email).first()
    assert user_created is not None
    assert user_created.first_login_at is not None
    assert user_created.login_count == 1

