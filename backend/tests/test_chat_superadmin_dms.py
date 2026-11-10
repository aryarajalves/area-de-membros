import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.chat import ChatMessage
from app.api.v1.endpoints.users import get_current_user
from app.services.chat_encryption_service import encrypt_dm_message
from tests.conftest import TestingSessionLocal

client = TestClient(app)


@pytest.fixture
def chat_users():
    db = TestingSessionLocal()
    try:
        # Cria Super Admin
        superadmin = User(
            email="superadmin_test_dm@example.com",
            name="Super Admin Mestre",
            hashed_password="fakehashedpassword",
            role="superadmin",
            is_active=True,
        )
        # Cria Admin
        admin = User(
            email="admin_test_dm@example.com",
            name="Professor Jordao",
            hashed_password="fakehashedpassword",
            role="admin",
            is_active=True,
        )
        # Cria Aluno
        student = User(
            email="aluno_test_dm@example.com",
            name="Aluno Dedicado",
            hashed_password="fakehashedpassword",
            role="aluno",
            is_active=True,
        )
        db.add_all([superadmin, admin, student])
        db.commit()
        db.refresh(superadmin)
        db.refresh(admin)
        db.refresh(student)

        return {"superadmin": superadmin, "admin": admin, "student": student}
    finally:
        db.close()


def test_student_cannot_access_superadmin_admin_conversations(chat_users):
    student = chat_users["student"]
    app.dependency_overrides[get_current_user] = lambda: student

    try:
        res = client.get("/api/v1/chat/dm/admin-conversations")
        assert res.status_code == 403
        assert "Acesso exclusivo" in res.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_superadmin_lists_and_inspects_admin_dms_without_marking_read(chat_users):
    superadmin = chat_users["superadmin"]
    admin = chat_users["admin"]
    student = chat_users["student"]

    db = TestingSessionLocal()
    try:
        # Aluno envia DM para o Admin
        encrypted_text = encrypt_dm_message("Professor, fiquei com dúvida no exercício 2")
        msg1 = ChatMessage(
            channel_type="dm",
            user_id=student.id,
            recipient_id=admin.id,
            message=encrypted_text,
            is_read=False,
        )
        db.add(msg1)
        db.commit()
        msg1_id = msg1.id
    finally:
        db.close()

    app.dependency_overrides[get_current_user] = lambda: superadmin

    try:
        # 1. Superadmin lista conversas da equipe
        res = client.get("/api/v1/chat/dm/admin-conversations")
        assert res.status_code == 200
        conversations = res.json()
        assert len(conversations) >= 1
        target_conv = next(
            (c for c in conversations if c["student"]["id"] == student.id and c["admin"]["id"] == admin.id),
            None,
        )
        assert target_conv is not None
        assert target_conv["unread_by_admin"] == 1
        assert "dúvida no exercício 2" in target_conv["last_message"]

        # 2. Superadmin inspeciona histórico de mensagens
        res_msgs = client.get(f"/api/v1/chat/dm/admin-conversations/{student.id}/{admin.id}/messages")
        assert res_msgs.status_code == 200
        msgs = res_msgs.json()
        assert len(msgs) == 1
        assert "dúvida no exercício 2" in msgs[0]["message"]

        # 3. Regra Crítica: a mensagem NÃO pode ter sido marcada como lida pelo Super Admin
        db_check = TestingSessionLocal()
        try:
            refreshed_msg = db_check.query(ChatMessage).filter(ChatMessage.id == msg1_id).first()
            assert refreshed_msg.is_read is False
        finally:
            db_check.close()

    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_superadmin_intervenes_in_admin_student_thread(chat_users):
    superadmin = chat_users["superadmin"]
    admin = chat_users["admin"]
    student = chat_users["student"]

    db = TestingSessionLocal()
    try:
        # Mensagem inicial do Aluno para o Admin
        msg1 = ChatMessage(
            channel_type="dm",
            user_id=student.id,
            recipient_id=admin.id,
            message=encrypt_dm_message("Professor, onde encontro o material?"),
            is_read=False,
        )
        db.add(msg1)
        db.commit()
    finally:
        db.close()

    app.dependency_overrides[get_current_user] = lambda: superadmin

    try:
        # Superadmin envia mensagem na thread do Admin para o Aluno
        payload = {
            "channel_type": "dm",
            "recipient_id": student.id,
            "dm_thread_admin_id": admin.id,
            "message": "Olá! O professor Jordão está atendendo outra turma, mas o material está na aba de anexos.",
        }
        res_send = client.post("/api/v1/chat/messages", json=payload)
        assert res_send.status_code == 201
        sent_data = res_send.json()
        assert sent_data["dm_thread_admin_id"] == admin.id
        assert sent_data["user"]["role"] == "superadmin"

        # Verifica histórico da thread pelo Superadmin
        res_msgs = client.get(f"/api/v1/chat/dm/admin-conversations/{student.id}/{admin.id}/messages")
        assert res_msgs.status_code == 200
        thread_msgs = res_msgs.json()
        assert len(thread_msgs) == 2
        assert thread_msgs[-1]["user"]["role"] == "superadmin"

    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # 4. Verifica se o Aluno e o Admin vêem a mensagem do Superadmin em sua conversa
    app.dependency_overrides[get_current_user] = lambda: student
    try:
        res_student_view = client.get(f"/api/v1/chat/dm/messages/{admin.id}")
        assert res_student_view.status_code == 200
        student_msgs = res_student_view.json()
        assert any(m["user"]["role"] == "superadmin" for m in student_msgs)
    finally:
        app.dependency_overrides.pop(get_current_user, None)
