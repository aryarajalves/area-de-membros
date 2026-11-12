import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonReport
from app.models.chat import ChatMessage
from app.core.security import get_password_hash, create_access_token
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def test_lesson_report_resolution_sends_dm_notification():
    db = TestingSessionLocal()
    try:
        # 1. Cria usuário aluno e admin
        student = User(
            name="Aluno Reporte Teste",
            email="aluno_reporte_teste@exemplo.com",
            hashed_password=get_password_hash("Aluno123!"),
            role="aluno",
            is_active=True
        )
        admin = User(
            name="Admin Suporte Teste",
            email="admin_suporte_teste@exemplo.com",
            hashed_password=get_password_hash("Admin123!"),
            role="admin",
            is_active=True
        )
        db.add_all([student, admin])
        db.commit()
        db.refresh(student)
        db.refresh(admin)

        # 2. Cria curso, módulo e aula
        course = Course(title="Curso Relato Teste", is_published=True)
        db.add(course)
        db.commit()
        db.refresh(course)

        module = Module(title="Módulo 1", course_id=course.id, order_index=1)
        db.add(module)
        db.commit()
        db.refresh(module)

        lesson = Lesson(title="Aula com Falha no Áudio", module_id=module.id, order_index=1)
        db.add(lesson)
        db.commit()
        db.refresh(lesson)

        # 3. Cria relato de problema aberto pelo aluno
        report = LessonReport(
            lesson_id=lesson.id,
            user_id=student.id,
            issue_type="audio",
            description="O som falha nos primeiros 30 segundos",
            status="open"
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        admin_token = create_access_token(data={"sub": str(admin.id)})
        headers = {"Authorization": f"Bearer {admin_token}"}

        # 4. Lista relatos e valida presença de module_id e course_id
        res_list = client.get("/api/v1/courses/reports", headers=headers)
        assert res_list.status_code == 200
        reports_data = res_list.json()
        matched = next((r for r in reports_data if r["id"] == report.id), None)
        assert matched is not None
        assert matched["lesson_id"] == lesson.id
        assert matched["course_id"] == course.id
        assert matched["module_id"] == module.id
        assert matched["lesson_title"] == "Aula com Falha no Áudio"

        # 5. Admin marca o relato como resolvido
        res_patch = client.patch(
            f"/api/v1/courses/reports/{report.id}",
            json={"status": "resolved"},
            headers=headers
        )
        assert res_patch.status_code == 200
        assert res_patch.json()["status"] == "resolved"

        # 6. Valida que uma DM foi gerada no banco para o aluno
        dm = db.query(ChatMessage).filter(
            ChatMessage.channel_type == "dm",
            ChatMessage.recipient_id == student.id,
            ChatMessage.user_id == admin.id
        ).first()

        assert dm is not None
        assert "marcado como resolvido" in dm.message
        assert "Aula com Falha no Áudio" in dm.message
        assert dm.button_text == "Acessar Aula"
        assert dm.button_action_type == "lesson"
        assert dm.button_url == f"internal://lesson/{course.id}/{lesson.id}"

    finally:
        db.close()
