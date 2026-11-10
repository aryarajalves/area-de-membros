import pytest
from datetime import date
from fastapi.testclient import TestClient
from app.models.user import User
from app.core.config import settings
from tests.conftest import TestingSessionLocal, client

def get_superadmin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_update_profile_birth_date():
    headers = get_superadmin_headers()

    # 1. Atualiza birth_date para o Super Admin
    res = client.patch("/api/v1/auth/me", json={
        "birth_date": "1995-07-25"
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["birth_date"] == "1995-07-25"

    # 2. Busca perfil via GET /me
    res_me = client.get("/api/v1/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["birth_date"] == "1995-07-25"

    # 3. Limpa birth_date enviando None
    res_clear = client.patch("/api/v1/auth/me", json={
        "birth_date": None
    }, headers=headers)
    assert res_clear.status_code == 200
    assert res_clear.json()["birth_date"] is None
