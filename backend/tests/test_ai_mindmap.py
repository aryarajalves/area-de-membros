"""
Testes unitários para o serviço e endpoints de Mapas Mentais com IA.
Valida geração individual, em lote por módulo/curso e controle de erros.
"""
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonTranscription, LessonAttachment
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def admin_headers(db_session: Session):
    admin = db_session.query(User).filter(User.role == "superadmin").first()
    if not admin:
        admin = User(
            name="Super Admin",
            email="admin_mindmap@teste.com",
            password_hash="fake",
            role="superadmin",
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
    token = create_access_token(data={"sub": str(admin.id), "email": admin.email, "role": admin.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_course_structure(db_session: Session):
    course = Course(title="Curso Astrologia Avançada", description="Desc")
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)

    mod = Module(course_id=course.id, title="Módulo 1 - Signos de Ar", order_index=1)
    db_session.add(mod)
    db_session.commit()
    db_session.refresh(mod)

    lesson1 = Lesson(module_id=mod.id, title="Aula 01 - Aquário e a Diferenciação", order_index=1)
    lesson2 = Lesson(module_id=mod.id, title="Aula 02 - Gêmeos e a Mente", order_index=2)
    db_session.add_all([lesson1, lesson2])
    db_session.commit()
    db_session.refresh(lesson1)
    db_session.refresh(lesson2)

    # Lesson 1 tem transcrição completa
    t1 = LessonTranscription(
        lesson_id=lesson1.id,
        full_transcript="Bem-vindos, nessa aula a gente vai falar sobre Aquário, a energia da diferenciação...",
        status="ready"
    )
    db_session.add(t1)
    db_session.commit()

    return {
        "course_id": course.id,
        "module_id": mod.id,
        "lesson1_id": lesson1.id,
        "lesson2_id": lesson2.id
    }


def test_generate_mindmap_without_transcription_returns_400(sample_course_structure, admin_headers):
    # Lesson 2 não tem transcrição
    c_id = sample_course_structure["course_id"]
    m_id = sample_course_structure["module_id"]
    l2_id = sample_course_structure["lesson2_id"]

    res = client.post(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons/{l2_id}/mindmap",
        headers=admin_headers
    )
    assert res.status_code == 400
    assert "ainda não possui transcrição" in res.json()["detail"]


@patch("app.services.ai_mindmap_service.ai_mindmap_service.request_mindmap_structure_from_ai", new_callable=AsyncMock)
def test_generate_mindmap_success_creates_attachment(mock_ai, sample_course_structure, admin_headers, db_session: Session):
    mock_ai.return_value = {
        "mermaid_code": "flowchart TD\n  A[\"Aquário\"] --> B[\"Urano e Ruptura\"]\n  A --> C[\"Saturno e Ordem\"]",
        "central_theme": "Aquário",
        "summary_points": [
            {"topic": "Energia de Ar Fixo", "description": "Mental, intelectual e focado na coletividade."},
            {"topic": "Urano vs Saturno", "description": "A dança entre inovação e estrutura."}
        ]
    }

    c_id = sample_course_structure["course_id"]
    m_id = sample_course_structure["module_id"]
    l1_id = sample_course_structure["lesson1_id"]

    res = client.post(
        f"/api/v1/courses/{c_id}/modules/{m_id}/lessons/{l1_id}/mindmap",
        headers=admin_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "Mapa Mental" in data["title"]
    assert data["file_url"].endswith(".html")

    # Verifica anexo no banco de dados
    att = db_session.query(LessonAttachment).filter(LessonAttachment.lesson_id == l1_id).first()
    assert att is not None
    assert "Mapa Mental" in att.title
    assert att.file_type == "html"
    assert att.file_size_bytes > 0


def test_get_course_mindmaps_overview(sample_course_structure, admin_headers):
    c_id = sample_course_structure["course_id"]
    res = client.get(f"/api/v1/courses/{c_id}/mindmaps/overview", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_lessons"] == 2
    assert data["with_transcript"] >= 1


@patch("app.services.ai_mindmap_service.ai_mindmap_service.request_mindmap_structure_from_ai", new_callable=AsyncMock)
def test_generate_module_mindmaps_batch(mock_ai, sample_course_structure, admin_headers):
    mock_ai.return_value = {
        "mermaid_code": "flowchart LR\n  A[\"Central\"] --> B[\"Pilar\"]",
        "summary_points": [{"topic": "Pilar", "description": "Explicação"}]
    }

    c_id = sample_course_structure["course_id"]
    m_id = sample_course_structure["module_id"]

    res = client.post(f"/api/v1/courses/{c_id}/modules/{m_id}/mindmaps", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_lessons"] == 2
    assert data["processed"] == 1  # Apenas lesson 1 tem transcrição
    assert data["skipped"] == 1    # Lesson 2 foi pulada por falta de transcrição
