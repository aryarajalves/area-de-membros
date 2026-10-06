import pytest
from datetime import datetime, timezone
from app.core.security import get_password_hash
from app.models.user import User
from app.models.gamification import GamificationPoint
from tests.conftest import TestingSessionLocal, client

def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def setup_gamification_student_test():
    db = TestingSessionLocal()

    admin = db.query(User).filter(User.email == "admin_gamif@test.com").first()
    if not admin:
        admin = User(
            name="Admin Gamif",
            email="admin_gamif@test.com",
            hashed_password=get_password_hash("Admin123456!"),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    aluno1 = db.query(User).filter(User.email == "aluno_gamif_1@test.com").first()
    if not aluno1:
        aluno1 = User(
            name="Aluno Gamif 1",
            email="aluno_gamif_1@test.com",
            hashed_password=get_password_hash("Aluno123456!"),
            role="aluno",
            is_active=True
        )
        db.add(aluno1)
        db.commit()
        db.refresh(aluno1)

    aluno2 = db.query(User).filter(User.email == "aluno_gamif_2@test.com").first()
    if not aluno2:
        aluno2 = User(
            name="Aluno Gamif 2",
            email="aluno_gamif_2@test.com",
            hashed_password=get_password_hash("Aluno123456!"),
            role="aluno",
            is_active=True
        )
        db.add(aluno2)
        db.commit()
        db.refresh(aluno2)

    # Inserir pontos para aluno1
    db.query(GamificationPoint).filter(GamificationPoint.user_id.in_([aluno1.id, aluno2.id])).delete()
    db.commit()

    p1 = GamificationPoint(
        user_id=aluno1.id,
        action="lesson_completed",
        points=15,
        description="Aula Concluída: Introdução",
        created_at=datetime.now(timezone.utc)
    )
    p2 = GamificationPoint(
        user_id=aluno1.id,
        action="support_solution",
        points=50,
        description="Melhor Solução no Suporte",
        created_at=datetime.now(timezone.utc)
    )
    db.add_all([p1, p2])
    db.commit()

    data = {
        "admin_headers": get_headers("admin_gamif@test.com", "Admin123456!"),
        "aluno1_headers": get_headers("aluno_gamif_1@test.com", "Aluno123456!"),
        "aluno2_headers": get_headers("aluno_gamif_2@test.com", "Aluno123456!"),
        "aluno1_id": aluno1.id,
        "aluno2_id": aluno2.id,
    }

    yield data

    db.query(GamificationPoint).filter(GamificationPoint.user_id.in_([aluno1.id, aluno2.id])).delete()
    db.commit()
    db.close()

def test_admin_can_view_student_gamification_history(setup_gamification_student_test):
    data = setup_gamification_student_test
    res = client.get(
        f"/api/v1/students/{data['aluno1_id']}/gamification-history",
        headers=data["admin_headers"]
    )
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["student_id"] == data["aluno1_id"]
    assert json_data["total_points"] == 65
    assert json_data["current_rank"] == 1
    assert "🥇 Mestre da Comunidade" in json_data["badge"]
    assert len(json_data["history"]) == 2
    assert any(h["points"] == 50 for h in json_data["history"])
    assert any(h["points"] == 15 for h in json_data["history"])

def test_student_can_view_own_history_but_not_others(setup_gamification_student_test):
    data = setup_gamification_student_test

    # Aluno 1 acessa seu próprio histórico -> OK
    res_own = client.get(
        f"/api/v1/students/{data['aluno1_id']}/gamification-history",
        headers=data["aluno1_headers"]
    )
    assert res_own.status_code == 200

    # Aluno 2 tenta acessar histórico do Aluno 1 -> 403 Forbidden
    res_other = client.get(
        f"/api/v1/students/{data['aluno1_id']}/gamification-history",
        headers=data["aluno2_headers"]
    )
    assert res_other.status_code == 403
