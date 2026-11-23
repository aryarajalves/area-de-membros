from tests.conftest import client, TestingSessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.chat import ChatMessage


def _get_token(email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_mark_all_chat_and_dms_as_read():
    db = TestingSessionLocal()
    try:
        sender = User(
            email="remetente@teste.com",
            name="Remetente",
            hashed_password=get_password_hash("Senha123!"),
            role="aluno",
            is_active=True,
        )
        db.add(sender)
        db.commit()
        db.refresh(sender)

        admin = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()
        db.add_all([
            ChatMessage(user_id=sender.id, channel_type="general", message="Oi canal"),
            ChatMessage(user_id=sender.id, recipient_id=admin.id, channel_type="dm", message="Oi DM", is_read=False),
        ])
        db.commit()
    finally:
        db.close()

    token = _get_token(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    summary_before = client.get("/api/v1/chat/unread-summary", headers={"Authorization": f"Bearer {token}"})
    assert summary_before.status_code == 200
    assert summary_before.json()["dm_unread"] == 1
    assert summary_before.json()["total_unread"] >= 2

    res_dms = client.post("/api/v1/chat/mark-all-read?scope=dms", headers={"Authorization": f"Bearer {token}"})
    assert res_dms.status_code == 200
    assert res_dms.json()["dm_unread"] == 0

    res_all = client.post("/api/v1/chat/mark-all-read?scope=all", headers={"Authorization": f"Bearer {token}"})
    assert res_all.status_code == 200
    assert res_all.json()["total_unread"] == 0
