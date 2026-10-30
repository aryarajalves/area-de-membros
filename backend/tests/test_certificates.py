import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonProgress
from app.models.certificate import Certificate
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)


def create_mock_user(db, email="aluno_cert@teste.com", role="aluno", name="Aluno Certificado"):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            hashed_password=get_password_hash("senha123"),
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def create_course_with_lessons(db, num_lessons=2, workload=15, instructor="Prof. Teste"):
    course = Course(
        title="Curso de Mestria em Python",
        description="Aprenda Python do zero ao avançado",
        certificate_enabled=True,
        workload_hours=workload,
        instructor_name=instructor,
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    module = Module(title="Módulo 1", course_id=course.id, order_index=1)
    db.add(module)
    db.commit()
    db.refresh(module)

    lessons = []
    for i in range(1, num_lessons + 1):
        lesson = Lesson(
            title=f"Aula {i}",
            module_id=module.id,
            order_index=i,
        )
        db.add(lesson)
        lessons.append(lesson)
    db.commit()
    for l in lessons:
        db.refresh(l)

    return course, lessons


def test_certificate_status_not_eligible_when_incomplete():
    db = SessionLocal()
    try:
        student = create_mock_user(db, email="incompleto@teste.com", name="Aluno Incompleto")
        course, lessons = create_course_with_lessons(db, num_lessons=2)

        # Conclui apenas 1 de 2 aulas (50%)
        prog = LessonProgress(lesson_id=lessons[0].id, user_id=student.id, is_completed=True)
        db.add(prog)
        db.commit()

        token = create_access_token(data={"sub": str(student.id), "role": student.role})

        res = client.get(
            f"/api/v1/certificates/course/{course.id}/status",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["eligible"] is False
        assert data["progress_pct"] == 50
        assert data["completed_lessons"] == 1
        assert data["total_lessons"] == 2
        assert data["certificate"] is None
    finally:
        db.close()


def test_issue_certificate_fails_when_not_completed():
    db = SessionLocal()
    try:
        student = create_mock_user(db, email="reprova_cert@teste.com", name="Aluno Incompleto 2")
        course, lessons = create_course_with_lessons(db, num_lessons=2)

        token = create_access_token(data={"sub": str(student.id), "role": student.role})

        res = client.post(
            f"/api/v1/certificates/course/{course.id}/issue",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 400
        assert "necessário concluir 100%" in res.json()["detail"]
    finally:
        db.close()


def test_issue_and_validate_certificate_success():
    db = SessionLocal()
    try:
        student = create_mock_user(db, email="aprovado@teste.com", name="Carlos Eduardo")
        course, lessons = create_course_with_lessons(db, num_lessons=2, workload=20, instructor="Dr. Python")

        # Conclui todas as aulas (100%)
        for l in lessons:
            db.add(LessonProgress(lesson_id=l.id, user_id=student.id, is_completed=True))
        db.commit()

        token = create_access_token(data={"sub": str(student.id), "role": student.role})

        # 1. Verifica status (deve estar elegível)
        status_res = client.get(
            f"/api/v1/certificates/course/{course.id}/status",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert status_res.status_code == 200
        assert status_res.json()["eligible"] is True
        assert status_res.json()["progress_pct"] == 100

        # 2. Emite certificado
        issue_res = client.post(
            f"/api/v1/certificates/course/{course.id}/issue",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert issue_res.status_code == 200
        cert_data = issue_res.json()
        assert cert_data["certificate_code"].startswith("CERT-")
        assert cert_data["student_name"] == "Carlos Eduardo"
        assert cert_data["course_title"] == "Curso de Mestria em Python"
        assert cert_data["workload_hours"] == 20
        assert cert_data["instructor_name"] == "Dr. Python"

        cert_code = cert_data["certificate_code"]

        # 3. Idempotência: emitir de novo retorna o mesmo código
        reissue_res = client.post(
            f"/api/v1/certificates/course/{course.id}/issue",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert reissue_res.status_code == 200
        assert reissue_res.json()["certificate_code"] == cert_code

        # 4. Download do PDF
        pdf_res = client.get(f"/api/v1/certificates/{cert_code}/download")
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 1000

        # 5. Validação pública (sem token / anônima)
        pub_res = client.get(f"/api/v1/certificates/public/{cert_code}")
        assert pub_res.status_code == 200
        pub_data = pub_res.json()
        assert pub_data["is_valid"] is True
        assert pub_data["certificate_code"] == cert_code
        assert pub_data["student_name"] == "Carlos Eduardo"
        assert pub_data["course_title"] == "Curso de Mestria em Python"
    finally:
        db.close()


def test_validate_public_certificate_not_found():
    res = client.get("/api/v1/certificates/public/CERT-INEXISTENTE-999")
    assert res.status_code == 404
    assert "Certificado de conclusão não encontrado" in res.json()["detail"]


def test_superadmin_can_issue_certificate_without_100_percent():
    db = SessionLocal()
    try:
        admin = create_mock_user(db, email="superadmin_cert@teste.com", role="superadmin", name="Super Admin Cert")
        course, lessons = create_course_with_lessons(db, num_lessons=2)
        lessons[0].duration = "40:00"
        lessons[1].duration = "01:00:00"
        db.commit()

        token = create_access_token(data={"sub": str(admin.id), "role": admin.role})
        issue_res = client.post(
            f"/api/v1/certificates/course/{course.id}/issue",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert issue_res.status_code == 200
        cert_json = issue_res.json()
        assert cert_json["certificate_code"].startswith("CERT-")
        assert cert_json["workload_label"] == "1h 40min"
        assert cert_json["workload_hours"] == 2
    finally:
        db.close()


def test_lesson_drip_content_7_days_guarantee_lock_and_unlock():
    from datetime import datetime, timezone, timedelta
    from app.services.drip_content import is_lesson_locked_for_user, apply_drip_content_to_course_modules

    db = SessionLocal()
    try:
        student = create_mock_user(db, email="aluno_drip7d@teste.com", role="aluno", name="Aluno Garantia")
        admin = create_mock_user(db, email="admin_drip7d@teste.com", role="superadmin", name="Admin Garantia")
        course, lessons = create_course_with_lessons(db, num_lessons=2)

        # Aula 1: Imediata | Aula 2: Após 7 dias da matrícula
        lessons[0].release_type = "immediate"
        lessons[1].release_type = "days_after"
        lessons[1].release_days = 7
        lessons[1].video_url = "https://cdn.exemplo.com/aula2.mp4"
        db.commit()

        # Recém-matriculado (hoje): Aula 1 liberada, Aula 2 bloqueada
        now = datetime.now(timezone.utc)
        locked_1, _ = is_lesson_locked_for_user(lessons[0], student, enrollment_date=now)
        locked_2, avail_2 = is_lesson_locked_for_user(lessons[1], student, enrollment_date=now)
        assert locked_1 is False
        assert locked_2 is True
        assert avail_2 is not None

        # Para Superadmin: Aula 2 nunca fica bloqueada
        locked_admin, _ = is_lesson_locked_for_user(lessons[1], admin, enrollment_date=now)
        assert locked_admin is False

        # Matriculado há 8 dias: Aula 2 liberada
        eight_days_ago = now - timedelta(days=8)
        locked_after_8d, _ = is_lesson_locked_for_user(lessons[1], student, enrollment_date=eight_days_ago)
        assert locked_after_8d is False

        # Sanitização em apply_drip_content_to_course_modules para aluno recém-matriculado
        db.refresh(course)
        apply_drip_content_to_course_modules(db, student, course.id, course.modules)
        mod_lessons = course.modules[0].lessons
        assert mod_lessons[0].is_locked is False
        assert mod_lessons[1].is_locked is True
        assert mod_lessons[1].video_url is None
    finally:
        db.close()
