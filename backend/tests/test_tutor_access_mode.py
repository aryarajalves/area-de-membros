import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base
from app.models.user import User
from app.models.course import Course, Module, Lesson
from app.models.tutor_ia import AiTutorSetting
from app.core.security import get_password_hash, create_access_token
from tests.conftest import engine, TestingSessionLocal

client = TestClient(app)


@pytest.fixture
def setup_access_mode_data():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Admin
        admin = db.query(User).filter(User.email == "admin_access_mode@example.com").first()
        if not admin:
            admin = User(
                email="admin_access_mode@example.com",
                name="Admin Access Mode",
                hashed_password=get_password_hash("Secret123!"),
                role="admin",
                is_active=True,
                token_version=1
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # Aluno
        student = db.query(User).filter(User.email == "student_access_mode@example.com").first()
        if not student:
            student = User(
                email="student_access_mode@example.com",
                name="Aluno Access Mode",
                hashed_password=get_password_hash("Secret123!"),
                role="user",
                is_active=True,
                ai_tutor_active=False,
                token_version=1
            )
            db.add(student)
            db.commit()
            db.refresh(student)

        # Curso e Aula
        course = db.query(Course).filter(Course.title == "Curso Access Mode").first()
        if not course:
            course = Course(title="Curso Access Mode", is_published=True)
            db.add(course)
            db.commit()
            db.refresh(course)

            mod = Module(title="Módulo 1", course_id=course.id, order_index=1)
            db.add(mod)
            db.commit()
            db.refresh(mod)

            lesson = Lesson(
                title="Aula 1 Access Mode",
                module_id=mod.id,
                order_index=1,
                video_url="https://youtube.com/watch?v=mock1"
            )
            db.add(lesson)
            db.commit()
            db.refresh(lesson)
        else:
            lesson = db.query(Lesson).join(Module).filter(Module.course_id == course.id).first()

        # Garante AiTutorSetting existente
        setting = db.query(AiTutorSetting).first()
        if not setting:
            setting = AiTutorSetting(
                is_enabled=True,
                access_mode="public",
                maintenance_message=""
            )
            db.add(setting)
            db.commit()
            db.refresh(setting)

        admin_token = create_access_token(data={"sub": str(admin.id), "token_version": admin.token_version})
        student_token = create_access_token(data={"sub": str(student.id), "token_version": student.token_version})

        yield {
            "db": db,
            "admin": admin,
            "student": student,
            "course": course,
            "lesson": lesson,
            "admin_headers": {"Authorization": f"Bearer {admin_token}"},
            "student_headers": {"Authorization": f"Bearer {student_token}"}
        }
    finally:
        db.close()


def test_tutor_settings_update_access_mode(setup_access_mode_data):
    """Admin consegue alterar access_mode e maintenance_message; aluno recebe 403."""
    admin_headers = setup_access_mode_data["admin_headers"]
    student_headers = setup_access_mode_data["student_headers"]

    # Aluno tenta atualizar -> 403
    res_student = client.put(
        "/api/v1/tutor-ia/settings",
        json={"access_mode": "maintenance", "maintenance_message": "Tentativa de aluno"},
        headers=student_headers
    )
    assert res_student.status_code == 403

    # Admin atualiza para maintenance
    res_admin = client.put(
        "/api/v1/tutor-ia/settings",
        json={"access_mode": "maintenance", "maintenance_message": "Manutenção preventiva programada"},
        headers=admin_headers
    )
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert data["access_mode"] == "maintenance"
    assert data["maintenance_message"] == "Manutenção preventiva programada"


def test_tutor_status_in_maintenance_mode(setup_access_mode_data):
    """No modo manutenção, aluno vê o chat mas com is_in_maintenance=True e can_ask=False."""
    db = setup_access_mode_data["db"]
    admin_headers = setup_access_mode_data["admin_headers"]
    student_headers = setup_access_mode_data["student_headers"]
    course = setup_access_mode_data["course"]

    setting = db.query(AiTutorSetting).first()
    if not setting:
        setting = AiTutorSetting()
        db.add(setting)
    setting.is_enabled = True
    setting.access_mode = "maintenance"
    setting.maintenance_message = "Tutor em ajustes finos"
    db.commit()

    # Status para o aluno
    res_student = client.get(
        f"/api/v1/tutor-ia/status?course_id={course.id}",
        headers=student_headers
    )
    assert res_student.status_code == 200
    data_student = res_student.json()
    assert data_student["is_visible"] is True
    assert data_student["is_in_maintenance"] is True
    assert data_student["can_ask"] is False
    assert "Tutor em ajustes finos" in data_student["maintenance_message"]

    # Status para o admin (admin mantém acesso de teste)
    res_admin = client.get(
        f"/api/v1/tutor-ia/status?course_id={course.id}",
        headers=admin_headers
    )
    assert res_admin.status_code == 200
    data_admin = res_admin.json()
    assert data_admin["is_visible"] is True
    assert data_admin["is_in_maintenance"] is False
    assert data_admin["can_ask"] is True


def test_tutor_status_in_private_team_mode(setup_access_mode_data):
    """No modo equipe privada, aluno tem is_visible=False; admin tem is_visible=True."""
    db = setup_access_mode_data["db"]
    admin_headers = setup_access_mode_data["admin_headers"]
    student_headers = setup_access_mode_data["student_headers"]
    course = setup_access_mode_data["course"]

    setting = db.query(AiTutorSetting).first()
    if not setting:
        setting = AiTutorSetting()
        db.add(setting)
    setting.is_enabled = True
    setting.access_mode = "private_team"
    db.commit()

    # Aluno: invisível
    res_student = client.get(
        f"/api/v1/tutor-ia/status?course_id={course.id}",
        headers=student_headers
    )
    assert res_student.status_code == 200
    data_student = res_student.json()
    assert data_student["is_visible"] is False
    assert data_student["can_ask"] is False

    # Admin: visível e liberado
    res_admin = client.get(
        f"/api/v1/tutor-ia/status?course_id={course.id}",
        headers=admin_headers
    )
    assert res_admin.status_code == 200
    data_admin = res_admin.json()
    assert data_admin["is_visible"] is True
    assert data_admin["can_ask"] is True


def test_tutor_stream_blocked_in_maintenance(setup_access_mode_data):
    """Tentativa de envio de mensagem por aluno em modo manutenção retorna HTTP 503."""
    db = setup_access_mode_data["db"]
    student_headers = setup_access_mode_data["student_headers"]
    course = setup_access_mode_data["course"]
    lesson = setup_access_mode_data["lesson"]

    setting = db.query(AiTutorSetting).first()
    if not setting:
        setting = AiTutorSetting()
        db.add(setting)
    setting.is_enabled = True
    setting.access_mode = "maintenance"
    setting.maintenance_message = "Sistema em manutenção preventiva"
    db.commit()

    res = client.post(
        "/api/v1/tutor-ia/chat/stream",
        json={
            "course_id": course.id,
            "lesson_id": lesson.id,
            "message": "Olá, tutor!"
        },
        headers=student_headers
    )
    assert res.status_code == 503
    assert "manutenção" in res.json()["detail"].lower()
