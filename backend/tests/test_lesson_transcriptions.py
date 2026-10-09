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
        "summary_html": "<!DOCTYPE html><html><body><h1>Resumo Inteligente</h1><p>Conteúdo de teste</p></body></html>",
        "generated_lesson_title": "Arquitetura Limpa: Desacoplamento e Testes"
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
        assert get_data["lesson_title"] == "Arquitetura Limpa: Desacoplamento e Testes"

        # Verifica persistência direta no banco de dados na entidade Lesson
        db_check = TestingSessionLocal()
        persisted_lesson = db_check.query(Lesson).filter(Lesson.id == data["lesson_id"]).first()
        assert persisted_lesson.title == "Arquitetura Limpa: Desacoplamento e Testes"
        db_check.close()


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
    # A transcrição integral não deve ser enviada para alunos (apenas resumo e destaques)
    assert res_data["full_transcript"] == ""
    assert "Resumo Executivo" in res_data["summary_markdown"]
    assert len(res_data["key_takeaways"]) == 2

    # Aluno NUNCA deve receber dados de custo em reais ou tokens consumidos
    assert res_data.get("estimated_cost_brl") is None
    assert res_data.get("estimated_cost_formatted") is None
    assert res_data.get("prompt_tokens") is None
    assert res_data.get("completion_tokens") is None

    # 2. Aluno com acesso consegue acessar o documento HTML puro renderizado com header
    html_url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription/html"
    html_res = client.get(html_url, headers=student_headers)
    assert html_res.status_code == 200
    assert "text/html" in html_res.headers["content-type"]
    assert "<h1>Resumo Inteligente</h1>" in html_res.text

    # 3. Aluno consegue abrir o documento HTML em nova aba usando ?token=... SEM header Authorization
    student_login = client.post("/api/v1/auth/login", json={"email": data["student_email"], "password": data["student_pass"]})
    student_token = student_login.json()["access_token"]
    html_token_url = f"{html_url}?token={student_token}"
    html_token_res = client.get(html_token_url)
    assert html_token_res.status_code == 200
    assert "<h1>Resumo Inteligente</h1>" in html_token_res.text

    # 4. Requisição sem token e sem header é rejeitada com 401
    html_no_auth = client.get(html_url)
    assert html_no_auth.status_code == 401


def test_admin_views_cost_and_tokens_metrics(setup_transcription_data):
    data = setup_transcription_data
    admin_headers = get_headers(data["admin_email"], data["admin_pass"])

    # Salva transcrição com custos e tokens gravados
    db = TestingSessionLocal()
    trans = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == data["lesson_id"]).first()
    if not trans:
        trans = LessonTranscription(lesson_id=data["lesson_id"])
        db.add(trans)
    trans.full_transcript = "Texto completo para cálculo de tokens e custos."
    trans.summary_html = "<p>Resumo em HTML</p>"
    trans.audio_duration_seconds = 180.0
    trans.prompt_tokens = 500
    trans.completion_tokens = 300
    trans.estimated_cost_usd = 0.033
    trans.estimated_cost_brl = 0.18
    trans.status = "completed"
    db.commit()
    db.close()

    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription"
    res = client.get(url, headers=admin_headers)
    assert res.status_code == 200
    res_data = res.json()

    # Admin e Super Admin têm acesso total aos custos em reais formatados e à transcrição integral
    assert "Texto completo para cálculo" in res_data["full_transcript"]
    assert res_data["estimated_cost_brl"] == 0.18
    assert res_data["estimated_cost_formatted"] == "R$ 0,18"
    assert res_data["prompt_tokens"] == 500
    assert res_data["completion_tokens"] == 300

    # Admin também acessa HTML via query param ?token=...
    admin_login = client.post("/api/v1/auth/login", json={"email": data["admin_email"], "password": data["admin_pass"]})
    admin_token = admin_login.json()["access_token"]
    html_admin_url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription/html?token={admin_token}"
    html_admin_res = client.get(html_admin_url)
    assert html_admin_res.status_code == 200
    assert "<p>Resumo em HTML</p>" in html_admin_res.text


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


def test_transcription_chapters_persistence_and_response(setup_transcription_data):
    import json
    data = setup_transcription_data
    admin_headers = get_headers(data["admin_email"], data["admin_pass"])

    db = TestingSessionLocal()
    trans = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == data["lesson_id"]).first()
    if not trans:
        trans = LessonTranscription(lesson_id=data["lesson_id"])
        db.add(trans)

    sample_chapters = [
        {"time": "00:00", "seconds": 0, "title": "Introdução"},
        {"time": "01:45", "seconds": 105, "title": "Conceitos Fundamentais"},
        {"time": "04:20", "seconds": 260, "title": "Demonstração Prática"}
    ]
    trans.full_transcript = "Transcrição com divisão de capítulos."
    trans.summary_markdown = "Resumo detalhado com capítulos"
    trans.chapters = json.dumps(sample_chapters)
    trans.status = "completed"
    db.commit()
    db.close()

    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription"
    res = client.get(url, headers=admin_headers)
    assert res.status_code == 200
    res_data = res.json()

    assert "chapters" in res_data
    assert isinstance(res_data["chapters"], list)
    assert len(res_data["chapters"]) == 3
    assert res_data["chapters"][0]["time"] == "00:00"
    assert res_data["chapters"][0]["seconds"] == 0
    assert res_data["chapters"][0]["title"] == "Introdução"
    assert res_data["chapters"][1]["time"] == "01:45"
    assert res_data["chapters"][1]["seconds"] == 105
    assert res_data["chapters"][2]["title"] == "Demonstração Prática"


def test_format_seconds_to_clock():
    from app.services.ai_transcription_service import format_seconds_to_clock
    assert format_seconds_to_clock(0) == "00:00"
    assert format_seconds_to_clock(930) == "15:30"
    assert format_seconds_to_clock(1540) == "25:40"
    assert format_seconds_to_clock(3600) == "01:00:00"
    assert format_seconds_to_clock(3665) == "01:01:05"
    assert format_seconds_to_clock(None) == "00:00"


def test_generate_module_ai_overview_endpoint(setup_transcription_data):
    data = setup_transcription_data
    admin_headers = get_headers(data["admin_email"], data["admin_pass"])

    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/generate-ai-overview"

    mock_ai_response = {
        "title": "Módulo 01 - Fundamentos e Estrutura dos Signos",
        "description": "Visão geral completa e detalhada sobre signos e elementos astrológicos."
    }

    def mock_gen_overview(module_title, lessons_data):
        assert len(lessons_data) > 0
        assert "title" in lessons_data[0]
        assert "transcript" in lessons_data[0]
        return mock_ai_response

    with patch("app.services.ai_transcription_service.ai_transcription_service.generate_module_overview", side_effect=mock_gen_overview):
        res = client.post(url, headers=admin_headers)
        assert res.status_code == 200, res.text
        res_data = res.json()
        assert res_data["title"] == "Módulo 01 - Fundamentos e Estrutura dos Signos"
        assert "Visão geral completa" in res_data["description"]

        # Verifica persistência no banco de dados
        db = TestingSessionLocal()
        mod = db.query(Module).filter(Module.id == data["module_id"]).first()
        assert mod.title == "Módulo 01 - Fundamentos e Estrutura dos Signos"
        assert "Visão geral completa" in mod.description
        db.close()


def test_generate_module_ai_overview_fails_when_no_lessons(setup_transcription_data):
    data = setup_transcription_data
    admin_headers = get_headers(data["admin_email"], data["admin_pass"])

    db = TestingSessionLocal()
    empty_mod = Module(course_id=data["course_id"], title="Módulo Sem Aulas", order_index=99)
    db.add(empty_mod)
    db.commit()
    empty_mod_id = empty_mod.id
    db.close()

    url = f"/api/v1/courses/{data['course_id']}/modules/{empty_mod_id}/generate-ai-overview"
    res = client.post(url, headers=admin_headers)
    assert res.status_code == 400
    assert "pelo menos uma aula cadastrada" in res.json()["detail"]


@pytest.mark.asyncio
async def test_ai_transcription_service_generate_module_overview_mock():
    from app.services.ai_transcription_service import ai_transcription_service
    import json

    mock_resp_json = {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "generated_module_title": "Módulo 01 - Introdução Astrológica",
                        "generated_module_description": "Conceitos fundamentais da astrologia moderna."
                    })
                }
            }
        ]
    }

    mock_http_response = AsyncMock()
    mock_http_response.status_code = 200
    mock_http_response.json = lambda: mock_resp_json

    with patch.dict("os.environ", {"OPENAI_API_KEY": "fake_key_123"}):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_http_response):
            result = await ai_transcription_service.generate_module_overview(
                module_title="Módulo 01",
                lessons_data=[
                    {"title": "Aula 01 - Signos", "summary": "Estudo de Áries a Peixes"}
                ]
            )
            assert result["title"] == "Módulo 01 - Introdução Astrológica"
            assert "Conceitos fundamentais" in result["description"]


def test_generate_lesson_title_and_description_endpoint(setup_transcription_data):
    data = setup_transcription_data
    admin_headers = get_headers(data["admin_email"], data["admin_pass"])

    # Garante que existe transcrição completa no banco
    db = TestingSessionLocal()
    trans = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == data["lesson_id"]).first()
    if not trans:
        trans = LessonTranscription(lesson_id=data["lesson_id"])
        db.add(trans)
    trans.full_transcript = "Nesta aula vamos aprender tudo sobre os signos do zodíaco e os elementos fogo, terra, ar e água."
    trans.status = "completed"
    db.commit()
    db.close()

    mock_gen_result = {
        "title": "Astrologia Básica: Os 4 Elementos e os Signos",
        "description": "Nesta aula completa, você aprenderá a dinâmica dos quatro elementos da natureza e como eles regem a personalidade dos 12 signos do zodíaco."
    }

    with patch("app.services.ai_transcription_service.ai_transcription_service.generate_lesson_title_and_description", new_callable=AsyncMock, return_value=mock_gen_result):
        url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/generate-metadata"
        res = client.post(url, headers=admin_headers)
        assert res.status_code == 200
        res_data = res.json()
        assert res_data["title"] == "Astrologia Básica: Os 4 Elementos e os Signos"
        assert "dinâmica dos quatro elementos" in res_data["description"]

        # Valida atualização no banco de dados da aula
        db = TestingSessionLocal()
        lesson = db.query(Lesson).filter(Lesson.id == data["lesson_id"]).first()
        assert lesson.title == "Astrologia Básica: Os 4 Elementos e os Signos"
        assert "dinâmica dos quatro elementos" in lesson.description
        db.close()


def test_generate_lesson_metadata_fails_without_transcription(setup_transcription_data):
    data = setup_transcription_data
    admin_headers = get_headers(data["admin_email"], data["admin_pass"])

    # Remove qualquer transcrição existente para simular aula sem transcrição
    db = TestingSessionLocal()
    db.query(LessonTranscription).filter(LessonTranscription.lesson_id == data["lesson_id"]).delete()
    db.commit()
    db.close()

    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/generate-metadata"
    res = client.post(url, headers=admin_headers)
    assert res.status_code == 400
    assert "A aula ainda não possui uma transcrição concluída" in res.json()["detail"]


def test_generate_lesson_metadata_forbidden_for_student(setup_transcription_data):
    data = setup_transcription_data
    student_headers = get_headers(data["student_email"], data["student_pass"])

    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/generate-metadata"
    res = client.post(url, headers=student_headers)
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_process_lesson_transcription_automatically_updates_title_and_description(setup_transcription_data):
    """
    Valida que ao concluir a transcrição por IA em process_lesson_transcription,
    o título da aula e a descrição pedagógica são atualizados automaticamente no banco
    e sincronizados com os vídeos da aula, refletindo também no endpoint GET transcription.
    """
    from app.services.ai_transcription_service import ai_transcription_service

    data = setup_transcription_data
    db = TestingSessionLocal()
    lesson_id = data["lesson_id"]

    mock_ai_data = {
        "generated_lesson_title": "Signos e Ascendentes na Prática",
        "generated_lesson_description": "Nesta aula essencial, você aprenderá a dinâmica profunda dos doze signos e ascendentes.",
        "summary_executive": "Resumo executivo do conteúdo.",
        "key_takeaways": ["Ponto 1"],
        "action_plan": ["Ação 1"],
        "chapters": [{"time": "00:00", "seconds": 0, "title": "Início"}],
        "summary_html": "<html><body>Resumo</body></html>",
        "summary_markdown": "Markdown",
        "prompt_tokens": 100,
        "completion_tokens": 50
    }

    with patch.object(ai_transcription_service, "extract_audio_from_video", new_callable=AsyncMock) as mock_extract, \
         patch("app.services.ai_transcription_service.resolve_local_video_path", return_value=None), \
         patch("app.services.ai_transcription_service._get_audio_duration_seconds", return_value=300.0), \
         patch.object(ai_transcription_service, "transcribe_audio_whisper", new_callable=AsyncMock, return_value={"text": "Transcrição da aula sobre signos.", "segments": []}), \
         patch.object(ai_transcription_service, "generate_summary_and_html", new_callable=AsyncMock, return_value=mock_ai_data):

        transcription_result = await ai_transcription_service.process_lesson_transcription(
            db=db,
            lesson_id=lesson_id,
            video_source="https://example.com/test-video.mp4"
        )

        assert transcription_result.status == "completed"

        # Valida que o título e a descrição da aula foram atualizados automaticamente
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        assert lesson.title == "Signos e Ascendentes na Prática"
        assert lesson.description == "Nesta aula essencial, você aprenderá a dinâmica profunda dos doze signos e ascendentes."

        # Valida que as faixas de vídeo da aula foram sincronizadas
        for v in lesson.videos:
            assert v.title == "Signos e Ascendentes na Prática"
            assert v.description == "Nesta aula essencial, você aprenderá a dinâmica profunda dos doze signos e ascendentes."

    db.close()

    # Valida que o endpoint GET transcription retorna lesson_title e lesson_description
    admin_headers = get_headers(data["admin_email"], data["admin_pass"])
    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription"
    res = client.get(url, headers=admin_headers)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["lesson_title"] == "Signos e Ascendentes na Prática"
    assert res_data["lesson_description"] == "Nesta aula essencial, você aprenderá a dinâmica profunda dos doze signos e ascendentes."


def test_get_transcription_returns_agentflow_sync_fields(setup_transcription_data):
    """
    Garante que o endpoint GET transcription retorna os campos agentflow_kb_id
    e agentflow_synced_at corretamente quando a aula já foi sincronizada.
    """
    from datetime import datetime, timezone
    data = setup_transcription_data
    db = TestingSessionLocal()
    transcription = db.query(LessonTranscription).filter(
        LessonTranscription.lesson_id == data["lesson_id"]
    ).first()

    now = datetime.now(timezone.utc)
    if not transcription:
        transcription = LessonTranscription(
            lesson_id=data["lesson_id"],
            full_transcript="Transcrição de teste para o AgentFlow",
            status="completed",
            agentflow_kb_id=37,
            agentflow_synced_at=now
        )
        db.add(transcription)
    else:
        transcription.agentflow_kb_id = 37
        transcription.agentflow_synced_at = now

    db.commit()
    db.close()

    admin_headers = get_headers(data["admin_email"], data["admin_pass"])
    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription"
    res = client.get(url, headers=admin_headers)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["agentflow_kb_id"] == 37
    assert res_data["agentflow_synced_at"] is not None


def test_admin_can_update_transcription_chapters(setup_transcription_data):
    """
    Garante que administradores e superadmins conseguem atualizar os capítulos da aula,
    corrigindo erros ortográficos e alterando minutagens.
    """
    data = setup_transcription_data
    admin_headers = get_headers(data["admin_email"], data["admin_pass"])
    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription/chapters"

    payload = {
        "chapters": [
            {"time": "00:00", "seconds": 0, "title": "Introdução ao Conteúdo"},
            {"time": "00:10", "seconds": 10, "title": "Motivo 1: Foco no Aluno"},
            {"time": "01:03", "seconds": 63, "title": "Motivo 2: Gamificação"},  # Corrigido de "Quemificação"
            {"time": "02:14", "seconds": 134, "title": "Motivo 3: Vitrine Exclusiva"},
            {"time": "02:54", "seconds": 174, "title": "Conclusão e Chamadas para Ação"}
        ]
    }

    res = client.put(url, json=payload, headers=admin_headers)
    assert res.status_code == 200, res.text
    res_data = res.json()

    assert len(res_data["chapters"]) == 5
    assert res_data["chapters"][2]["title"] == "Motivo 2: Gamificação"
    assert res_data["chapters"][2]["time"] == "01:03"
    assert res_data["chapters"][2]["seconds"] == 63.0

    # Verifica persistência no banco
    db = TestingSessionLocal()
    transcription = db.query(LessonTranscription).filter(
        LessonTranscription.lesson_id == data["lesson_id"]
    ).first()
    assert transcription is not None
    import json
    saved_chapters = json.loads(transcription.chapters)
    assert saved_chapters[2]["title"] == "Motivo 2: Gamificação"
    db.close()


def test_student_cannot_update_transcription_chapters(setup_transcription_data):
    """
    Garante que alunos não têm permissão para editar capítulos (HTTP 403 Forbidden).
    """
    data = setup_transcription_data
    student_headers = get_headers(data["student_email"], data["student_pass"])
    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription/chapters"

    payload = {
        "chapters": [
            {"time": "00:00", "seconds": 0, "title": "Tentativa de alteração por aluno"}
        ]
    }

    res = client.put(url, json=payload, headers=student_headers)
    assert res.status_code == 403


def test_unauthenticated_cannot_update_transcription_chapters(setup_transcription_data):
    """
    Garante que requisições não autenticadas retornam HTTP 401 Unauthorized.
    """
    data = setup_transcription_data
    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription/chapters"

    res = client.put(url, json={"chapters": []})
    assert res.status_code == 401


def test_update_transcription_chapters_auto_sorts_and_calculates_seconds(setup_transcription_data):
    """
    Garante que os capítulos sejam ordenados cronologicamente e que o tempo MM:SS
    seja convertido automaticamente para segundos caso venha zerado.
    """
    data = setup_transcription_data
    admin_headers = get_headers(data["admin_email"], data["admin_pass"])
    url = f"/api/v1/courses/{data['course_id']}/modules/{data['module_id']}/lessons/{data['lesson_id']}/transcription/chapters"

    # Enviando fora de ordem propositalmente
    payload = {
        "chapters": [
            {"time": "02:30", "seconds": 0, "title": "Segundo Ponto"},
            {"time": "00:15", "seconds": 0, "title": "Primeiro Ponto"},
            {"time": "05:00", "seconds": 300, "title": "Terceiro Ponto"}
        ]
    }

    res = client.put(url, json=payload, headers=admin_headers)
    assert res.status_code == 200
    res_data = res.json()

    assert len(res_data["chapters"]) == 3
    # Primeiro ponto deve ser 00:15 (15s)
    assert res_data["chapters"][0]["title"] == "Primeiro Ponto"
    assert res_data["chapters"][0]["seconds"] == 15.0
    # Segundo ponto deve ser 02:30 (150s)
    assert res_data["chapters"][1]["title"] == "Segundo Ponto"
    assert res_data["chapters"][1]["seconds"] == 150.0
    # Terceiro ponto deve ser 05:00 (300s)
    assert res_data["chapters"][2]["title"] == "Terceiro Ponto"
    assert res_data["chapters"][2]["seconds"] == 300.0










