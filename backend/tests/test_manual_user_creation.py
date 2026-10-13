import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.models.course import Course, UserCourse
from app.core.database import SessionLocal

@pytest.fixture
def superadmin_token():
    return create_access_token(data={"sub": "1", "role": "superadmin"})

@pytest.fixture
def regular_user_token():
    db = SessionLocal()
    aluno = User(
        email="aluno_runner_test@teste.com",
        name="Aluno Teste Runner",
        hashed_password=get_password_hash("senha123"),
        role="aluno",
        is_active=True
    )
    db.add(aluno)
    db.commit()
    db.refresh(aluno)
    token = create_access_token(data={"sub": str(aluno.id), "role": "aluno"})
    db.close()
    return token

def test_create_user_manual_success(superadmin_token):
    client = TestClient(app)
    db: Session = SessionLocal()
    try:
        # Cria um curso de teste para vincular
        course = Course(title="Curso Manual Teste", description="Desc")
        db.add(course)
        db.commit()
        db.refresh(course)

        payload = {
            "name": "Aluno Manual Criado",
            "email": "manual_novo_aluno@teste.com",
            "phone": "+55 11 98765-4321",
            "password": "SenhaSegura123!",
            "role": "aluno",
            "course_ids": [course.id],
            "course_access": [
                {"course_id": course.id, "access_duration": "1_year"}
            ]
        }

        response = client.post(
            "/api/v1/auth/users",
            json=payload,
            headers={"Authorization": f"Bearer {superadmin_token}"}
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "manual_novo_aluno@teste.com"
        assert data["name"] == "Aluno Manual Criado"
        assert data["role"] == "aluno"
        assert data["is_active"] is True
        assert course.id in data["course_ids"]

        # Valida persistência direta no banco
        created_user = db.query(User).filter(User.email == "manual_novo_aluno@teste.com").first()
        assert created_user is not None
        assert created_user.is_active is True
        assert created_user.phone == "+55 11 98765-4321"

        # Limpa dados do teste
        db.query(UserCourse).filter(UserCourse.user_id == created_user.id).delete()
        db.delete(created_user)
        db.delete(course)
        db.commit()
    finally:
        db.close()

def test_create_user_manual_duplicate_email(superadmin_token):
    client = TestClient(app)
    db: Session = SessionLocal()
    try:
        # Garante usuário existente
        existing = User(
            email="duplicado_teste@teste.com",
            name="Usuario Existente",
            hashed_password=get_password_hash("senha123"),
            role="aluno",
            is_active=True
        )
        db.add(existing)
        db.commit()

        payload = {
            "name": "Tentativa Duplicada",
            "email": "duplicado_teste@teste.com",
            "password": "SenhaSegura123!",
            "role": "aluno"
        }

        response = client.post(
            "/api/v1/auth/users",
            json=payload,
            headers={"Authorization": f"Bearer {superadmin_token}"}
        )

        assert response.status_code == 400
        assert "já está cadastrado" in response.json()["detail"]

        db.delete(existing)
        db.commit()
    finally:
        db.close()

def test_create_user_manual_requires_superadmin(regular_user_token):
    client = TestClient(app)
    payload = {
        "name": "Invasor",
        "email": "invasor@teste.com",
        "password": "SenhaSegura123!",
        "role": "admin"
    }

    response = client.post(
        "/api/v1/auth/users",
        json=payload,
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )

    assert response.status_code == 403

@pytest.mark.parametrize("invalid_password,expected_error", [
    ("Curta123!", "A senha deve ter no mínimo 12 caracteres."),
    ("semmaiuscula123!", "A senha deve conter ao menos 1 letra maiúscula."),
    ("SEMMINUSCULA123!", "A senha deve conter ao menos 1 letra minúscula."),
    ("SenhaSemNumero!!", "A senha deve conter ao menos 1 número."),
    ("SenhaSemEspecial123", "A senha deve conter ao menos 1 caractere especial."),
])
def test_create_user_manual_password_requirements(superadmin_token, invalid_password, expected_error):
    client = TestClient(app)
    payload = {
        "name": "Teste Senha Invalida",
        "email": f"senha_{abs(hash(invalid_password))}@teste.com",
        "password": invalid_password,
        "role": "aluno"
    }

    response = client.post(
        "/api/v1/auth/users",
        json=payload,
        headers={"Authorization": f"Bearer {superadmin_token}"}
    )

    assert response.status_code in [400, 422]
    detail = response.json().get("detail", "")
    detail_str = str(detail)
    assert expected_error in detail_str
