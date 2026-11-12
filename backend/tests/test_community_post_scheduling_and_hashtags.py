import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.community_feed import CommunityPost
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def auth_user():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "feed_schedule_test@teste.com").first()
    if not user:
        user = User(
            name="Schedule Tester",
            email="feed_schedule_test@teste.com",
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
    return {"id": user_id, "token": token, "email": user.email}


def test_create_post_with_location(auth_user):
    headers = {"Authorization": f"Bearer {auth_user['token']}"}
    payload = {
        "content": "Publicação com localização #estudos #foco",
        "category": "dica",
        "location": "São Paulo, SP",
    }
    response = client.post("/api/v1/community/feed", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["location"] == "São Paulo, SP"
    assert data["is_scheduled"] is False
    assert data["scheduled_at"] is None


def test_create_scheduled_post_flow(auth_user):
    headers = {"Authorization": f"Bearer {auth_user['token']}"}
    future_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    payload = {
        "content": "Post agendado para o futuro #novidade",
        "category": "aviso",
        "scheduled_at": future_time,
    }
    response = client.post("/api/v1/community/feed", json=payload, headers=headers)
    assert response.status_code == 201
    created_post = response.json()
    post_id = created_post["id"]
    assert created_post["is_scheduled"] is True
    assert created_post["scheduled_at"] is not None

    # No feed geral padrão, NÃO deve aparecer
    res_feed = client.get("/api/v1/community/feed?filter=all", headers=headers)
    assert res_feed.status_code == 200
    feed_posts = res_feed.json()["posts"]
    assert not any(p["id"] == post_id for p in feed_posts)

    # No filtro 'scheduled', DEVE aparecer
    res_sched = client.get("/api/v1/community/feed?filter=scheduled", headers=headers)
    assert res_sched.status_code == 200
    sched_posts = res_sched.json()["posts"]
    assert any(p["id"] == post_id for p in sched_posts)

    # Publicar imediatamente
    res_pub = client.post(f"/api/v1/community/feed/{post_id}/publish-now", headers=headers)
    assert res_pub.status_code == 200
    published = res_pub.json()
    assert published["is_scheduled"] is False
    assert published["scheduled_at"] is None

    # Agora DEVE aparecer no feed geral
    res_feed_after = client.get("/api/v1/community/feed?filter=all", headers=headers)
    assert res_feed_after.status_code == 200
    assert any(p["id"] == post_id for p in res_feed_after.json()["posts"])


def test_filter_posts_by_hashtag(auth_user):
    headers = {"Authorization": f"Bearer {auth_user['token']}"}
    unique_tag = f"hashtag_teste_{int(datetime.now().timestamp())}"
    payload = {
        "content": f"Testando mecanismo de busca por #{unique_tag} na comunidade",
        "category": "geral",
    }
    response = client.post("/api/v1/community/feed", json=payload, headers=headers)
    assert response.status_code == 201
    post_id = response.json()["id"]

    # Busca com a hashtag
    res_tag = client.get(f"/api/v1/community/feed?hashtag={unique_tag}", headers=headers)
    assert res_tag.status_code == 200
    results = res_tag.json()["posts"]
    assert any(p["id"] == post_id for p in results)

    # Busca com hashtag inexistente
    res_tag_miss = client.get(f"/api/v1/community/feed?hashtag=inexistente_xyz_999", headers=headers)
    assert res_tag_miss.status_code == 200
    miss_results = res_tag_miss.json()["posts"]
    assert not any(p["id"] == post_id for p in miss_results)
