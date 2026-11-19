from app.core.security import create_access_token, get_password_hash
from app.models.community_feed import CommunityPost
from app.models.user import User
from tests.conftest import TestingSessionLocal, client


def test_engagement_filters_exclude_zero_engagement_posts():
    db = TestingSessionLocal()
    try:
        admin = User(
            email="feed_filter_admin@example.com",
            name="Admin Feed",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        zero_post = CommunityPost(user_id=admin.id, content="Post zerado", likes_count=0, comments_count=0, bookmarks_count=0, shares_count=0)
        liked_post = CommunityPost(user_id=admin.id, content="Post curtido", likes_count=3)
        commented_post = CommunityPost(user_id=admin.id, content="Post comentado", comments_count=2)
        saved_post = CommunityPost(user_id=admin.id, content="Post salvo", bookmarks_count=1)
        shared_post = CommunityPost(user_id=admin.id, content="Post compartilhado", shares_count=4)
        db.add_all([zero_post, liked_post, commented_post, saved_post, shared_post])
        db.commit()

        token = create_access_token(data={"sub": str(admin.id), "role": admin.role})
        headers = {"Authorization": f"Bearer {token}"}
    finally:
        db.close()

    # Filtro geral traz todos (inclusive o zerado)
    all_res = client.get("/api/v1/community/feed?filter=all", headers=headers)
    assert all_res.status_code == 200
    assert any(p["content"] == "Post zerado" for p in all_res.json()["posts"])

    # Cada filtro de engajamento exclui posts com 0 naquela métrica
    checks = [
        ("most_liked", "Post curtido"),
        ("most_commented", "Post comentado"),
        ("most_saved", "Post salvo"),
        ("most_shared", "Post compartilhado"),
    ]
    for filter_name, expected_content in checks:
        res = client.get(f"/api/v1/community/feed?filter={filter_name}", headers=headers)
        assert res.status_code == 200
        contents = [p["content"] for p in res.json()["posts"]]
        assert contents == [expected_content]
