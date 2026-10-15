import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.user import User
from app.core.database import SessionLocal

def test_public_register_success():
    client = TestClient(app)
    db: Session = SessionLocal()
    email = "aluno_comunidade_novo@teste.com"
    try:
        # Garante limpeza prévia
        db.query(User).filter(User.email == email).delete()
        db.commit()

        payload = {
            "name": "Aluno Comunidade",
            "email": email,
            "password": "SenhaSegura123!@",
            "phone": "11988887777"
        }

        response = client.post("/api/v1/auth/public-register", json=payload)
        assert response.status_code == 201
        data = response.json()

        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["name"] == "Aluno Comunidade"
        assert data["user"]["email"] == email
        assert data["user"]["role"] == "aluno"
        assert data["user"]["course_ids"] == []
        assert data["user"]["course_access"] == []

        # Verifica se foi persistido no banco
        saved = db.query(User).filter(User.email == email).first()
        assert saved is not None
        assert saved.role == "aluno"
        assert saved.is_active is True
    finally:
        db.query(User).filter(User.email == email).delete()
        db.commit()
        db.close()

def test_public_register_duplicate_email():
    client = TestClient(app)
    db: Session = SessionLocal()
    email = "aluno_duplicado@teste.com"
    try:
        db.query(User).filter(User.email == email).delete()
        db.commit()

        payload = {
            "name": "Aluno Primeiro",
            "email": email,
            "password": "SenhaSegura123!@"
        }

        # Primeiro cadastro
        res1 = client.post("/api/v1/auth/public-register", json=payload)
        assert res1.status_code == 201

        # Segundo cadastro com o mesmo email
        res2 = client.post("/api/v1/auth/public-register", json=payload)
        assert res2.status_code == 400
        assert "Este e-mail já está cadastrado no sistema." in res2.json()["detail"]
    finally:
        db.query(User).filter(User.email == email).delete()
        db.commit()
        db.close()

def test_public_register_weak_password():
    client = TestClient(app)
    payload = {
        "name": "Aluno Senha Fraca",
        "email": "aluno_fraco@teste.com",
        "password": "123"
    }
    response = client.post("/api/v1/auth/public-register", json=payload)
    assert response.status_code == 422

def test_public_register_invalid_name():
    client = TestClient(app)
    payload = {
        "name": "A",
        "email": "aluno_curto@teste.com",
        "password": "SenhaSegura123!@"
    }
    response = client.post("/api/v1/auth/public-register", json=payload)
    assert response.status_code == 422

def test_public_register_with_ddi_phone():
    client = TestClient(app)
    db: Session = SessionLocal()
    email = "aluno_ddi_phone@teste.com"
    try:
        db.query(User).filter(User.email == email).delete()
        db.commit()

        payload = {
            "name": "Aluno Internacional",
            "email": email,
            "password": "SenhaSegura123!@",
            "phone": "+351 912 345 678"
        }

        response = client.post("/api/v1/auth/public-register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["email"] == email

        saved = db.query(User).filter(User.email == email).first()
        assert saved is not None
        assert saved.phone == "+351 912 345 678"
    finally:
        db.query(User).filter(User.email == email).delete()
        db.commit()
        db.close()

