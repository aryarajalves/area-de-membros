import pytest
from tests.conftest import client, TestingSessionLocal
from app.models.user import User
from app.models.webhook import Webhook
from app.core.config import settings
from app.core.encryption import ENCRYPTION_PREFIX, encrypt_field, decrypt_field

def get_admin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_webhook_secret_key_encryption_at_rest():
    """
    Testa se o segredo do webhook é encriptado com Fernet (enc:v1:...) ao salvar no banco
    e descriptografado transparentemente ao responder para o administrador ou despachar evento.
    """
    headers = get_admin_headers()
    plain_secret = "meu_segredo_super_confidencial_webhook_999"

    # 1. Criação do webhook com chave secreta
    payload = {
        "name": "Webhook Seguro com Segredo Criptografado",
        "url": "https://meu-endpoint.com/webhook",
        "events": ["course.progress.100"],
        "secret_key": plain_secret,
        "is_active": True
    }
    create_res = client.post("/api/v1/integrations", json=payload, headers=headers)
    assert create_res.status_code == 201
    created_data = create_res.json()
    webhook_id = created_data["id"]

    # Na resposta para o admin, o segredo descriptografado deve estar legível
    assert created_data["secret_key"] == plain_secret

    # 2. No banco de dados em repouso, o segredo DEVE estar cifrado com enc:v1:
    db = TestingSessionLocal()
    webhook_row = db.query(Webhook).filter(Webhook.id == webhook_id).first()
    assert webhook_row is not None
    assert webhook_row.secret_key != plain_secret, "O segredo do webhook não pode estar em texto puro no banco!"
    assert webhook_row.secret_key.startswith(ENCRYPTION_PREFIX), f"Deveria começar com '{ENCRYPTION_PREFIX}' mas foi '{webhook_row.secret_key}'"

    # A função de descriptografia deve recuperar o valor exato original
    decrypted = decrypt_field(webhook_row.secret_key)
    assert decrypted == plain_secret

    # 3. Atualização do webhook mantendo chave ou alterando
    update_res = client.put(
        f"/api/v1/integrations/{webhook_id}",
        json={"name": "Webhook Atualizado", "secret_key": "novo_segredo_123"},
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["secret_key"] == "novo_segredo_123"

    db.refresh(webhook_row)
    assert webhook_row.secret_key.startswith(ENCRYPTION_PREFIX)
    assert decrypt_field(webhook_row.secret_key) == "novo_segredo_123"

    # Limpeza
    db.delete(webhook_row)
    db.commit()
    db.close()


def test_security_http_headers_present():
    """
    Testa se as respostas da API contêm os cabeçalhos de segurança HTTP recomendados pela OWASP.
    """
    res = client.get("/health")
    assert res.status_code == 200
    headers = res.headers

    assert headers.get("x-frame-options") == "SAMEORIGIN"
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "permissions-policy" in headers
