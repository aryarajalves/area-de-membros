import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
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
            name="Aluno WhiteLabel Test",
            email="alunowhitelabel@teste.com",
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


def test_get_whitelabel_is_public():
    # Não exige token
    res = client.get("/api/v1/whitelabel")
    assert res.status_code == 200
    data = res.json()
    assert "platform_name" in data
    assert "bg_color" in data


def test_student_cannot_update_whitelabel(student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    payload = {"platform_name": "Invasão de Nome"}
    res = client.patch("/api/v1/whitelabel", json=payload, headers=headers)
    assert res.status_code == 403


def test_superadmin_can_update_whitelabel_name(superadmin_token):
    headers = {"Authorization": f"Bearer {superadmin_token}"}

    # 1. Altera nome
    payload = {"platform_name": "Portal do Aluno VIP"}
    res = client.patch("/api/v1/whitelabel", json=payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["platform_name"] == "Portal do Aluno VIP"

    # 2. Confirma leitura pública
    pub_res = client.get("/api/v1/whitelabel")
    assert pub_res.status_code == 200
    assert pub_res.json()["platform_name"] == "Portal do Aluno VIP"

    # 3. Restaura para Área de Membros
    restore_res = client.patch("/api/v1/whitelabel", json={"platform_name": "Área de Membros"}, headers=headers)
    assert restore_res.status_code == 200
    assert restore_res.json()["platform_name"] == "Área de Membros"


def test_upload_login_banner_and_reset(superadmin_token):
    headers = {"Authorization": f"Bearer {superadmin_token}"}

    # Simula imagem PNG
    file_bytes = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82")
    files = {"file": ("banner_teste.png", file_bytes, "image/png")}

    upload_res = client.post("/api/v1/whitelabel/login-banner", files=files, headers=headers)
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert data["login_banner_url"] is not None
    assert "banner" in data["login_banner_url"].lower()

    # Reseta banner
    reset_res = client.delete("/api/v1/whitelabel/login-banner", headers=headers)
    assert reset_res.status_code == 200
    assert reset_res.json()["login_banner_url"] is None
