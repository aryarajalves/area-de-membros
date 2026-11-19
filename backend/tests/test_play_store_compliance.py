from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from tests.conftest import TestingSessionLocal, client


def _make_user(email: str, name: str):
    db = TestingSessionLocal()
    try:
        user = User(
            email=email,
            name=name,
            hashed_password=get_password_hash("SenhaForte123!"),
            role="aluno",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_access_token(data={"sub": str(user.id), "role": user.role})
        return user.id, {"Authorization": f"Bearer {token}"}
    finally:
        db.close()


def test_user_block_lifecycle_and_dm_restriction():
    id_a, headers_a = _make_user("blocker_a@example.com", "Aluno A")
    id_b, headers_b = _make_user("blocked_b@example.com", "Aluno B")

    # Não pode bloquear a si mesmo
    self_res = client.post(f"/api/v1/blocks/{id_a}", headers=headers_a)
    assert self_res.status_code == 400

    # A bloqueia B
    blk_res = client.post(f"/api/v1/blocks/{id_b}", headers=headers_a)
    assert blk_res.status_code == 200
    assert blk_res.json()["status"] == "blocked"

    # Listagem de bloqueados
    list_res = client.get("/api/v1/blocks", headers=headers_a)
    assert list_res.status_code == 200
    assert len(list_res.json()["blocked_users"]) == 1
    assert list_res.json()["blocked_users"][0]["id"] == id_b

    # B tenta enviar DM para A -> bloqueado (403)
    dm_res = client.post(
        "/api/v1/chat/messages",
        json={"channel_type": "dm", "recipient_id": id_a, "message": "Oi"},
        headers=headers_b,
    )
    assert dm_res.status_code == 403

    # A desbloqueia B
    unblk_res = client.delete(f"/api/v1/blocks/{id_b}", headers=headers_a)
    assert unblk_res.status_code == 200
    assert unblk_res.json()["removed"] is True


def test_public_account_deletion_request_does_not_leak_email_existence():
    _make_user("titular_lgpd@example.com", "Titular LGPD")

    res_exists = client.post(
        "/api/v1/auth/public-account-deletion",
        json={"email": "titular_lgpd@example.com", "reason": "Não uso mais"},
    )
    assert res_exists.status_code == 200
    assert res_exists.json()["status"] == "received"

    res_missing = client.post(
        "/api/v1/auth/public-account-deletion",
        json={"email": "inexistente@example.com", "reason": ""},
    )
    assert res_missing.status_code == 200
    assert res_missing.json() == res_exists.json()


def test_blocked_user_hidden_from_introductions():
    from app.models.introduction import IntroductionPost

    id_a, headers_a = _make_user("intro_viewer@example.com", "Viewer")
    id_b, _ = _make_user("intro_blocked@example.com", "Spammer")

    db = TestingSessionLocal()
    try:
        db.add(IntroductionPost(user_id=id_b, title="Spam Intro", content="Conteúdo indesejado"))
        db.commit()
    finally:
        db.close()

    res_before = client.get("/api/v1/introductions", headers=headers_a)
    assert res_before.status_code == 200
    assert any(p["title"] == "Spam Intro" for p in res_before.json())

    client.post(f"/api/v1/blocks/{id_b}", headers=headers_a)
    res_after = client.get("/api/v1/introductions", headers=headers_a)
    assert res_after.status_code == 200
    assert not any(p["title"] == "Spam Intro" for p in res_after.json())
