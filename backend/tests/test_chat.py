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


def test_chat_websocket_connection_and_ping(seed_chat_data):
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")
    token = aluno1_headers["Authorization"].split(" ")[1]

    with client.websocket_connect(f"/api/v1/chat/ws?token={token}") as ws:
        ws.send_text('{"type": "ping"}')
        reply = ws.receive_text()
        assert '{"type": "pong"}' in reply


def test_chat_websocket_unauthorized_rejected():
    with pytest.raises(Exception):
        with client.websocket_connect("/api/v1/chat/ws?token=invalid_token") as ws:
            pass


def test_chat_websocket_broadcast_on_new_message(seed_chat_data):
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")
    aluno2_headers = get_headers("chat_aluno2@test.com", "pass123")
    token1 = aluno1_headers["Authorization"].split(" ")[1]

    with client.websocket_connect(f"/api/v1/chat/ws?token={token1}") as ws:
        # Aluno 2 envia mensagem via REST
        res_post = client.post(
            "/api/v1/chat/messages",
            json={
                "channel_type": "general",
                "message": "Mensagem broadcast em tempo real!",
            },
            headers=aluno2_headers,
        )
        assert res_post.status_code == 201
        created_id = res_post.json()["id"]

        # Aluno 1 deve receber o evento no WebSocket imediatamente
        event_raw = ws.receive_text()
        import json
        event = json.loads(event_raw)
        assert event["type"] == "new_message"
        assert event["data"]["id"] == created_id
        assert event["data"]["message"] == "Mensagem broadcast em tempo real!"


def test_chat_upload_audio_and_file(seed_chat_data):
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")

    # 1. Upload de áudio
    audio_content = b"fake audio content webm"
    res_audio = client.post(
        "/api/v1/chat/upload-media",
        files={"file": ("audio_teste.webm", audio_content, "audio/webm")},
        headers=aluno1_headers,
    )
    assert res_audio.status_code == 200
    data_audio = res_audio.json()
    assert data_audio["media_type"] == "audio"
    assert "audio_teste.webm" in data_audio["filename"]
    assert "media_url" in data_audio

    # 2. Upload de documento
    doc_content = b"fake pdf content"
    res_doc = client.post(
        "/api/v1/chat/upload-media",
        files={"file": ("apostila.pdf", doc_content, "application/pdf")},
        headers=aluno1_headers,
    )
    assert res_doc.status_code == 200
    data_doc = res_doc.json()
    assert data_doc["media_type"] == "file"
    assert data_doc["filename"] == "apostila.pdf"


def test_chat_media_gallery_endpoint(seed_chat_data):
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")

    # Enviar mensagem com imagem
    client.post(
        "/api/v1/chat/messages",
        json={
            "channel_type": "general",
            "message": "Foto 1",
            "media_url": "https://cdn.test.com/foto1.jpg",
            "media_type": "image",
        },
        headers=aluno1_headers,
    )

    # Enviar mensagem com áudio
    client.post(
        "/api/v1/chat/messages",
        json={
            "channel_type": "general",
            "message": "Áudio explicativo",
            "media_url": "https://cdn.test.com/audio1.webm",
            "media_type": "audio",
        },
        headers=aluno1_headers,
    )

    # Enviar mensagem com documento
    client.post(
        "/api/v1/chat/messages",
        json={
            "channel_type": "general",
            "message": "Guia PDF",
            "media_url": "https://cdn.test.com/guia.pdf",
            "media_type": "file",
        },
        headers=aluno1_headers,
    )

    # 1. Buscar todas as mídias
    res_all = client.get("/api/v1/chat/media-gallery?channel_type=general", headers=aluno1_headers)
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert data_all["total"] >= 3
    assert len(data_all["items"]) >= 3

    # 2. Filtrar por áudio
    res_audio = client.get("/api/v1/chat/media-gallery?channel_type=general&media_type=audio", headers=aluno1_headers)
    assert res_audio.status_code == 200
    data_audio = res_audio.json()
    assert all(item["media_type"] == "audio" for item in data_audio["items"])

    # 3. Filtrar por foto
    res_img = client.get("/api/v1/chat/media-gallery?channel_type=general&media_type=image", headers=aluno1_headers)
    assert res_img.status_code == 200
    data_img = res_img.json()
    assert all(item["media_type"] == "image" for item in data_img["items"])

    # 4. Filtrar por documento
    res_file = client.get("/api/v1/chat/media-gallery?channel_type=general&media_type=file", headers=aluno1_headers)
    assert res_file.status_code == 200
    data_file = res_file.json()
    assert all(item["media_type"] in ("file", "document") for item in data_file["items"])


def test_send_and_list_dm_messages(seed_chat_data):
    """Testa envio de DM entre contatos e listagem na inbox privada."""
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")
    aluno2_headers = get_headers("chat_aluno2@test.com", "pass123")

    db = TestingSessionLocal()
    aluno2 = db.query(User).filter(User.email == "chat_aluno2@test.com").first()
    aluno1 = db.query(User).filter(User.email == "chat_aluno1@test.com").first()
    db.close()

    # 1. Aluno 1 envia DM para Aluno 2
    res_send = client.post(
        "/api/v1/chat/messages",
        json={
            "channel_type": "dm",
            "recipient_id": aluno2.id,
            "message": "Olá Aluno 2, mensagem privada!",
        },
        headers=aluno1_headers,
    )
    assert res_send.status_code == 201
    dm_msg = res_send.json()
    assert dm_msg["channel_type"] == "dm"
    assert dm_msg["recipient_id"] == aluno2.id
    assert dm_msg["message"] == "Olá Aluno 2, mensagem privada!"

    # 2. Aluno 2 consulta suas conversas de DM (inbox)
    res_convs = client.get("/api/v1/chat/dm/conversations", headers=aluno2_headers)
    assert res_convs.status_code == 200
    convs = res_convs.json()
    assert len(convs) >= 1
    found = next((c for c in convs if c["contact"]["id"] == aluno1.id), None)
    assert found is not None
    assert found["unread_count"] >= 1
    assert found["last_message"] == "Olá Aluno 2, mensagem privada!"

    # 3. Aluno 2 abre as mensagens com Aluno 1 (marca como lida)
    res_msgs = client.get(f"/api/v1/chat/dm/messages/{aluno1.id}", headers=aluno2_headers)
    assert res_msgs.status_code == 200
    msgs = res_msgs.json()
    assert any(m["message"] == "Olá Aluno 2, mensagem privada!" for m in msgs)

    # 4. Aluno 2 consulta conversas não lidas e deve estar zerado
    res_unread = client.get("/api/v1/chat/dm/conversations?unread_only=true", headers=aluno2_headers)
    assert res_unread.status_code == 200
    unread_convs = res_unread.json()
    assert not any(c["contact"]["id"] == aluno1.id for c in unread_convs)


def test_chat_unread_summary_and_mark_channel_read(seed_chat_data):
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")
    aluno2_headers = get_headers("chat_aluno2@test.com", "pass123")

    # 1. Aluno 1 envia mensagem na Comunidade Geral
    res_send = client.post(
        "/api/v1/chat/messages",
        json={
            "channel_type": "general",
            "message": "Nova mensagem na comunidade geral!",
        },
        headers=aluno1_headers,
    )
    assert res_send.status_code == 201
    msg_id = res_send.json()["id"]

    # 2. Aluno 2 consulta o unread-summary (deve contabilizar a mensagem não lida)
    res_summary = client.get("/api/v1/chat/unread-summary", headers=aluno2_headers)
    assert res_summary.status_code == 200
    summary_data = res_summary.json()
    assert summary_data["total_unread"] >= 1
    assert summary_data["channel_unread"] >= 1

    # 3. Aluno 2 consulta a lista de canais (Canal Geral deve ter unread_count >= 1)
    res_channels = client.get("/api/v1/chat/channels", headers=aluno2_headers)
    assert res_channels.status_code == 200
    channels = res_channels.json()
    gen_channel = next((c for c in channels if c["id"] == "general"), None)
    assert gen_channel is not None
    assert gen_channel["unread_count"] >= 1

    # 4. Aluno 2 marca o canal geral como lido
    res_read = client.post(
        f"/api/v1/chat/channels/general/read?last_message_id={msg_id}",
        headers=aluno2_headers,
    )
    assert res_read.status_code == 200
    assert res_read.json()["status"] == "ok"

    # 5. Ao consultar novamente os canais, unread_count do canal geral deve ser 0
    res_channels_after = client.get("/api/v1/chat/channels", headers=aluno2_headers)
    assert res_channels_after.status_code == 200
    gen_after = next((c for c in res_channels_after.json() if c["id"] == "general"), None)
    assert gen_after is not None
    assert gen_after["unread_count"] == 0


def test_chat_notifications_and_threads_flow(seed_chat_data):
    """
    Testa o fluxo da Central de Notificações:
    - Menção ao Aluno 2
    - Resposta na thread criada pelo Aluno 2
    - Consulta de /notifications (inbox, mentions, threads)
    - Consulta de /notifications/counts
    - Marcar todas como lidas via /notifications/mark-all-read
    """
    aluno1_headers = get_headers("chat_aluno1@test.com", "pass123")
    aluno2_headers = get_headers("chat_aluno2@test.com", "pass123")
    db = TestingSessionLocal()
    aluno2 = db.query(User).filter(User.email == "chat_aluno2@test.com").first()
    aluno2_id = aluno2.id
    db.close()

    # 1. Aluno 2 cria uma mensagem pai
    res_parent = client.post(
        "/api/v1/chat/messages",
        json={"channel_type": "general", "message": "Minha pergunta sobre a aula"},
        headers=aluno2_headers,
    )
    assert res_parent.status_code == 201
    parent_id = res_parent.json()["id"]

    # 2. Aluno 1 responde na thread do Aluno 2
    res_reply = client.post(
        "/api/v1/chat/messages",
        json={
            "channel_type": "general",
            "parent_id": parent_id,
            "message": "Aqui está a resposta para sua dúvida!",
        },
        headers=aluno1_headers,
    )
    assert res_reply.status_code == 201

    # 3. Aluno 1 também menciona Aluno 2 em outra mensagem
    res_mention = client.post(
        "/api/v1/chat/messages",
        json={
            "channel_type": "general",
            "message": "Atenção @Aluno Dois veja isso",
            "mentioned_user_ids": [aluno2_id],
        },
        headers=aluno1_headers,
    )
    assert res_mention.status_code == 201

    # 4. Aluno 2 verifica contadores de notificações
    res_counts = client.get("/api/v1/chat/notifications/counts", headers=aluno2_headers)
    assert res_counts.status_code == 200
    counts = res_counts.json()
    assert counts["mentions"] >= 1
    assert counts["threads"] >= 1
    assert counts["inbox"] >= 2

    # 5. Aluno 2 consulta lista de notificações por aba
    res_inbox = client.get("/api/v1/chat/notifications?tab=inbox", headers=aluno2_headers)
    assert res_inbox.status_code == 200
    inbox_items = res_inbox.json()
    assert len(inbox_items) >= 2

    res_threads = client.get("/api/v1/chat/notifications?tab=threads", headers=aluno2_headers)
    assert res_threads.status_code == 200
    threads_items = res_threads.json()
    assert any(item["type"] == "thread_reply" for item in threads_items)

    # 6. Aluno 2 marca todas como lidas
    res_mark_all = client.post("/api/v1/chat/notifications/mark-all-read", headers=aluno2_headers)
    assert res_mark_all.status_code == 200

    # 7. Contadores devem estar zerados
    res_counts_after = client.get("/api/v1/chat/notifications/counts", headers=aluno2_headers)
    assert res_counts_after.status_code == 200
    counts_after = res_counts_after.json()
    assert counts_after["total_unread"] == 0


@pytest.mark.asyncio
async def test_chat_realtime_ws_manager_send_to_user():
    """Valida o envio direcionado por usuário no ChatConnectionManager."""
    from unittest.mock import AsyncMock
    from app.services.chat_ws_manager import ChatConnectionManager

    manager = ChatConnectionManager()
    ws_user1 = AsyncMock()
    ws_user2 = AsyncMock()

    await manager.connect(ws_user1, user_id=10, role="aluno", name="Aluno 10")
    await manager.connect(ws_user2, user_id=20, role="admin", name="Admin 20")

    assert len(manager.active_connections) == 2

    # Envia evento direcionado apenas para user_id=10
    await manager.send_to_user(user_id=10, event_type="favorites_updated", data={"user_id": 10})

    assert ws_user1.send_text.called
    payload1 = ws_user1.send_text.call_args[0][0]
    assert "favorites_updated" in payload1
    assert '"user_id": 10' in payload1

    # O usuário 2 não deve receber essa mensagem privada
    assert not ws_user2.send_text.called

    # Envia evento de nova DM para user_id=20
    await manager.send_to_user(user_id=20, event_type="new_dm", data={"recipient_id": 20, "sender_id": 10})
    assert ws_user2.send_text.called
    payload2 = ws_user2.send_text.call_args[0][0]
    assert "new_dm" in payload2
    assert '"recipient_id": 20' in payload2

    # Desconecta os sockets
    await manager.disconnect(ws_user1)
    await manager.disconnect(ws_user2)
    assert len(manager.active_connections) == 0






