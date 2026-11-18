from app.core.security import create_access_token, get_password_hash
from app.models.introduction import IntroductionLike, IntroductionPost
from app.models.user import User
from tests.conftest import TestingSessionLocal, client


def test_list_introduction_reactions_returns_users_and_types():
    db = TestingSessionLocal()
    try:
        u1 = User(
            email="intro_author@example.com",
            name="Autor Intro",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="aluno",
            is_active=True,
        )
        u2 = User(
            email="intro_reactor@example.com",
            name="Maria Reagiu",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="aluno",
            is_active=True,
        )
        db.add_all([u1, u2])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)

        post = IntroductionPost(
            user_id=u1.id,
            title="Minha apresentação",
            content="Olá pessoal da comunidade!",
            likes_count=1,
        )
        db.add(post)
        db.commit()
        db.refresh(post)

        like = IntroductionLike(post_id=post.id, user_id=u2.id, reaction_type="love")
        db.add(like)
        db.commit()

        token = create_access_token(data={"sub": str(u1.id), "role": u1.role})
        headers = {"Authorization": f"Bearer {token}"}
        post_id = post.id
    finally:
        db.close()

    res = client.get(f"/api/v1/introductions/{post_id}/reactions", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["reactions"][0]["name"] == "Maria Reagiu"
    assert data["reactions"][0]["reaction_type"] == "love"

    res_missing = client.get("/api/v1/introductions/999999/reactions", headers=headers)
    assert res_missing.status_code == 404
