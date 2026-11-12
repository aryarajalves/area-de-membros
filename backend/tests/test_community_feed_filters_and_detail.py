import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.community_feed import CommunityPost, CommunityPostBookmark
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def auth_user():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "feed_filters_tester@teste.com").first()
    if not user:
        user = User(
            name="Feed Tester",
            email="feed_filters_tester@teste.com",
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


def test_get_post_detail_success(auth_user):
    db = SessionLocal()
    post = CommunityPost(
        user_id=auth_user["id"],
        content="Post para teste de detalhe maximizado",
        category="dica",
        likes_count=5,
        bookmarks_count=2,
        shares_count=1,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post_id = post.id
    db.close()

    res = client.get(
        f"/api/v1/community/feed/post/{post_id}",
        headers={"Authorization": f"Bearer {auth_user['token']}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == post_id
    assert data["content"] == "Post para teste de detalhe maximizado"
    assert data["category"] == "dica"
    assert data["bookmarks_count"] == 2
    assert data["shares_count"] == 1


def test_get_post_detail_not_found(auth_user):
    res = client.get(
        "/api/v1/community/feed/post/999999",
        headers={"Authorization": f"Bearer {auth_user['token']}"},
    )
    assert res.status_code == 404
    assert "Publicação não encontrada" in res.json()["detail"]


def test_share_post_increments_shares_count(auth_user):
    db = SessionLocal()
    post = CommunityPost(
        user_id=auth_user["id"],
        content="Post para teste de compartilhamento",
        shares_count=3,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post_id = post.id
    db.close()

    res = client.post(
        f"/api/v1/community/feed/{post_id}/share",
        headers={"Authorization": f"Bearer {auth_user['token']}"},
    )
    assert res.status_code == 200
    assert res.json()["shares_count"] == 4

    # Segunda vez
    res2 = client.post(
        f"/api/v1/community/feed/{post_id}/share",
        headers={"Authorization": f"Bearer {auth_user['token']}"},
    )
    assert res2.status_code == 200
    assert res2.json()["shares_count"] == 5


def test_bookmark_post_syncs_bookmarks_count(auth_user):
    db = SessionLocal()
    post = CommunityPost(
        user_id=auth_user["id"],
        content="Post para teste de sincronização de bookmark",
        bookmarks_count=0,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post_id = post.id
    db.close()

    # Salva
    res = client.post(
        f"/api/v1/community/feed/{post_id}/bookmark",
        headers={"Authorization": f"Bearer {auth_user['token']}"},
    )
    assert res.status_code == 200
    assert res.json()["bookmarked"] is True
    assert res.json()["bookmarks_count"] == 1

    # Remove
    res2 = client.post(
        f"/api/v1/community/feed/{post_id}/bookmark",
        headers={"Authorization": f"Bearer {auth_user['token']}"},
    )
    assert res2.status_code == 200
    assert res2.json()["bookmarked"] is False
    assert res2.json()["bookmarks_count"] == 0


def test_feed_ordering_filters(auth_user):
    db = SessionLocal()
    p1 = CommunityPost(
        user_id=auth_user["id"],
        content="Post 1 - mais comentado",
        comments_count=100,
        likes_count=2,
        bookmarks_count=1,
        shares_count=5,
    )
    p2 = CommunityPost(
        user_id=auth_user["id"],
        content="Post 2 - mais salvo",
        comments_count=1,
        likes_count=3,
        bookmarks_count=50,
        shares_count=2,
    )
    p3 = CommunityPost(
        user_id=auth_user["id"],
        content="Post 3 - mais compartilhado",
        comments_count=2,
        likes_count=1,
        bookmarks_count=2,
        shares_count=80,
    )
    db.add_all([p1, p2, p3])
    db.commit()
    db.close()

    headers = {"Authorization": f"Bearer {auth_user['token']}"}

    # Teste filtro most_commented
    res_com = client.get("/api/v1/community/feed?filter=most_commented&limit=5", headers=headers)
    assert res_com.status_code == 200
    posts_com = res_com.json()["posts"]
    assert len(posts_com) >= 3
    assert posts_com[0]["comments_count"] >= posts_com[1]["comments_count"]

    # Teste filtro most_saved
    res_sav = client.get("/api/v1/community/feed?filter=most_saved&limit=5", headers=headers)
    assert res_sav.status_code == 200
    posts_sav = res_sav.json()["posts"]
    assert len(posts_sav) >= 3
    assert posts_sav[0]["bookmarks_count"] >= posts_sav[1]["bookmarks_count"]

    # Teste filtro most_shared
    res_sha = client.get("/api/v1/community/feed?filter=most_shared&limit=5", headers=headers)
    assert res_sha.status_code == 200
    posts_sha = res_sha.json()["posts"]
    assert len(posts_sha) >= 3
    assert posts_sha[0]["shares_count"] >= posts_sha[1]["shares_count"]
