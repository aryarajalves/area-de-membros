import pytest
from app.core.security import get_password_hash
from app.models.user import User
from app.models.chat import ChatMessage
from tests.conftest import TestingSessionLocal, client

def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def chat_soft_delete_users():
    db = TestingSessionLocal()
    aluno = db.query(User).filter(User.email == "softdel_aluno@test.com").first()
    if not aluno:
        aluno = User(
            email="softdel_aluno@test.com",
            name="Aluno Soft Delete",
            hashed_password=get_password_hash("pass123"),
            role="aluno",
            is_active=True,
        )
        db.add(aluno)
    
    superadmin = db.query(User).filter(User.email == "softdel_superadmin@test.com").first()
    if not superadmin:
        superadmin = User(
            email="softdel_superadmin@test.com",
            name="Super Admin Soft Delete",
            hashed_password=get_password_hash("pass123"),
            role="superadmin",
            is_active=True,
        )
        db.add(superadmin)
    db.commit()
    db.refresh(aluno)
    db.refresh(superadmin)
    yield aluno, superadmin
    db.close()

def test_student_soft_delete_and_admin_hard_delete(chat_soft_delete_users):
    aluno, superadmin = chat_soft_delete_users
    db = TestingSessionLocal()

    # 1. Aluno cria mensagem
    msg = ChatMessage(
        channel_type="general",
        user_id=aluno.id,
        message="Mensagem do aluno para ser apagada",
        is_deleted=False,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    msg_id = msg.id

    student_headers = get_headers("softdel_aluno@test.com", "pass123")
    admin_headers = get_headers("softdel_superadmin@test.com", "pass123")

    # 2. Aluno deleta sua própria mensagem
    del_resp = client.delete(f"/api/v1/chat/messages/{msg_id}", headers=student_headers)
    assert del_resp.status_code == 200
    del_data = del_resp.json()
    assert del_data["ok"] is True
    assert del_data["permanent"] is False  # Soft delete

    # 3. Aluno consulta histórico -> mensagem não aparece
    list_student = client.get("/api/v1/chat/messages?channel_type=general", headers=student_headers)
    assert list_student.status_code == 200
    msgs_student = list_student.json()
    assert not any(m["id"] == msg_id for m in msgs_student)

    # 4. Super Admin consulta histórico -> mensagem aparece com is_deleted == True
    list_admin = client.get("/api/v1/chat/messages?channel_type=general", headers=admin_headers)
    assert list_admin.status_code == 200
    msgs_admin = list_admin.json()
    deleted_msg_admin = next((m for m in msgs_admin if m["id"] == msg_id), None)
    assert deleted_msg_admin is not None
    assert deleted_msg_admin["is_deleted"] is True

    # 5. Super Admin deleta a mensagem -> exclusão definitiva (Hard Delete)
    admin_del_resp = client.delete(f"/api/v1/chat/messages/{msg_id}", headers=admin_headers)
    assert admin_del_resp.status_code == 200
    assert admin_del_resp.json()["permanent"] is True

    # Verifica que foi excluído permanentemente
    db.expire_all()
    check_db = db.query(ChatMessage).filter(ChatMessage.id == msg_id).first()
    assert check_db is None
    db.close()
