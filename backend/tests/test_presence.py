import pytest
from datetime import datetime, timezone
from app.core.config import settings
from app.models.user import User
from app.services.chat_ws_manager import chat_manager
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def presence_mock():
    # Simula mock de conexões no chat_manager
    original_connections = dict(chat_manager.active_connections)
    chat_manager.active_connections.clear()

    # Adiciona mock sockets
    class DummySocket:
        pass

    s1 = DummySocket()
    s2 = DummySocket()
    chat_manager.active_connections[s1] = {"user_id": 9991, "role": "superadmin", "name": "Super Test"}
    chat_manager.active_connections[s2] = {"user_id": 9992, "role": "aluno", "name": "Aluno Test"}

    yield

    chat_manager.active_connections = original_connections


def test_presence_stats_endpoint(presence_mock):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.get("/api/v1/presence/stats", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_online" in data
    assert "superadmins_online" in data
    assert "admins_online" in data
    assert "students_online" in data
    assert data["total_online"] >= 2
    assert data["superadmins_online"] >= 1
    assert data["students_online"] >= 1


def test_presence_online_ids_endpoint(presence_mock):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.get("/api/v1/presence/online-ids", headers=headers)
    assert res.status_code == 200
    ids = res.json()
    assert isinstance(ids, list)
    assert 9991 in ids
    assert 9992 in ids


def test_presence_heartbeat_endpoint():
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.post("/api/v1/presence/heartbeat", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["is_online"] is True
    assert data["last_seen_at"] is not None


def test_students_list_with_only_online_filter():
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    # Sem alunos online simulados para este filtro específico
    res = client.get("/api/v1/students?only_online=true", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert isinstance(data["items"], list)
