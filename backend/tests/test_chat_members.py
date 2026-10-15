import pytest
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, UserCourse
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def chat_members_seed():
    db = TestingSessionLocal()
    # 1. Admin
    admin = db.query(User).filter(User.email == "admin_chat_members@test.com").first()
    if not admin:
        admin = User(
            email="admin_chat_members@test.com",
            name="Admin Chat",
            hashed_password=get_password_hash("pass123"),
            role="admin",
            is_active=True,
            avatar_url="https://example.com/admin.jpg",
        )
        db.add(admin)
        db.commit()

    # 2. Aluno Matriculado
    student_enrolled = db.query(User).filter(User.email == "aluno_enrolled_chat@test.com").first()
    if not student_enrolled:
        student_enrolled = User(
            email="aluno_enrolled_chat@test.com",
            name="Aluno Matriculado",
            hashed_password=get_password_hash("pass123"),
            role="aluno",
            is_active=True,
            avatar_url="https://example.com/aluno1.jpg",
        )
        db.add(student_enrolled)
        db.commit()

    # 3. Aluno Sem Matrícula
    student_other = db.query(User).filter(User.email == "aluno_other_chat@test.com").first()
    if not student_other:
        student_other = User(
            email="aluno_other_chat@test.com",
            name="Aluno Outro Curso",
            hashed_password=get_password_hash("pass123"),
            role="aluno",
            is_active=True,
        )
        db.add(student_other)
        db.commit()

    # 4. Curso de Teste
    course = db.query(Course).filter(Course.title == "Curso Chat Membros Teste").first()
    if not course:
        course = Course(
            title="Curso Chat Membros Teste",
            description="Curso para validação de membros no chat",
            order_index=1,
            is_published=True,
        )
        db.add(course)
        db.commit()

    # 5. Matrícula ativa apenas para student_enrolled
    uc = db.query(UserCourse).filter(
        UserCourse.user_id == student_enrolled.id,
        UserCourse.course_id == course.id,
    ).first()
    if not uc:
        uc = UserCourse(
            user_id=student_enrolled.id,
            course_id=course.id,
            access_duration="lifetime",
            expires_at=None,
        )
        db.add(uc)
        db.commit()

    data = {
        "admin_id": admin.id,
        "student_enrolled_id": student_enrolled.id,
        "student_other_id": student_other.id,
        "course_id": course.id,
    }
    db.close()
    return data


def test_list_general_chat_members(chat_members_seed):
    """Valida que o canal geral retorna todos os alunos, admins e o superadmin."""
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.get("/api/v1/chat/members?channel_type=general", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["channel_type"] == "general"
    assert data["channel_name"] == "Comunidade Geral"
    assert data["total_members"] >= 3

    # Superadmin presente
    superadmin_emails = [u["email"] for u in data["superadmins"]]
    assert settings.SUPERADMIN_EMAIL in superadmin_emails

    # Admin presente
    admin_emails = [u["email"] for u in data["admins"]]
    assert "admin_chat_members@test.com" in admin_emails

    # Ambos os alunos presentes no canal geral
    student_emails = [u["email"] for u in data["students"]]
    assert "aluno_enrolled_chat@test.com" in student_emails
    assert "aluno_other_chat@test.com" in student_emails

    # Valida estrutura do membro
    first_member = data["superadmins"][0]
    assert "id" in first_member
    assert "name" in first_member
    assert "role" in first_member
    assert "avatar_url" in first_member
    assert "is_online" in first_member


def test_list_course_chat_members_filtering(chat_members_seed):
    """Valida que o canal de curso filtra apenas alunos matriculados, mantendo admins."""
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    cid = chat_members_seed["course_id"]
    res = client.get(f"/api/v1/chat/members?channel_type=course&course_id={cid}", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["channel_type"] == "course"
    assert data["course_id"] == cid
    assert "Curso Chat Membros Teste" in data["channel_name"]

    # Aluno matriculado DEVE estar na lista
    student_emails = [u["email"] for u in data["students"]]
    assert "aluno_enrolled_chat@test.com" in student_emails

    # Aluno não matriculado NÃO deve estar na lista do curso
    assert "aluno_other_chat@test.com" not in student_emails

    # Superadmin e admin continuam com acesso ao canal do curso
    superadmin_emails = [u["email"] for u in data["superadmins"]]
    assert settings.SUPERADMIN_EMAIL in superadmin_emails
    admin_emails = [u["email"] for u in data["admins"]]
    assert "admin_chat_members@test.com" in admin_emails


def test_list_chat_members_unauthorized():
    """Valida que acesso sem token JWT é bloqueado com 401 Unauthorized."""
    res = client.get("/api/v1/chat/members")
    assert res.status_code == 401
