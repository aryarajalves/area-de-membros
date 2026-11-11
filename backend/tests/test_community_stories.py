import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.community_stories import CommunityStory, CommunityStoryView, CommunityStoryReaction
from app.models.chat import ChatMessage
from app.models.gamification import GamificationPoint
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def story_user_1():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "storyuser1@teste.com").first()
    if not user:
        user = User(
            name="Story User Um",
            email="storyuser1@teste.com",
            hashed_password="hashed_pwd",
            role="aluno",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    uid = user.id
    db.close()
    return {"id": uid, "token": token}


@pytest.fixture
def story_user_2():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "storyuser2@teste.com").first()
    if not user:
        user = User(
            name="Story User Dois",
            email="storyuser2@teste.com",
            hashed_password="hashed_pwd",
            role="aluno",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    uid = user.id
    db.close()
    return {"id": uid, "token": token}


@pytest.fixture
def admin_user():
    db = SessionLocal()
    user = db.query(User).filter(User.role == "superadmin").first()
    if not user:
        user = User(
            name="Admin Story",
            email="adminstory@teste.com",
            hashed_password="hashed_pwd",
            role="superadmin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    uid = user.id
    db.close()
    return {"id": uid, "token": token}


def test_create_and_get_story(story_user_1):
    headers = {"Authorization": f"Bearer {story_user_1['token']}"}

    payload = {
        "media_url": "/api/v1/community/stories/media/test_image.jpg",
        "media_type": "image",
        "caption": "Meu primeiro story de estudo!",
        "duration_seconds": 5,
    }

    res = client.post("/api/v1/community/stories", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["caption"] == "Meu primeiro story de estudo!"
    assert data["media_type"] == "image"
    assert data["user_id"] == story_user_1["id"]
    assert data["is_owner"] is True
    assert data["views_count"] == 0

    story_id = data["id"]

    # Verifica se os stories do usuário são retornados
    get_res = client.get(f"/api/v1/community/stories/user/{story_user_1['id']}", headers=headers)
    assert get_res.status_code == 200
    stories = get_res.json()
    assert any(s["id"] == story_id for s in stories)


def test_story_gamification_xp_award(story_user_1):
    headers = {"Authorization": f"Bearer {story_user_1['token']}"}

    db = SessionLocal()
    initial_pts = db.query(GamificationPoint).filter(
        GamificationPoint.user_id == story_user_1["id"],
        GamificationPoint.action == "community_story_post"
    ).count()
    db.close()

    res = client.post("/api/v1/community/stories", json={
        "media_url": "/api/v1/community/stories/media/xp_test.png",
        "media_type": "image",
        "caption": "Story que gera XP",
    }, headers=headers)
    assert res.status_code == 200

    db = SessionLocal()
    new_pts = db.query(GamificationPoint).filter(
        GamificationPoint.user_id == story_user_1["id"],
        GamificationPoint.action == "community_story_post"
    ).count()
    db.close()

    assert new_pts >= initial_pts + 1


def test_stories_tray_grouping(story_user_1, story_user_2):
    headers_1 = {"Authorization": f"Bearer {story_user_1['token']}"}
    headers_2 = {"Authorization": f"Bearer {story_user_2['token']}"}

    # User 2 posta um story
    client.post("/api/v1/community/stories", json={
        "media_url": "/api/v1/community/stories/media/tray_test.jpg",
        "media_type": "image",
        "caption": "Story do User 2",
    }, headers=headers_2)

    # User 1 consulta a bandeja
    res = client.get("/api/v1/community/stories/tray", headers=headers_1)
    assert res.status_code == 200
    tray = res.json()
    assert len(tray) >= 1
    user_2_group = next((g for g in tray if g["user_id"] == story_user_2["id"]), None)
    assert user_2_group is not None
    assert user_2_group["has_unviewed"] is True


def test_story_view_and_reaction(story_user_1, story_user_2):
    headers_1 = {"Authorization": f"Bearer {story_user_1['token']}"}
    headers_2 = {"Authorization": f"Bearer {story_user_2['token']}"}

    create_res = client.post("/api/v1/community/stories", json={
        "media_url": "/api/v1/community/stories/media/react_test.jpg",
        "media_type": "image",
        "caption": "Story para reagir",
    }, headers=headers_1)
    story_id = create_res.json()["id"]

    # User 2 visualiza
    view_res = client.post(f"/api/v1/community/stories/{story_id}/view", headers=headers_2)
    assert view_res.status_code == 200
    assert view_res.json()["viewed"] is True

    # User 2 reage com emoji 'fire'
    react_res = client.post(f"/api/v1/community/stories/{story_id}/react", json={"reaction_type": "fire"}, headers=headers_2)
    assert react_res.status_code == 200
    assert react_res.json()["reaction"] == "fire"

    # User 1 consulta lista de visualizadores
    views_res = client.get(f"/api/v1/community/stories/{story_id}/views", headers=headers_1)
    assert views_res.status_code == 200
    viewers = views_res.json()
    assert any(v["user_id"] == story_user_2["id"] for v in viewers)


def test_story_reply_via_dm(story_user_1, story_user_2):
    headers_1 = {"Authorization": f"Bearer {story_user_1['token']}"}
    headers_2 = {"Authorization": f"Bearer {story_user_2['token']}"}

    create_res = client.post("/api/v1/community/stories", json={
        "media_url": "/api/v1/community/stories/media/dm_story.jpg",
        "media_type": "image",
        "caption": "Story com resposta DM",
    }, headers=headers_1)
    story_id = create_res.json()["id"]

    # User 2 responde ao story do User 1
    reply_payload = {"message": "Que massa esse conteúdo, parabéns!"}
    reply_res = client.post(f"/api/v1/community/stories/{story_id}/reply", json=reply_payload, headers=headers_2)
    assert reply_res.status_code == 200
    assert reply_res.json()["sent"] is True

    # Verifica no banco se a DM foi criada
    db = SessionLocal()
    dm = db.query(ChatMessage).filter(
        ChatMessage.channel_type == "dm",
        ChatMessage.user_id == story_user_2["id"],
        ChatMessage.recipient_id == story_user_1["id"]
    ).order_by(ChatMessage.created_at.desc()).first()
    db.close()
    assert dm is not None


def test_story_delete_permissions(story_user_1, story_user_2, admin_user):
    headers_1 = {"Authorization": f"Bearer {story_user_1['token']}"}
    headers_2 = {"Authorization": f"Bearer {story_user_2['token']}"}
    admin_headers = {"Authorization": f"Bearer {admin_user['token']}"}

    create_res = client.post("/api/v1/community/stories", json={
        "media_url": "/api/v1/community/stories/media/delete_test.jpg",
        "media_type": "image",
    }, headers=headers_1)
    story_id = create_res.json()["id"]

    # User 2 tenta excluir story de User 1 (deve falhar com 403)
    del_forbidden = client.delete(f"/api/v1/community/stories/{story_id}", headers=headers_2)
    assert del_forbidden.status_code == 403

    # Admin pode excluir
    del_admin = client.delete(f"/api/v1/community/stories/{story_id}", headers=admin_headers)
    assert del_admin.status_code == 200

    # Confirma que não existe mais
    check_res = client.get(f"/api/v1/community/stories/user/{story_user_1['id']}", headers=headers_1)
    assert all(s["id"] != story_id for s in check_res.json())
