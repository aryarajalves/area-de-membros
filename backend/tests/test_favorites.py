import pytest
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonComment, LessonFavorite, LessonCommentFavorite
from app.models.support import SupportTopic, SupportTopicPin
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def setup_favorites_data():
    db = TestingSessionLocal()

    # Usuário
    user = db.query(User).filter(User.email == "aluno_fav@test.com").first()
    if not user:
        user = User(
            email="aluno_fav@test.com",
            name="Aluno Favoritador",
            role="aluno",
            hashed_password=get_password_hash("Pass123!"),
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Curso, Módulo e Aula
    course = db.query(Course).filter(Course.title == "Curso Favoritos Teste").first()
    if not course:
        course = Course(title="Curso Favoritos Teste", description="Desc", is_published=True)
        db.add(course)
        db.commit()
        db.refresh(course)

    mod = db.query(Module).filter(Module.course_id == course.id).first()
    if not mod:
        mod = Module(title="Módulo 1", course_id=course.id, order_index=1)
        db.add(mod)
        db.commit()
        db.refresh(mod)

    lesson = db.query(Lesson).filter(Lesson.module_id == mod.id).first()
    if not lesson:
        lesson = Lesson(title="Aula 1 Teste", module_id=mod.id, order_index=1, duration="10 min")
        db.add(lesson)
        db.commit()
        db.refresh(lesson)

    comment = db.query(LessonComment).filter(LessonComment.lesson_id == lesson.id).first()
    if not comment:
        comment = LessonComment(lesson_id=lesson.id, user_id=user.id, content="Ótima explicação!")
        db.add(comment)
        db.commit()
        db.refresh(comment)

    topic = db.query(SupportTopic).filter(SupportTopic.title == "Dúvida Favorita Teste").first()
    if not topic:
        topic = SupportTopic(course_id=course.id, user_id=user.id, title="Dúvida Favorita Teste", content="Conteúdo dúvida")
        db.add(topic)
        db.commit()
        db.refresh(topic)

    yield {
        "user": user,
        "course": course,
        "lesson": lesson,
        "comment": comment,
        "topic": topic,
    }


def test_toggle_and_status_lesson_favorite(setup_favorites_data):
    headers = get_headers("aluno_fav@test.com", "Pass123!")
    lesson_id = setup_favorites_data["lesson"].id

    # 1. Verificar status inicial (não favoritado)
    res_status = client.get(f"/api/v1/favorites/lessons/{lesson_id}/status", headers=headers)
    assert res_status.status_code == 200
    assert res_status.json()["is_favorited"] is False

    # 2. Favoritar aula
    res_toggle = client.post(f"/api/v1/favorites/lessons/{lesson_id}/toggle", headers=headers)
    assert res_toggle.status_code == 200
    assert res_toggle.json()["is_favorited"] is True

    # 3. Verificar status agora (favoritado)
    res_status2 = client.get(f"/api/v1/favorites/lessons/{lesson_id}/status", headers=headers)
    assert res_status2.status_code == 200
    assert res_status2.json()["is_favorited"] is True

    # 4. Desfavoritar aula
    res_toggle2 = client.post(f"/api/v1/favorites/lessons/{lesson_id}/toggle", headers=headers)
    assert res_toggle2.status_code == 200
    assert res_toggle2.json()["is_favorited"] is False


def test_toggle_and_status_comment_favorite(setup_favorites_data):
    headers = get_headers("aluno_fav@test.com", "Pass123!")
    comment_id = setup_favorites_data["comment"].id

    # 1. Favoritar comentário
    res_toggle = client.post(f"/api/v1/favorites/comments/{comment_id}/toggle", headers=headers)
    assert res_toggle.status_code == 200
    assert res_toggle.json()["is_favorited"] is True

    # 2. Verificar status
    res_status = client.get(f"/api/v1/favorites/comments/{comment_id}/status", headers=headers)
    assert res_status.status_code == 200
    assert res_status.json()["is_favorited"] is True

    # 3. Desfavoritar comentário
    res_toggle2 = client.post(f"/api/v1/favorites/comments/{comment_id}/toggle", headers=headers)
    assert res_toggle2.status_code == 200
    assert res_toggle2.json()["is_favorited"] is False


def test_list_all_favorites(setup_favorites_data):
    headers = get_headers("aluno_fav@test.com", "Pass123!")
    lesson_id = setup_favorites_data["lesson"].id
    comment_id = setup_favorites_data["comment"].id
    topic_id = setup_favorites_data["topic"].id

    # Favorita aula
    client.post(f"/api/v1/favorites/lessons/{lesson_id}/toggle", headers=headers)
    # Favorita comentário
    client.post(f"/api/v1/favorites/comments/{comment_id}/toggle", headers=headers)
    # Fixa/Favorita tópico de suporte
    client.post(f"/api/v1/support/topics/{topic_id}/pin", headers=headers)

    # Busca favoritos
    res = client.get("/api/v1/favorites", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["counts"]["lessons"] >= 1
    assert data["counts"]["comments"] >= 1
    assert data["counts"]["topics"] >= 1
    assert data["counts"]["total"] >= 3

    assert any(l["id"] == lesson_id for l in data["lessons"])
    assert any(c["id"] == comment_id for c in data["comments"])
    assert any(t["id"] == topic_id for t in data["topics"])


def test_toggle_and_status_topic_favorite(setup_favorites_data):
    headers = get_headers("aluno_fav@test.com", "Pass123!")
    topic_id = setup_favorites_data["topic"].id

    # 1. Favoritar dúvida
    res_toggle = client.post(f"/api/v1/favorites/topics/{topic_id}/toggle", headers=headers)
    assert res_toggle.status_code == 200
    assert res_toggle.json()["is_favorited"] is True

    # 2. Verificar status
    res_status = client.get(f"/api/v1/favorites/topics/{topic_id}/status", headers=headers)
    assert res_status.status_code == 200
    assert res_status.json()["is_favorited"] is True

    # 3. Desfavoritar dúvida
    res_toggle2 = client.post(f"/api/v1/favorites/topics/{topic_id}/toggle", headers=headers)
    assert res_toggle2.status_code == 200
    assert res_toggle2.json()["is_favorited"] is False

