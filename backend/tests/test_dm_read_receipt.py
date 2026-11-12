import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.chat import ChatMessage
from app.api.v1.endpoints.users import get_current_user
from app.services.chat_encryption_service import encrypt_dm_message
from tests.conftest import TestingSessionLocal

client = TestClient(app)


@pytest.fixture
def dm_users():
    db = TestingSessionLocal()
    try:
        sender = User(
            email="sender_receipt@test.com",
            name="Remetente DM",
            hashed_password="fakehashedpassword",
            role="superadmin",
            is_active=True,
        )
        recipient = User(
            email="recipient_receipt@test.com",
            name="Destinatario DM",
            hashed_password="fakehashedpassword",
            role="aluno",
            is_active=True,
        )
        db.add_all([sender, recipient])
        db.commit()
        db.refresh(sender)
        db.refresh(recipient)
        return {"sender": sender, "recipient": recipient}
    finally:
        db.close()


def test_dm_read_receipt_marking_and_response(dm_users):
    """
    Valida se ao enviar uma DM ela começa como is_read=False e, quando o destinatário
    abre o histórico, a mensagem é marcada como is_read=True com read_at preenchido.
    """
    sender = dm_users["sender"]
    recipient = dm_users["recipient"]

    db = TestingSessionLocal()
    try:
        # 1. Cria mensagem enviada pelo sender para recipient
        msg = ChatMessage(
            channel_type="dm",
            user_id=sender.id,
            recipient_id=recipient.id,
            message=encrypt_dm_message("Olá, seu relato foi atendido!"),
            is_read=False,
            read_at=None,
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        msg_id = msg.id

        # 2. Sender consulta histórico de mensagens com recipient
        app.dependency_overrides[get_current_user] = lambda: sender
        res_sender = client.get(f"/api/v1/chat/dm/messages/{recipient.id}")
        assert res_sender.status_code == 200, f"Erro: {res_sender.status_code} - {res_sender.text}"
        msgs_sender = res_sender.json()
        assert len(msgs_sender) >= 1
        target_sender = next(m for m in msgs_sender if m["id"] == msg_id)
        # Ainda não lida pelo destinatário
        assert target_sender["is_read"] is False
        assert target_sender["read_at"] is None

        # 3. Destinatário abre a conversa (marcando como lida)
        app.dependency_overrides[get_current_user] = lambda: recipient
        res_recipient = client.get(f"/api/v1/chat/dm/messages/{sender.id}")
        assert res_recipient.status_code == 200, f"Erro: {res_recipient.status_code} - {res_recipient.text}"
        msgs_recipient = res_recipient.json()
        target_recipient = next(m for m in msgs_recipient if m["id"] == msg_id)
        # Agora está lida com timestamp
        assert target_recipient["is_read"] is True
        assert target_recipient["read_at"] is not None

        # 4. Sender consulta novamente e agora vê que foi visualizada
        app.dependency_overrides[get_current_user] = lambda: sender
        res_sender_after = client.get(f"/api/v1/chat/dm/messages/{recipient.id}")
        assert res_sender_after.status_code == 200, f"Erro: {res_sender_after.status_code} - {res_sender_after.text}"
        target_sender_after = next(m for m in res_sender_after.json() if m["id"] == msg_id)
        assert target_sender_after["is_read"] is True
        assert target_sender_after["read_at"] is not None

    finally:
        app.dependency_overrides.clear()
        db.close()
