import os
import re
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.logger import logger
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonTranscription, UserCourse
from app.models.tutor_ia import AiTutorSetting, AiTutorMessage, AiTutorSuggestion
from app.services.ai_transcription_service import get_openai_api_key, CHAT_COMPLETIONS_ENDPOINT

DEFAULT_SYSTEM_PROMPT = """Você é o Tutor de IA da plataforma de membros, especializado no curso "{curso_atual}".
Seu objetivo é guiar o aluno {nome_aluno} com didática acolhedora, objetiva e clara.

Diretrizes Obrigatórias:
1. Responda com base estrita no conteúdo da aula atual "{aula_atual}" e nas transcrições disponíveis.
2. Sempre que oportuno, mencione a minutagem aproximada em que o instrutor aborda o tema (ex: "Aos 02:15 do vídeo...").
3. Se a dúvida do aluno for abordada em outra aula do mesmo curso ou em outros cursos que ele já possui acesso ({outros_cursos_aluno}), indique expressamente o módulo e aula.
4. Se o aluno perguntar sobre um assunto avançado disponível em outro curso da lista {cursos_nao_adquiridos}, responda cordialmente a dúvida básica e informe que o aprofundamento prático está disponível no respectivo treinamento.
5. Se o aluno perguntar sobre quantidade de aulas, duração ou carga horária de módulos ou do curso (ou de outros cursos), consulte a Grade e Cronograma fornecida no contexto e responda com exatidão.
6. Seja conciso: respostas em 2 a 4 parágrafos curtos, formatadas com tópicos e negritos para leitura fluida."""


def get_current_year_month() -> Tuple[datetime, datetime]:
    """Retorna o início e término do mês corrente em UTC para cálculo de cotas mensais."""
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=timezone.utc)
    if now.month == 12:
        end_of_month = datetime(now.year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    else:
        end_of_month = datetime(now.year, now.month + 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    return start_of_month, end_of_month


def get_or_create_tutor_settings(db: Session) -> AiTutorSetting:
    """Recupera ou cria as configurações globais do Tutor IA."""
    settings = db.query(AiTutorSetting).first()
    if not settings:
        settings = AiTutorSetting(
            tutor_name="Tutor IA 24h",
            default_monthly_free_questions=3,
            system_prompt=DEFAULT_SYSTEM_PROMPT,
            temperature=0.3,
            model_name="gpt-4o-mini",
            is_enabled=True,
            monthly_price_brl=10.0
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def get_student_tutor_quota(db: Session, user: User) -> Dict[str, Any]:
    """
    Calcula a cota mensal do aluno para o Tutor IA.
    Retorna o status de assinante, limite total, perguntas utilizadas no mês e perguntas restantes.
    """
    settings = get_or_create_tutor_settings(db)
    is_manager = user.role in ["superadmin", "admin"]
    access_mode = getattr(settings, "access_mode", "public") or "public"
    is_enabled = getattr(settings, "is_enabled", True)
    default_m_msg = "O Tutor IA está temporariamente em manutenção para melhorias pedagógicas e atualizações. O envio de dúvidas voltará a funcionar em breve!"
    maintenance_msg = getattr(settings, "maintenance_message", None) or default_m_msg

    if not is_enabled or access_mode == "disabled":
        is_visible = False
    elif access_mode == "private_team":
        is_visible = is_manager
    else:
        is_visible = True

    is_in_maintenance = (access_mode == "maintenance" and not is_manager)

    # Se for admin, superadmin ou possuir cota VIP (-1)
    is_vip = user.ai_tutor_custom_monthly_limit == -1
    is_subscriber = bool(user.ai_tutor_active)

    # Verifica validade da assinatura se houver expires_at
    if is_subscriber and user.ai_tutor_expires_at:
        now = datetime.now(timezone.utc)
        expires_at_utc = user.ai_tutor_expires_at
        if expires_at_utc.tzinfo is None:
            expires_at_utc = expires_at_utc.replace(tzinfo=timezone.utc)
        if expires_at_utc < now:
            is_subscriber = False

    start_month, end_month = get_current_year_month()

    # Total de perguntas enviadas pelo aluno neste mês
    used_count = db.query(func.count(AiTutorMessage.id)).filter(
        AiTutorMessage.user_id == user.id,
        AiTutorMessage.role == "user",
        AiTutorMessage.created_at >= start_month,
        AiTutorMessage.created_at < end_month
    ).scalar() or 0

    # Custo somado consumido pelo aluno neste mês
    cost_month = db.query(func.sum(AiTutorMessage.cost_brl)).filter(
        AiTutorMessage.user_id == user.id,
        AiTutorMessage.created_at >= start_month,
        AiTutorMessage.created_at < end_month
    ).scalar() or 0.0

    if is_manager or is_vip or is_subscriber:
        total_limit = -1
        remaining = 9999
        can_ask = is_manager or (not is_in_maintenance and is_visible)
    else:
        custom_limit = user.ai_tutor_custom_monthly_limit
        total_limit = custom_limit if custom_limit is not None else settings.default_monthly_free_questions
        remaining = max(0, total_limit - used_count)
        can_ask = (remaining > 0) and (not is_in_maintenance) and is_visible

    return {
        "tutor_name": settings.tutor_name or "Tutor IA 24h",
        "is_active": is_subscriber or is_vip or is_manager,
        "is_subscriber": is_subscriber,
        "is_vip": is_vip,
        "expires_at": user.ai_tutor_expires_at.isoformat() if user.ai_tutor_expires_at else None,
        "total_monthly_limit": total_limit,
        "used_this_month": used_count,
        "remaining_free": remaining,
        "can_ask": can_ask,
        "sales_checkout_url": settings.sales_checkout_url,
        "monthly_price_brl": settings.monthly_price_brl,
        "student_cost_this_month_brl": round(cost_month, 2),
        "is_enabled": is_enabled,
        "access_mode": access_mode,
        "is_visible": is_visible,
        "is_in_maintenance": is_in_maintenance,
        "maintenance_message": maintenance_msg if is_in_maintenance else None,
    }


def find_related_lesson_mentions(
    db: Session,
    permitted_course_ids: List[int],
    query_text: str,
    current_lesson_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Busca semântica simples/rápida por palavras-chave entre as aulas transcritas
    dos cursos que o aluno tem permissão para indicar outras aulas onde o tema é citado.
    """
    if not permitted_course_ids or not query_text:
        return []

    words = [w.lower().strip() for w in re.findall(r'\b\w{4,}\b', query_text) if len(w) >= 4]
    if not words:
        return []

    related = []
    # Busca lições de cursos permitidos com transcrição
    query = (
        db.query(Lesson, Module, Course, LessonTranscription)
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .outerjoin(LessonTranscription, Lesson.id == LessonTranscription.lesson_id)
        .filter(Course.id.in_(permitted_course_ids))
    )
    if current_lesson_id:
        query = query.filter(Lesson.id != current_lesson_id)

    candidates = query.limit(40).all()

    for lesson, module, course, trans in candidates:
        match_count = 0
        summary = (trans.summary_markdown or '') if trans else ''
        takeaways = (trans.key_takeaways or '') if trans else ''
        content_haystack = f"{lesson.title} {lesson.description or ''} {summary} {takeaways}".lower()
        for w in words:
            if w in content_haystack:
                match_count += 1
        if match_count >= 1:
            related.append({
                "lesson_id": lesson.id,
                "lesson_title": lesson.title,
                "module_id": module.id,
                "module_title": module.title,
                "course_id": course.id,
                "course_title": course.title,
                "match_score": match_count
            })

    related.sort(key=lambda x: x["match_score"], reverse=True)
    return related[:3]


async def prepare_tutor_chat_context(
    db: Session,
    user: User,
    course_id: int,
    lesson_id: Optional[int],
    user_message: str
) -> Tuple[AiTutorSetting, Dict[str, Any], List[Dict[str, Any]], Dict[str, Any], Dict[str, str]]:
    """
    Valida cota, busca contexto do RAG, histórico e prepara o payload de mensagens para a IA.
    """
    settings = get_or_create_tutor_settings(db)
    is_manager = user.role in ["superadmin", "admin"]
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

    # 1. Validar cota do aluno
    quota = get_student_tutor_quota(db, user)
    if not quota["can_ask"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Você atingiu o limite de perguntas gratuitas deste mês. Assine o Tutor IA para tirar dúvidas ilimitadas!"
        )

    # Registra sugestão de melhoria se for detectada na mensagem do aluno
    record_student_suggestion_if_detected(db, user.id, course_id, lesson_id, user_message)

    # 2. Obter curso atual
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    # 3. Identificar cursos aos quais o aluno tem acesso vs cursos para upsell
    enrolled_course_ids = [
        uc.course_id for uc in db.query(UserCourse.course_id).filter(UserCourse.user_id == user.id).all()
    ]
    if user.role in ["superadmin", "admin"]:
        enrolled_course_ids = [c.id for c in db.query(Course.id).all()]
    elif course_id not in enrolled_course_ids:
        enrolled_course_ids.append(course_id)

    other_courses = db.query(Course.title).filter(
        Course.id.in_(enrolled_course_ids),
        Course.id != course_id
    ).all()
    other_courses_str = ", ".join([c.title for c in other_courses]) or "Nenhum outro curso matriculado"

    unowned_courses = db.query(Course.title).filter(~Course.id.in_(enrolled_course_ids)).all()
    unowned_courses_str = ", ".join([c.title for c in unowned_courses]) or "Todos os cursos já adquiridos"

    # 4. Contexto da aula atual
    lesson = None
    lesson_transcription_text = ""
    chapters_str = ""
    if lesson_id:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if lesson:
            trans = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == lesson_id).first()
            if trans:
                parts = []
                if trans.key_takeaways:
                    parts.append(f"Principais Pontos da Aula:\n{trans.key_takeaways}")
                if trans.summary_markdown:
                    parts.append(f"Resumo Pedagógico:\n{trans.summary_markdown[:2500]}")
                if trans.chapters:
                    try:
                        chaps = json.loads(trans.chapters) if isinstance(trans.chapters, str) else trans.chapters
                        chapters_str = "Capítulos e Minutagens da Aula:\n" + "\n".join(
                            [f"- {c.get('time', '00:00')} : {c.get('title', '')}" for c in chaps]
                        )
                        parts.append(chapters_str)
                    except Exception:
                        pass
                if trans.full_transcript:
                    parts.append(f"Trecho Inicial da Transcrição:\n{trans.full_transcript[:3000]}")
                lesson_transcription_text = "\n\n".join(parts)

    # 5. Busca Semântica Vetorial (RAG) e Aulas Correlatas nos cursos permitidos
    from app.services.ai_rag_service import search_rag_chunks, get_course_structure_metadata

    rag_chunks = []
    try:
        rag_chunks = await search_rag_chunks(
            db=db,
            query_text=user_message,
            permitted_course_ids=enrolled_course_ids,
            current_lesson_id=lesson_id,
            limit=getattr(settings, "rag_top_k", 4) or 4,
            min_similarity=getattr(settings, "rag_min_similarity", 0.35) or 0.35,
            enable_multi_query=True
        )
    except Exception as e_rag:
        logger.warning(f"[TUTOR IA] Falha na busca vetorial RAG: {e_rag}")

    related_lessons = find_related_lesson_mentions(
        db=db,
        permitted_course_ids=enrolled_course_ids,
        query_text=user_message,
        current_lesson_id=lesson_id
    )

    # Incorpora aulas correlatas identificadas com alta similaridade vetorial
    for rc in rag_chunks:
        if not rc.get("is_current_lesson"):
            if not any(r["lesson_id"] == rc["lesson_id"] for r in related_lessons):
                related_lessons.append({
                    "lesson_id": rc["lesson_id"],
                    "lesson_title": rc["lesson_title"],
                    "course_id": rc["course_id"],
                    "course_title": rc["course_title"],
                    "module_id": rc["module_id"],
                    "module_title": rc.get("module_title") or "Módulo da Aula"
                })

    rag_chunks_text = ""
    if rag_chunks:
        rag_chunks_text = "\nFragmentos Semânticos mais Relevantes (RAG Vetorial com Minutagens):\n" + "\n".join(
            [f"- [Aula '{rc['lesson_title']}' | Minutagem: {rc['start_time_str']} a {rc['end_time_str']}]:\n  \"{rc['content']}\"" for rc in rag_chunks]
        )

    related_hint = ""
    if related_lessons:
        related_hint = "\nAulas correlatas encontradas nos cursos do aluno:\n" + "\n".join(
            [f"- Curso '{r['course_title']}', Módulo '{r['module_title']}', Aula '{r['lesson_title']}'" for r in related_lessons]
        )

    # Grade Estrutural (quantidade de aulas e duração de módulos/curso)
    course_structure_info = get_course_structure_metadata(db, course_id, enrolled_course_ids)

    # 5.5 Diretrizes e Proibições Estritas (Permitido vs Proibido)
    guidelines_prompt = "\n\n=== REGRAS DE CONDUTA E LIMITES DE ATUAÇÃO OBRIGATÓRIOS ===\n"
    allowed_sec = getattr(settings, "allowed_topics", None)
    if allowed_sec:
        guidelines_prompt += f"ESCOPO PERMITIDO (O que você PODE e DEVE falar):\n{allowed_sec}\n\n"

    prohibited_sec = getattr(settings, "prohibited_topics", None)
    redirect_url = getattr(settings, "redirect_app_url", None)
    redirect_name = getattr(settings, "redirect_app_name", None) or "nosso aplicativo especializado"
    prohibited_guideline = getattr(settings, "prohibited_response_guideline", None)

    guidelines_prompt += "PROIBIÇÕES ABSOLUTAS (O que você JAMAIS deve fazer):\n"
    guidelines_prompt += "- REGRA INVIOLÁVEL: Você é TERMINANTEMENTE PROIBIDO de fazer leitura ou interpretação de trânsitos astrológicos personalizados para o aluno. Temos um aplicativo/agente focado exatamente nisso.\n"
    if prohibited_sec:
        guidelines_prompt += f"{prohibited_sec}\n"

    guidelines_prompt += "\nCOMO AGIR QUANDO O ALUNO SOLICITAR ALGO PROIBIDO OU INTERPRETAÇÃO DE TRÂNSITOS:\n"
    if prohibited_guideline:
        guidelines_prompt += f"{prohibited_guideline}\n"
    else:
        guidelines_prompt += "- Recuse gentilmente explicando que o seu papel pedagógico é focado nas aulas do curso e em tirar dúvidas dos vídeos.\n"
        if redirect_url:
            guidelines_prompt += f"- Forneça o link do {redirect_name}: {redirect_url}\n"
        else:
            guidelines_prompt += f"- Direcione o aluno para o {redirect_name} oficial.\n"

    # 6. Montagem do Prompt Dinâmico
    template = settings.system_prompt or DEFAULT_SYSTEM_PROMPT
    system_prompt = template.replace("{nome_aluno}", user.name or "Aluno") \
                            .replace("{nome_tutor}", settings.tutor_name or "Tutor IA 24h") \
                            .replace("{curso_atual}", course.title) \
                            .replace("{aula_atual}", lesson.title if lesson else "Visão Geral do Curso") \
                            .replace("{outros_cursos_aluno}", other_courses_str) \
                            .replace("{cursos_nao_adquiridos}", unowned_courses_str)
    system_prompt += guidelines_prompt

    context_prompt = f"""Informações de Apoio para a Resposta:
Curso: {course.title}
Aula Atual: {lesson.title if lesson else 'Nenhuma aula específica'}
{lesson_transcription_text}
{rag_chunks_text}
{related_hint}

{course_structure_info}
"""

    # 7. Buscar histórico recente da conversa (últimas 4 mensagens)
    recent_query = db.query(AiTutorMessage).filter(
        AiTutorMessage.user_id == user.id,
        AiTutorMessage.course_id == course_id
    )
    if lesson_id:
        recent_query = recent_query.filter(AiTutorMessage.lesson_id == lesson_id)
    recent_messages = recent_query.order_by(desc(AiTutorMessage.created_at)).limit(4).all()
    recent_messages.reverse()

    chat_history_payload = []
    for m in recent_messages:
        chat_history_payload.append({"role": m.role, "content": m.content})

    # Mensagens para a OpenAI
    messages_payload = [
        {"role": "system", "content": system_prompt + "\n\n" + context_prompt},
        *chat_history_payload,
        {"role": "user", "content": user_message}
    ]

    api_key = get_openai_api_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.model_name or "gpt-4o-mini",
        "messages": messages_payload,
        "temperature": settings.temperature or 0.3
    }
    return settings, quota, related_lessons, payload, headers


def _trigger_tutor_lifecycle(db: Session, user: User, updated_quota: dict):
    try:
        from app.services.funnel_trigger_service import dispatch_tutor_ia_lifecycle_funnels
        user_msgs_count = db.query(AiTutorMessage).filter(
            AiTutorMessage.user_id == user.id,
            AiTutorMessage.role == "user"
        ).count()
        if user_msgs_count == 1:
            dispatch_tutor_ia_lifecycle_funnels(db=db, student_id=user.id, event_type="first_chat")
        if updated_quota.get("can_ask") is False or updated_quota.get("questions_remaining") == 0:
            dispatch_tutor_ia_lifecycle_funnels(db=db, student_id=user.id, event_type="quota_exhausted")
    except Exception as exc:
        logger.error(f"[TUTOR IA] Falha ao verificar gatilhos de ciclo do tutor: {exc}")


async def generate_tutor_response(
    db: Session,
    user: User,
    course_id: int,
    lesson_id: Optional[int],
    user_message: str
) -> Dict[str, Any]:
    """
    Executa a requisição tradicional (não-streaming) ao Tutor IA com RAG, controle de cotas e cálculo de custos.
    """
    settings, quota, related_lessons, payload, headers = await prepare_tutor_chat_context(
        db=db,
        user=user,
        course_id=course_id,
        lesson_id=lesson_id,
        user_message=user_message
    )

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(CHAT_COMPLETIONS_ENDPOINT, headers=headers, json=payload)

        if res.status_code != 200:
            logger.error(f"[TUTOR IA] Erro na OpenAI API ({res.status_code}): {res.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Não foi possível obter resposta do Tutor IA neste momento. Tente novamente em instantes."
            )

        resp_json = res.json()
        ai_reply = resp_json["choices"][0]["message"]["content"].strip()
        usage = resp_json.get("usage", {})
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)

        cost_usd = (prompt_tokens * (0.15 / 1_000_000)) + (completion_tokens * (0.60 / 1_000_000))
        cost_brl = round(cost_usd * 5.80, 5)

        user_msg_db = AiTutorMessage(
            user_id=user.id,
            course_id=course_id,
            lesson_id=lesson_id,
            role="user",
            content=user_message,
            prompt_tokens=prompt_tokens,
            completion_tokens=0,
            cost_brl=0.0
        )
        db.add(user_msg_db)

        assistant_msg_db = AiTutorMessage(
            user_id=user.id,
            course_id=course_id,
            lesson_id=lesson_id,
            role="assistant",
            content=ai_reply,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost_brl=cost_brl,
            related_lessons_json=json.dumps(related_lessons, ensure_ascii=False) if related_lessons else None
        )
        db.add(assistant_msg_db)
        db.commit()
        db.refresh(assistant_msg_db)

        updated_quota = get_student_tutor_quota(db, user)
        _trigger_tutor_lifecycle(db, user, updated_quota)

        return {
            "tutor_name": settings.tutor_name or "Tutor IA 24h",
            "reply": ai_reply,
            "cost_brl": cost_brl,
            "remaining_free": updated_quota["remaining_free"],
            "can_ask": updated_quota["can_ask"],
            "related_lessons": related_lessons,
            "message_id": assistant_msg_db.id,
            "created_at": assistant_msg_db.created_at.isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[TUTOR IA] Falha inesperada ao processar mensagem do aluno {user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro interno ao processar a dúvida com o Tutor IA."
        )


async def generate_tutor_response_stream(
    db: Session,
    user: User,
    course_id: int,
    lesson_id: Optional[int],
    user_message: str
):
    """
    Executa a requisição ao Tutor IA com streaming Server-Sent Events (SSE) em tempo real.
    Emite tokens conforme chegam da OpenAI e salva o histórico consolidado ao finalizar.
    """
    try:
        settings, quota, related_lessons, payload, headers = await prepare_tutor_chat_context(
            db=db,
            user=user,
            course_id=course_id,
            lesson_id=lesson_id,
            user_message=user_message
        )

        payload["stream"] = True
        accumulated_content = []
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", CHAT_COMPLETIONS_ENDPOINT, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    err_text = await response.aread()
                    logger.error(f"[TUTOR IA STREAM] Erro OpenAI ({response.status_code}): {err_text.decode('utf-8', 'ignore')}")
                    yield f"data: {json.dumps({'type': 'error', 'detail': 'Falha na comunicação com o Tutor IA.'})}\n\n"
                    return

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            token = delta.get("content", "")
                            if token:
                                accumulated_content.append(token)
                                yield f"data: {json.dumps({'type': 'token', 'token': token}, ensure_ascii=False)}\n\n"
                        except Exception:
                            continue

        full_reply = "".join(accumulated_content).strip()
        if not full_reply:
            full_reply = "Não foi possível gerar a resposta no momento."

        prompt_tokens_est = len(json.dumps(payload.get("messages", []))) // 4
        completion_tokens_est = len(full_reply) // 4
        cost_usd = (prompt_tokens_est * (0.15 / 1_000_000)) + (completion_tokens_est * (0.60 / 1_000_000))
        cost_brl = round(cost_usd * 5.80, 5)

        from app.core.database import SessionLocal
        save_db = SessionLocal()
        try:
            user_msg_db = AiTutorMessage(
                user_id=user.id,
                course_id=course_id,
                lesson_id=lesson_id,
                role="user",
                content=user_message,
                prompt_tokens=prompt_tokens_est,
                completion_tokens=0,
                cost_brl=0.0
            )
            save_db.add(user_msg_db)

            assistant_msg_db = AiTutorMessage(
                user_id=user.id,
                course_id=course_id,
                lesson_id=lesson_id,
                role="assistant",
                content=full_reply,
                prompt_tokens=prompt_tokens_est,
                completion_tokens=completion_tokens_est,
                cost_brl=cost_brl,
                related_lessons_json=json.dumps(related_lessons, ensure_ascii=False) if related_lessons else None
            )
            save_db.add(assistant_msg_db)
            save_db.commit()
            save_db.refresh(assistant_msg_db)

            saved_id = assistant_msg_db.id
            saved_created_at = assistant_msg_db.created_at.isoformat()
            updated_quota = get_student_tutor_quota(save_db, user)
            _trigger_tutor_lifecycle(save_db, user, updated_quota)
        finally:
            save_db.close()

        done_payload = {
            "type": "done",
            "message_id": saved_id,
            "reply": full_reply,
            "cost_brl": cost_brl,
            "remaining_free": updated_quota["remaining_free"],
            "can_ask": updated_quota["can_ask"],
            "related_lessons": related_lessons,
            "tutor_name": settings.tutor_name or "Tutor IA 24h",
            "created_at": saved_created_at
        }
        yield f"data: {json.dumps(done_payload, ensure_ascii=False)}\n\n"

    except HTTPException as http_exc:
        logger.warning(f"[TUTOR IA STREAM] HTTPException durante streaming: {http_exc.detail}")
        yield f"data: {json.dumps({'type': 'error', 'detail': http_exc.detail, 'status': http_exc.status_code}, ensure_ascii=False)}\n\n"
    except Exception as e:
        logger.error(f"[TUTOR IA STREAM] Exceção durante streaming: {e}")
        yield f"data: {json.dumps({'type': 'error', 'detail': 'Ocorreu um erro ao processar sua dúvida. Tente novamente mais tarde.'}, ensure_ascii=False)}\n\n" 


def record_student_suggestion_if_detected(
    db: Session,
    user_id: int,
    course_id: Optional[int],
    lesson_id: Optional[int],
    message_text: str
):
    """
    Detecta automaticamente intenções de melhoria ou feedback da plataforma enviados pelo aluno
    e armazena na tabela ai_tutor_suggestions para gestão do administrador.
    """
    if not message_text or len(message_text) < 8:
        return None

    triggers = [
        "sugiro", "sugestao", "sugestão", "melhorar", "poderia ter", "podia ter",
        "deveria ter", "feedback", "ideia", "adicionar opcao", "adicionar opção",
        "audio baixo", "áudio baixo", "som baixo", "nao gostei", "não gostei",
        "podiam colocar", "podiam adicionar", "app mobile", "aplicativo"
    ]
    txt_lower = message_text.lower()
    if any(t in txt_lower for t in triggers):
        try:
            sugg = AiTutorSuggestion(
                user_id=user_id,
                course_id=course_id,
                lesson_id=lesson_id,
                suggestion_text=message_text.strip(),
                category="platform_improvement",
                status="new"
            )
            db.add(sugg)
            db.commit()

            # Opção B: Abre chamado interno na Central de Suporte (/admin/suporte)
            if course_id:
                try:
                    from app.models.support import SupportTopic
                    from app.models.course import Course, Lesson
                    from app.models.user import User

                    course = db.query(Course).filter(Course.id == course_id).first()
                    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first() if lesson_id else None
                    u = db.query(User).filter(User.id == user_id).first()

                    c_title = course.title if course else "Curso"
                    l_title = lesson.title if lesson else "Visão Geral do Curso"
                    topic_title = f"💡 [Sugestão Tech Tutor] {l_title[:60]}"

                    topic_content = (
                        f"💡 **Sugestão de melhoria enviada pelo aluno através do Tech Tutor:**\n\n"
                        f"> \"{message_text.strip()}\"\n\n"
                        f"--------------------------------------------------\n"
                        f"📚 **Curso:** {c_title}\n"
                        f"🎬 **Aula:** {l_title}\n"
                        f"👤 **Aluno:** {u.name if u else 'Aluno'} ({u.email if u else ''})"
                    )

                    support_topic = SupportTopic(
                        user_id=user_id,
                        course_id=course_id,
                        title=topic_title,
                        content=topic_content,
                        status="open"
                    )
                    db.add(support_topic)
                    db.commit()
                except Exception as e_sup:
                    logger.warning(f"[TUTOR IA] Falha ao criar chamado de suporte para sugestão: {e_sup}")

            return sugg
        except Exception as e:
            db.rollback()
            logger.warning(f"[TUTOR IA] Falha ao registrar sugestão detectada: {e}")
    return None
