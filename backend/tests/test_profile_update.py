import io
import pytest
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from tests.conftest import TestingSessionLocal, client

def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def seed_users():
    db = TestingSessionLocal()
    admin = User(
        email="admin_profile@test.com",
        name="Admin Teste",
        role="admin",
        hashed_password=get_password_hash("AdminPass12345!"),
        is_active=True,
        phone="11999999999"
    )
    db.add(admin)
    db.commit()
    db.close()

def test_superadmin_can_update_avatar_only():
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    # 1. Super Admin pode alterar a foto/avatar com sucesso
    res = client.patch("/api/v1/auth/me", json={"avatar_url": "https://cdn.test.com/super_avatar.png"}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["avatar_url"] == "https://cdn.test.com/super_avatar.png"
    assert data["name"] == settings.SUPERADMIN_NAME

def test_superadmin_blocked_from_updating_name_email_password():
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    # Tenta alterar nome
    res_name = client.patch("/api/v1/auth/me", json={"name": "Novo Nome Proibido"}, headers=headers)
    assert res_name.status_code == 400
    assert "Super Admin não pode alterar nome, email ou senha" in res_name.json()["detail"]

    # Tenta alterar email
    res_email = client.patch("/api/v1/auth/me", json={"email": "outro_email_sa@test.com"}, headers=headers)
    assert res_email.status_code == 400
    assert "Super Admin não pode alterar nome, email ou senha" in res_email.json()["detail"]

    # Tenta alterar senha
    res_pw = client.patch("/api/v1/auth/me", json={"password": "NovaSenhaForte123!"}, headers=headers)
    assert res_pw.status_code == 400
    assert "Super Admin não pode alterar nome, email ou senha" in res_pw.json()["detail"]

def test_normal_admin_can_update_profile_and_password(seed_users):
    headers = get_headers("admin_profile@test.com", "AdminPass12345!")

    payload = {
        "name": "Admin Atualizado Silva",
        "phone": "11988887777",
        "avatar_url": "https://cdn.test.com/admin_avatar.jpg",
        "password": "NovaSenhaSegura123!"
    }
    res = client.patch("/api/v1/auth/me", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Admin Atualizado Silva"
    assert data["phone"] == "11988887777"
    assert data["avatar_url"] == "https://cdn.test.com/admin_avatar.jpg"

    # Valida login com a nova senha
    res_login = client.post("/api/v1/auth/login", json={
        "email": "admin_profile@test.com",
        "password": "NovaSenhaSegura123!"
    })
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()

def test_upload_avatar_endpoint(seed_users):
    headers = get_headers("admin_profile@test.com", "AdminPass12345!")

    # Mock de upload de imagem PNG de 1x1 pixel
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
    files = {"file": ("avatar_test.png", io.BytesIO(fake_png), "image/png")}

    res = client.post("/api/v1/auth/upload-avatar", files=files, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "avatar_url" in data
    assert data["avatar_url"].endswith(".png")
    assert data["user"]["avatar_url"] == data["avatar_url"]
