import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.models.user import User, Invite, RegistrationVerification
from app.core.config import settings
from tests.conftest import TestingSessionLocal, client

def get_superadmin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_register_and_verification_attempts_tracking():
    headers = get_superadmin_headers()

    # 1. Cria convite de aluno
    res_inv = client.post("/api/v1/auth/invites", json={
        "role": "aluno",
        "duration_hours": 1
    }, headers=headers)
    assert res_inv.status_code == 201
    token = res_inv.json()["token"]

    # 2. Inicia registro
    email = "aluno_tentativas@teste.com"
    res_reg = client.post("/api/v1/auth/register", json={
        "token": token,
        "name": "Aluno Tentativas",
        "email": email,
        "phone": "+55 (11) 99999-8888",
        "password": "Password123!@#",
        "password_confirm": "Password123!@#"
    })
    assert res_reg.status_code == 200
    assert res_reg.json()["requires_verification"] is True

    # 3. Verifica no banco se o registro foi salvo com attempts = 0
    db = TestingSessionLocal()
    verif = db.query(RegistrationVerification).filter_by(email=email, is_used=False).first()
    assert verif is not None
    assert verif.attempts == 0
    correct_code = verif.code
    db.close()

    # 4. Envia código incorreto (deve incrementar attempts)
    res_fail = client.post("/api/v1/auth/register/verify", json={
        "email": email,
        "code": "000000"
    })
    assert res_fail.status_code == 400
    assert "Código de verificação inválido" in res_fail.json()["detail"]

    db = TestingSessionLocal()
    verif = db.query(RegistrationVerification).filter_by(email=email, is_used=False).first()
    assert verif.attempts == 1
    db.close()

    # 5. Mais 4 tentativas erradas para atingir o limite de 5
    for i in range(2, 6):
        res_fail = client.post("/api/v1/auth/register/verify", json={
            "email": email,
            "code": f"00000{i}"
        })
        assert res_fail.status_code == 400

    # 6. Tentativa adicional após atingir limite (deve ser bloqueada)
    res_blocked = client.post("/api/v1/auth/register/verify", json={
        "email": email,
        "code": correct_code
    })
    assert res_blocked.status_code == 400
    assert "Número de tentativas excedido" in res_blocked.json()["detail"]
