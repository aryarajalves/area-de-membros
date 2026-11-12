import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.community_feed import CommunityPost, CommunityPostPollVote, CommunityPostReport
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def test_admin_user():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "feedadmin_v2@teste.com").first()
    if not user:
        user = User(
            name="Feed Admin V2",
            email="feedadmin_v2@teste.com",
            hashed_password="hashed_pwd",
            role="admin",
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
def test_student_user():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "feedstudent_v2@teste.com").first()
    if not user:
        user = User(
            name="Feed Student V2",
            email="feedstudent_v2@teste.com",
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


def test_create_post_with_category_and_filter(test_admin_user):
    headers = {"Authorization": f"Bearer {test_admin_user['token']}"}

    # 1. Cria post com categoria "vitoria"
    res = client.post(
        "/api/v1/community/feed",
        headers=headers,
        json={
            "content": "Fechei meu primeiro cliente de R$ 5.000 usando as estratégias do curso! #Vitória",
            "category": "vitoria",
        },
    )
    assert res.status_code == 201
    post_data = res.json()
    assert post_data["category"] == "vitoria"
    post_id = post_data["id"]

    # 2. Filtra feed por category=vitoria
    feed_res = client.get("/api/v1/community/feed?category=vitoria", headers=headers)
    assert feed_res.status_code == 200
    feed_data = feed_res.json()
    found = any(p["id"] == post_id for p in feed_data["posts"])
    assert found is True

    # 3. Filtra por category=duvida (não deve conter esse post)
    feed_duvida = client.get("/api/v1/community/feed?category=duvida", headers=headers)
    assert feed_duvida.status_code == 200
    assert not any(p["id"] == post_id for p in feed_duvida.json()["posts"])


def test_poll_creation_and_voting(test_admin_user, test_student_user):
    headers_admin = {"Authorization": f"Bearer {test_admin_user['token']}"}
    headers_student = {"Authorization": f"Bearer {test_student_user['token']}"}

    # 1. Cria post com enquete
    res = client.post(
        "/api/v1/community/feed",
        headers=headers_admin,
        json={
            "content": "Qual é a sua maior dificuldade com tráfego pago hoje?",
            "category": "duvida",
            "poll_question": "Qual é a sua maior dificuldade?",
            "poll_options": ["Criar criativos", "Escalar orçamento", "Estrutura de métricas"],
        },
    )
    assert res.status_code == 201
    post_data = res.json()
    assert post_data["poll_question"] == "Qual é a sua maior dificuldade?"
    assert len(post_data["poll_options"]) == 3
    post_id = post_data["id"]

    # 2. Aluno vota na opção 1
    vote_res = client.post(
        f"/api/v1/community/feed/{post_id}/poll/vote",
        headers=headers_student,
        json={"option_id": 1},
    )
    assert vote_res.status_code == 200
    voted_post = vote_res.json()
    assert voted_post["total_poll_votes"] == 1
    assert voted_post["my_poll_vote"] == 1

    opt1 = next(opt for opt in voted_post["poll_options"] if opt["id"] == 1)
    assert opt1["votes"] == 1
    assert opt1["percent"] == 100.0

    # 3. Tentativa de votar novamente pelo mesmo usuário (deve falhar 400)
    vote_again = client.post(
        f"/api/v1/community/feed/{post_id}/poll/vote",
        headers=headers_student,
        json={"option_id": 2},
    )
    assert vote_again.status_code == 400
    assert "já votou" in vote_again.json()["detail"].lower()


def test_post_comment_with_audio_and_gif(test_admin_user):
    headers = {"Authorization": f"Bearer {test_admin_user['token']}"}

    # Cria post
    post_res = client.post(
        "/api/v1/community/feed",
        headers=headers,
        json={"content": "Post para teste de comentários com mídia."},
    )
    post_id = post_res.json()["id"]

    # Comentário de áudio
    comment_res = client.post(
        f"/api/v1/community/feed/{post_id}/comments",
        headers=headers,
        json={
            "content": "Ouça meu feedback em áudio!",
            "media_type": "audio",
            "media_url": "/api/v1/feed/media/audio_test_123.webm",
        },
    )
    assert comment_res.status_code == 201
    c_data = comment_res.json()
    assert c_data["media_type"] == "audio"
    assert "/api/v1/feed/media/audio_test_123.webm" in c_data["media_url"]


def test_report_post_and_admin_moderation(test_admin_user, test_student_user):
    headers_admin = {"Authorization": f"Bearer {test_admin_user['token']}"}
    headers_student = {"Authorization": f"Bearer {test_student_user['token']}"}

    # 1. Cria post a ser denunciado
    res = client.post(
        "/api/v1/community/feed",
        headers=headers_student,
        json={"content": "Post com conteúdo suspeito para moderação."},
    )
    post_id = res.json()["id"]

    # 2. Usuário denuncia o post
    rep_res = client.post(
        f"/api/v1/community/feed/{post_id}/report",
        headers=headers_admin,
        json={
            "reason": "spam",
            "description": "Conteúdo promocional repetitivo",
        },
    )
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["reason"] == "spam"
    report_id = rep_data["id"]

    # 3. Admin lista denúncias
    list_rep = client.get("/api/v1/community/feed/admin/reports?status=pending", headers=headers_admin)
    assert list_rep.status_code == 200
    reports = list_rep.json()["reports"]
    assert any(r["id"] == report_id for r in reports)

    # 4. Admin descarta denúncia
    mod_res = client.put(
        f"/api/v1/community/feed/admin/reports/{report_id}?action=dismiss",
        headers=headers_admin,
    )
    assert mod_res.status_code == 200
    assert mod_res.json()["status"] == "dismissed"
