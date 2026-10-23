import pytest
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonComment, LessonFavorite, LessonCommentFavorite, UserCourse
from app.models.support import SupportTopic, SupportTopicPin
from app.models.chat import ChatMessage, ChatMessageFavorite
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

    # Vínculo de acesso ao curso para o aluno
    uc = db.query(UserCourse).filter(UserCourse.user_id == user.id, UserCourse.course_id == course.id).first()
    if not uc:
        uc = UserCourse(user_id=user.id, course_id=course.id)
        db.add(uc)
        db.commit()

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

    # Segundo usuário para DM
    user_dm = db.query(User).filter(User.email == "outro_aluno_dm@test.com").first()
    if not user_dm:
        user_dm = User(
            email="outro_aluno_dm@test.com",
            name="Mariana Contato DM",
            role="aluno",
            hashed_password=get_password_hash("Pass123!"),
            is_active=True
        )
        db.add(user_dm)
        db.commit()
        db.refresh(user_dm)

    # Mensagem de grupo (curso)
    group_msg = db.query(ChatMessage).filter(ChatMessage.message == "Mensagem no grupo do curso").first()
    if not group_msg:
        group_msg = ChatMessage(
            channel_type="course",
            course_id=course.id,
            user_id=user.id,
            message="Mensagem no grupo do curso"
        )
        db.add(group_msg)
        db.commit()
        db.refresh(group_msg)

    # Mensagem de DM
    dm_msg = db.query(ChatMessage).filter(ChatMessage.message == "Mensagem privada em DM").first()
    if not dm_msg:
        dm_msg = ChatMessage(
            channel_type="dm",
            user_id=user_dm.id,
            recipient_id=user.id,
            message="Mensagem privada em DM"
        )
        db.add(dm_msg)
        db.commit()
        db.refresh(dm_msg)

    yield {
        "user": user,
        "user_dm": user_dm,
        "course": course,
        "lesson": lesson,
        "comment": comment,
        "topic": topic,
        "group_msg": group_msg,
        "dm_msg": dm_msg,
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
    fav_comment_item = next((c for c in data["comments"] if c["id"] == comment_id), None)
    assert fav_comment_item is not None
    assert fav_comment_item["lesson_id"] == lesson_id
    assert fav_comment_item["lesson_title"] == "Aula 1 Teste"
    assert fav_comment_item["module_id"] is not None
    assert fav_comment_item["module_title"] == "Módulo 1"
    assert fav_comment_item["course_id"] is not None
    assert fav_comment_item["course_title"] == "Curso Favoritos Teste"
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


def test_favorite_messages_group_and_dm(setup_favorites_data):
    headers = get_headers("aluno_fav@test.com", "Pass123!")
    group_msg = setup_favorites_data["group_msg"]
    dm_msg = setup_favorites_data["dm_msg"]

    # Favoritar as duas mensagens
    client.post(f"/api/v1/chat/messages/{group_msg.id}/favorite", headers=headers)
    client.post(f"/api/v1/chat/messages/{dm_msg.id}/favorite", headers=headers)

    res = client.get("/api/v1/favorites?category=messages", headers=headers)
    assert res.status_code == 200
    data = res.json()

    fav_messages = data["messages"]
    assert len(fav_messages) >= 2

    # Verifica mensagem de grupo
    found_group = next((m for m in fav_messages if m["id"] == group_msg.id), None)
    assert found_group is not None
    assert found_group["channel_type"] == "course"
    assert found_group["course_id"] == setup_favorites_data["course"].id
    assert found_group["course_title"] == "Curso Favoritos Teste"

    # Verifica mensagem de DM
    found_dm = next((m for m in fav_messages if m["id"] == dm_msg.id), None)
    assert found_dm is not None
    assert found_dm["channel_type"] == "dm"
    assert found_dm["other_user"] is not None
    assert found_dm["other_user"]["name"] == "Mariana Contato DM"


