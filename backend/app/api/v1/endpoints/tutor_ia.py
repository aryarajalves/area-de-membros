import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course, Lesson, Module
from app.models.tutor_ia import AiTutorSetting, AiTutorMessage, AiKnowledgeChunk, AiTutorSuggestion
from app.api.v1.endpoints.users import get_current_user, require_admin_or_superadmin
from app.schemas.tutor_ia import (
    AiTutorSettingResponse,
    AiTutorSettingUpdate,
    AiTutorStatusResponse,
    AiTutorChatRequest,
    AiTutorChatResponse,
    AiTutorMessageResponse,
    StudentAiTutorUpdate,
    HotmartSubscriptionWebhookPayload,
    BatchIndexLessonsRequest,
    SuggestedQuestionsResponse,
    AiTutorFeedbackRequest,
    AiTutorSuggestionCreate,
    AiTutorSuggestionUpdate,
    AiTutorSuggestionResponse,
)
from app.services.ai_tutor_service import (
    get_or_create_tutor_settings,
    get_student_tutor_quota,
    generate_tutor_response,
    generate_tutor_response_stream,
    DEFAULT_SYSTEM_PROMPT,
)

router = APIRouter(prefix="/tutor-ia", tags=["Tutor IA Interativo"])


@router.get("/status", response_model=AiTutorStatusResponse)
def get_tutor_status(
    course_id: Optional[int] = Query(None),
    lesson_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna o status de cota, perguntas restantes e dados de assinatura do aluno logado."""
    quota = get_student_tutor_quota(db, current_user)
    return AiTutorStatusResponse(**quota)


@router.post("/chat", response_model=AiTutorChatResponse)
async def send_message_to_tutor(
    payload: AiTutorChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Envia uma dúvida para o Tutor IA e recebe a resposta contextualizada com minutagem e busca em aulas."""
    result = await generate_tutor_response(
        db=db,
        user=current_user,
        course_id=payload.course_id,
        lesson_id=payload.lesson_id,
        user_message=payload.message
    )
    return AiTutorChatResponse(**result)


@router.post("/chat/stream")
async def send_message_to_tutor_stream(
    payload: AiTutorChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Envia uma dúvida para o Tutor IA e transmite a resposta em tempo real via Server-Sent Events (SSE).
    """
    settings = get_or_create_tutor_settings(db)
    is_manager = current_user.role in ["superadmin", "admin"]
    access_mode = getattr(settings, "access_mode", "public") or "public"

    if not settings.is_enabled or access_mode == "disabled":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="O Tutor IA está temporariamente desativado no momento."
        )

    if access_mode == "private_team" and not is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="O Tutor IA está em acesso restrito à equipe no momento."
        )

    if access_mode == "maintenance" and not is_manager:
        m_msg = getattr(settings, "maintenance_message", None) or "O Tutor IA está temporariamente em manutenção para melhorias pedagógicas. O envio de dúvidas voltará a funcionar em breve!"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=m_msg
        )

    generator = generate_tutor_response_stream(
        db=db,
        user=current_user,
        course_id=payload.course_id,
        lesson_id=payload.lesson_id,
        user_message=payload.message
    )
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/history", response_model=List[AiTutorMessageResponse])
def get_chat_history(
    course_id: int = Query(...),
    lesson_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna o histórico de conversas do aluno naquele curso e opcionalmente filtrado pela aula."""
    query = db.query(AiTutorMessage).filter(
        AiTutorMessage.user_id == current_user.id,
        AiTutorMessage.course_id == course_id
    )
    if lesson_id:
        query = query.filter(AiTutorMessage.lesson_id == lesson_id)

    messages = query.order_by(AiTutorMessage.created_at.asc()).limit(50).all()

    response = []
    for m in messages:
        rel = None
        if m.related_lessons_json:
            try:
                rel = json.loads(m.related_lessons_json)
            except Exception:
                rel = None
        response.append(AiTutorMessageResponse(
            id=m.id,
            role=m.role,
            content=m.content,
            course_id=m.course_id,
            lesson_id=m.lesson_id,
            cost_brl=m.cost_brl,
            related_lessons=rel,
            feedback_rating=m.feedback_rating,
            feedback_text=m.feedback_text,
            created_at=m.created_at.isoformat()
        ))
    return response


@router.post("/messages/{message_id}/feedback")
def submit_message_feedback(
    message_id: int,
    payload: AiTutorFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registra avaliação (Like / Dislike) e justificativa opcional do aluno para uma resposta do Tutor IA.
    """
    message = db.query(AiTutorMessage).filter(AiTutorMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Mensagem não encontrada.")

    # Apenas o autor da conversa ou administrador pode avaliar
    if message.user_id != current_user.id and current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Você não tem permissão para avaliar esta mensagem.")

    if message.role != "assistant":
        raise HTTPException(status_code=400, detail="Apenas respostas do assistente podem receber avaliação.")

    message.feedback_rating = payload.rating
    message.feedback_text = payload.feedback_text.strip() if payload.feedback_text else None
    message.feedback_at = datetime.now(timezone.utc)
    db.commit()

    logger.info(
        f"[TUTOR IA FEEDBACK] Mensagem #{message_id} avaliada como '{payload.rating}' pelo usuário #{current_user.id} "
        f"(Justificativa: {message.feedback_text[:60] if message.feedback_text else 'Nenhuma'})"
    )

    return {
        "status": "success",
        "message_id": message.id,
        "rating": message.feedback_rating,
        "feedback_text": message.feedback_text
    }


@router.delete("/history")
def clear_chat_history(
    course_id: int = Query(...),
    lesson_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Limpa o histórico de conversas do aluno daquela aula ou curso."""
    query = db.query(AiTutorMessage).filter(
        AiTutorMessage.user_id == current_user.id,
        AiTutorMessage.course_id == course_id
    )
    if lesson_id:
        query = query.filter(AiTutorMessage.lesson_id == lesson_id)
    deleted_count = query.delete(synchronize_session=False)
    db.commit()
    return {"status": "success", "deleted_count": deleted_count}


@router.get("/suggested-questions", response_model=SuggestedQuestionsResponse)
def get_suggested_questions(
    course_id: int = Query(...),
    lesson_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna 3 a 5 perguntas sugeridas inteligentes para a aula (baseadas no Q&A gerado pela IA)
    ou perguntas gerais sobre o curso caso nenhuma aula específica esteja selecionada.
    """
    if lesson_id:
        # 1. Tenta buscar as perguntas sintéticas (Q&A) geradas para esta aula específica
        qa_chunks = (
            db.query(AiKnowledgeChunk)
            .filter(
                AiKnowledgeChunk.lesson_id == lesson_id,
                AiKnowledgeChunk.chunk_type == "qa_pair",
                AiKnowledgeChunk.question_text.isnot(None)
            )
            .order_by(AiKnowledgeChunk.chunk_index.asc())
            .limit(5)
            .all()
        )
        questions = [c.question_text.strip() for c in qa_chunks if c.question_text and c.question_text.strip()]
        if questions:
            return SuggestedQuestionsResponse(
                lesson_id=lesson_id,
                questions=questions,
                has_custom_qa=True
            )

        # 2. Fallback didático baseado no título da aula
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        title = lesson.title.strip() if lesson and lesson.title else "esta aula"
        fallback_questions = [
            f"Quais são os conceitos principais ensinados em '{title}'?",
            f"Pode me dar um resumo prático dos pontos mais importantes desta aula?",
            f"Em qual minuto o professor aborda a aplicação prática deste conteúdo?",
            f"Como posso aplicar o que aprendi nesta aula no meu dia a dia?"
        ]
        return SuggestedQuestionsResponse(
            lesson_id=lesson_id,
            questions=fallback_questions,
            has_custom_qa=False
        )

    # Escopo do curso geral (Drawer 'all')
    course = db.query(Course).filter(Course.id == course_id).first()
    course_title = course.title.strip() if course and course.title else "este treinamento"
    course_questions = [
        f"Quantos módulos e aulas tem o curso '{course_title}'?",
        "Qual é a carga horária e duração total deste treinamento?",
        "Qual a melhor ordem e cronograma para eu estudar este curso?",
        "O que vou ser capaz de fazer ao concluir todas as aulas?"
    ]
    return SuggestedQuestionsResponse(
        lesson_id=None,
        questions=course_questions,
        has_custom_qa=False
    )


# =========================================================================
# ENDPOINTS ADMINISTRATIVOS (Superadmin e Admin)
# =========================================================================

@router.get("/knowledge-base")
def get_admin_knowledge_base(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Retorna métricas e lista de todas as aulas com status de indexação vetorial no RAG."""
    from app.services.ai_rag_service import get_knowledge_base_overview
    return get_knowledge_base_overview(db)


@router.get("/knowledge-base/lessons/{lesson_id}/chunks")
def get_lesson_chunks(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Retorna todos os fragmentos e minutagens indexados de uma aula específica."""
    from app.models.tutor_ia import AiKnowledgeChunk
    from app.services.ai_rag_service import seconds_to_time
    chunks = db.query(AiKnowledgeChunk).filter(
        AiKnowledgeChunk.lesson_id == lesson_id
    ).order_by(AiKnowledgeChunk.chunk_index).all()

    return [
        {
            "id": c.id,
            "chunk_index": c.chunk_index,
            "chunk_type": getattr(c, "chunk_type", "transcript") or "transcript",
            "question_text": getattr(c, "question_text", None),
            "answer_text": getattr(c, "answer_text", None),
            "content": c.content,
            "start_time_seconds": c.start_time_seconds,
            "end_time_seconds": c.end_time_seconds,
            "start_time_str": seconds_to_time(c.start_time_seconds),
            "end_time_str": seconds_to_time(c.end_time_seconds),
            "token_count": c.token_count,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in chunks
    ]


@router.post("/knowledge-base/lessons/{lesson_id}/index")
async def trigger_lesson_indexing(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Força a indexação ou re-indexação vetorial de uma aula no RAG."""
    from app.services.ai_rag_service import index_lesson_rag
    res = await index_lesson_rag(db, lesson_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message", "Falha ao indexar aula"))
    return res


@router.post("/knowledge-base/lessons/{lesson_id}/generate-qa")
async def trigger_generate_lesson_qa(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Gera ou re-gera exclusivamente os 5 pares pedagógicos de Perguntas e Respostas via IA."""
    from app.services.ai_rag_service import generate_and_save_lesson_qa
    res = await generate_and_save_lesson_qa(db, lesson_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message", "Falha ao gerar perguntas e respostas"))
    return res


@router.post("/knowledge-base/batch-index")
async def trigger_batch_lessons_indexing(
    payload: BatchIndexLessonsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Executa a indexação vetorial sob demanda de uma lista específica de aulas."""
    from app.services.ai_rag_service import batch_index_lessons_rag
    return await batch_index_lessons_rag(db, payload.lesson_ids)


@router.post("/knowledge-base/index-all")
async def trigger_index_all_lessons(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Executa a indexação vetorial em lote de todas as aulas com transcrição no sistema."""
    from app.services.ai_rag_service import index_all_transcribed_lessons
    return await index_all_transcribed_lessons(db)


@router.post("/knowledge-base/simulate-search")
async def simulate_rag_search(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Simulador para o administrador testar a busca semântica vetorial e ver os chunks retornados."""
    query = (payload.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="O termo de busca é obrigatório.")

    course_id = payload.get("course_id")
    from app.services.ai_rag_service import search_rag_chunks
    from app.models.course import Course

    if course_id:
        permitted_ids = [course_id]
    else:
        permitted_ids = [c[0] for c in db.query(Course.id).all()]

    results = await search_rag_chunks(
        db=db,
        query_text=query,
        permitted_course_ids=permitted_ids,
        limit=6,
        min_similarity=0.1
    )
    return {"query": query, "results": results}


@router.get("/settings", response_model=AiTutorSettingResponse)
def get_admin_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Retorna as configurações globais do Tutor IA para gestão no painel."""
    return get_or_create_tutor_settings(db)


@router.put("/settings", response_model=AiTutorSettingResponse)
def update_admin_settings(
    payload: AiTutorSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Atualiza o prompt de sistema, temperatura, limites padrão e checkout do Tutor IA."""
    settings = get_or_create_tutor_settings(db)
    if payload.tutor_name is not None:
        settings.tutor_name = payload.tutor_name.strip() or "Tutor IA 24h"
    if payload.default_monthly_free_questions is not None:
        settings.default_monthly_free_questions = payload.default_monthly_free_questions
    if payload.system_prompt is not None:
        settings.system_prompt = payload.system_prompt
    if payload.temperature is not None:
        settings.temperature = payload.temperature
    if payload.model_name is not None:
        settings.model_name = payload.model_name
    if payload.is_enabled is not None:
        settings.is_enabled = payload.is_enabled
    if payload.sales_checkout_url is not None:
        settings.sales_checkout_url = payload.sales_checkout_url.strip() or None
    if payload.monthly_price_brl is not None:
        settings.monthly_price_brl = payload.monthly_price_brl
    if payload.rag_top_k is not None:
        settings.rag_top_k = payload.rag_top_k
    if payload.rag_min_similarity is not None:
        settings.rag_min_similarity = payload.rag_min_similarity
    if payload.access_mode is not None:
        settings.access_mode = payload.access_mode.strip() or "public"
    if payload.maintenance_message is not None:
        settings.maintenance_message = payload.maintenance_message.strip() or None
    if payload.allowed_topics is not None:
        settings.allowed_topics = payload.allowed_topics.strip() or None
    if payload.prohibited_topics is not None:
        settings.prohibited_topics = payload.prohibited_topics.strip() or None
    if payload.redirect_app_url is not None:
        settings.redirect_app_url = payload.redirect_app_url.strip() or None
    if payload.redirect_app_name is not None:
        settings.redirect_app_name = payload.redirect_app_name.strip() or None
    if payload.prohibited_response_guideline is not None:
        settings.prohibited_response_guideline = payload.prohibited_response_guideline.strip() or None

    settings.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(settings)
    logger.info(f"[TUTOR IA] Configurações globais atualizadas por {current_user.email}")
    return settings


@router.post("/settings/reset-prompt", response_model=AiTutorSettingResponse)
def reset_admin_prompt(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Restaura o Prompt de Sistema do Tutor IA para o modelo padrão recomendado."""
    settings = get_or_create_tutor_settings(db)
    settings.system_prompt = DEFAULT_SYSTEM_PROMPT
    settings.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(settings)
    logger.info(f"[TUTOR IA] Prompt padrão restaurado por {current_user.email}")
    return settings


@router.get("/analytics/insights")
def get_tutor_insights(
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Retorna métricas pedagógicas consolidadas e análise de dúvidas dos alunos:
    - Total de perguntas feitas pelos alunos
    - Total de likes e dislikes (taxa de satisfação)
    - Ranking das aulas com maior número de dúvidas (para revisão do professor)
    - Lista detalhada de feedbacks negativos com justificativas dos alunos
    """
    # 1. Total de perguntas de alunos
    user_msgs_query = db.query(AiTutorMessage).filter(AiTutorMessage.role == "user")
    if course_id:
        user_msgs_query = user_msgs_query.filter(AiTutorMessage.course_id == course_id)
    total_questions = user_msgs_query.count()

    # 2. Avaliações (likes e dislikes)
    ratings_query = db.query(AiTutorMessage).filter(AiTutorMessage.role == "assistant")
    if course_id:
        ratings_query = ratings_query.filter(AiTutorMessage.course_id == course_id)

    total_likes = ratings_query.filter(AiTutorMessage.feedback_rating == "like").count()
    total_dislikes = ratings_query.filter(AiTutorMessage.feedback_rating == "dislike").count()
    total_rated = total_likes + total_dislikes
    satisfaction_rate = round((total_likes / total_rated) * 100, 1) if total_rated > 0 else 100.0

    # 3. Aulas com mais dúvidas (Ranking pedagógico)
    lessons_grouped = (
        db.query(
            AiTutorMessage.lesson_id,
            func.count(AiTutorMessage.id).label("questions_count")
        )
        .filter(AiTutorMessage.role == "user", AiTutorMessage.lesson_id.isnot(None))
    )
    if course_id:
        lessons_grouped = lessons_grouped.filter(AiTutorMessage.course_id == course_id)

    top_lessons_raw = (
        lessons_grouped.group_by(AiTutorMessage.lesson_id)
        .order_by(desc("questions_count"))
        .limit(8)
        .all()
    )

    top_questioned_lessons = []
    for l_id, q_count in top_lessons_raw:
        lesson = db.query(Lesson).filter(Lesson.id == l_id).first()
        if not lesson:
            continue
        course = lesson.module.course if (lesson.module and lesson.module.course) else None
        dislikes_count = (
            db.query(AiTutorMessage)
            .filter(
                AiTutorMessage.lesson_id == l_id,
                AiTutorMessage.feedback_rating == "dislike"
            )
            .count()
        )
        top_questioned_lessons.append({
            "lesson_id": lesson.id,
            "lesson_title": lesson.title,
            "course_id": course.id if course else None,
            "course_title": course.title if course else "Curso",
            "questions_count": q_count,
            "dislikes_count": dislikes_count
        })

    # 4. Avaliações negativas recentes com justificativa dos alunos
    negative_query = (
        db.query(AiTutorMessage)
        .filter(
            AiTutorMessage.role == "assistant",
            AiTutorMessage.feedback_rating == "dislike"
        )
    )
    if course_id:
        negative_query = negative_query.filter(AiTutorMessage.course_id == course_id)

    recent_dislikes = negative_query.order_by(desc(AiTutorMessage.created_at)).limit(10).all()
    recent_negative_feedbacks = []
    for msg in recent_dislikes:
        user_name = msg.user.name if msg.user and msg.user.name else (msg.user.email if msg.user else "Aluno")
        lesson_title = msg.lesson.title if msg.lesson else "Geral do Curso"
        course_title = msg.course.title if msg.course else "Curso"
        recent_negative_feedbacks.append({
            "message_id": msg.id,
            "student_name": user_name,
            "lesson_id": msg.lesson_id,
            "lesson_title": lesson_title,
            "course_id": msg.course_id,
            "course_title": course_title,
            "answer_preview": msg.content[:200] + "..." if len(msg.content) > 200 else msg.content,
            "feedback_text": msg.feedback_text or "Nenhum motivo detalhado informado",
            "feedback_at": (msg.feedback_at or msg.created_at).isoformat() if (msg.feedback_at or msg.created_at) else None
        })

    return {
        "total_questions": total_questions,
        "total_likes": total_likes,
        "total_dislikes": total_dislikes,
        "satisfaction_rate": satisfaction_rate,
        "top_questioned_lessons": top_questioned_lessons,
        "recent_negative_feedbacks": recent_negative_feedbacks
    }


@router.get("/students/{student_id}")
def get_student_tutor_details(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Retorna métricas de custo, histórico de dúvidas e cota de um aluno específico."""
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    quota = get_student_tutor_quota(db, student)

    # Custo acumulado total de todas as perguntas já feitas pelo aluno
    total_cost_brl = db.query(func.sum(AiTutorMessage.cost_brl)).filter(
        AiTutorMessage.user_id == student_id
    ).scalar() or 0.0

    total_questions = db.query(func.count(AiTutorMessage.id)).filter(
        AiTutorMessage.user_id == student_id,
        AiTutorMessage.role == "user"
    ).scalar() or 0

    return {
        "student_id": student.id,
        "student_name": student.name,
        "student_email": student.email,
        "ai_tutor_active": student.ai_tutor_active,
        "ai_tutor_expires_at": student.ai_tutor_expires_at.isoformat() if student.ai_tutor_expires_at else None,
        "ai_tutor_custom_monthly_limit": student.ai_tutor_custom_monthly_limit,
        "used_this_month": quota["used_this_month"],
        "cost_this_month_brl": quota["student_cost_this_month_brl"],
        "total_cost_all_time_brl": round(total_cost_brl, 2),
        "total_questions_all_time": total_questions,
        "can_ask": quota["can_ask"],
    }


@router.put("/students/{student_id}")
def update_student_tutor_access(
    student_id: int,
    payload: StudentAiTutorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """Permite ao administrador ativar/desativar assinatura e definir cota personalizada para o aluno."""
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    if payload.ai_tutor_active is not None:
        student.ai_tutor_active = payload.ai_tutor_active
    if payload.ai_tutor_custom_monthly_limit is not None:
        student.ai_tutor_custom_monthly_limit = payload.ai_tutor_custom_monthly_limit
    if payload.ai_tutor_expires_at is not None:
        if payload.ai_tutor_expires_at:
            try:
                parsed_dt = datetime.fromisoformat(payload.ai_tutor_expires_at.replace("Z", "+00:00"))
                student.ai_tutor_expires_at = parsed_dt
            except Exception:
                raise HTTPException(status_code=400, detail="Formato de data inválido. Use ISO 8601.")
        else:
            student.ai_tutor_expires_at = None

    db.commit()
    db.refresh(student)
    logger.info(
        f"[TUTOR IA] Acesso do aluno {student.email} atualizado por {current_user.email}: "
        f"active={student.ai_tutor_active}, limit={student.ai_tutor_custom_monthly_limit}"
    )
    return {
        "status": "success",
        "student_id": student.id,
        "ai_tutor_active": student.ai_tutor_active,
        "ai_tutor_expires_at": student.ai_tutor_expires_at.isoformat() if student.ai_tutor_expires_at else None,
        "ai_tutor_custom_monthly_limit": student.ai_tutor_custom_monthly_limit
    }


# =========================================================================
# WEBHOOK DE ASSINATURAS (Hotmart & Checkout Futuro)
# =========================================================================

@router.post("/webhook/hotmart")
def hotmart_subscription_webhook(
    payload: HotmartSubscriptionWebhookPayload,
    db: Session = Depends(get_db),
):
    """
    Webhook para receber eventos de assinatura da Hotmart e ativar/cancelar o Tutor IA automaticamente.
    Compatível com eventos: PURCHASE_APPROVED, SUBSCRIPTION_CANCELED, SWITCH_PLAN, etc.
    """
    event = (payload.event or "").upper()
    data = payload.data or {}
    buyer = data.get("buyer", {})
    email = buyer.get("email") or data.get("email")

    if not email:
        logger.warning("[TUTOR IA WEBHOOK] Webhook recebido sem e-mail do comprador.")
        return {"status": "ignored", "reason": "No buyer email"}

    student = db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()
    if not student:
        logger.info(f"[TUTOR IA WEBHOOK] Usuário com e-mail {email} não cadastrado na plataforma.")
        return {"status": "ignored", "reason": "User not found"}

    # Eventos de aprovação de compra ou renovação
    if any(k in event for k in ["PURCHASE_APPROVED", "APPROVED", "COMPLETED", "ACTIVE"]):
        student.ai_tutor_active = True
        # Se vier data de expiração/próxima recorrência
        student.ai_tutor_expires_at = None
        db.commit()
        logger.info(f"[TUTOR IA WEBHOOK] Assinatura ativada para o aluno {student.email} via evento {event}")
        return {"status": "activated", "email": student.email}

    # Eventos de cancelamento, chargeback ou reembolso
    elif any(k in event for k in ["CANCELED", "REFUNDED", "CHARGEBACK", "EXPIRED", "SUSPENDED"]):
        student.ai_tutor_active = False
        db.commit()
        logger.info(f"[TUTOR IA WEBHOOK] Assinatura desativada para o aluno {student.email} via evento {event}")
        return {"status": "deactivated", "email": student.email}

    return {"status": "received", "event": event}


@router.get("/suggestions", response_model=List[AiTutorSuggestionResponse])
def list_student_suggestions(
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Lista sugestões e feedbacks de melhoria coletados dos alunos pelo Tutor IA.
    """
    query = (
        db.query(AiTutorSuggestion, User, Course, Lesson)
        .join(User, AiTutorSuggestion.user_id == User.id)
        .outerjoin(Course, AiTutorSuggestion.course_id == Course.id)
        .outerjoin(Lesson, AiTutorSuggestion.lesson_id == Lesson.id)
    )
    if status_filter:
        query = query.filter(AiTutorSuggestion.status == status_filter)

    records = query.order_by(desc(AiTutorSuggestion.created_at)).all()
    results = []
    for sugg, u, c, l in records:
        results.append(AiTutorSuggestionResponse(
            id=sugg.id,
            user_id=sugg.user_id,
            student_name=u.name or "Aluno",
            student_email=u.email,
            course_id=sugg.course_id,
            course_title=c.title if c else None,
            lesson_id=sugg.lesson_id,
            lesson_title=l.title if l else None,
            suggestion_text=sugg.suggestion_text,
            category=sugg.category,
            status=sugg.status,
            admin_notes=sugg.admin_notes,
            created_at=sugg.created_at.isoformat() if sugg.created_at else ""
        ))
    return results


@router.patch("/suggestions/{suggestion_id}", response_model=AiTutorSuggestionResponse)
def update_student_suggestion(
    suggestion_id: int,
    payload: AiTutorSuggestionUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Atualiza o status (new, analyzing, implemented, dismissed) e anotações internas da sugestão.
    """
    sugg = db.query(AiTutorSuggestion).filter(AiTutorSuggestion.id == suggestion_id).first()
    if not sugg:
        raise HTTPException(status_code=404, detail="Sugestão não encontrada.")

    if payload.status is not None:
        sugg.status = payload.status
    if payload.admin_notes is not None:
        sugg.admin_notes = payload.admin_notes.strip() or None

    sugg.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(sugg)

    u = db.query(User).filter(User.id == sugg.user_id).first()
    c = db.query(Course).filter(Course.id == sugg.course_id).first() if sugg.course_id else None
    l = db.query(Lesson).filter(Lesson.id == sugg.lesson_id).first() if sugg.lesson_id else None

    return AiTutorSuggestionResponse(
        id=sugg.id,
        user_id=sugg.user_id,
        student_name=u.name if u else "Aluno",
        student_email=u.email if u else "",
        course_id=sugg.course_id,
        course_title=c.title if c else None,
        lesson_id=sugg.lesson_id,
        lesson_title=l.title if l else None,
        suggestion_text=sugg.suggestion_text,
        category=sugg.category,
        status=sugg.status,
        admin_notes=sugg.admin_notes,
        created_at=sugg.created_at.isoformat() if sugg.created_at else ""
    )


@router.delete("/suggestions/{suggestion_id}")
def delete_student_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Exclui uma sugestão coletada.
    """
    sugg = db.query(AiTutorSuggestion).filter(AiTutorSuggestion.id == suggestion_id).first()
    if not sugg:
        raise HTTPException(status_code=404, detail="Sugestão não encontrada.")
    db.delete(sugg)
    db.commit()
    return {"detail": "Sugestão excluída com sucesso."}


@router.get("/admin/messages")
def get_admin_tutor_messages(
    student_id: Optional[int] = Query(None),
    course_id: Optional[int] = Query(None),
    lesson_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Retorna histórico auditável de conversas do Tutor IA com resumo financeiro
    de custos de API em BRL (geral da turma ou filtrado por aluno).
    """
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    # 1. Resumo Financeiro
    base_fin_query = db.query(AiTutorMessage)
    if student_id:
        base_fin_query = base_fin_query.filter(AiTutorMessage.user_id == student_id)

    total_spent_brl = base_fin_query.with_entities(func.sum(AiTutorMessage.cost_brl)).scalar() or 0.0
    total_spent_this_month = base_fin_query.filter(
        AiTutorMessage.created_at >= month_start
    ).with_entities(func.sum(AiTutorMessage.cost_brl)).scalar() or 0.0

    total_questions = base_fin_query.filter(
        AiTutorMessage.role == "user"
    ).with_entities(func.count(AiTutorMessage.id)).scalar() or 0

    avg_cost = round(total_spent_brl / max(total_questions, 1), 4)

    # Métricas de Assinaturas e Lucro
    settings = get_or_create_tutor_settings(db)
    monthly_price = float(settings.monthly_price_brl or 10.0)
    active_subs_count = db.query(func.count(User.id)).filter(User.ai_tutor_active == True).scalar() or 0
    est_monthly_rev = round(active_subs_count * monthly_price, 2)
    est_monthly_profit = round(est_monthly_rev - float(total_spent_this_month), 2)

    # Top alunos com maior custo (apenas na visão geral)
    top_spenders = []
    if not student_id:
        top_spenders_raw = (
            db.query(
                User.id,
                User.name,
                User.email,
                func.sum(AiTutorMessage.cost_brl).label("total_cost"),
                func.count(AiTutorMessage.id).label("total_msgs")
            )
            .join(AiTutorMessage, User.id == AiTutorMessage.user_id)
            .group_by(User.id, User.name, User.email)
            .order_by(desc("total_cost"))
            .limit(5)
            .all()
        )
        for u_id, u_name, u_email, u_cost, u_count in top_spenders_raw:
            top_spenders.append({
                "student_id": u_id,
                "student_name": u_name,
                "student_email": u_email,
                "total_cost_brl": round(float(u_cost or 0.0), 4),
                "total_messages": u_count
            })

    # 2. Listagem de mensagens com paginação e filtros
    query = (
        db.query(AiTutorMessage, User, Course, Lesson, Module)
        .join(User, AiTutorMessage.user_id == User.id)
        .outerjoin(Course, AiTutorMessage.course_id == Course.id)
        .outerjoin(Lesson, AiTutorMessage.lesson_id == Lesson.id)
        .outerjoin(Module, Lesson.module_id == Module.id)
    )

    if student_id:
        query = query.filter(AiTutorMessage.user_id == student_id)
    if course_id:
        query = query.filter(AiTutorMessage.course_id == course_id)
    if lesson_id:
        query = query.filter(AiTutorMessage.lesson_id == lesson_id)
    if search:
        search_filter = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(AiTutorMessage.content).like(search_filter) |
            func.lower(User.name).like(search_filter) |
            func.lower(User.email).like(search_filter)
        )

    total_items = query.count()
    total_pages = max(1, (total_items + limit - 1) // limit)
    offset = (page - 1) * limit

    rows = query.order_by(desc(AiTutorMessage.created_at)).offset(offset).limit(limit).all()

    items = []
    for msg, usr, crs, les, mod in rows:
        items.append({
            "id": msg.id,
            "student_id": usr.id,
            "student_name": usr.name,
            "student_email": usr.email,
            "course_id": crs.id if crs else None,
            "course_title": crs.title if crs else None,
            "module_id": mod.id if mod else None,
            "module_title": mod.title if mod else None,
            "lesson_id": les.id if les else None,
            "lesson_title": les.title if les else None,
            "role": msg.role,
            "content": msg.content,
            "prompt_tokens": msg.prompt_tokens,
            "completion_tokens": msg.completion_tokens,
            "cost_brl": round(float(msg.cost_brl or 0.0), 4),
            "feedback_rating": msg.feedback_rating,
            "feedback_text": msg.feedback_text,
            "created_at": msg.created_at.isoformat() if msg.created_at else ""
        })

    return {
        "financial_summary": {
            "total_spent_brl": round(float(total_spent_brl), 4),
            "total_spent_this_month_brl": round(float(total_spent_this_month), 4),
            "total_questions": total_questions,
            "avg_cost_per_question": avg_cost,
            "active_subscribers": active_subs_count,
            "monthly_price_brl": monthly_price,
            "estimated_monthly_revenue": est_monthly_rev,
            "estimated_monthly_profit": est_monthly_profit,
            "top_spenders": top_spenders
        },
        "items": items,
        "pagination": {
            "total_items": total_items,
            "total_pages": total_pages,
            "current_page": page,
            "limit": limit
        }
    }
