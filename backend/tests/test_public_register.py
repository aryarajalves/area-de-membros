from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.user import User, RegistrationVerification
from app.core.database import SessionLocal


def _cleanup_email(db: Session, email: str):
    db.query(RegistrationVerification).filter(RegistrationVerification.email == email).delete()
    db.query(User).filter(User.email == email).delete()
    db.commit()


def test_public_register_success():
    client = TestClient(app)
    db: Session = SessionLocal()
    email = "aluno_comunidade_novo@teste.com"
    try:
        _cleanup_email(db, email)

        payload = {
            "name": "Aluno Comunidade",
            "email": email,
            "password": "SenhaSegura123!@",
            "phone": "11988887777",
        }

        response = client.post("/api/v1/auth/public-register", json=payload)
        assert response.status_code == 200
        init_data = response.json()
        assert init_data["requires_verification"] is True
        assert init_data["email"] == email

        # Usuário ainda não deve existir antes de clicar no botão do e-mail
        assert db.query(User).filter(User.email == email).first() is None

        verif = (
            db.query(RegistrationVerification)
            .filter(RegistrationVerification.email == email, RegistrationVerification.is_used == False)
            .first()
        )
        assert verif is not None
        assert verif.verification_token is not None

        # Simula clique no botão do e-mail (/verify-email?token=...)
        confirm_res = client.post(
            "/api/v1/auth/register/verify-link",
            json={"token": verif.verification_token},
        )
        assert confirm_res.status_code == 200
        data = confirm_res.json()

        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["name"] == "Aluno Comunidade"
        assert data["user"]["email"] == email
        assert data["user"]["role"] == "aluno"
        assert data["user"]["course_ids"] == []
        assert data["user"]["course_access"] == []

        saved = db.query(User).filter(User.email == email).first()
        assert saved is not None
        assert saved.role == "aluno"
        assert saved.is_active is True
    finally:
        _cleanup_email(db, email)
        db.close()


def test_public_register_duplicate_email():
    client = TestClient(app)
    db: Session = SessionLocal()
    email = "aluno_duplicado@teste.com"
    try:
        _cleanup_email(db, email)

        payload = {
            "name": "Aluno Primeiro",
            "email": email,
            "password": "SenhaSegura123!@",
        }

        res1 = client.post("/api/v1/auth/public-register", json=payload)
        assert res1.status_code == 200
        verif = (
            db.query(RegistrationVerification)
            .filter(RegistrationVerification.email == email, RegistrationVerification.is_used == False)
            .first()
        )
        confirm = client.post("/api/v1/auth/register/verify-link", json={"token": verif.verification_token})
        assert confirm.status_code == 200

        res2 = client.post("/api/v1/auth/public-register", json=payload)
        assert res2.status_code == 400
        assert "Este e-mail já está cadastrado no sistema." in res2.json()["detail"]
    finally:
        _cleanup_email(db, email)
        db.close()


def test_public_register_weak_password():
    client = TestClient(app)
    payload = {
        "name": "Aluno Senha Fraca",
        "email": "aluno_fraco@teste.com",
        "password": "123",
    }
    response = client.post("/api/v1/auth/public-register", json=payload)
    assert response.status_code == 422


def test_public_register_invalid_name():
    client = TestClient(app)
    payload = {
        "name": "A",
        "email": "aluno_curto@teste.com",
        "password": "SenhaSegura123!@",
    }
    response = client.post("/api/v1/auth/public-register", json=payload)
    assert response.status_code == 422


def test_public_register_with_ddi_phone():
    client = TestClient(app)
    db: Session = SessionLocal()
    email = "aluno_ddi_phone@teste.com"
    try:
        _cleanup_email(db, email)

        payload = {
            "name": "Aluno Internacional",
            "email": email,
            "password": "SenhaSegura123!@",
            "phone": "+351 912 345 678",
        }

        response = client.post("/api/v1/auth/public-register", json=payload)
        assert response.status_code == 200

        verif = (
            db.query(RegistrationVerification)
            .filter(RegistrationVerification.email == email, RegistrationVerification.is_used == False)
            .first()
        )
        confirm_res = client.post("/api/v1/auth/register/verify-link", json={"token": verif.verification_token})
        assert confirm_res.status_code == 200
        data = confirm_res.json()
        assert data["user"]["email"] == email

        saved = db.query(User).filter(User.email == email).first()
        assert saved is not None
        assert saved.phone == "+351 912 345 678"
    finally:
        _cleanup_email(db, email)
        db.close()


def test_public_register_expired_and_reused_link():
    client = TestClient(app)
    db: Session = SessionLocal()
    email = "aluno_expirado@teste.com"
    try:
        _cleanup_email(db, email)

        res = client.post(
            "/api/v1/auth/public-register",
            json={"name": "Aluno Expirado", "email": email, "password": "SenhaSegura123!@"},
        )
        assert res.status_code == 200

        verif = (
            db.query(RegistrationVerification)
            .filter(RegistrationVerification.email == email, RegistrationVerification.is_used == False)
            .first()
        )
        # Simula expiração (> 30 minutos)
        verif.expires_at = datetime.now(timezone.utc) - timedelta(minutes=31)
        db.commit()

        expired_res = client.post("/api/v1/auth/register/verify-link", json={"token": verif.verification_token})
        assert expired_res.status_code == 400
        assert "expirou" in expired_res.json()["detail"].lower()

        # Reenvia novo e-mail (gera novo token válido por 30 min)
        resend_res = client.post("/api/v1/auth/register/resend-code", json={"email": email})
        assert resend_res.status_code == 200
        db.refresh(verif)

        ok_res = client.post("/api/v1/auth/register/verify-link", json={"token": verif.verification_token})
        assert ok_res.status_code == 200
        assert "access_token" in ok_res.json()

        # Reutilizar o mesmo link deve falhar
        reuse_res = client.post("/api/v1/auth/register/verify-link", json={"token": verif.verification_token})
        assert reuse_res.status_code == 400
        assert "já foi utilizado" in reuse_res.json()["detail"].lower()
    finally:
        _cleanup_email(db, email)
        db.close()
