import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base
from app.models.user import User
from app.models.course import Course, Module, Lesson
from app.models.tutor_ia import AiTutorSetting, AiTutorSuggestion
from app.core.security import get_password_hash, create_access_token
from tests.conftest import engine, TestingSessionLocal

client = TestClient(app)


@pytest.fixture
def setup_guidelines_test_data():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin_guidelines@example.com").first()
        if not admin:
            admin = User(
                email="admin_guidelines@example.com",
                name="Admin Guidelines",
                hashed_password=get_password_hash("Secret123!"),
                role="admin",
                is_active=True,
                token_version=1
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        student = db.query(User).filter(User.email == "student_guidelines@example.com").first()
        if not student:
            student = User(
                email="student_guidelines@example.com",
                name="Aluno Guidelines",
                hashed_password=get_password_hash("Secret123!"),
                role="user",
                is_active=True,
                token_version=1
            )
            db.add(student)
            db.commit()
            db.refresh(student)

        course = db.query(Course).filter(Course.title == "Curso Guidelines").first()
        if not course:
            course = Course(title="Curso Guidelines", is_published=True)
            db.add(course)
            db.commit()
            db.refresh(course)

        setting = db.query(AiTutorSetting).first()
        if not setting:
            setting = AiTutorSetting()
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
            "admin_headers": {"Authorization": f"Bearer {admin_token}"},
            "student_headers": {"Authorization": f"Bearer {student_token}"}
        }
    finally:
        db.close()


def test_tutor_guidelines_save_and_retrieve(setup_guidelines_test_data):
    """Admin consegue salvar e recuperar tópicos permitidos, tópicos proibidos e link do app."""
    admin_headers = setup_guidelines_test_data["admin_headers"]

    payload = {
        "allowed_topics": "Tirar dúvidas sobre as aulas gravadas",
        "prohibited_topics": "Proibido interpretar trânsitos astrológicos personalizados",
        "redirect_app_url": "https://app.astrologia.com/transitos",
        "redirect_app_name": "App Especializado de Trânsitos",
        "prohibited_response_guideline": "Recuse e envie o link do app dedicado."
    }

    res_put = client.put("/api/v1/tutor-ia/settings", json=payload, headers=admin_headers)
    assert res_put.status_code == 200
    data_put = res_put.json()
    assert data_put["allowed_topics"] == payload["allowed_topics"]
    assert data_put["prohibited_topics"] == payload["prohibited_topics"]
    assert data_put["redirect_app_url"] == payload["redirect_app_url"]
    assert data_put["redirect_app_name"] == payload["redirect_app_name"]
    assert data_put["prohibited_response_guideline"] == payload["prohibited_response_guideline"]

    res_get = client.get("/api/v1/tutor-ia/settings", headers=admin_headers)
    assert res_get.status_code == 200
    data_get = res_get.json()
    assert data_get["prohibited_topics"] == payload["prohibited_topics"]


def test_student_suggestions_crud(setup_guidelines_test_data):
    """Fluxo de listagem, atualização de status e exclusão de sugestões de alunos."""
    db = setup_guidelines_test_data["db"]
    admin_headers = setup_guidelines_test_data["admin_headers"]
    student = setup_guidelines_test_data["student"]
    course = setup_guidelines_test_data["course"]

    # Cria uma sugestão de teste no banco
    sugg = AiTutorSuggestion(
        user_id=student.id,
        course_id=course.id,
        suggestion_text="Poderiam colocar um botão para acelerar o vídeo em 2.5x",
        status="new"
    )
    db.add(sugg)
    db.commit()
    db.refresh(sugg)

    # 1. Admin lista sugestões
    res_list = client.get("/api/v1/tutor-ia/suggestions", headers=admin_headers)
    assert res_list.status_code == 200
    items = res_list.json()
    assert len(items) >= 1
    target = next((item for item in items if item["id"] == sugg.id), None)
    assert target is not None
    assert "2.5x" in target["suggestion_text"]
    assert target["status"] == "new"

    # 2. Admin atualiza status para 'analyzing'
    res_patch = client.patch(
        f"/api/v1/tutor-ia/suggestions/{sugg.id}",
        json={"status": "analyzing", "admin_notes": "Ideia aprovada pelo professor"},
        headers=admin_headers
    )
    assert res_patch.status_code == 200
    updated = res_patch.json()
    assert updated["status"] == "analyzing"
    assert updated["admin_notes"] == "Ideia aprovada pelo professor"

    # 3. Admin exclui a sugestão
    res_delete = client.delete(f"/api/v1/tutor-ia/suggestions/{sugg.id}", headers=admin_headers)
    assert res_delete.status_code == 200

    # Confirma que foi excluída
    check = db.query(AiTutorSuggestion).filter(AiTutorSuggestion.id == sugg.id).first()
    assert check is None


def test_suggestion_creates_support_topic_option_b(setup_guidelines_test_data):
    """Valida que detecção de sugestão pelo Tech Tutor abre automaticamente um chamado na Central de Suporte (Opção B)."""
    db = setup_guidelines_test_data["db"]
    student = setup_guidelines_test_data["student"]
    course = setup_guidelines_test_data["course"]

    from app.services.ai_tutor_service import record_student_suggestion_if_detected
    from app.models.support import SupportTopic

    msg = "Eu sugiro que adicionem um arquivo PDF de resumo dos trânsitos nesta aula"
    sugg = record_student_suggestion_if_detected(db, student.id, course.id, None, msg)
    assert sugg is not None

    # Confirma que foi criado um SupportTopic correspondente
    topic = db.query(SupportTopic).filter(
        SupportTopic.user_id == student.id,
        SupportTopic.course_id == course.id,
        SupportTopic.title.like("%Sugestão Tech Tutor%")
    ).first()
    assert topic is not None
    assert "PDF de resumo dos trânsitos" in topic.content
    assert topic.status == "open"
