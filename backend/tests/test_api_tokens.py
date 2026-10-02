import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.api_token import ApiToken
from app.core.database import SessionLocal

client = TestClient(app)

@pytest.fixture
def auth_headers():
    db = SessionLocal()
    user = db.query(User).filter(User.role == "superadmin").first()
    if not user:
        from app.core.security import get_password_hash
        user = User(
            email="admin_token_test@test.com",
            name="Admin Token Test",
            role="superadmin",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    from app.core.security import create_access_token
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    db.close()
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list_api_tokens(auth_headers):
    # 1. Cria um novo token de API
    create_payload = {
        "name": "Token Automação n8n",
        "expiration_days": 30
    }
    res_create = client.post("/api/v1/api-tokens", json=create_payload, headers=auth_headers)
    assert res_create.status_code == 201
    data = res_create.json()
    assert data["name"] == "Token Automação n8n"
    assert data["raw_token"].startswith("sk_live_")
    assert "masked_token" in data
    assert data["is_active"] is True
    token_id = data["id"]
    raw_token = data["raw_token"]

    # 2. Lista os tokens e valida se está presente
    res_list = client.get("/api/v1/api-tokens", headers=auth_headers)
    assert res_list.status_code == 200
    items = res_list.json()
    assert any(t["id"] == token_id for t in items)

    # 3. Testa autenticação direta usando a API Key gerada via Bearer Token
    res_me_bearer = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {raw_token}"})
    assert res_me_bearer.status_code == 200
    assert "email" in res_me_bearer.json()

    # 4. Testa autenticação direta usando o header X-API-Key
    res_me_header = client.get("/api/v1/auth/me", headers={"X-API-Key": raw_token})
    assert res_me_header.status_code == 200

    # 5. Alterna status (desativa)
    res_toggle = client.patch(f"/api/v1/api-tokens/{token_id}/toggle", headers=auth_headers)
    assert res_toggle.status_code == 200
    assert res_toggle.json()["is_active"] is False

    # 6. Com token desativado, tentativa de uso deve retornar 401
    res_blocked = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {raw_token}"})
    assert res_blocked.status_code == 401

    # 7. Exclui/revoga o token
    res_del = client.delete(f"/api/v1/api-tokens/{token_id}", headers=auth_headers)
    assert res_del.status_code == 200
