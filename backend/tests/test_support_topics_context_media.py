from app.core.security import create_access_token, get_password_hash
from app.models.course import Course, Lesson, Module, UserCourse
from app.models.user import User
from tests.conftest import TestingSessionLocal, client


def test_support_my_courses_includes_modules_and_create_topic_with_multi_media_and_context():
    db = TestingSessionLocal()
    try:
        student = User(
            email="support_ctx_student@example.com",
            name="Aluno Dúvida Contexto",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="aluno",
            is_active=True,
        )
        course = Course(title="Curso AstroWake", is_published=True, item_type="course")
        empty_course = Course(title="Bussola Astrologica Combo Sem Aulas", is_published=True, item_type="course")
        tool_app = Course(title="Bussola Astrologica APP", is_published=True, item_type="tool")
        db.add_all([student, course, empty_course, tool_app])
        db.commit()
        db.refresh(student)
        db.refresh(course)
        db.refresh(empty_course)
        db.refresh(tool_app)

        mod = Module(course_id=course.id, title="Módulo 1 - Comece por aqui", order_index=1)
        db.add(mod)
        db.commit()
        db.refresh(mod)

        lesson = Lesson(module_id=mod.id, title="Aula 2 - Desvendando o Mapa Astral", order_index=2)
        db.add(lesson)
        db.add_all([
            UserCourse(user_id=student.id, course_id=course.id),
            UserCourse(user_id=student.id, course_id=empty_course.id),
            UserCourse(user_id=student.id, course_id=tool_app.id),
        ])
        db.commit()
        db.refresh(lesson)

        course_id = course.id
        empty_course_id = empty_course.id
        tool_app_id = tool_app.id
        mod_id = mod.id
        lesson_id = lesson.id
        headers = {"Authorization": f"Bearer {create_access_token({'sub': str(student.id), 'role': 'aluno'})}"}
    finally:
        db.close()

    # 1. Verifica que GET /api/v1/support/my-courses retorna apenas cursos com >= 1 aula OU que sejam Apps (item_type == 'tool')
    res_courses = client.get("/api/v1/support/my-courses", headers=headers)
    assert res_courses.status_code == 200
    courses_data = res_courses.json()
    returned_ids = [c["id"] for c in courses_data]
    assert course_id in returned_ids
    assert tool_app_id in returned_ids
    assert empty_course_id not in returned_ids
    target_course = next((c for c in courses_data if c["id"] == course_id), None)
    assert target_course is not None
    assert len(target_course["modules"]) == 1
    assert target_course["modules"][0]["id"] == mod_id
    assert target_course["modules"][0]["title"] == "Módulo 1 - Comece por aqui"
    assert len(target_course["modules"][0]["lessons"]) == 1
    assert target_course["modules"][0]["lessons"][0]["id"] == lesson_id
    assert target_course["modules"][0]["lessons"][0]["title"] == "Aula 2 - Desvendando o Mapa Astral"

    # 2. Cria uma dúvida especificando módulo, aula e múltiplas imagens
    payload = {
        "course_id": course_id,
        "module_id": mod_id,
        "lesson_id": lesson_id,
        "title": "Dúvida sobre o material da Aula 2",
        "content": "Estou enviando dois prints do que aconteceu na aula.",
        "image_urls": [
            "https://cdn.example.com/print1.png",
            "https://cdn.example.com/print2.png",
        ],
    }
    res_create = client.post("/api/v1/support/topics", json=payload, headers=headers)
    assert res_create.status_code == 201
    created = res_create.json()
    assert created["module_id"] == mod_id
    assert created["lesson_id"] == lesson_id
    assert created["module_title"] == "Módulo 1 - Comece por aqui"
    assert created["lesson_title"] == "Aula 2 - Desvendando o Mapa Astral"
    assert created["image_url"] == "https://cdn.example.com/print1.png"
    assert created["image_urls"] == [
        "https://cdn.example.com/print1.png",
        "https://cdn.example.com/print2.png",
    ]

    # 3. Verifica que a listagem também retorna o contexto e as múltiplas mídias
    res_list = client.get(f"/api/v1/support/topics?course_id={course_id}", headers=headers)
    assert res_list.status_code == 200
    items = res_list.json()["items"]
    assert len(items) == 1
    assert items[0]["module_title"] == "Módulo 1 - Comece por aqui"
    assert items[0]["lesson_title"] == "Aula 2 - Desvendando o Mapa Astral"
    assert len(items[0]["image_urls"]) == 2
