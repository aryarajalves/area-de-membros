import pytest
from app.core.config import settings
from app.models.user import User
from app.models.course import Course, Module, Lesson
from app.core.security import get_password_hash
from tests.conftest import TestingSessionLocal, client

def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_setup():
    db = TestingSessionLocal()
    course = Course(title="Curso Astrologia Avançada", description="Curso de teste", is_published=True)
    db.add(course)
    db.commit()
    db.refresh(course)

    mod = Module(title="Módulo 2: Casas Astrológicas", course_id=course.id, order_index=1)
    db.add(mod)
    db.commit()
    db.refresh(mod)

    lesson = Lesson(
        title="Sol na Casa 2: Prosperidade e Finanças",
        module_id=mod.id,
        order_index=1,
        description="Conteúdo da aula"
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    course_id = course.id
    module_id = mod.id
    lesson_id = lesson.id
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    db.close()

    return {
        "course_id": course_id,
        "module_id": module_id,
        "lesson_id": lesson_id,
        "admin_headers": admin_headers
    }

def test_get_lesson_mention_context_success(test_setup):
    lesson_id = test_setup["lesson_id"]
    headers = test_setup["admin_headers"]

    res = client.get(f"/api/v1/courses/lessons/{lesson_id}/context", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["lesson_id"] == lesson_id
    assert data["lesson_title"] == "Sol na Casa 2: Prosperidade e Finanças"
    assert data["module_id"] == test_setup["module_id"]
    assert data["module_title"] == "Módulo 2: Casas Astrológicas"
    assert data["course_id"] == test_setup["course_id"]
    assert data["course_title"] == "Curso Astrologia Avançada"

def test_get_lesson_mention_context_not_found(test_setup):
    headers = test_setup["admin_headers"]
    res = client.get("/api/v1/courses/lessons/999999/context", headers=headers)
    assert res.status_code == 404
    assert res.json()["detail"] == "Aula não encontrada."
