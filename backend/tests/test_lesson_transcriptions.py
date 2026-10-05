import pytest
from unittest.mock import patch, AsyncMock
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonVideo, LessonTranscription, UserCourse
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def setup_transcription_data():
    db = TestingSessionLocal()

    # Cria ou obtém Admin
    admin = db.query(User).filter(User.email == "admin_transcribe@test.com").first()
    if not admin:
        admin = User(
            email="admin_transcribe@test.com",
            name="Admin Transcribe",
            role="superadmin",
            hashed_password=get_password_hash("AdminPass123!"),
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # Cria aluno com acesso ao curso
    student_with_access = db.query(User).filter(User.email == "student_access@test.com").first()
    if not student_with_access:
        student_with_access = User(
            email="student_access@test.com",
            name="Aluno Matriculado",
            role="aluno",
            hashed_password=get_password_hash("StudentPass123!"),
            is_active=True
        )
        db.add(student_with_access)
        db.commit()
        db.refresh(student_with_access)

    # Cria aluno sem acesso ao curso
    student_no_access = db.query(User).filter(User.email == "student_no_access@test.com").first()
    if not student_no_access:
        student_no_access = User(
            email="student_no_access@test.com",
            name="Aluno Sem Acesso",
            role="aluno",
            hashed_password=get_password_hash("StudentPass123!"),
            is_active=True
        )
        db.add(student_no_access)
        db.commit()
        db.refresh(student_no_access)

    # Cria curso
    course = db.query(Course).filter(Course.title == "Curso Transcricao Teste").first()
    if not course:
        course = Course(
            title="Curso Transcricao Teste",
            description="Curso para testar transcricao por IA",
            is_published=True
        )
        db.add(course)
        db.commit()
        db.refresh(course)

    # Vincula student_with_access ao curso
    uc = db.query(UserCourse).filter(
        UserCourse.user_id == student_with_access.id,
        UserCourse.course_id == course.id
    ).first()
    if not uc:
        uc = UserCourse(user_id=student_with_access.id, course_id=course.id)
        db.add(uc)
        db.commit()

    # Cria módulo
    module = db.query(Module).filter(
        Module.course_id == course.id,
        Module.title == "Modulo Transcricao"
    ).first()
    if not module:
        module = Module(course_id=course.id, title="Modulo Transcricao", order_index=1)
        db.add(module)
        db.commit()
        db.refresh(module)

    # Cria aula
    lesson = db.query(Lesson).filter(
        Lesson.module_id == module.id,
        Lesson.title == "Aula com Video IA"
    ).first()
    if not lesson:
        lesson = Lesson(module_id=module.id, title="Aula com Video IA", order_index=1)
        db.add(lesson)
        db.commit()
        db.refresh(lesson)

    # Adiciona vídeo à aula
    video = db.query(LessonVideo).filter(LessonVideo.lesson_id == lesson.id).first()
    if not video:
        video = LessonVideo(
            lesson_id=lesson.id,
            title="Video Principal",
            video_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            video_type="url"
        )
        db.add(video)
        db.commit()
        db.refresh(video)

    course_id = course.id
    module_id = module.id
    lesson_id = lesson.id
    video_url = video.video_url

    db.close()
    return {
        "admin_email": "admin_transcribe@test.com",
        "admin_pass": "AdminPass123!",
        "student_email": "student_access@test.com",
        "student_pass": "StudentPass123!",
        "no_access_email": "student_no_access@test.com",
        "no_access_pass": "StudentPass123!",
        "course_id": course_id,
        "module_id": module_id,
        "lesson_id": lesson_id,
        "video_url": video_url
    }


def test_get_transcription_initial_status(setup_transcription_data):
    data = setup_transcription_data
    headers = get_headers(data["admin_email"], data["admin_pass"])

    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription"
    res = client.get(url, headers=headers)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["status"] == "not_started"
    assert res_data["full_transcript"] == ""
    assert res_data["summary_html"] == ""


def test_student_cannot_trigger_transcription(setup_transcription_data):
    data = setup_transcription_data
    student_headers = get_headers(data["student_email"], data["student_pass"])

    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcribe"
    res = client.post(url, headers=student_headers, json={})
    assert res.status_code == 403


def test_unauthorized_student_cannot_view_transcription(setup_transcription_data):
    data = setup_transcription_data
    no_access_headers = get_headers(data["no_access_email"], data["no_access_pass"])

    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription"
    res = client.get(url, headers=no_access_headers)
    assert res.status_code == 403


def test_admin_triggers_transcription_with_mocked_ai(setup_transcription_data):
    data = setup_transcription_data
    admin_headers = get_headers(data["admin_email"], data["admin_pass"])

    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcribe"

    mock_transcript = "Bem-vindos à aula de arquitetura limpa. Hoje falaremos sobre desacoplamento e testes."
    mock_ai_result = {
        "summary_markdown": "Resumo da aula sobre arquitetura limpa e desacoplamento.",
        "key_takeaways": [
            "Arquitetura limpa foca em desacoplamento.",
            "Testes unitários garantem estabilidade."
        ],
        "summary_html": "<!DOCTYPE html><html><body><h1>Resumo Inteligente</h1><p>Conteúdo de teste</p></body></html>"
    }

    with patch("app.services.ai_transcription_service.SessionLocal", side_effect=TestingSessionLocal), \
         patch("app.services.ai_transcription_service.download_video_stream") as mock_download, \
         patch("app.services.ai_transcription_service.ai_transcription_service.extract_audio_from_video", new_callable=AsyncMock) as mock_extract, \
         patch("app.services.ai_transcription_service.ai_transcription_service.transcribe_audio_whisper", new_callable=AsyncMock) as mock_whisper, \
         patch("app.services.ai_transcription_service.ai_transcription_service.generate_summary_and_html", new_callable=AsyncMock) as mock_summary:

        mock_download.return_value = None
        mock_extract.return_value = "/tmp/dummy.mp3"
        mock_whisper.return_value = mock_transcript
        mock_summary.return_value = mock_ai_result

        res = client.post(url, headers=admin_headers, json={"video_url": data["video_url"]})
        assert res.status_code == 200, res.text
        res_data = res.json()
        assert res_data["status"] == "processing"

        # Consulta o status concluído após execução da Background Task
        get_url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription"
        get_res = client.get(get_url, headers=admin_headers)
        assert get_res.status_code == 200
        get_data = get_res.json()

        assert get_data["status"] == "completed"
        assert get_data["full_transcript"] == mock_transcript
        assert len(get_data["key_takeaways"]) == 2
        assert "Resumo Inteligente" in get_data["summary_html"]


def test_student_and_html_endpoint_after_transcription(setup_transcription_data):
    data = setup_transcription_data
    student_headers = get_headers(data["student_email"], data["student_pass"])

    # Salva transcrição concluída no banco para validação do aluno
    db = TestingSessionLocal()
    trans = LessonTranscription(
        lesson_id=data["lesson_id"],
        full_transcript="Bem-vindos à aula de arquitetura limpa. Hoje falaremos sobre desacoplamento e testes.",
        summary_html="<!DOCTYPE html><html><body><h1>Resumo Inteligente</h1><p>Conteúdo de teste</p></body></html>",
        summary_markdown="## Resumo Executivo\nConteúdo de teste",
        key_takeaways='["Ponto 1", "Ponto 2"]',
        status="completed"
    )
    db.add(trans)
    db.commit()
    db.close()

    # 1. Aluno com acesso consegue obter a transcrição e resumo gerados
    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription"
    res = client.get(url, headers=student_headers)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["status"] == "completed"
    assert "Bem-vindos à aula" in res_data["full_transcript"]

    # 2. Aluno com acesso consegue acessar o documento HTML puro renderizado
    html_url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription/html"
    html_res = client.get(html_url, headers=student_headers)
    assert html_res.status_code == 200
    assert "text/html" in html_res.headers["content-type"]
    assert "<h1>Resumo Inteligente</h1>" in html_res.text


def test_admin_can_reset_transcription(setup_transcription_data):
    data = setup_transcription_data
    admin_headers = get_headers(data["admin_email"], data["admin_pass"])

    # Dispara reset / cancelamento
    reset_url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription"
    res = client.delete(reset_url, headers=admin_headers)
    assert res.status_code == 200
    assert "resetado com sucesso" in res.json()["message"]

    # Verifica se status voltou para not_started
    get_res = client.get(reset_url, headers=admin_headers)
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "not_started"

