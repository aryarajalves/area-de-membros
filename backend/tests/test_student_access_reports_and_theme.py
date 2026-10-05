import pytest
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonReport
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def setup_reports_and_theme_data():
    db = TestingSessionLocal()

    # Cria ou busca Admin
    admin = db.query(User).filter(User.email == "admin_reports_test@test.com").first()
    if not admin:
        admin = User(
            email="admin_reports_test@test.com",
            name="Admin Reports",
            role="superadmin",
            hashed_password=get_password_hash("AdminPass123!"),
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # Cria ou busca Aluno
    student = db.query(User).filter(User.email == "student_reports_test@test.com").first()
    if not student:
        student = User(
            email="student_reports_test@test.com",
            name="Aluno Reports",
            role="aluno",
            hashed_password=get_password_hash("StudentPass123!"),
            is_active=True
        )
        db.add(student)
        db.commit()
        db.refresh(student)

    # Cria curso, módulo e aula para associar ao relato
    course = db.query(Course).filter(Course.title == "Curso Teste Relatos").first()
    if not course:
        course = Course(title="Curso Teste Relatos", is_published=True)
        db.add(course)
        db.commit()
        db.refresh(course)

    module = db.query(Module).filter(Module.course_id == course.id).first()
    if not module:
        module = Module(title="Modulo 1", course_id=course.id, order_index=1)
        db.add(module)
        db.commit()
        db.refresh(module)

    lesson = db.query(Lesson).filter(Lesson.module_id == module.id).first()
    if not lesson:
        lesson = Lesson(title="Aula 1", module_id=module.id, order_index=1)
        db.add(lesson)
        db.commit()
        db.refresh(lesson)

    # Cria um relato de exemplo
    report = db.query(LessonReport).filter(LessonReport.lesson_id == lesson.id).first()
    if not report:
        report = LessonReport(
            lesson_id=lesson.id,
            user_id=student.id,
            issue_type="video",
            description="Problema de áudio nesta aula",
            status="open"
        )
        db.add(report)
        db.commit()
        db.refresh(report)

    report_id = report.id
    db.close()

    return {
        "admin_email": "admin_reports_test@test.com",
        "admin_pass": "AdminPass123!",
        "student_email": "student_reports_test@test.com",
        "student_pass": "StudentPass123!",
        "report_id": report_id
    }


def test_student_can_view_reports_and_summary(setup_reports_and_theme_data):
    data = setup_reports_and_theme_data
    student_headers = get_headers(data["student_email"], data["student_pass"])

    # 1. Aluno pode obter contadores/resumo de relatos
    res_summary = client.get("/api/v1/courses/reports/summary", headers=student_headers)
    assert res_summary.status_code == 200
    summary_data = res_summary.json()
    assert "pending_count" in summary_data
    assert "resolved_count" in summary_data
    assert "total_count" in summary_data

    # 2. Aluno pode listar relatos de aula
    res_list = client.get("/api/v1/courses/reports", headers=student_headers)
    assert res_list.status_code == 200
    reports = res_list.json()
    assert isinstance(reports, list)
    assert len(reports) >= 1
    assert any(r["id"] == data["report_id"] for r in reports)


def test_student_cannot_modify_or_delete_reports(setup_reports_and_theme_data):
    data = setup_reports_and_theme_data
    student_headers = get_headers(data["student_email"], data["student_pass"])

    # 1. Aluno é bloqueado (403) ao tentar alterar status de relato
    patch_url = f"/api/v1/courses/reports/{data['report_id']}"
    res_patch = client.patch(patch_url, headers=student_headers, json={"status": "resolved"})
    assert res_patch.status_code == 403

    # 2. Aluno é bloqueado (403) ao tentar deletar relato
    res_delete = client.delete(patch_url, headers=student_headers)
    assert res_delete.status_code == 403


def test_student_can_update_platform_theme(setup_reports_and_theme_data):
    data = setup_reports_and_theme_data
    student_headers = get_headers(data["student_email"], data["student_pass"])

    # Aluno pode alterar cor de fundo na aba de configurações
    res = client.patch(
        "/api/v1/courses/platform-theme",
        headers=student_headers,
        json={"bg_color": "#121620"}
    )
    assert res.status_code == 200
    assert res.json()["bg_color"] == "#121620"
