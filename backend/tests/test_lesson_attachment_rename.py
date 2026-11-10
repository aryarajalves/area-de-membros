import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonAttachment
from app.core.security import get_password_hash, create_access_token
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def test_rename_lesson_attachment():
    db = TestingSessionLocal()
    try:
        # Cria admin
        admin = User(
            email="admin_attachment@teste.com",
            name="Admin Attachment",
            hashed_password=get_password_hash("AdminPass123!"),
            role="admin",
            is_active=True
        )
        # Cria aluno comum
        student = User(
            email="student_attachment@teste.com",
            name="Student Attachment",
            hashed_password=get_password_hash("StudentPass123!"),
            role="aluno",
            is_active=True
        )
        db.add_all([admin, student])
        db.commit()
        db.refresh(admin)
        db.refresh(student)

        admin_token = create_access_token(data={"sub": str(admin.id)})
        student_token = create_access_token(data={"sub": str(student.id)})

        # Cria curso, módulo, aula e anexo
        course = Course(title="Curso Teste Anexos", is_published=True)
        db.add(course)
        db.commit()

        module = Module(course_id=course.id, title="Módulo 1", order_index=1)
        db.add(module)
        db.commit()

        lesson = Lesson(module_id=module.id, title="Aula 1", order_index=1)
        db.add(lesson)
        db.commit()

        att = LessonAttachment(
            lesson_id=lesson.id,
            title="Checklist Bússola Astrológica (1).pdf",
            description="Descrição antiga",
            file_url="/api/v1/courses/attachments/checklist.pdf",
            file_type="pdf",
            file_size_bytes=1024
        )
        db.add(att)
        db.commit()

        # 1. Aluno comum tenta renomear -> 403 Forbidden
        res_student = client.patch(
            f"/api/v1/courses/{course.id}/modules/{module.id}/lessons/{lesson.id}/attachments/{att.id}",
            json={"title": "Nome Tentado Pelo Aluno"},
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert res_student.status_code == 403

        # 2. Admin renomeia com sucesso
        res_admin = client.patch(
            f"/api/v1/courses/{course.id}/modules/{module.id}/lessons/{lesson.id}/attachments/{att.id}",
            json={"title": "Checklist Astrológico Oficial", "description": "Nova descrição atualizada"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_admin.status_code == 200
        data = res_admin.json()
        assert data["title"] == "Checklist Astrológico Oficial"
        assert data["description"] == "Nova descrição atualizada"

        # Confere no banco
        db.refresh(att)
        assert att.title == "Checklist Astrológico Oficial"
        assert att.description == "Nova descrição atualizada"

        # 3. Tentar renomear com título vazio -> 400 Bad Request
        res_empty = client.patch(
            f"/api/v1/courses/{course.id}/modules/{module.id}/lessons/{lesson.id}/attachments/{att.id}",
            json={"title": "   "},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_empty.status_code == 400
        assert "não pode ser vazio" in res_empty.json()["detail"]

        # 4. Tentar renomear anexo inexistente -> 404 Not Found
        res_not_found = client.patch(
            f"/api/v1/courses/{course.id}/modules/{module.id}/lessons/{lesson.id}/attachments/99999",
            json={"title": "Qualquer Nome"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res_not_found.status_code == 404
    finally:
        db.close()
