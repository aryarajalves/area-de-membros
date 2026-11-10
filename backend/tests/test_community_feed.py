import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.community_feed import CommunityPost, CommunityPostComment, CommunityPostLike
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def superadmin_user():
    db = SessionLocal()
    user = db.query(User).filter(User.role == "superadmin").first()
    if not user:
        user = User(
            name="Super Admin Feed",
            email="superadminfeed@teste.com",
            hashed_password="hashed_pwd",
            role="superadmin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    user_id = user.id
    token = create_access_token(data={"sub": str(user_id), "role": user.role})
    db.close()
    return {"id": user_id, "token": token}


@pytest.fixture
def student_user_1():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "alunofeed1@teste.com").first()
    if not user:
        user = User(
            name="Admin Feed Um",
            email="alunofeed1@teste.com",
            hashed_password="hashed_pwd",
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.role = "admin"
        db.commit()
    user_id = user.id
    token = create_access_token(data={"sub": str(user_id), "role": user.role})
    db.close()
    return {"id": user_id, "token": token}


@pytest.fixture
def student_user_2():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "alunofeed2@teste.com").first()
    if not user:
        user = User(
            name="Admin Feed Dois",
            email="alunofeed2@teste.com",
            hashed_password="hashed_pwd",
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.role = "admin"
        db.commit()
    user_id = user.id
    token = create_access_token(data={"sub": str(user_id), "role": user.role})
    db.close()
    return {"id": user_id, "token": token}


@pytest.fixture
def regular_student_user():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "alunobloqueadofeed@teste.com").first()
    if not user:
        user = User(
            name="Aluno Bloqueado Feed",
            email="alunobloqueadofeed@teste.com",
            hashed_password="hashed_pwd",
            role="aluno",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.role = "aluno"
        db.commit()
    user_id = user.id
    token = create_access_token(data={"sub": str(user_id), "role": user.role})
    db.close()
    return {"id": user_id, "token": token}


def test_feed_requires_auth():
    res = client.get("/api/v1/community/feed")
    assert res.status_code == 401


def test_student_blocked_from_feed_during_testing(regular_student_user):
    headers = {"Authorization": f"Bearer {regular_student_user['token']}"}
    res = client.get("/api/v1/community/feed", headers=headers)
    assert res.status_code == 403
    assert "apenas para administradores" in res.json()["detail"]

    post_res = client.post("/api/v1/community/feed", json={"content": "Tentando postar"}, headers=headers)
    assert post_res.status_code == 403
    assert "apenas para administradores" in post_res.json()["detail"]


def test_create_and_list_feed_posts(student_user_1):
    headers = {"Authorization": f"Bearer {student_user_1['token']}"}
    payload = {
        "content": "Hoje finalizei meu primeiro módulo com 100% de aproveitamento! 🚀",
        "media_urls": ["/uploads/community/feed_test.png"],
        "media_type": "image"
    }
    res = client.post("/api/v1/community/feed", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["content"] == payload["content"]
    assert data["user_id"] == student_user_1["id"]
    assert data["likes_count"] == 0
    assert data["comments_count"] == 0
    assert data["is_liked_by_me"] is False
    post_id = data["id"]

    # List feed
    list_res = client.get("/api/v1/community/feed", headers=headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    found = any(p["id"] == post_id for p in list_data["posts"])
    assert found is True


def test_toggle_like_post(student_user_1, student_user_2):
    # Student 1 creates post
    headers_1 = {"Authorization": f"Bearer {student_user_1['token']}"}
    create_res = client.post("/api/v1/community/feed", json={"content": "Post para teste de likes"}, headers=headers_1)
    post_id = create_res.json()["id"]

    headers_2 = {"Authorization": f"Bearer {student_user_2['token']}"}

    # Student 2 likes post
    like_res = client.post(f"/api/v1/community/feed/{post_id}/like", headers=headers_2)
    assert like_res.status_code == 200
    assert like_res.json()["liked"] is True
    assert like_res.json()["likes_count"] == 1

    # Check feed from student 2 perspective (is_liked_by_me = True)
    feed_res = client.get(f"/api/v1/community/feed", headers=headers_2)
    post_in_feed = next(p for p in feed_res.json()["posts"] if p["id"] == post_id)
    assert post_in_feed["is_liked_by_me"] is True
    assert post_in_feed["likes_count"] == 1

    # Student 2 unlikes post
    unlike_res = client.post(f"/api/v1/community/feed/{post_id}/like", headers=headers_2)
    assert unlike_res.status_code == 200
    assert unlike_res.json()["liked"] is False
    assert unlike_res.json()["likes_count"] == 0


def test_comments_flow(student_user_1, student_user_2, regular_student_user):
    # Admin 1 creates post
    headers_1 = {"Authorization": f"Bearer {student_user_1['token']}"}
    post_res = client.post("/api/v1/community/feed", json={"content": "Post com comentários"}, headers=headers_1)
    post_id = post_res.json()["id"]

    # Admin 2 comments
    headers_2 = {"Authorization": f"Bearer {student_user_2['token']}"}
    comment_payload = {"content": "Parabéns pela conquista!"}
    comment_res = client.post(f"/api/v1/community/feed/{post_id}/comments", json=comment_payload, headers=headers_2)
    assert comment_res.status_code == 201
    comment_data = comment_res.json()
    assert comment_data["content"] == "Parabéns pela conquista!"
    assert comment_data["user_id"] == student_user_2["id"]
    comment_id = comment_data["id"]

    # Get comments
    get_comm_res = client.get(f"/api/v1/community/feed/{post_id}/comments", headers=headers_1)
    assert get_comm_res.status_code == 200
    assert len(get_comm_res.json()) >= 1
    assert get_comm_res.json()[0]["id"] == comment_id

    # Aluno regular não pode apagar comentários no feed (403)
    headers_student = {"Authorization": f"Bearer {regular_student_user['token']}"}
    del_forbidden = client.delete(f"/api/v1/community/feed/comments/{comment_id}", headers=headers_student)
    assert del_forbidden.status_code == 403

    # Admin 2 deletes own comment
    del_ok = client.delete(f"/api/v1/community/feed/comments/{comment_id}", headers=headers_2)
    assert del_ok.status_code == 204


def test_pin_post_permissions(regular_student_user, superadmin_user, student_user_1):
    headers_student = {"Authorization": f"Bearer {regular_student_user['token']}"}
    headers_feed_admin = {"Authorization": f"Bearer {student_user_1['token']}"}
    headers_admin = {"Authorization": f"Bearer {superadmin_user['token']}"}

    # Admin creates post
    post_res = client.post("/api/v1/community/feed", json={"content": "Post para testar pin"}, headers=headers_feed_admin)
    post_id = post_res.json()["id"]

    # Aluno tenta fixar (403 forbidden)
    pin_student_res = client.post(f"/api/v1/community/feed/{post_id}/pin", headers=headers_student)
    assert pin_student_res.status_code == 403

    # Admin pins
    pin_admin_res = client.post(f"/api/v1/community/feed/{post_id}/pin", headers=headers_admin)
    assert pin_admin_res.status_code == 200
    assert pin_admin_res.json()["is_pinned"] is True

    # Admin unpins
    unpin_res = client.post(f"/api/v1/community/feed/{post_id}/pin", headers=headers_admin)
    assert unpin_res.status_code == 200
    assert unpin_res.json()["is_pinned"] is False


def test_delete_post_permissions(student_user_1, regular_student_user, superadmin_user):
    headers_1 = {"Authorization": f"Bearer {student_user_1['token']}"}
    headers_student = {"Authorization": f"Bearer {regular_student_user['token']}"}
    headers_admin = {"Authorization": f"Bearer {superadmin_user['token']}"}

    # Admin 1 creates post
    post_res = client.post("/api/v1/community/feed", json={"content": "Post para deleção"}, headers=headers_1)
    post_id = post_res.json()["id"]

    # Aluno tenta deletar (403 forbidden)
    del_student = client.delete(f"/api/v1/community/feed/{post_id}", headers=headers_student)
    assert del_student.status_code == 403

    # Admin can delete
    del_admin = client.delete(f"/api/v1/community/feed/{post_id}", headers=headers_admin)
    assert del_admin.status_code == 204


def test_create_carousel_and_video_post(student_user_1):
    headers = {"Authorization": f"Bearer {student_user_1['token']}"}

    # Carrossel com múltiplas imagens
    carousel_payload = {
        "content": "Carrossel de 3 fotos do meu novo setup de estudos!",
        "media_urls": ["/uploads/img1.png", "/uploads/img2.png", "/uploads/img3.png"],
    }
    res_carousel = client.post("/api/v1/community/feed", json=carousel_payload, headers=headers)
    assert res_carousel.status_code == 201
    assert res_carousel.json()["media_type"] == "carousel"
    assert len(res_carousel.json()["media_urls"]) == 3

    # Post com vídeo curto e capa/thumbnail
    video_payload = {
        "content": "Pitch em vídeo do meu projeto final!",
        "media_urls": ["/uploads/pitch.mp4"],
        "media_type": "video",
        "media_thumbnail_url": "/uploads/pitch_cover.jpg",
    }
    res_video = client.post("/api/v1/community/feed", json=video_payload, headers=headers)
    assert res_video.status_code == 201
    assert res_video.json()["media_type"] == "video"
    assert len(res_video.json()["media_urls"]) == 1
    assert res_video.json()["media_thumbnail_url"] == "/uploads/pitch_cover.jpg"


def test_bookmark_post_and_filter_saved(student_user_1, student_user_2):
    headers_1 = {"Authorization": f"Bearer {student_user_1['token']}"}
    headers_2 = {"Authorization": f"Bearer {student_user_2['token']}"}

    # Post criado
    post_res = client.post("/api/v1/community/feed", json={"content": "Post para salvar nos favoritos"}, headers=headers_1)
    post_id = post_res.json()["id"]

    # Student 2 salva o post
    bm_res = client.post(f"/api/v1/community/feed/{post_id}/bookmark", headers=headers_2)
    assert bm_res.status_code == 200
    assert bm_res.json()["bookmarked"] is True

    # Verifica filtro saved para student 2
    saved_res = client.get("/api/v1/community/feed?filter=saved", headers=headers_2)
    assert saved_res.status_code == 200
    assert any(p["id"] == post_id for p in saved_res.json()["posts"])

    # Student 2 desfavorita
    unbm_res = client.post(f"/api/v1/community/feed/{post_id}/bookmark", headers=headers_2)
    assert unbm_res.status_code == 200
    assert unbm_res.json()["bookmarked"] is False


def test_get_post_likes_list(student_user_1, student_user_2):
    headers_1 = {"Authorization": f"Bearer {student_user_1['token']}"}
    headers_2 = {"Authorization": f"Bearer {student_user_2['token']}"}

    post_res = client.post("/api/v1/community/feed", json={"content": "Post para lista de likes"}, headers=headers_1)
    post_id = post_res.json()["id"]

    # Student 2 curte
    client.post(f"/api/v1/community/feed/{post_id}/like", headers=headers_2)

    # Consulta quem curtiu
    likes_res = client.get(f"/api/v1/community/feed/{post_id}/likes", headers=headers_1)
    assert likes_res.status_code == 200
    likes_list = likes_res.json()
    assert len(likes_list) == 1
    assert likes_list[0]["user_id"] == student_user_2["id"]
    assert "name" in likes_list[0]


def test_get_mention_candidates(student_user_1):
    headers = {"Authorization": f"Bearer {student_user_1['token']}"}
    res = client.get("/api/v1/community/feed/mention-candidates?q=Admin", headers=headers)
    assert res.status_code == 200
    candidates = res.json()
    assert isinstance(candidates, list)
    assert len(candidates) >= 1
    assert "name" in candidates[0]


def test_social_notifications_flow(student_user_1, student_user_2):
    headers_1 = {"Authorization": f"Bearer {student_user_1['token']}"}
    headers_2 = {"Authorization": f"Bearer {student_user_2['token']}"}

    # 1. Student 1 cria um post
    post_res = client.post("/api/v1/community/feed", json={"content": "Post com notificações"}, headers=headers_1)
    post_id = post_res.json()["id"]

    # 2. Student 2 curte o post -> gera notificação de like para Student 1
    client.post(f"/api/v1/community/feed/{post_id}/like", headers=headers_2)

    # 3. Student 2 comenta no post -> gera notificação de comment para Student 1
    client.post(f"/api/v1/community/feed/{post_id}/comments", json={"content": "Ótimo post!"}, headers=headers_2)

    # 4. Student 1 consulta suas notificações
    notif_res = client.get("/api/v1/community/feed/notifications", headers=headers_1)
    assert notif_res.status_code == 200
    data = notif_res.json()
    assert data["unread_count"] >= 2
    assert any(n["notification_type"] == "feed_like" and n["post_id"] == post_id for n in data["notifications"])
    assert any(n["notification_type"] == "feed_comment" and n["post_id"] == post_id for n in data["notifications"])

    # 5. Verifica contagem de não lidas via endpoint leve
    count_res = client.get("/api/v1/community/feed/notifications/unread-count", headers=headers_1)
    assert count_res.status_code == 200
    assert count_res.json()["unread_count"] >= 2

    # 6. Marca primeira notificação como lida
    first_notif_id = data["notifications"][0]["id"]
    read_res = client.post(f"/api/v1/community/feed/notifications/{first_notif_id}/read", headers=headers_1)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    # 7. Marca todas como lidas
    read_all_res = client.post("/api/v1/community/feed/notifications/read-all", headers=headers_1)
    assert read_all_res.status_code == 200
    count_after_all = client.get("/api/v1/community/feed/notifications/unread-count", headers=headers_1).json()["unread_count"]
    assert count_after_all == 0

    # 8. Exclui a notificação
    del_res = client.delete(f"/api/v1/community/feed/notifications/{first_notif_id}", headers=headers_1)
    assert del_res.status_code == 204


def test_user_profile_bio_and_link(student_user_1):
    headers = {"Authorization": f"Bearer {student_user_1['token']}"}

    # 1. Atualiza perfil com bio de até 150 caracteres e link
    update_payload = {
        "name": "Aluno Atualizado",
        "bio": "Estudante dedicado de Inteligência Artificial. Construindo agentes autônomos! 🚀",
        "bio_link": "github.com/aluno-ai",
    }
    update_res = client.put("/api/v1/community/feed/profile/me", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["name"] == "Aluno Atualizado"
    assert "Inteligência Artificial" in data["bio"]
    assert data["bio_link"] == "https://github.com/aluno-ai"
    assert data["is_me"] is True

    # 2. Consulta perfil público por ID
    get_res = client.get(f"/api/v1/community/feed/profile/{student_user_1['id']}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["bio"] == data["bio"]
    assert get_res.json()["bio_link"] == "https://github.com/aluno-ai"


def test_follow_unfollow_system(student_user_1, student_user_2):
    headers_1 = {"Authorization": f"Bearer {student_user_1['token']}"}
    headers_2 = {"Authorization": f"Bearer {student_user_2['token']}"}

    # 1. Usuário não pode seguir a si mesmo
    self_res = client.post(f"/api/v1/community/feed/users/{student_user_1['id']}/follow", headers=headers_1)
    assert self_res.status_code == 400

    # 2. Usuário 1 segue Usuário 2
    follow_res = client.post(f"/api/v1/community/feed/users/{student_user_2['id']}/follow", headers=headers_1)
    assert follow_res.status_code == 200
    follow_data = follow_res.json()
    assert follow_data["following"] is True
    assert follow_data["followers_count"] >= 1

    # 3. Usuário 2 recebe notificação de que está sendo seguido
    notif_res = client.get("/api/v1/community/feed/notifications", headers=headers_2)
    assert notif_res.status_code == 200
    assert any(n["notification_type"] == "feed_follow" for n in notif_res.json()["notifications"])

    # 4. Checa lista de seguidores de Usuário 2
    followers_res = client.get(f"/api/v1/community/feed/users/{student_user_2['id']}/followers", headers=headers_1)
    assert followers_res.status_code == 200
    followers = followers_res.json()
    assert any(f["id"] == student_user_1["id"] for f in followers)

    # 5. Checa lista de pessoas que Usuário 1 está seguindo
    following_res = client.get(f"/api/v1/community/feed/users/{student_user_1['id']}/following", headers=headers_1)
    assert following_res.status_code == 200
    following = following_res.json()
    assert any(f["id"] == student_user_2["id"] for f in following)

    # 6. Perfil de Usuário 2 visto por Usuário 1 mostra is_following = True
    profile_res = client.get(f"/api/v1/community/feed/profile/{student_user_2['id']}", headers=headers_1)
    assert profile_res.status_code == 200
    profile_data = profile_res.json()
    assert profile_data["is_following"] is True
    assert profile_data["followers_count"] >= 1

    # 7. Filtro do feed 'following': post de Usuário 2 aparece no feed de Usuário 1
    post_res = client.post(
        "/api/v1/community/feed",
        json={"content": "Post exclusivo para quem me segue!"},
        headers=headers_2,
    )
    assert post_res.status_code == 201
    post_id = post_res.json()["id"]

    feed_following = client.get("/api/v1/community/feed?filter=following", headers=headers_1)
    assert feed_following.status_code == 200
    assert any(p["id"] == post_id for p in feed_following.json()["posts"])

    # 8. Deixar de seguir
    unfollow_res = client.post(f"/api/v1/community/feed/users/{student_user_2['id']}/follow", headers=headers_1)
    assert unfollow_res.status_code == 200
    assert unfollow_res.json()["following"] is False

    # 9. Perfil de Usuário 2 agora mostra is_following = False
    profile_after = client.get(f"/api/v1/community/feed/profile/{student_user_2['id']}", headers=headers_1).json()
    assert profile_after["is_following"] is False


def test_post_views_and_insights(student_user_1, student_user_2, regular_student_user, superadmin_user):
    headers_1 = {"Authorization": f"Bearer {student_user_1['token']}"}
    headers_2 = {"Authorization": f"Bearer {student_user_2['token']}"}
    headers_student = {"Authorization": f"Bearer {regular_student_user['token']}"}
    headers_admin = {"Authorization": f"Bearer {superadmin_user['token']}"}

    # 1. Autor (user 1) cria um post
    post_res = client.post(
        "/api/v1/community/feed",
        json={"content": "Publicação com métricas de alcance e insights!"},
        headers=headers_1,
    )
    assert post_res.status_code == 201
    post_id = post_res.json()["id"]

    # 2. Usuário 2 visualiza o post
    view_res = client.post(f"/api/v1/community/feed/{post_id}/view", headers=headers_2)
    assert view_res.status_code == 200
    assert view_res.json()["recorded"] is True
    assert view_res.json()["views_count"] == 1

    # Segunda visualização do mesmo usuário é idempotente
    view_repeat = client.post(f"/api/v1/community/feed/{post_id}/view", headers=headers_2)
    assert view_repeat.status_code == 200
    assert view_repeat.json()["recorded"] is False
    assert view_repeat.json()["views_count"] == 1

    # 3. Usuário 2 curte e comenta
    client.post(f"/api/v1/community/feed/{post_id}/like", headers=headers_2)
    client.post(f"/api/v1/community/feed/{post_id}/comments", json={"content": "Excelente conteúdo!"}, headers=headers_2)

    # 4. Aluno comum não pode ver os insights (bloqueado na fase de testes / 403)
    forbidden_res = client.get(f"/api/v1/community/feed/{post_id}/insights", headers=headers_student)
    assert forbidden_res.status_code == 403

    # 5. O autor pode ver os insights
    insights_res = client.get(f"/api/v1/community/feed/{post_id}/insights", headers=headers_1)
    assert insights_res.status_code == 200
    data = insights_res.json()
    assert data["post_id"] == post_id
    assert data["views_count"] == 1
    assert data["likes_count"] == 1
    assert data["comments_count"] == 1
    assert data["total_interactions"] >= 2
    assert data["engagement_rate"] >= 100.0
    assert any(v["user_id"] == student_user_2["id"] for v in data["recent_viewers"])

    # 6. Administrador também pode ver os insights da comunidade
    admin_insights = client.get(f"/api/v1/community/feed/{post_id}/insights", headers=headers_admin)
    assert admin_insights.status_code == 200
    assert admin_insights.json()["views_count"] == 1




