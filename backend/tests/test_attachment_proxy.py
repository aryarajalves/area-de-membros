from unittest.mock import patch

from app.core.security import create_access_token, get_password_hash
from app.models.course import Course, Lesson, LessonAttachment, Module, UserCourse
from app.models.user import User
from tests.conftest import TestingSessionLocal, client


class _FakeB2Body:
    def __init__(self, content: bytes):
        self._content = content

    def iter_chunks(self, chunk_size: int = 65536):
        yield self._content


def test_attachment_proxy_auth_enrollment_and_b2_stream():
    db = TestingSessionLocal()
    try:
        enrolled_student = User(
            email="att_enrolled@example.com",
            name="Aluno Matriculado",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="aluno",
            is_active=True,
        )
        other_student = User(
            email="att_other@example.com",
            name="Outro Aluno",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="aluno",
            is_active=True,
        )
        course = Course(title="Curso Proxy", is_published=True)
        db.add_all([enrolled_student, other_student, course])
        db.commit()
        db.refresh(enrolled_student)
        db.refresh(other_student)
        db.refresh(course)

        mod = Module(course_id=course.id, title="Módulo 1", order_index=0)
        db.add(mod)
        db.commit()
        db.refresh(mod)

        lesson = Lesson(module_id=mod.id, title="Aula 1", order_index=0)
        db.add(lesson)
        db.commit()
        db.refresh(lesson)

        att = LessonAttachment(
            lesson_id=lesson.id,
            title="Recomendações",
            file_type="pdf",
            file_url="https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/attachments/att_123.pdf",
        )
        db.add(att)
        db.add(UserCourse(user_id=enrolled_student.id, course_id=course.id))
        db.commit()
        db.refresh(att)

        att_id = att.id
        h_enrolled = {"Authorization": f"Bearer {create_access_token({'sub': str(enrolled_student.id), 'role': 'aluno'})}"}
        h_other = {"Authorization": f"Bearer {create_access_token({'sub': str(other_student.id), 'role': 'aluno'})}"}
    finally:
        db.close()

    # Sem autenticação -> 401
    assert client.get(f"/api/v1/courses/attachments/{att_id}/access").status_code == 401

    # Aluno sem matrícula -> 403
    assert client.get(f"/api/v1/courses/attachments/{att_id}/access", headers=h_other).status_code == 403

    # Aluno matriculado -> 200 com stream PDF pelo domínio próprio
    fake_pdf = b"%PDF-1.4\n%conteudo"
    with patch(
        "app.api.v1.endpoints.course_attachments.fetch_media_object",
        return_value={"body": _FakeB2Body(fake_pdf), "content_type": "application/pdf", "content_length": len(fake_pdf)},
    ):
        res = client.get(f"/api/v1/courses/attachments/{att_id}/access", headers=h_enrolled)

    assert res.status_code == 200
    assert res.headers["content-type"].startswith("application/pdf")
    assert res.content == fake_pdf
