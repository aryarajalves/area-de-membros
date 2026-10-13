import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.tutorial import Tutorial
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def superadmin_token():
    db = SessionLocal()
    user = db.query(User).filter(User.role == "superadmin").first()
    db.close()
    if not user:
        pytest.skip("Superadmin não encontrado")
    return create_access_token(data={"sub": str(user.id), "role": user.role})


@pytest.fixture
def student_token():
    db = SessionLocal()
    user = db.query(User).filter(User.role == "aluno").first()
    if not user:
        user = User(
            name="Aluno Tutorial Test",
            email="alunotutorial@teste.com",
            hashed_password="hashed_pwd",
            role="aluno",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    db.close()
    return token


def test_list_tutorials_accessible_by_student(student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.get("/api/v1/tutorials", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_student_cannot_create_tutorial(student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    payload = {
        "title": "Tutorial Aluno Hack",
        "video_url": "https://exemplo.com/hack.mp4",
        "description": "Não deve ser permitido",
    }
    response = client.post("/api/v1/tutorials", json=payload, headers=headers)
    assert response.status_code == 403


def test_crud_tutorial_lifecycle(superadmin_token, student_token):
    headers_admin = {"Authorization": f"Bearer {superadmin_token}"}
    headers_student = {"Authorization": f"Bearer {student_token}"}

    # 1. Cria tutorial
    payload = {
        "title": "Como Navegar na Plataforma",
        "description": "Aprenda a acessar as aulas e marcar seu progresso.",
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "duration": "03:45",
        "order_index": 1,
    }
    create_res = client.post("/api/v1/tutorials", json=payload, headers=headers_admin)
    assert create_res.status_code == 201
    created = create_res.json()
    tutorial_id = created["id"]
    assert created["title"] == "Como Navegar na Plataforma"

    # 2. Aluno visualiza na listagem
    list_res = client.get("/api/v1/tutorials", headers=headers_student)
    assert list_res.status_code == 200
    tutorials = list_res.json()
    assert any(t["id"] == tutorial_id for t in tutorials)

    # 3. Atualiza tutorial
    update_payload = {
        "title": "Como Navegar na Plataforma (Atualizado)",
        "duration": "04:10",
    }
    update_res = client.put(f"/api/v1/tutorials/{tutorial_id}", json=update_payload, headers=headers_admin)
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Como Navegar na Plataforma (Atualizado)"
    assert update_res.json()["duration"] == "04:10"

    # 4. Deleta tutorial
    del_res = client.delete(f"/api/v1/tutorials/{tutorial_id}", headers=headers_admin)
    assert del_res.status_code == 200

    # 5. Verifica se não está mais na lista
    list_res_after = client.get("/api/v1/tutorials", headers=headers_student)
    assert not any(t["id"] == tutorial_id for t in list_res_after.json())
