from unittest.mock import MagicMock, patch

from app.core.security import create_access_token, get_password_hash
from app.models.push_token import UserDeviceToken
from app.models.user import User
from app.services import push_notification_service
from tests.conftest import TestingSessionLocal, client


def _create_user_and_token(email: str, name: str = "Aluno Teste", role: str = "aluno"):
    db = TestingSessionLocal()
    try:
        user = User(
            email=email,
            name=name,
            hashed_password=get_password_hash("SenhaForte123!"),
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_access_token(data={"sub": str(user.id), "role": user.role})
        return user.id, {"Authorization": f"Bearer {token}"}
    finally:
        db.close()


def test_push_endpoints_require_authentication():
    res_status = client.get("/api/v1/push/status")
    assert res_status.status_code == 401

    res_reg = client.post("/api/v1/push/register", json={"fcm_token": "fcm_token_exemplo_123456"})
    assert res_reg.status_code == 401


def test_register_status_and_unregister_push_token():
    user_id, headers = _create_user_and_token("push_aluno1@example.com")

    reg_res = client.post(
        "/api/v1/push/register",
        json={"fcm_token": "fcm_device_token_abc_123456", "platform": "android", "device_name": "Pixel 8"},
        headers=headers,
    )
    assert reg_res.status_code == 200
    data = reg_res.json()
    assert data["status"] == "registered"
    assert data["platform"] == "android"

    status_res = client.get("/api/v1/push/status", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["active_devices_count"] == 1

    # Re-registrar o mesmo token não duplica registro
    reg_res_2 = client.post(
        "/api/v1/push/register",
        json={"fcm_token": "fcm_device_token_abc_123456", "platform": "android"},
        headers=headers,
    )
    assert reg_res_2.status_code == 200
    assert client.get("/api/v1/push/status", headers=headers).json()["active_devices_count"] == 1

    del_res = client.request(
        "DELETE",
        "/api/v1/push/unregister",
        json={"fcm_token": "fcm_device_token_abc_123456"},
        headers=headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["removed"] is True
    assert client.get("/api/v1/push/status", headers=headers).json()["active_devices_count"] == 0


def test_cannot_unregister_another_users_token_idor():
    _, headers_a = _create_user_and_token("push_user_a@example.com")
    _, headers_b = _create_user_and_token("push_user_b@example.com")

    client.post(
        "/api/v1/push/register",
        json={"fcm_token": "fcm_token_exclusivo_user_a_999", "platform": "android"},
        headers=headers_a,
    )

    del_res = client.request(
        "DELETE",
        "/api/v1/push/unregister",
        json={"fcm_token": "fcm_token_exclusivo_user_a_999"},
        headers=headers_b,
    )
    assert del_res.status_code == 200
    assert del_res.json()["removed"] is False
    assert client.get("/api/v1/push/status", headers=headers_a).json()["active_devices_count"] == 1


def test_send_push_to_user_handles_mocked_fcm_and_stale_tokens():
    user_id, _ = _create_user_and_token("push_sender@example.com")
    db = TestingSessionLocal()
    try:
        push_notification_service.register_device_token(db, user_id, "fcm_valid_token_123456", "android")
        push_notification_service.register_device_token(db, user_id, "fcm_stale_token_123456", "android")

        class FakeUnregisteredError(Exception):
            pass

        def fake_send(msg):
            if msg.token == "fcm_stale_token_123456":
                raise FakeUnregisteredError("Requested entity was not found.")
            return "projects/test/messages/1"

        with patch.object(push_notification_service, "_ensure_firebase_initialized", return_value=True), \
             patch.object(push_notification_service.messaging, "send", side_effect=fake_send):
            sent = push_notification_service.send_push_to_user(
                db=db,
                user_id=user_id,
                title="Nova mensagem",
                body="Olá!",
                data={"type": "dm"},
            )

        assert sent == 1
        stale_row = db.query(UserDeviceToken).filter(UserDeviceToken.fcm_token == "fcm_stale_token_123456").first()
        valid_row = db.query(UserDeviceToken).filter(UserDeviceToken.fcm_token == "fcm_valid_token_123456").first()
        assert stale_row.is_active is False
        assert valid_row.is_active is True
    finally:
        db.close()
