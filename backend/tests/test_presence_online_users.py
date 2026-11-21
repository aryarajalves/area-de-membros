from unittest.mock import patch
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from tests.conftest import TestingSessionLocal, client


def test_list_online_users_admin_only_and_returns_connected_contacts():
    db = TestingSessionLocal()
    try:
        admin = User(
            email="admin_pres@example.com",
            name="Admin Presença",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="admin",
            is_active=True,
        )
        student = User(
            email="aluno_pres@example.com",
            name="João Online",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="aluno",
            is_active=True,
        )
        offline_student = User(
            email="offline_pres@example.com",
            name="Pedro Offline",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="aluno",
            is_active=True,
        )
        db.add_all([admin, student, offline_student])
        db.commit()
        db.refresh(admin)
        db.refresh(student)
        db.refresh(offline_student)

        admin_id = admin.id
        student_id = student.id
        h_admin = {"Authorization": f"Bearer {create_access_token({'sub': str(admin.id), 'role': 'admin'})}"}
        h_student = {"Authorization": f"Bearer {create_access_token({'sub': str(student.id), 'role': 'aluno'})}"}
    finally:
        db.close()

    # Aluno comum não pode listar detalhes dos contatos online -> 403
    res_forbidden = client.get("/api/v1/presence/online-users", headers=h_student)
    assert res_forbidden.status_code == 403

    # Admin vê apenas os usuários atualmente conectados via WebSocket/presença
    with patch("app.api.v1.endpoints.presence.get_online_user_ids", return_value={admin_id, student_id}):
        res_ok = client.get("/api/v1/presence/online-users", headers=h_admin)

    assert res_ok.status_code == 200
    data = res_ok.json()
    names = [u["name"] for u in data]
    assert "Admin Presença" in names
    assert "João Online" in names
    assert "Pedro Offline" not in names

    # /stats deve refletir exatamente os mesmos usuários ativos conectados (sem ficar zerado)
    with patch("app.services.presence_service.get_online_user_ids", return_value={admin_id, student_id}):
        res_stats = client.get("/api/v1/presence/stats", headers=h_admin)

    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["total_online"] == 2
    assert stats["admins_online"] == 1
    assert stats["students_online"] == 1
