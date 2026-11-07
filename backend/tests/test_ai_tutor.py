import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime, timezone

from app.main import app
from app.core.database import Base
from app.models.user import User
from app.models.course import Course, Module, Lesson, UserCourse
from app.models.tutor_ia import AiTutorSetting, AiTutorMessage
from app.core.security import get_password_hash, create_access_token
from tests.conftest import engine, TestingSessionLocal

client = TestClient(app)


@pytest.fixture
def setup_tutor_test_data():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Cria usuário admin e aluno de teste
        admin = db.query(User).filter(User.email == "admin_tutor_test@example.com").first()
        if not admin:
            admin = User(
                email="admin_tutor_test@example.com",
                name="Admin Tutor",
                hashed_password=get_password_hash("Secret123!"),
                role="admin",
                is_active=True,
                token_version=1
            )
            db.add(admin)

        student = db.query(User).filter(User.email == "student_tutor_test@example.com").first()
        if not student:
            student = User(
                email="student_tutor_test@example.com",
                name="Aluno Tutor",
                hashed_password=get_password_hash("Secret123!"),
                role="user",
                is_active=True,
                ai_tutor_active=False,
                token_version=1
            )
            db.add(student)

        # Cria curso e aula
        course = db.query(Course).filter(Course.title == "Curso Astrologia Tutor").first()
        if not course:
            course = Course(title="Curso Astrologia Tutor", is_published=True)
            db.add(course)
            db.commit()
            db.refresh(course)

            mod = Module(title="Módulo 1", course_id=course.id, order_index=1)
            db.add(mod)
            db.commit()
            db.refresh(mod)

            lesson = Lesson(title="Aula 1 - Trânsitos", module_id=mod.id, order_index=1)
            db.add(lesson)

        db.commit()
        db.refresh(admin)
        db.refresh(student)
        db.refresh(course)
        lesson = db.query(Lesson).filter(Lesson.title == "Aula 1 - Trânsitos").first()

        admin_token = create_access_token(data={"sub": str(admin.id), "token_version": admin.token_version})
        student_token = create_access_token(data={"sub": str(student.id), "token_version": student.token_version})

        data = {
            "admin_id": admin.id,
            "admin_email": admin.email,
            "admin_token": admin_token,
            "student_id": student.id,
            "student_email": student.email,
            "student_token": student_token,
            "course_id": course.id,
            "lesson_id": lesson.id
        }
        return data
    finally:
        db.close()


def test_tutor_settings_crud_and_permissions(setup_tutor_test_data):
    admin_token = setup_tutor_test_data["admin_token"]
    student_token = setup_tutor_test_data["student_token"]

    # Aluno tenta acessar settings admin -> 403
    res_student = client.get("/api/v1/tutor-ia/settings", headers={"Authorization": f"Bearer {student_token}"})
    assert res_student.status_code == 403

    # Admin acessa settings -> 200
    res_admin = client.get("/api/v1/tutor-ia/settings", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert "default_monthly_free_questions" in data
    assert data["monthly_price_brl"] == 10.0

    # Admin atualiza configurações incluindo tutor_name, rag_top_k e rag_min_similarity
    update_res = client.put(
        "/api/v1/tutor-ia/settings",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "tutor_name": "Atena IA Cósmica",
            "default_monthly_free_questions": 5,
            "system_prompt": "Prompt customizado de teste para {nome_aluno}",
            "temperature": 0.5,
            "sales_checkout_url": "https://hotmart.com/tutor-ia-checkout",
            "rag_top_k": 6,
            "rag_min_similarity": 0.40
        }
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["tutor_name"] == "Atena IA Cósmica"
    assert updated_data["default_monthly_free_questions"] == 5
    assert updated_data["sales_checkout_url"] == "https://hotmart.com/tutor-ia-checkout"
    assert updated_data["rag_top_k"] == 6
    assert updated_data["rag_min_similarity"] == 0.40

    # Admin restaura prompt padrão
    reset_res = client.post("/api/v1/tutor-ia/settings/reset-prompt", headers={"Authorization": f"Bearer {admin_token}"})
    assert reset_res.status_code == 200
    assert "Tutor de IA da plataforma de membros" in reset_res.json()["system_prompt"]


def test_student_quota_status_and_custom_limits(setup_tutor_test_data):
    admin_token = setup_tutor_test_data["admin_token"]
    student_token = setup_tutor_test_data["student_token"]
    student_id = setup_tutor_test_data["student_id"]

    # Aluno verifica seu status
    res = client.get("/api/v1/tutor-ia/status", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "tutor_name" in data
    assert data["can_ask"] is True
    assert data["remaining_free"] >= 1

    # Admin define cota customizada para o aluno (ex: 1 pergunta)
    update_student = client.put(
        f"/api/v1/tutor-ia/students/{student_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"ai_tutor_custom_monthly_limit": 1}
    )
    assert update_student.status_code == 200

    # Aluno agora tem cota total de 1
    res2 = client.get("/api/v1/tutor-ia/status", headers={"Authorization": f"Bearer {student_token}"})
    assert res2.json()["total_monthly_limit"] == 1


@pytest.mark.asyncio
async def test_tutor_chat_execution_and_cost_tracking(setup_tutor_test_data):
    student_token = setup_tutor_test_data["student_token"]
    course_id = setup_tutor_test_data["course_id"]
    lesson_id = setup_tutor_test_data["lesson_id"]

    fake_openai_response = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "Olá! O professor aborda os trânsitos aos **01:30** da aula. É um momento de grande aprendizado."
                }
            }
        ],
        "usage": {
            "prompt_tokens": 120,
            "completion_tokens": 45
        }
    }

    mock_resp = AsyncMock()
    mock_resp.status_code = 200
    mock_resp.json = lambda: fake_openai_response

    with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=mock_resp)):
        with patch("app.services.ai_tutor_service.get_openai_api_key", return_value="sk-fake-test-key"):
            res = client.post(
                "/api/v1/tutor-ia/chat",
                headers={"Authorization": f"Bearer {student_token}"},
                json={
                    "course_id": course_id,
                    "lesson_id": lesson_id,
                    "message": "Em que minuto da aula o professor explica trânsitos?"
                }
            )
            assert res.status_code == 200
            resp_data = res.json()
            assert "01:30" in resp_data["reply"]
            assert resp_data["cost_brl"] > 0
            assert "message_id" in resp_data

    # Verifica se histórico pode ser recuperado
    hist_res = client.get(
        f"/api/v1/tutor-ia/history?course_id={course_id}&lesson_id={lesson_id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert hist_res.status_code == 200
    messages = hist_res.json()
    assert len(messages) >= 2


def test_clear_chat_history(setup_tutor_test_data):
    student_token = setup_tutor_test_data["student_token"]
    course_id = setup_tutor_test_data["course_id"]
    lesson_id = setup_tutor_test_data["lesson_id"]

    del_res = client.delete(
        f"/api/v1/tutor-ia/history?course_id={course_id}&lesson_id={lesson_id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # Confere que o histórico ficou vazio
    hist_res = client.get(
        f"/api/v1/tutor-ia/history?course_id={course_id}&lesson_id={lesson_id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert hist_res.status_code == 200
    assert len(hist_res.json()) == 0


def test_hotmart_subscription_webhook(setup_tutor_test_data):
    student_email = setup_tutor_test_data["student_email"]

    # 1. Evento de compra/assinatura aprovada
    payload_approved = {
        "event": "PURCHASE_APPROVED",
        "data": {
            "buyer": {"email": student_email}
        }
    }
    res_app = client.post("/api/v1/tutor-ia/webhook/hotmart", json=payload_approved)
    assert res_app.status_code == 200
    assert res_app.json()["status"] == "activated"

    # 2. Evento de cancelamento
    payload_cancel = {
        "event": "SUBSCRIPTION_CANCELED",
        "data": {
            "buyer": {"email": student_email}
        }
    }
    res_canc = client.post("/api/v1/tutor-ia/webhook/hotmart", json=payload_cancel)
    assert res_canc.status_code == 200
    assert res_canc.json()["status"] == "deactivated"


def test_rag_indexing_and_knowledge_base_endpoints(setup_tutor_test_data):
    admin_token = setup_tutor_test_data["admin_token"]
    student_token = setup_tutor_test_data["student_token"]
    lesson_id = setup_tutor_test_data["lesson_id"]

    # Aluno tenta acessar a base de conhecimento -> 403
    res_student = client.get("/api/v1/tutor-ia/knowledge-base", headers={"Authorization": f"Bearer {student_token}"})
    assert res_student.status_code == 403

    # Admin acessa a base de conhecimento -> 200
    res_admin = client.get("/api/v1/tutor-ia/knowledge-base", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert "metrics" in data
    assert "lessons" in data

    # Adiciona transcrição de teste na aula se não houver
    db = TestingSessionLocal()
    try:
        from app.models.course import LessonTranscription
        trans = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == lesson_id).first()
        if not trans:
            trans = LessonTranscription(
                lesson_id=lesson_id,
                full_transcript="Nesta aula nós vamos aprender os trânsitos astrológicos e como calcular os ciclos planetários na prática.",
                chapters='[{"time": "00:00", "title": "Introdução"}, {"time": "01:20", "title": "Trânsitos"}]',
                status="completed"
            )
            db.add(trans)
            db.commit()
    finally:
        db.close()

    # Admin dispara indexação da aula
    index_res = client.post(
        f"/api/v1/tutor-ia/knowledge-base/lessons/{lesson_id}/index",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert index_res.status_code == 200
    assert index_res.json()["status"] == "success"
    assert index_res.json()["chunks_count"] >= 1

    # Admin consulta chunks da aula
    chunks_res = client.get(
        f"/api/v1/tutor-ia/knowledge-base/lessons/{lesson_id}/chunks",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert chunks_res.status_code == 200
    chunks = chunks_res.json()
    assert len(chunks) >= 1
    assert "trânsitos" in chunks[0]["content"].lower()

    # Admin simula busca semântica
    sim_res = client.post(
        "/api/v1/tutor-ia/knowledge-base/simulate-search",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"query": "como calcular os ciclos planetários"}
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert len(sim_data["results"]) >= 1

    # Admin dispara indexação em lote com batch-index
    batch_res = client.post(
        "/api/v1/tutor-ia/knowledge-base/batch-index",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"lesson_ids": [lesson_id]}
    )
    assert batch_res.status_code == 200
    batch_data = batch_res.json()
    assert batch_data["indexed_lessons"] >= 1

    # Verifica se a base de conhecimento retornou o formato de árvore (tree)
    kb_res = client.get("/api/v1/tutor-ia/knowledge-base", headers={"Authorization": f"Bearer {admin_token}"})
    assert kb_res.status_code == 200
    kb_data = kb_res.json()
    assert "tree" in kb_data
    assert len(kb_data["tree"]) >= 1
    assert "modules" in kb_data["tree"][0]


@pytest.mark.asyncio
async def test_multi_query_decomposition():
    from app.services.ai_rag_service import decompose_user_query
    
    # Pergunta simples
    single = await decompose_user_query("Qual o significado de Marte?")
    assert len(single) == 1
    assert "Marte" in single[0]

    # Pergunta composta com conectivos e pontuações
    multi = await decompose_user_query("Qual a duração da aula 1? E o que o professor fala sobre Júpiter na aula 2?")
    assert len(multi) >= 2


def test_course_structure_metadata_includes_durations_and_counts(setup_tutor_test_data):
    from app.services.ai_rag_service import get_course_structure_metadata
    course_id = setup_tutor_test_data["course_id"]

    db = TestingSessionLocal()
    try:
        metadata = get_course_structure_metadata(db, course_id, [course_id])
        assert "Grade Estrutural e Carga Horária" in metadata
        assert "aulas" in metadata
        assert "Carga horária" in metadata or "Duração" in metadata
    finally:
        db.close()


def test_generate_lesson_qa_endpoint(setup_tutor_test_data):
    admin_token = setup_tutor_test_data["admin_token"]
    lesson_id = setup_tutor_test_data["lesson_id"]

    db = TestingSessionLocal()
    try:
        from app.models.course import LessonTranscription
        trans = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == lesson_id).first()
        if not trans:
            trans = LessonTranscription(
                lesson_id=lesson_id,
                full_transcript="Transcrição completa da aula de astrologia sobre trânsitos planetários e aspectos de Júpiter."
            )
            db.add(trans)
            db.commit()
    finally:
        db.close()

    fake_qa_pairs = [
        {"question": "O que é trânsito planetário?", "answer": "É o movimento atual dos planetas.", "start_time_seconds": 10, "end_time_seconds": 60},
        {"question": "Como calcular?", "answer": "Consultando as efemérides.", "start_time_seconds": 60, "end_time_seconds": 120}
    ]

    with patch("app.services.ai_rag_service.generate_lesson_qa_pairs", new=AsyncMock(return_value=fake_qa_pairs)):
        with patch("app.services.ai_rag_service.generate_embeddings_batch", new=AsyncMock(return_value=[[0.1]*1536, [0.2]*1536])):
            res = client.post(
                f"/api/v1/tutor-ia/knowledge-base/lessons/{lesson_id}/generate-qa",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert res.status_code == 200
            data = res.json()
            assert data["status"] == "success"
            assert data["qa_count"] == 2


def test_get_suggested_questions_endpoint(setup_tutor_test_data):
    student_token = setup_tutor_test_data["student_token"]
    course_id = setup_tutor_test_data["course_id"]
    lesson_id = setup_tutor_test_data["lesson_id"]

    # 1. Teste para aula antes de ter chunks Q&A (fallback didático)
    res_lesson = client.get(
        f"/api/v1/tutor-ia/suggested-questions?course_id={course_id}&lesson_id={lesson_id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_lesson.status_code == 200
    data_lesson = res_lesson.json()
    assert data_lesson["lesson_id"] == lesson_id
    assert len(data_lesson["questions"]) >= 3
    assert any("Aula 1" in q or "conceitos" in q for q in data_lesson["questions"])
    assert data_lesson["has_custom_qa"] is False

    # 2. Adiciona um chunk Q&A customizado para a aula
    db = TestingSessionLocal()
    try:
        from app.models.tutor_ia import AiKnowledgeChunk
        qa_chunk = AiKnowledgeChunk(
            course_id=course_id,
            module_id=1,
            lesson_id=lesson_id,
            chunk_index=0,
            chunk_type="qa_pair",
            question_text="O que é o retorno de Saturno ensinado nesta aula?",
            answer_text="É a passagem de Saturno pelo ponto exato do nascimento.",
            content="Q: O que é o retorno de Saturno? A: É a passagem de Saturno.",
            embedding_json="[0.1, 0.2]",
            token_count=15
        )
        db.add(qa_chunk)
        db.commit()
    finally:
        db.close()

    # Agora a rota deve retornar a pergunta customizada
    res_custom = client.get(
        f"/api/v1/tutor-ia/suggested-questions?course_id={course_id}&lesson_id={lesson_id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_custom.status_code == 200
    data_custom = res_custom.json()
    assert data_custom["has_custom_qa"] is True
    assert "retorno de Saturno" in data_custom["questions"][0]

    # 3. Teste para escopo geral do curso (sem lesson_id)
    res_course = client.get(
        f"/api/v1/tutor-ia/suggested-questions?course_id={course_id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_course.status_code == 200
    data_course = res_course.json()
    assert data_course["lesson_id"] is None
    assert len(data_course["questions"]) >= 3
    assert any("módulos" in q or "carga horária" in q for q in data_course["questions"])


def test_tutor_chat_stream_endpoint(setup_tutor_test_data):
    student_token = setup_tutor_test_data["student_token"]
    course_id = setup_tutor_test_data["course_id"]
    lesson_id = setup_tutor_test_data["lesson_id"]

    # Simula stream da OpenAI com aiter_lines
    class MockStreamResponse:
        status_code = 200
        async def aiter_lines(self):
            chunks = [
                'data: {"choices": [{"delta": {"content": "Olá"}}]}',
                'data: {"choices": [{"delta": {"content": " Aluno"}}]}',
                'data: [DONE]'
            ]
            for c in chunks:
                yield c

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

    class MockAsyncClient:
        def stream(self, method, url, **kwargs):
            return MockStreamResponse()

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

    with patch("app.services.ai_rag_service.search_rag_chunks", new=AsyncMock(return_value=[])):
        with patch("httpx.AsyncClient", return_value=MockAsyncClient()):
            res = client.post(
                "/api/v1/tutor-ia/chat/stream",
                json={
                    "course_id": course_id,
                    "lesson_id": lesson_id,
                    "message": "Qual é a lição desta aula?"
                },
                headers={"Authorization": f"Bearer {student_token}"}
            )
            assert res.status_code == 200
            assert "text/event-stream" in res.headers["content-type"]
            body = res.text
            assert "Olá" in body
            assert "Aluno" in body
            assert '"type": "done"' in body


def test_tutor_message_feedback_endpoints(setup_tutor_test_data):
    student_token = setup_tutor_test_data["student_token"]
    student_id = setup_tutor_test_data["student_id"]
    course_id = setup_tutor_test_data["course_id"]
    lesson_id = setup_tutor_test_data["lesson_id"]

    db = TestingSessionLocal()
    try:
        from app.models.tutor_ia import AiTutorMessage
        msg = AiTutorMessage(
            user_id=student_id,
            course_id=course_id,
            lesson_id=lesson_id,
            role="assistant",
            content="Aqui está a resposta explicativa.",
            cost_brl=0.002
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        msg_id = msg.id
    finally:
        db.close()

    # 1. Aluno avalia com Like
    res_like = client.post(
        f"/api/v1/tutor-ia/messages/{msg_id}/feedback",
        json={"rating": "like"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_like.status_code == 200
    assert res_like.json()["rating"] == "like"
    assert res_like.json()["feedback_text"] is None

    # 2. Aluno atualiza avaliação para Dislike com justificativa
    res_dislike = client.post(
        f"/api/v1/tutor-ia/messages/{msg_id}/feedback",
        json={"rating": "dislike", "feedback_text": "O minuto citado não corresponde ao que o instrutor falou."},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_dislike.status_code == 200
    assert res_dislike.json()["rating"] == "dislike"
    assert "minuto citado não corresponde" in res_dislike.json()["feedback_text"]

    # 3. Consulta histórico para validar presença dos campos de feedback
    res_hist = client.get(
        f"/api/v1/tutor-ia/history?course_id={course_id}&lesson_id={lesson_id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_hist.status_code == 200
    found = [m for m in res_hist.json() if m["id"] == msg_id]
    assert len(found) == 1
    assert found[0]["feedback_rating"] == "dislike"
    assert "minuto citado não corresponde" in found[0]["feedback_text"]


def test_tutor_analytics_insights_endpoint(setup_tutor_test_data):
    admin_token = setup_tutor_test_data["admin_token"]
    student_token = setup_tutor_test_data["student_token"]
    student_id = setup_tutor_test_data["student_id"]
    course_id = setup_tutor_test_data["course_id"]
    lesson_id = setup_tutor_test_data["lesson_id"]

    # 1. Aluno comum não pode acessar analytics (403)
    res_forbidden = client.get(
        "/api/v1/tutor-ia/analytics/insights",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_forbidden.status_code == 403

    # 2. Cria mensagens de teste para alimentar métricas
    db = TestingSessionLocal()
    try:
        from app.models.tutor_ia import AiTutorMessage
        # Pergunta de aluno
        q_msg = AiTutorMessage(
            user_id=student_id,
            course_id=course_id,
            lesson_id=lesson_id,
            role="user",
            content="Como calcular meu ascendente?"
        )
        db.add(q_msg)

        # Resposta com dislike e justificativa
        a_msg = AiTutorMessage(
            user_id=student_id,
            course_id=course_id,
            lesson_id=lesson_id,
            role="assistant",
            content="O ascendente é definido pelo horário exato de nascimento.",
            feedback_rating="dislike",
            feedback_text="Faltou explicar a tabela de fusos horários.",
            feedback_at=datetime.now(timezone.utc)
        )
        db.add(a_msg)
        db.commit()
    finally:
        db.close()

    # 3. Admin acessa insights (200)
    res_admin = client.get(
        "/api/v1/tutor-ia/analytics/insights",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_admin.status_code == 200
    data = res_admin.json()

    assert "total_questions" in data
    assert data["total_questions"] >= 1
    assert "total_likes" in data
    assert "total_dislikes" in data
    assert data["total_dislikes"] >= 1
    assert "satisfaction_rate" in data
    assert "top_questioned_lessons" in data
    assert isinstance(data["top_questioned_lessons"], list)
    assert "recent_negative_feedbacks" in data
    assert isinstance(data["recent_negative_feedbacks"], list)

    # Valida que o feedback negativo recente veio com os campos esperados
    found_neg = [f for f in data["recent_negative_feedbacks"] if "fusos horários" in f.get("feedback_text", "")]
    assert len(found_neg) >= 1
    assert found_neg[0]["lesson_id"] == lesson_id






def test_find_related_lessons_without_transcription(setup_tutor_test_data):
    """
    Garante que lições sem transcrição (trans = None) não quebram o Tutor IA
    com AttributeError em summary_markdown.
    """
    from app.services.ai_tutor_service import find_related_lesson_mentions
    from app.core.database import SessionLocal
    from app.models.course import Lesson

    db = SessionLocal()
    try:
        course_id = setup_tutor_test_data["course_id"]
        ref_lesson = db.query(Lesson).filter(Lesson.id == setup_tutor_test_data["lesson_id"]).first()
        # Cria uma lição sem transcrição
        lesson_no_trans = Lesson(
            title="Aula Sem Transcrição Especial",
            description="Explicação prática sobre astrologia moderna",
            module_id=ref_lesson.module_id,
            order_index=99
        )
        db.add(lesson_no_trans)
        db.commit()
        db.refresh(lesson_no_trans)

        # Executa a busca de menções correlatas
        results = find_related_lesson_mentions(
            db=db,
            permitted_course_ids=[course_id],
            query_text="astrologia moderna e prática",
            current_lesson_id=setup_tutor_test_data["lesson_id"]
        )

        assert isinstance(results, list)
        matched_ids = [r["lesson_id"] for r in results]
        assert lesson_no_trans.id in matched_ids
    finally:
        db.close()


def test_admin_tutor_messages_and_financial_summary(setup_tutor_test_data):
    """
    Testa o endpoint /admin/messages com métricas financeiras (total gasto,
    gasto mensal, top spenders) e listagem paginada por aluno e geral.
    """
    admin_token = setup_tutor_test_data["admin_token"]
    student_id = setup_tutor_test_data["student_id"]
    course_id = setup_tutor_test_data["course_id"]
    lesson_id = setup_tutor_test_data["lesson_id"]

    # 1. Requisição geral
    res_all = client.get(
        "/api/v1/tutor-ia/admin/messages",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert "financial_summary" in data_all
    assert "total_spent_brl" in data_all["financial_summary"]
    assert "top_spenders" in data_all["financial_summary"]
    assert "items" in data_all
    assert "pagination" in data_all

    # 2. Requisição filtrada por aluno
    res_student = client.get(
        f"/api/v1/tutor-ia/admin/messages?student_id={student_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_student.status_code == 200
    data_student = res_student.json()
    assert "financial_summary" in data_student
    for item in data_student["items"]:
        assert item["student_id"] == student_id
