import hashlib
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

    # Validação de segurança: o token no banco NÃO pode estar em texto puro
    db = SessionLocal()
    token_record = db.query(ApiToken).filter(ApiToken.id == token_id).first()
    assert token_record.token != raw_token, "O token de API não pode ser salvo em texto puro no banco de dados!"
    expected_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    assert token_record.token == expected_hash, "O token de API deve ser salvo como hash SHA-256 no banco de dados!"
    db.close()

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


def test_legacy_api_token_automatic_upgrade_to_sha256(auth_headers):
    """
    Testa retrocompatibilidade com tokens legados que estavam salvos em texto claro.
    Ao realizar a primeira autenticação, a chave deve ser atualizada transparentemente
    para hash SHA-256 no banco de dados.
    """
    db = SessionLocal()
    user = db.query(User).filter(User.role == "superadmin").first()
    plain_token = "sk_live_legacy_plain_token_1234567890abcdef"
    legacy_token = ApiToken(
        user_id=user.id,
        name="Token Legado em Texto Puro",
        token=plain_token,
        masked_token="sk_live_••••••••cdef",
        is_active=True
    )
    db.add(legacy_token)
    db.commit()
    db.refresh(legacy_token)
    token_id = legacy_token.id
    db.close()

    # Autentica com o token legado
    res = client.get("/api/v1/auth/me", headers={"X-API-Key": plain_token})
    assert res.status_code == 200

    # Verifica se no banco o token foi automaticamente migrado para hash SHA-256
    db = SessionLocal()
    migrated_record = db.query(ApiToken).filter(ApiToken.id == token_id).first()
    expected_hash = hashlib.sha256(plain_token.encode("utf-8")).hexdigest()
    assert migrated_record.token == expected_hash
    db.delete(migrated_record)
    db.commit()
    db.close()
