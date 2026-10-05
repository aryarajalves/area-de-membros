import pytest
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonComment, UserCourse
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seed_lesson_comments_data():
    db = TestingSessionLocal()
    aluno1 = User(
        email="comment_aluno1@test.com",
        name="Aluno Comentador Um",
        hashed_password=get_password_hash("pass123"),
        role="aluno",
        is_active=True,
    )
    aluno2 = User(
        email="comment_aluno2@test.com",
        name="Aluno Comentador Dois",
        hashed_password=get_password_hash("pass123"),
        role="aluno",
        is_active=True,
    )
    db.add_all([aluno1, aluno2])

    curso = Course(title="Curso de Testes de Comentários", description="Curso Teste", is_published=True)
    db.add(curso)
    db.commit()

    modulo = Module(title="Módulo 1", course_id=curso.id, order_index=1)
    db.add(modulo)
    db.commit()

    aula = Lesson(title="Aula 1: Introdução", module_id=modulo.id, order_index=1)
    db.add(aula)
    db.commit()

    # Matricular aluno1 e aluno2
    db.add_all([
        UserCourse(user_id=aluno1.id, course_id=curso.id),
        UserCourse(user_id=aluno2.id, course_id=curso.id),
    ])
    db.commit()

    c_id = curso.id
    m_id = modulo.id
    l_id = aula.id

    db.close()
    return {"course_id": c_id, "module_id": m_id, "lesson_id": l_id}


def test_toggle_like_lesson_comment_and_reply(seed_lesson_comments_data):
    data = seed_lesson_comments_data
    c_id = data["course_id"]
    m_id = data["module_id"]
    l_id = data["lesson_id"]

    aluno1_headers = get_headers("comment_aluno1@test.com", "pass123")
    aluno2_headers = get_headers("comment_aluno2@test.com", "pass123")

    # 1. Aluno 1 posta comentário raiz na aula
    res_comment = client.post(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons/{l_id}/comments",
        json={"content": "Excelente explicação dessa aula!"},
        headers=aluno1_headers,
    )
    assert res_comment.status_code == 201
    comment_id = res_comment.json()["id"]

    # 2. Aluno 2 curte o comentário
    res_like = client.post(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons/{l_id}/comments/{comment_id}/like",
        headers=aluno2_headers,
    )
    assert res_like.status_code == 200
    like_data = res_like.json()
    assert like_data["liked"] is True
    assert like_data["likes_count"] == 1

    # 3. Listar comentários e verificar likes_count e liked_by_me para Aluno 2
    res_list = client.get(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons/{l_id}/comments",
        headers=aluno2_headers,
    )
    assert res_list.status_code == 200
    comments = res_list.json()
    root = next(c for c in comments if c["id"] == comment_id)
    assert root["likes_count"] == 1
    assert root["liked_by_me"] is True

    # Para o Aluno 1, liked_by_me deve ser False
    res_list_a1 = client.get(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons/{l_id}/comments",
        headers=aluno1_headers,
    )
    root_a1 = next(c for c in res_list_a1.json() if c["id"] == comment_id)
    assert root_a1["likes_count"] == 1
    assert root_a1["liked_by_me"] is False

    # 4. Aluno 2 responde ao comentário
    res_reply = client.post(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons/{l_id}/comments",
        json={"content": "Também gostei muito!", "parent_id": comment_id},
        headers=aluno2_headers,
    )
    assert res_reply.status_code == 201
    reply_id = res_reply.json()["id"]

    # 5. Aluno 1 curte a resposta do Aluno 2
    res_like_reply = client.post(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons/{l_id}/comments/{reply_id}/like",
        headers=aluno1_headers,
    )
    assert res_like_reply.status_code == 200
    assert res_like_reply.json()["liked"] is True
    assert res_like_reply.json()["likes_count"] == 1

    # 6. Aluno 2 descurte o comentário raiz
    res_unlike = client.post(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons/{l_id}/comments/{comment_id}/like",
        headers=aluno2_headers,
    )
    assert res_unlike.status_code == 200
    assert res_unlike.json()["liked"] is False
    assert res_unlike.json()["likes_count"] == 0
