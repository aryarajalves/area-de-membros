import pytest
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.chat import ChatMessage
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seed_chat_data():
    db = TestingSessionLocal()
    aluno1 = User(
        email="chat_aluno1@test.com",
        name="Aluno Chat Um",
        hashed_password=get_password_hash("pass123"),
        role="aluno",
        is_active=True,
    )
    aluno2 = User(
        email="chat_aluno2@test.com",
        name="Aluno Chat Dois",
        hashed_password=get_password_hash("pass123"),
        role="aluno",
        is_active=True,
    )
    db.add_all([aluno1, aluno2])

    curso_react = Course(title="Curso React Avançado", description="React do Zero ao Pro", is_published=True)
    curso_python = Course(title="Curso Python Pro", description="Python do Zero ao Pro", is_published=True)
    db.add_all([curso_react, curso_python])
    db.commit()

    # aluno1 matriculado apenas em React
    uc = UserCourse(user_id=aluno1.id, course_id=curso_react.id)
    db.add(uc)
    db.commit()
    db.close()


def test_list_channels(seed_chat_data):
    aluno_headers = get_headers("chat_aluno1@test.com", "pass123")
    res = client.get("/api/v1/chat/channels", headers=aluno_headers)
    assert res.status_code == 200
    channels = res.json()
    # Deve conter Comunidade Geral + Curso React (1 curso liberado)
    assert any(c["id"] == "general" for c in channels)
    assert any(c["name"] == "Curso React Avançado" for c in channels)
    assert not any(c["name"] == "Curso Python Pro" for c in channels)

    # Admin deve ver todos os cursos
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res_admin = client.get("/api/v1/chat/channels", headers=admin_headers)
    assert res_admin.status_code == 200
    admin_channels = res_admin.json()
    assert any(c["name"] == "Curso Python Pro" for c in admin_channels)


def test_send_and_get_general_message(seed_chat_data):
    aluno_headers = get_headers("chat_aluno1@test.com", "pass123")
    payload = {
        "channel_type": "general",
        "course_id": None,
        "message": "Olá pessoal, alguém estudando hoje?",
    }
    res_post = client.post("/api/v1/chat/messages", json=payload, headers=aluno_headers)
    assert res_post.status_code == 201
    created_msg = res_post.json()
    assert created_msg["message"] == "Olá pessoal, alguém estudando hoje?"
    assert created_msg["user"]["name"] == "Aluno Chat Um"

    # Listar mensagens do canal geral
    res_get = client.get("/api/v1/chat/messages?channel_type=general", headers=aluno_headers)
    assert res_get.status_code == 200
    msgs = res_get.json()
    assert any(m["id"] == created_msg["id"] for m in msgs)


def test_student_blocked_from_unauthorized_course_chat(seed_chat_data):
    aluno_headers = get_headers("chat_aluno1@test.com", "pass123")
    db = TestingSessionLocal()
    curso_bloqueado = db.query(Course).filter(Course.title == "Curso Python Pro").first()
    db.close()

    # Tentar ler mensagens
    res_get = client.get(
        f"/api/v1/chat/messages?channel_type=course&course_id={curso_bloqueado.id}",
        headers=aluno_headers,
    )
    assert res_get.status_code == 403

    # Tentar enviar mensagem
    payload = {
        "channel_type": "course",
        "course_id": curso_bloqueado.id,
        "message": "Tentando invadir canal",
    }
    res_post = client.post("/api/v1/chat/messages", json=payload, headers=aluno_headers)
    assert res_post.status_code == 403


def test_student_can_chat_in_enrolled_course(seed_chat_data):
    aluno_headers = get_headers("chat_aluno1@test.com", "pass123")
    db = TestingSessionLocal()
    curso_liberado = db.query(Course).filter(Course.title == "Curso React Avançado").first()
    db.close()

    payload = {
        "channel_type": "course",
        "course_id": curso_liberado.id,
        "message": "Dúvida sobre hooks!",
    }
    res_post = client.post("/api/v1/chat/messages", json=payload, headers=aluno_headers)
    assert res_post.status_code == 201
    created_msg = res_post.json()
    assert created_msg["course_id"] == curso_liberado.id

    res_get = client.get(
        f"/api/v1/chat/messages?channel_type=course&course_id={curso_liberado.id}",
        headers=aluno_headers,
    )
    assert res_get.status_code == 200
    msgs = res_get.json()
    assert any(m["id"] == created_msg["id"] for m in msgs)


def test_delete_own_message(seed_chat_data):
    aluno_headers = get_headers("chat_aluno1@test.com", "pass123")
    res_post = client.post(
        "/api/v1/chat/messages",
        json={"channel_type": "general", "message": "Mensagem que vou apagar"},
        headers=aluno_headers,
    )
    assert res_post.status_code == 201
    msg_id = res_post.json()["id"]

    # Deletar própria mensagem
    res_del = client.delete(f"/api/v1/chat/messages/{msg_id}", headers=aluno_headers)
    assert res_del.status_code == 200


def test_student_cannot_delete_others_message(seed_chat_data):
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")
    aluno2_headers = get_headers("chat_aluno2@test.com", "pass123")

    res_post = client.post(
        "/api/v1/chat/messages",
        json={"channel_type": "general", "message": "Mensagem do Aluno 1"},
        headers=aluno1_headers,
    )
    assert res_post.status_code == 201
    msg_id = res_post.json()["id"]

    # Aluno 2 tenta deletar mensagem do Aluno 1
    res_del = client.delete(f"/api/v1/chat/messages/{msg_id}", headers=aluno2_headers)
    assert res_del.status_code == 403


def test_admin_can_delete_any_message(seed_chat_data):
    aluno_headers = get_headers("chat_aluno1@test.com", "pass123")
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    res_post = client.post(
        "/api/v1/chat/messages",
        json={"channel_type": "general", "message": "Mensagem inapropriada do Aluno 1"},
        headers=aluno_headers,
    )
    assert res_post.status_code == 201
    msg_id = res_post.json()["id"]

    # Admin modera e deleta
    res_del = client.delete(f"/api/v1/chat/messages/{msg_id}", headers=admin_headers)
    assert res_del.status_code == 200


def test_empty_message_validation(seed_chat_data):
    aluno_headers = get_headers("chat_aluno1@test.com", "pass123")
    res_post = client.post(
        "/api/v1/chat/messages",
        json={"channel_type": "general", "message": "   "},
        headers=aluno_headers,
    )
    assert res_post.status_code == 400


def test_chat_message_includes_user_avatar_url(seed_chat_data):
    db = TestingSessionLocal()
    aluno = db.query(User).filter(User.email == "chat_aluno1@test.com").first()
    aluno.avatar_url = "https://cdn.test.com/aluno_avatar.png"
    db.commit()
    db.close()

    aluno_headers = get_headers("chat_aluno1@test.com", "pass123")
    res_post = client.post(
        "/api/v1/chat/messages",
        json={"channel_type": "general", "message": "Mensagem com foto de perfil"},
        headers=aluno_headers,
    )
    assert res_post.status_code == 201
    created_msg = res_post.json()
    assert created_msg["user"]["avatar_url"] == "https://cdn.test.com/aluno_avatar.png"

    # Verificar no get messages
    res_get = client.get("/api/v1/chat/messages?channel_type=general", headers=aluno_headers)
    assert res_get.status_code == 200
    messages = res_get.json()
    msg = next(m for m in messages if m["id"] == created_msg["id"])
    assert msg["user"]["avatar_url"] == "https://cdn.test.com/aluno_avatar.png"


def test_chat_like_toggle(seed_chat_data):
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")
    aluno2_headers = get_headers("chat_aluno2@test.com", "pass123")

    # Aluno 1 envia mensagem
    res_post = client.post(
        "/api/v1/chat/messages",
        json={"channel_type": "general", "message": "Mensagem para ser curtida"},
        headers=aluno1_headers,
    )
    assert res_post.status_code == 201
    msg_id = res_post.json()["id"]

    # Aluno 2 curte a mensagem
    res_like = client.post(f"/api/v1/chat/messages/{msg_id}/like", headers=aluno2_headers)
    assert res_like.status_code == 200
    data = res_like.json()
    assert data["liked"] is True
    assert data["likes_count"] == 1

    # Verificar no get messages
    res_get = client.get("/api/v1/chat/messages?channel_type=general", headers=aluno2_headers)
    assert res_get.status_code == 200
    msg = next(m for m in res_get.json() if m["id"] == msg_id)
    assert msg["likes_count"] == 1
    assert msg["liked_by_me"] is True

    # Aluno 2 descurte a mensagem
    res_unlike = client.post(f"/api/v1/chat/messages/{msg_id}/like", headers=aluno2_headers)
    assert res_unlike.status_code == 200
    data_unlike = res_unlike.json()
    assert data_unlike["liked"] is False
    assert data_unlike["likes_count"] == 0


def test_chat_favorite_toggle_and_filter(seed_chat_data):
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")

    # Enviar 2 mensagens
    res1 = client.post(
        "/api/v1/chat/messages",
        json={"channel_type": "general", "message": "Mensagem comum"},
        headers=aluno1_headers,
    )
    res2 = client.post(
        "/api/v1/chat/messages",
        json={"channel_type": "general", "message": "Mensagem super importante para favoritar"},
        headers=aluno1_headers,
    )
    msg1_id = res1.json()["id"]
    msg2_id = res2.json()["id"]

    # Favoritar a mensagem 2
    res_fav = client.post(f"/api/v1/chat/messages/{msg2_id}/favorite", headers=aluno1_headers)
    assert res_fav.status_code == 200
    assert res_fav.json()["is_favorited"] is True

    # Listar com filtro de favoritas
    res_fav_only = client.get(
        "/api/v1/chat/messages?channel_type=general&favorites_only=true",
        headers=aluno1_headers,
    )
    assert res_fav_only.status_code == 200
    fav_msgs = res_fav_only.json()
    assert any(m["id"] == msg2_id for m in fav_msgs)
    assert not any(m["id"] == msg1_id for m in fav_msgs)

    # Desfavoritar mensagem 2
    res_unfav = client.post(f"/api/v1/chat/messages/{msg2_id}/favorite", headers=aluno1_headers)
    assert res_unfav.status_code == 200
    assert res_unfav.json()["is_favorited"] is False


def test_chat_pin_message_admin_and_student_forbidden(seed_chat_data):
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    res_post = client.post(
        "/api/v1/chat/messages",
        json={"channel_type": "general", "message": "Aviso da coordenação"},
        headers=admin_headers,
    )
    assert res_post.status_code == 201
    msg_id = res_post.json()["id"]

    # Aluno tenta fixar -> 403 Forbidden
    res_pin_student = client.patch(f"/api/v1/chat/messages/{msg_id}/pin", headers=aluno1_headers)
    assert res_pin_student.status_code == 403

    # Admin fixa a mensagem
    res_pin_admin = client.patch(f"/api/v1/chat/messages/{msg_id}/pin", headers=admin_headers)
    assert res_pin_admin.status_code == 200
    pinned_data = res_pin_admin.json()
    assert pinned_data["is_pinned"] is True
    assert pinned_data["pinned_at"] is not None

    # Buscar mensagem fixada do canal geral
    res_pinned = client.get("/api/v1/chat/pinned-message?channel_type=general", headers=aluno1_headers)
    assert res_pinned.status_code == 200
    assert res_pinned.json()["id"] == msg_id

    # Admin desafixa a mensagem
    res_unpin = client.patch(f"/api/v1/chat/messages/{msg_id}/pin", headers=admin_headers)
    assert res_unpin.status_code == 200
    assert res_unpin.json()["is_pinned"] is False

    # Mensagem fixada agora retorna null
    res_pinned_after = client.get("/api/v1/chat/pinned-message?channel_type=general", headers=aluno1_headers)
    assert res_pinned_after.status_code == 200
    assert res_pinned_after.json() is None


def test_chat_send_media_message(seed_chat_data):
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")
    payload = {
        "channel_type": "general",
        "message": "Olhem esse print!",
        "media_url": "https://cdn.test.com/prints/erro.png",
        "media_type": "image",
    }
    res_post = client.post("/api/v1/chat/messages", json=payload, headers=aluno1_headers)
    assert res_post.status_code == 201
    data = res_post.json()
    assert data["media_url"] == "https://cdn.test.com/prints/erro.png"
    assert data["media_type"] == "image"
    assert data["message"] == "Olhem esse print!"

