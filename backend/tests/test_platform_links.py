import pytest
from app.core.security import get_password_hash
from app.models.user import User
from app.models.platform_link import PlatformLink
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def setup_platform_links_users():
    db = TestingSessionLocal()

    # Cria ou busca admin
    admin = db.query(User).filter(User.email == "admin_links@test.com").first()
    if not admin:
        admin = User(
            email="admin_links@test.com",
            name="Admin Links",
            role="admin",
            hashed_password=get_password_hash("Pass123!"),
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # Cria ou busca aluno
    aluno = db.query(User).filter(User.email == "aluno_links@test.com").first()
    if not aluno:
        aluno = User(
            email="aluno_links@test.com",
            name="Aluno Links",
            role="aluno",
            hashed_password=get_password_hash("Pass123!"),
            is_active=True
        )
        db.add(aluno)
        db.commit()
        db.refresh(aluno)

    # Limpar links existentes criados em testes anteriores
    db.query(PlatformLink).filter(PlatformLink.title.like("Teste%")).delete(synchronize_session=False)
    db.commit()

    user_ids = {"admin_id": admin.id, "aluno_id": aluno.id}
    db.close()
    return user_ids


def test_student_and_admin_list_links(setup_platform_links_users):
    db = TestingSessionLocal()
    # Cria um link ativo e um inativo de teste
    l_active = PlatformLink(
        title="Teste Instagram",
        url="https://instagram.com/test",
        icon="instagram",
        order_index=1,
        is_active=True
    )
    l_inactive = PlatformLink(
        title="Teste Oculto",
        url="https://youtube.com/hidden",
        icon="youtube",
        order_index=2,
        is_active=False
    )
    db.add_all([l_active, l_inactive])
    db.commit()
    db.close()

    headers_aluno = get_headers("aluno_links@test.com", "Pass123!")
    headers_admin = get_headers("admin_links@test.com", "Pass123!")

    # 1. Aluno só pode ver os links ativos
    res_aluno = client.get("/api/v1/platform-links", headers=headers_aluno)
    assert res_aluno.status_code == 200
    aluno_links = res_aluno.json()
    assert any(l["title"] == "Teste Instagram" for l in aluno_links)
    assert not any(l["title"] == "Teste Oculto" for l in aluno_links)

    # 2. Admin solicitando include_inactive=true vê todos os links
    res_admin = client.get("/api/v1/platform-links?include_inactive=true", headers=headers_admin)
    assert res_admin.status_code == 200
    admin_links = res_admin.json()
    assert any(l["title"] == "Teste Instagram" for l in admin_links)
    assert any(l["title"] == "Teste Oculto" for l in admin_links)


def test_create_update_and_delete_link(setup_platform_links_users):
    headers_admin = get_headers("admin_links@test.com", "Pass123!")
    headers_aluno = get_headers("aluno_links@test.com", "Pass123!")

    payload = {
        "title": "Teste Canal VIP",
        "url": "https://t.me/canalvip",
        "icon": "telegram",
        "order_index": 3,
        "is_active": True
    }

    # 1. Aluno não pode criar link (403)
    res_forbidden = client.post("/api/v1/platform-links", json=payload, headers=headers_aluno)
    assert res_forbidden.status_code == 403

    # 2. Admin cria com sucesso (201)
    res_create = client.post("/api/v1/platform-links", json=payload, headers=headers_admin)
    assert res_create.status_code == 201
    created_link = res_create.json()
    link_id = created_link["id"]
    assert created_link["title"] == "Teste Canal VIP"
    assert created_link["icon"] == "telegram"

    # 3. Admin atualiza o link (200)
    update_payload = {
        "title": "Teste Canal VIP Atualizado",
        "is_active": False
    }
    res_update = client.put(f"/api/v1/platform-links/{link_id}", json=update_payload, headers=headers_admin)
    assert res_update.status_code == 200
    updated_link = res_update.json()
    assert updated_link["title"] == "Teste Canal VIP Atualizado"
    assert updated_link["is_active"] is False

    # 4. Aluno não pode deletar link (403)
    res_del_forbidden = client.delete(f"/api/v1/platform-links/{link_id}", headers=headers_aluno)
    assert res_del_forbidden.status_code == 403

    # 5. Admin deleta link com sucesso (200)
    res_delete = client.delete(f"/api/v1/platform-links/{link_id}", headers=headers_admin)
    assert res_delete.status_code == 200

    # 6. Checagem de que foi removido
    res_check = client.get("/api/v1/platform-links?include_inactive=true", headers=headers_admin)
    assert not any(l["id"] == link_id for l in res_check.json())
