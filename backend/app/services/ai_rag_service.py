import math
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.logger import logger
from app.models.course import Course, Module, Lesson, LessonTranscription, UserCourse
from app.models.tutor_ia import AiKnowledgeChunk
from app.services.ai_transcription_service import get_openai_api_key

EMBEDDINGS_ENDPOINT = "https://api.openai.com/v1/embeddings"
EMBEDDING_MODEL = "text-embedding-3-small"


def normalize_vector(v: List[float]) -> List[float]:
    """Normaliza um vetor para norma L2 unitária."""
    norm = math.sqrt(sum(x * x for x in v))
    if norm == 0.0:
        return v
    return [round(x / norm, 6) for x in v]


def dot_product(v1: List[float], v2: List[float]) -> float:
    """Calcula o produto escalar entre dois vetores normalizados (similaridade de cosseno)."""
    return sum(x * y for x, y in zip(v1, v2))


def time_to_seconds(time_str: str) -> int:
    """Converte 'MM:SS' ou 'HH:MM:SS' em segundos."""
    try:
        parts = [int(p) for p in time_str.strip().split(":")]
        if len(parts) == 2:
            return parts[0] * 60 + parts[1]
        elif len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
    except Exception:
        pass
    return 0


def seconds_to_time(seconds: Optional[int]) -> str:
    """Converte segundos em 'MM:SS'."""
    if not seconds:
        return "00:00"
    m = seconds // 60
    s = seconds % 60
    return f"{m:02d}:{s:02d}"


async def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Gera embeddings para uma lista de textos utilizando a API OpenAI text-embedding-3-small.
    Em fallback ou testes sem chave, gera vetores normalizados com segurança.
    """
    if not texts:
        return []

    try:
        api_key = get_openai_api_key()
    except Exception as e:
        logger.warning(f"[RAG VETORIAL] API Key da OpenAI não encontrada ({e}). Usando fallback mock.")
        return [normalize_vector([float((hash(t) + i) % 100) for i in range(64)]) for t in texts]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": EMBEDDING_MODEL,
        "input": texts
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(EMBEDDINGS_ENDPOINT, headers=headers, json=payload)
            if res.status_code != 200:
                logger.error(f"[RAG VETORIAL] Erro na API de embeddings OpenAI ({res.status_code}): {res.text}")
                # Fallback em caso de erro da API
                return [normalize_vector([float((hash(t) + i) % 100) for i in range(64)]) for t in texts]

            data = res.json()
            raw_embeddings = [item["embedding"] for item in data.get("data", [])]
            return [normalize_vector(emb) for emb in raw_embeddings]
    except Exception as err:
        logger.error(f"[RAG VETORIAL] Falha ao conectar na API de embeddings: {err}")
        return [normalize_vector([float((hash(t) + i) % 100) for i in range(64)]) for t in texts]


def split_text_into_chunks(
    text: str,
    chapters: List[Dict[str, Any]],
    chunk_size_words: int = 150,
    overlap_words: int = 30
) -> List[Dict[str, Any]]:
    """
    Divide a transcrição em blocos respeitando pontuação e associando
    a minutagem aproximada com base nos capítulos da aula.
    """
    if not text:
        return []

    words = text.split()
    total_words = len(words)
    if total_words == 0:
        return []

    # Mapa de minutagens por capítulo se houver
    parsed_chapters = []
    for c in chapters:
        time_str = c.get("time", "00:00")
        sec = time_to_seconds(time_str)
        parsed_chapters.append({"sec": sec, "title": c.get("title", "")})
    parsed_chapters.sort(key=lambda x: x["sec"])

    chunks = []
    i = 0
    step = max(1, chunk_size_words - overlap_words)

    while i < total_words:
        chunk_words = words[i:i + chunk_size_words]
        chunk_text = " ".join(chunk_words)

        # Estima proporção do tempo com base no progresso das palavras
        start_ratio = i / total_words
        end_ratio = min(1.0, (i + len(chunk_words)) / total_words)

        # Se houver capítulos, pega o capítulo que melhor coincide com a proporção
        start_sec = 0
        end_sec = 0
        if parsed_chapters:
            max_sec = parsed_chapters[-1]["sec"] if parsed_chapters[-1]["sec"] > 0 else 600
            start_sec = int(start_ratio * max_sec)
            end_sec = int(end_ratio * max_sec)
        else:
            start_sec = int(start_ratio * 300)
            end_sec = int(end_ratio * 300)

        chunks.append({
            "content": chunk_text,
            "start_time_seconds": start_sec,
            "end_time_seconds": max(start_sec, end_sec),
            "token_count": len(chunk_words)
        })

        i += step
        if i + overlap_words >= total_words and i < total_words:
            # Pega as palavras finais
            rest = words[i:]
            if rest:
                chunks.append({
                    "content": " ".join(rest),
                    "start_time_seconds": int((i / total_words) * (start_sec or 300)),
                    "end_time_seconds": end_sec,
                    "token_count": len(rest)
                })
            break

    return chunks


async def generate_lesson_qa_pairs(
    transcript: str,
    lesson_title: str,
    course_title: str
) -> List[Dict[str, Any]]:
    """
    Gera 5 perguntas e respostas pedagógicas frequentes baseadas no conteúdo da aula.
    Retorna lista de dicts com question, answer, start_time_seconds e end_time_seconds.
    """
    if not transcript or len(transcript.strip()) < 40:
        return []

    try:
        api_key = get_openai_api_key()
    except Exception as e:
        logger.warning(f"[RAG Q&A] Sem chave OpenAI configurada ({e}). Usando mock pedagógico.")
        return [
            {
                "question": f"O que é ensinado na aula '{lesson_title}' do curso '{course_title}'?",
                "answer": f"Nesta aula, o instrutor aborda os conceitos fundamentais de {lesson_title}, demonstrando aplicações práticas e exemplos explicativos.",
                "start_time_seconds": 0,
                "end_time_seconds": 120
            },
            {
                "question": f"Quais os pontos principais discutidos em {lesson_title}?",
                "answer": f"Os pontos principais envolvem as diretrizes teóricas e práticas de {lesson_title} apresentadas ao longo do vídeo.",
                "start_time_seconds": 60,
                "end_time_seconds": 180
            },
            {
                "question": f"Como aplicar o conteúdo de {lesson_title} na prática?",
                "answer": f"O professor orienta seguir o passo a passo demonstrado na aula para obter resultados consistentes.",
                "start_time_seconds": 120,
                "end_time_seconds": 240
            },
            {
                "question": f"Existe algum exemplo prático apresentado na aula {lesson_title}?",
                "answer": f"Sim, o instrutor utiliza exemplos concretos para facilitar a compreensão dos alunos.",
                "start_time_seconds": 150,
                "end_time_seconds": 270
            },
            {
                "question": f"Qual a conclusão ou resumo da aula {lesson_title}?",
                "answer": f"A aula conclui reforçando os princípios abordados e preparando o aluno para as próximas etapas.",
                "start_time_seconds": 180,
                "end_time_seconds": 300
            }
        ]

    prompt = f"""Você é um especialista pedagógico em aprendizado online e RAG vetorial.
Com base estritamente na transcrição da aula abaixo, elabore exatamente 5 perguntas frequentes que os alunos fariam sobre essa aula, junto com a resposta completa, precisa e fundamentada.

Curso: {course_title}
Aula: {lesson_title}

Transcrição da Aula:
{transcript[:7000]}

Responda OBRIGATORIAMENTE em JSON válido com a seguinte estrutura:
[
  {{
    "question": "Pergunta clara e natural que o aluno digitaria no chat?",
    "answer": "Resposta completa e didática baseada no conteúdo da aula.",
    "start_time_seconds": 0,
    "end_time_seconds": 60
  }}
]
Apenas o array JSON com as 5 perguntas, sem nenhum texto introdutório ou markdown extra."""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }

    try:
        async with httpx.AsyncClient(timeout=35.0) as client:
            res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            if res.status_code == 200:
                data = res.json()
                raw = data["choices"][0]["message"]["content"].strip()
                if "```json" in raw:
                    raw = raw.split("```json")[1].split("```")[0].strip()
                elif "```" in raw:
                    raw = raw.split("```")[1].split("```")[0].strip()
                parsed = json.loads(raw)
                if isinstance(parsed, dict) and "questions" in parsed:
                    parsed = parsed["questions"]
                if isinstance(parsed, list):
                    return parsed[:5]
    except Exception as err:
        logger.warning(f"[RAG Q&A] Falha na chamada da OpenAI ({err}). Continuando sem Q&A sintético.")
    return []


async def decompose_user_query(message: str) -> List[str]:
    """
    Analisa a mensagem do usuário. Se contiver mais de uma pergunta ou intenção,
    decompõe em sub-perguntas individuais e específicas.
    Se for apenas uma pergunta, retorna [message.strip()].
    """
    cleaned = message.strip()
    if not cleaned:
        return []

    q_marks = cleaned.count("?")
    has_connectors = bool(re.search(r'\b(e|além disso|também|outra dúvida|segunda dúvida)\b', cleaned, re.IGNORECASE))
    if q_marks <= 1 and not (len(cleaned) > 100 and has_connectors):
        return [cleaned]

    try:
        api_key = get_openai_api_key()
    except Exception:
        if q_marks > 1:
            parts = [p.strip() + "?" for p in cleaned.split("?") if p.strip()]
            return parts[:4]
        return [cleaned]

    prompt = f"""Analise a seguinte mensagem enviada por um aluno e determine se ela contém 1 única dúvida ou 2 ou mais perguntas/tópicos distintos.
Se for apenas 1 pergunta, retorne ela mesma.
Se contiver 2 ou mais perguntas distintas, extraia cada uma de forma independente e clara.

Mensagem do aluno:
"{cleaned}"

Responda OBRIGATORIAMENTE em JSON no formato:
{{"queries": ["pergunta 1", "pergunta 2"]}}"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.0,
        "response_format": {"type": "json_object"}
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            if res.status_code == 200:
                data = res.json()
                raw = json.loads(data["choices"][0]["message"]["content"])
                queries = raw.get("queries", [])
                if isinstance(queries, list) and len(queries) > 0:
                    return [q.strip() for q in queries if q.strip()][:5]
    except Exception as err:
        logger.warning(f"[RAG MULTI-QUERY] Falha na decomposição via OpenAI: {err}")

    if q_marks > 1:
        parts = [p.strip() + "?" for p in cleaned.split("?") if p.strip()]
        return parts[:4]
    return [cleaned]


async def index_lesson_rag(db: Session, lesson_id: int) -> Dict[str, Any]:
    """
    Indexa uma aula individual no RAG vetorial:
    1. Lê a transcrição e capítulos.
    2. Divide em blocos com timestamps.
    3. Gera embeddings com a OpenAI.
    4. Remove chunks antigos e salva os novos em ai_knowledge_chunks.
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        return {"status": "error", "message": "Aula não encontrada"}

    module = db.query(Module).filter(Module.id == lesson.module_id).first()
    course = db.query(Course).filter(Course.id == module.course_id).first() if module else None
    if not module or not course:
        return {"status": "error", "message": "Módulo ou Curso não encontrado"}

    trans = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == lesson_id).first()
    if not trans or not trans.full_transcript:
        return {"status": "error", "message": "Aula não possui transcrição disponível para indexação"}

    chapters = []
    ch_raw = getattr(trans, "chapters", None) or getattr(trans, "chapters_json", None)
    if ch_raw:
        try:
            chapters = json.loads(ch_raw) if isinstance(ch_raw, str) else ch_raw
        except Exception:
            chapters = []

    raw_chunks = split_text_into_chunks(trans.full_transcript, chapters)
    if not raw_chunks:
        return {"status": "warning", "message": "Nenhum fragmento extraído da transcrição", "chunks_count": 0}

    # Prepara textos enriquecidos com metadados de contexto para o embedding
    texts_to_embed = [
        f"Curso: {course.title} | Módulo: {module.title} | Aula: {lesson.title}\n{c['content']}"
        for c in raw_chunks
    ]

    embeddings = await generate_embeddings_batch(texts_to_embed)

    # Remove chunks anteriores daquela aula
    db.query(AiKnowledgeChunk).filter(AiKnowledgeChunk.lesson_id == lesson_id).delete(synchronize_session=False)

    saved_count = 0
    now = datetime.now(timezone.utc)
    for idx, (c, emb) in enumerate(zip(raw_chunks, embeddings)):
        chunk_db = AiKnowledgeChunk(
            course_id=course.id,
            module_id=module.id,
            lesson_id=lesson.id,
            chunk_index=idx,
            chunk_type="transcript",
            content=c["content"],
            start_time_seconds=c["start_time_seconds"],
            end_time_seconds=c["end_time_seconds"],
            embedding_json=json.dumps(emb),
            token_count=c["token_count"],
            created_at=now,
            updated_at=now
        )
        db.add(chunk_db)
        saved_count += 1

    # 5. Gera 5 Perguntas & Respostas Frequentes com base na transcrição para enriquecer a busca semântica
    qa_count = 0
    try:
        qa_pairs = await generate_lesson_qa_pairs(
            transcript=trans.full_transcript,
            lesson_title=lesson.title,
            course_title=course.title
        )
        if qa_pairs:
            qa_texts_to_embed = [
                f"Curso: {course.title} | Módulo: {module.title} | Aula: {lesson.title}\nPergunta: {qa['question']}\nResposta: {qa['answer']}"
                for qa in qa_pairs
            ]
            qa_embeddings = await generate_embeddings_batch(qa_texts_to_embed)
            for idx, (qa, emb) in enumerate(zip(qa_pairs, qa_embeddings), start=saved_count):
                qa_content = f"Pergunta: {qa['question']}\nResposta: {qa['answer']}"
                chunk_qa = AiKnowledgeChunk(
                    course_id=course.id,
                    module_id=module.id,
                    lesson_id=lesson.id,
                    chunk_index=idx,
                    chunk_type="qa_pair",
                    question_text=qa["question"],
                    answer_text=qa["answer"],
                    content=qa_content,
                    start_time_seconds=qa.get("start_time_seconds", 0),
                    end_time_seconds=qa.get("end_time_seconds", 0),
                    embedding_json=json.dumps(emb),
                    token_count=len(qa_content.split()),
                    created_at=now,
                    updated_at=now
                )
                db.add(chunk_qa)
                saved_count += 1
                qa_count += 1
    except Exception as e_qa:
        logger.warning(f"[RAG Q&A] Falha ao processar perguntas e respostas sintéticas na aula {lesson.id}: {e_qa}")

    db.commit()
    logger.info(f"[RAG VETORIAL] Aula {lesson.id} ('{lesson.title}') indexada com {saved_count} chunks ({qa_count} Q&A).")
    return {
        "status": "success",
        "lesson_id": lesson.id,
        "lesson_title": lesson.title,
        "chunks_count": saved_count,
        "transcript_chunks_count": len(raw_chunks),
        "qa_count": qa_count
    }


async def generate_and_save_lesson_qa(db: Session, lesson_id: int) -> Dict[str, Any]:
    """Gera exclusivamente os 5 pares de perguntas e respostas pedagógicas via IA para a aula."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        return {"status": "error", "message": f"Aula {lesson_id} não encontrada."}

    trans = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == lesson_id).first()
    if not trans or not trans.full_transcript or len(trans.full_transcript.strip()) < 30:
        return {"status": "error", "message": "Aula não possui transcrição de áudio suficiente para gerar perguntas e respostas."}

    module = db.query(Module).filter(Module.id == lesson.module_id).first()
    course = db.query(Course).filter(Course.id == module.course_id).first() if module else None
    if not course or not module:
        return {"status": "error", "message": "Curso ou Módulo da aula não encontrado."}

    # 1. Remove pares de Q&A antigos para esta aula
    db.query(AiKnowledgeChunk).filter(
        AiKnowledgeChunk.lesson_id == lesson_id,
        AiKnowledgeChunk.chunk_type == "qa_pair"
    ).delete()
    db.commit()

    # 2. Obtém a contagem de chunks existentes para indexação sequencial
    existing_chunks_count = (
        db.query(func.count(AiKnowledgeChunk.id))
        .filter(AiKnowledgeChunk.lesson_id == lesson_id)
        .scalar() or 0
    )

    # 3. Gera os 5 pares sintéticos via IA
    qa_pairs = await generate_lesson_qa_pairs(
        transcript=trans.full_transcript,
        lesson_title=lesson.title,
        course_title=course.title
    )
    if not qa_pairs:
        return {"status": "error", "message": "Não foi possível gerar os pares de perguntas e respostas pedagógicas."}

    # 4. Gera embeddings vetoriais para os pares de Q&A
    qa_texts_to_embed = [
        f"Curso: {course.title} | Módulo: {module.title} | Aula: {lesson.title}\nPergunta: {qa['question']}\nResposta: {qa['answer']}"
        for qa in qa_pairs
    ]
    qa_embeddings = await generate_embeddings_batch(qa_texts_to_embed)

    now = datetime.utcnow()
    qa_count = 0
    for idx, (qa, emb) in enumerate(zip(qa_pairs, qa_embeddings), start=existing_chunks_count):
        qa_content = f"Pergunta: {qa['question']}\nResposta: {qa['answer']}"
        chunk_qa = AiKnowledgeChunk(
            course_id=course.id,
            module_id=module.id,
            lesson_id=lesson.id,
            chunk_index=idx,
            chunk_type="qa_pair",
            question_text=qa["question"],
            answer_text=qa["answer"],
            content=qa_content,
            start_time_seconds=qa.get("start_time_seconds", 0),
            end_time_seconds=qa.get("end_time_seconds", 0),
            embedding_json=json.dumps(emb),
            token_count=len(qa_content.split()),
            created_at=now,
            updated_at=now
        )
        db.add(chunk_qa)
        qa_count += 1

    db.commit()
    logger.info(f"[RAG Q&A] Geradas {qa_count} perguntas e respostas para a aula {lesson.id} ('{lesson.title}').")

    return {
        "status": "success",
        "lesson_id": lesson.id,
        "lesson_title": lesson.title,
        "qa_count": qa_count,
        "message": f"{qa_count} perguntas e respostas pedagógicas geradas com sucesso para a aula!"
    }


async def batch_index_lessons_rag(db: Session, lesson_ids: List[int]) -> Dict[str, Any]:
    """Indexa uma lista específica de aulas no RAG vetorial sob demanda."""
    indexed_count = 0
    total_chunks = 0
    errors = []

    for lid in lesson_ids:
        try:
            res = await index_lesson_rag(db, lid)
            if res.get("status") == "success":
                indexed_count += 1
                total_chunks += res.get("chunks_count", 0)
            elif res.get("status") in ["warning", "error"]:
                errors.append(f"Aula {lid}: {res.get('message')}")
        except Exception as e:
            errors.append(f"Aula {lid}: {str(e)}")

    return {
        "requested_count": len(lesson_ids),
        "indexed_lessons": indexed_count,
        "total_chunks_saved": total_chunks,
        "errors": errors
    }


async def index_all_transcribed_lessons(db: Session) -> Dict[str, Any]:
    """Indexa todas as aulas que possuem transcrição no sistema em lote."""
    transcriptions = db.query(LessonTranscription).filter(
        LessonTranscription.full_transcript.isnot(None),
        LessonTranscription.full_transcript != ""
    ).all()

    total = len(transcriptions)
    indexed_count = 0
    total_chunks = 0
    errors = []

    for t in transcriptions:
        try:
            res = await index_lesson_rag(db, t.lesson_id)
            if res.get("status") == "success":
                indexed_count += 1
                total_chunks += res.get("chunks_count", 0)
        except Exception as e:
            errors.append(f"Aula {t.lesson_id}: {str(e)}")

    return {
        "total_transcribed": total,
        "indexed_lessons": indexed_count,
        "total_chunks_saved": total_chunks,
        "errors": errors
    }


async def search_rag_chunks(
    db: Session,
    query_text: str,
    permitted_course_ids: List[int],
    current_lesson_id: Optional[int] = None,
    limit: int = 4,
    min_similarity: float = 0.35,
    enable_multi_query: bool = True
) -> List[Dict[str, Any]]:
    """
    Busca semântica vetorial por similaridade de cosseno com suporte a Multi-Query (decomposição de perguntas).
    Retorna os fragmentos mais relevantes com minutagens, Q&A e referências.
    """
    if not permitted_course_ids or not query_text.strip():
        return []

    # Decomposição de perguntas caso o usuário pergunte múltiplos tópicos
    sub_queries = [query_text.strip()]
    if enable_multi_query:
        try:
            sub_queries = await decompose_user_query(query_text.strip())
        except Exception:
            sub_queries = [query_text.strip()]

    # Gera embeddings de todas as sub-queries em lote
    all_query_embeddings = await generate_embeddings_batch(sub_queries)
    if not all_query_embeddings:
        return []

    # Busca chunks de cursos que o aluno tem permissão
    query = (
        db.query(AiKnowledgeChunk, Lesson, Module, Course)
        .join(Lesson, AiKnowledgeChunk.lesson_id == Lesson.id)
        .join(Module, AiKnowledgeChunk.module_id == Module.id)
        .join(Course, AiKnowledgeChunk.course_id == Course.id)
        .filter(AiKnowledgeChunk.course_id.in_(permitted_course_ids))
    )

    candidates = query.all()
    if not candidates:
        return []

    # Guarda o melhor score por chunk_id (deduplicação entre sub-queries)
    best_chunks_by_id: Dict[int, Dict[str, Any]] = {}

    for q_emb in all_query_embeddings:
        for chunk, lesson, module, course in candidates:
            try:
                c_emb = json.loads(chunk.embedding_json)
                sim = dot_product(q_emb, c_emb)
                if sim >= min_similarity:
                    curr_best = best_chunks_by_id.get(chunk.id)
                    if not curr_best or sim > curr_best["similarity"]:
                        best_chunks_by_id[chunk.id] = {
                            "chunk_id": chunk.id,
                            "chunk_type": getattr(chunk, "chunk_type", "transcript") or "transcript",
                            "question_text": getattr(chunk, "question_text", None),
                            "answer_text": getattr(chunk, "answer_text", None),
                            "lesson_id": lesson.id,
                            "lesson_title": lesson.title,
                            "module_id": module.id,
                            "module_title": module.title,
                            "course_id": course.id,
                            "course_title": course.title,
                            "content": chunk.content,
                            "start_time_seconds": chunk.start_time_seconds,
                            "end_time_seconds": chunk.end_time_seconds,
                            "start_time_str": seconds_to_time(chunk.start_time_seconds),
                            "end_time_str": seconds_to_time(chunk.end_time_seconds),
                            "similarity": round(float(sim), 4),
                            "is_current_lesson": bool(current_lesson_id and lesson.id == current_lesson_id)
                        }
            except Exception:
                continue

    scored_chunks = list(best_chunks_by_id.values())
    scored_chunks.sort(key=lambda x: x["similarity"], reverse=True)
    return scored_chunks[:limit]


def parse_lesson_duration_seconds(lesson: Any) -> int:
    """Extrai a duração da aula em segundos, suportando formato MM:SS ou transcrição."""
    if not lesson:
        return 0
    if getattr(lesson, "transcription", None) and lesson.transcription and getattr(lesson.transcription, "audio_duration_seconds", None):
        return int(lesson.transcription.audio_duration_seconds)
    dur = getattr(lesson, "duration", None)
    if dur:
        if str(dur).isdigit():
            return int(dur) * 60
        return time_to_seconds(str(dur))
    return 0


def get_course_structure_metadata(
    db: Session,
    course_id: int,
    enrolled_course_ids: List[int]
) -> str:
    """
    Gera um relatório conciso com a quantidade de aulas e a carga horária
    (duração) de cada módulo, do curso atual e dos outros cursos da plataforma.
    Injetado no prompt para que o Tutor IA responda dúvidas de cronograma.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return ""

    modules = db.query(Module).filter(Module.course_id == course_id).order_by(Module.order_index).all()
    lines = [f"Grade Estrutural e Carga Horária do Curso '{course.title}':"]

    total_course_seconds = 0
    total_course_lessons = 0

    for idx, mod in enumerate(modules, start=1):
        lessons = db.query(Lesson).filter(Lesson.module_id == mod.id).all()
        mod_lessons_count = len(lessons)
        mod_seconds = sum(parse_lesson_duration_seconds(l) for l in lessons)

        total_course_lessons += mod_lessons_count
        total_course_seconds += mod_seconds

        mod_time_str = f"{mod_seconds // 60} min" if mod_seconds < 3600 else f"{mod_seconds // 3600}h {(mod_seconds % 3600) // 60}min"
        lines.append(f"- Módulo {idx} ('{mod.title}'): {mod_lessons_count} aulas | Carga horária: {mod_time_str}")

    total_time_str = f"{total_course_seconds // 3600}h {(total_course_seconds % 3600) // 60}min" if total_course_seconds >= 3600 else f"{total_course_seconds // 60}min"
    lines.append(f"Total do Curso Atual: {len(modules)} módulos | {total_course_lessons} aulas | Duração Total: {total_time_str}")

    # Resumo dos outros cursos disponíveis
    other_courses = db.query(Course).filter(Course.id != course_id, Course.is_published == True).all()
    if other_courses:
        lines.append("\nOutros Cursos da Plataforma:")
        for oc in other_courses:
            oc_lessons = db.query(Lesson).join(Module).filter(Module.course_id == oc.id).all()
            oc_lessons_count = len(oc_lessons)
            oc_seconds = sum(parse_lesson_duration_seconds(l) for l in oc_lessons)
            oc_time_str = f"{oc_seconds // 3600}h {(oc_seconds % 3600) // 60}min" if oc_seconds >= 3600 else f"{oc_seconds // 60}min"
            status_matricula = "Aluno MATRICULADO" if oc.id in enrolled_course_ids else "NÃO ADQUIRIDO (disponível para venda)"
            lines.append(f"- '{oc.title}': {oc_lessons_count} aulas | {oc_time_str} | Status: {status_matricula}")

    return "\n".join(lines)


def get_knowledge_base_overview(db: Session) -> Dict[str, Any]:
    """Retorna dados de auditoria da Base de Conhecimento para o painel administrativo."""
    total_lessons = db.query(func.count(Lesson.id)).scalar() or 0
    total_transcriptions = db.query(func.count(LessonTranscription.id)).scalar() or 0
    
    # Aulas com ao menos 1 chunk
    indexed_lessons = db.query(func.count(func.distinct(AiKnowledgeChunk.lesson_id))).scalar() or 0
    total_chunks = db.query(func.count(AiKnowledgeChunk.id)).scalar() or 0
    total_tokens = db.query(func.sum(AiKnowledgeChunk.token_count)).scalar() or 0

    # Lista detalhada por aula
    lessons_data = []
    lessons = (
        db.query(Lesson, Module, Course, LessonTranscription)
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .outerjoin(LessonTranscription, Lesson.id == LessonTranscription.lesson_id)
        .order_by(Course.id, Module.order_index, Lesson.order_index)
        .all()
    )

    # Chunks contados por aula (totais e Q&A)
    chunk_counts = dict(
        db.query(AiKnowledgeChunk.lesson_id, func.count(AiKnowledgeChunk.id))
        .group_by(AiKnowledgeChunk.lesson_id)
        .all()
    )
    qa_counts = dict(
        db.query(AiKnowledgeChunk.lesson_id, func.count(AiKnowledgeChunk.id))
        .filter(AiKnowledgeChunk.chunk_type == "qa_pair")
        .group_by(AiKnowledgeChunk.lesson_id)
        .all()
    )

    courses_map: Dict[int, Dict[str, Any]] = {}

    for l, m, c, trans in lessons:
        chunks_count = chunk_counts.get(l.id, 0)
        qa_count = qa_counts.get(l.id, 0)
        dur = parse_lesson_duration_seconds(l)
        dur_str = f"{dur // 60:02d}:{dur % 60:02d}"

        lesson_item = {
            "lesson_id": l.id,
            "lesson_title": l.title,
            "module_id": m.id,
            "module_title": m.title,
            "course_id": c.id,
            "course_title": c.title,
            "duration_str": dur_str,
            "has_transcription": bool(trans and trans.full_transcript),
            "chunks_count": chunks_count,
            "qa_count": qa_count,
            "is_indexed": chunks_count > 0
        }
        lessons_data.append(lesson_item)

        # Agrupamento da árvore hierárquica (Curso > Módulos > Aulas)
        if c.id not in courses_map:
            courses_map[c.id] = {
                "course_id": c.id,
                "course_title": c.title,
                "course_thumbnail_url": getattr(c, "thumbnail_url", None),
                "total_lessons": 0,
                "indexed_lessons": 0,
                "total_chunks": 0,
                "modules_map": {}
            }
        c_entry = courses_map[c.id]
        c_entry["total_lessons"] += 1
        if chunks_count > 0:
            c_entry["indexed_lessons"] += 1
        c_entry["total_chunks"] += chunks_count

        if m.id not in c_entry["modules_map"]:
            c_entry["modules_map"][m.id] = {
                "module_id": m.id,
                "module_title": m.title,
                "order_index": getattr(m, "order_index", 0) or 0,
                "total_lessons": 0,
                "indexed_lessons": 0,
                "lessons": []
            }
        m_entry = c_entry["modules_map"][m.id]
        m_entry["total_lessons"] += 1
        if chunks_count > 0:
            m_entry["indexed_lessons"] += 1
        m_entry["lessons"].append(lesson_item)

    # Formata a lista da árvore ordenada
    tree = []
    for c_id, c_data in courses_map.items():
        mods = list(c_data["modules_map"].values())
        mods.sort(key=lambda x: x["order_index"])
        tree.append({
            "course_id": c_data["course_id"],
            "course_title": c_data["course_title"],
            "course_thumbnail_url": c_data["course_thumbnail_url"],
            "total_lessons": c_data["total_lessons"],
            "indexed_lessons": c_data["indexed_lessons"],
            "total_chunks": c_data["total_chunks"],
            "modules": mods
        })

    return {
        "metrics": {
            "total_lessons": total_lessons,
            "total_transcriptions": total_transcriptions,
            "indexed_lessons": indexed_lessons,
            "pending_indexing": max(0, total_transcriptions - indexed_lessons),
            "total_chunks": total_chunks,
            "total_tokens": total_tokens
        },
        "lessons": lessons_data,
        "tree": tree
    }
