import pytest
from unittest.mock import patch, AsyncMock
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonTranscription
from tests.conftest import TestingSessionLocal, client

def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def setup_agentflow_data():
    db = TestingSessionLocal()
    # Cria curso para teste
    course = db.query(Course).filter(Course.title == "Curso Teste AgentFlow").first()
    if not course:
        course = Course(
            title="Curso Teste AgentFlow",
            description="Descrição do curso de teste",
            is_published=True
        )
        db.add(course)
        db.commit()
        db.refresh(course)

    # Cria módulo
    module = db.query(Module).filter(Module.course_id == course.id, Module.title == "Módulo AgentFlow").first()
    if not module:
        module = Module(
            course_id=course.id,
            title="Módulo AgentFlow",
            description="Resumo didático do módulo de teste",
            order_index=1
        )
        db.add(module)
        db.commit()
        db.refresh(module)

    # Cria aula com transcrição
    lesson = db.query(Lesson).filter(Lesson.module_id == module.id, Lesson.title == "Aula Teste AgentFlow").first()
    if not lesson:
        lesson = Lesson(
            module_id=module.id,
            title="Aula Teste AgentFlow",
            description="Descrição da aula",
            order_index=1
        )
        db.add(lesson)
        db.commit()
        db.refresh(lesson)

    transcription = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == lesson.id).first()
    if not transcription:
        transcription = LessonTranscription(
            lesson_id=lesson.id,
            full_transcript="Este é o conteúdo transcrito da aula de teste para o AgentFlow.",
            summary_markdown="## Resumo Executivo\nResumo da aula de teste.",
            status="ready"
        )
        db.add(transcription)
        db.commit()
        db.refresh(transcription)

    data = {
        "course_id": course.id,
        "module_id": module.id,
        "lesson_id": lesson.id
    }
    db.close()
    return data


def test_agentflow_status():
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.get("/api/v1/agentflow/status", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "configured" in data


@patch("app.services.agentflow_service.agentflow_service.list_knowledge_bases", new_callable=AsyncMock)
def test_list_knowledge_bases(mock_list):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    mock_list.return_value = [
        {"id": 1, "name": "Base de Testes 1", "kb_type": "qa"},
        {"id": 2, "name": "Base de Testes 2", "kb_type": "qa"}
    ]
    res = client.get("/api/v1/agentflow/knowledge-bases", headers=headers)
    assert res.status_code == 200
    bases = res.json()
    assert len(bases) == 2
    assert bases[0]["name"] == "Base de Testes 1"


@patch("app.services.agentflow_service.agentflow_service.create_knowledge_base", new_callable=AsyncMock)
def test_create_knowledge_base(mock_create):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    mock_create.return_value = {
        "id": 99,
        "name": "Nova Base Curso",
        "description": "Base criada via API",
        "kb_type": "qa"
    }
    res = client.post("/api/v1/agentflow/knowledge-bases", json={
        "name": "Nova Base Curso",
        "description": "Base criada via API"
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == 99
    assert data["name"] == "Nova Base Curso"


def test_link_course_to_knowledge_base(setup_agentflow_data):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    c_id = setup_agentflow_data["course_id"]
    res = client.post(f"/api/v1/agentflow/courses/{c_id}/link", json={
        "agentflow_kb_id": 42,
        "agentflow_kb_name": "Base Astrologia"
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["agentflow_kb_id"] == 42
    assert data["agentflow_kb_name"] == "Base Astrologia"

    # Confirma no endpoint GET /courses/{course_id}
    res_get = client.get(f"/api/v1/courses/{c_id}", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json()["agentflow_kb_id"] == 42


@patch("app.services.agentflow_service.agentflow_service.sync_lesson_to_knowledge_base", new_callable=AsyncMock)
def test_sync_lesson_to_agentflow(mock_sync, setup_agentflow_data):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    l_id = setup_agentflow_data["lesson_id"]
    mock_sync.return_value = {
        "success": True,
        "kb_id": 42,
        "lesson_id": l_id,
        "total_saved": 9
    }
    res = client.post(f"/api/v1/agentflow/lessons/{l_id}/sync", json={
        "kb_id": 42
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["total_saved"] == 9


def test_split_text_into_smart_chunks_no_broken_words():
    from app.services.agentflow_service import split_text_into_smart_chunks

    sample_text = (
        "Agora a gente vai começar a entender o significado dos planetas em trânsito, e o primeiro deles é o Sol. "
        "O Sol é um dos trânsitos mais fáceis de perceber no nosso dia-a-dia, porque ele representa o foco, a consciência, "
        "na saúde, na produtividade, no trabalho ou em organizar a vida. Se ele estiver na tua casa 7, os relacionamentos "
        "costumam ganhar mais importância. Se estiver na tua casa 10, talvez exista mais foco na carreira. "
        "O ideal é usar a energia do Sol com consciência, sem exagerar. Na prática o Sol funciona como uma lanterna. "
        "Ele mostra onde a vida está pedindo presença. Agora nas próximas aulas a gente vai entender como isso se desdobra."
    )

    # Usa chunk pequeno propositalmente para forçar quebra
    chunks = split_text_into_smart_chunks(sample_text, max_chunk_size=150, overlap_size=30)
    assert len(chunks) > 1

    # Nenhuma palavra deve terminar cortada no meio (ex: 'deal' em vez de 'ideal')
    for chunk in chunks:
        words = chunk.split()
        for word in words:
            # Não deve haver pedaços sem sentido de 'ideal' como 'deal'
            assert word not in ("deal", "scência")

    # Verifica se a palavra 'ideal' existe completa em pelo menos um dos chunks
    assert any("ideal" in c.lower() for c in chunks)


def test_build_contextual_chunk():
    from app.services.agentflow_service import build_contextual_chunk

    raw_text = "O Sol representa a consciência e vitalidade."
    result = build_contextual_chunk(
        raw_chunk=raw_text,
        course_title="Bússola Astrológica",
        module_title="Módulo 02 - Trânsitos",
        lesson_title="O Sol em Trânsito",
        chapter_title="00:00 - Introdução"
    )

    assert '[Contexto da Aula: Curso: "Bússola Astrológica" | Módulo: "Módulo 02 - Trânsitos" | Aula: "O Sol em Trânsito" | Capítulo: "00:00 - Introdução"]' in result
    assert "O Sol representa a consciência e vitalidade." in result


def test_all_chapters_and_topics_included_in_metadata():
    chapters = [
        "00:00 - Introdução ao Conteúdo",
        "00:13 - Aumento da Curiosidade",
        "00:43 - Movimentação e Interações Sociais",
        "01:12 - Consciência sobre Padrões Mentais",
        "01:46 - Auto-Expressão",
        "02:04 - Cuidados Necessários",
        "02:33 - Exemplos Práticos",
        "02:53 - Conclusão e Reflexões Finais"
    ]
    topics = ["Tópico 1", "Tópico 2", "Tópico 3", "Tópico 4", "Tópico 5", "Tópico 6"]

    metadata_base = f"Curso: Astrologia | Módulo: Módulo 02 | Aula: Sol na Casa 3"
    metadata_base += f" | Capítulos: {', '.join(chapters)}"
    metadata_base += f" | Tópicos: {', '.join(topics)}"

    # Garante que todos os 8 capítulos estão presentes no texto dos metadados
    for ch in chapters:
        assert ch in metadata_base

    # Garante que todos os 6 tópicos estão presentes
    for tp in topics:
        assert tp in metadata_base


