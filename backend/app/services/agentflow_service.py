"""
Serviço de Integração com o AgentFlow (Motor RAG e Bases de Conhecimento).
Permite listar bases, criar bases, e sincronizar automaticamente transcrições,
chunks com contextual overlay e overlap inteligente sem quebra de palavras,
perguntas & respostas didáticas com variações e resumos pedagógicos de aulas e módulos.
Possui tolerância a falhas de rede com retries e backoff exponencial.
"""
import os
import re
import json
import asyncio
from typing import Dict, Any, Optional, List
import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.core.logger import logger
from app.models.course import Course, Module, Lesson, LessonTranscription, utc_now

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"


def _get_agentflow_env() -> Dict[str, str]:
    """Lê as variáveis de ambiente do AgentFlow atualizadas."""
    env_file = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_file):
        load_dotenv(env_file, override=True)
    api_url = os.getenv("AGENTFLOW_API_URL", "https://backendagente.aryaraj.shop").strip().rstrip("/")
    api_key = os.getenv("AGENTFLOW_API_KEY", "").strip().strip('"').strip("'")
    return {"api_url": api_url, "api_key": api_key}


def _get_openai_key() -> str:
    """Lê a chave da OpenAI se disponível."""
    env_file = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_file):
        load_dotenv(env_file, override=True)
    return os.getenv("OPENAI_API_KEY", "").strip().strip('"').strip("'")


def split_text_into_smart_chunks(
    text: str,
    max_chunk_size: int = 1100,
    overlap_size: int = 180
) -> List[str]:
    """
    Divide um texto longo em blocos com sobreposição (overlap),
    respeitando estritamente fronteiras de frases (. ! ?) ou de palavras,
    garantindo que nenhuma palavra seja cortada ao meio (ex: 'deal' em vez de 'ideal').
    """
    cleaned = re.sub(r'[ \t]+', ' ', text).strip()
    if not cleaned:
        return []

    if len(cleaned) <= max_chunk_size:
        return [cleaned]

    chunks: List[str] = []
    start = 0
    text_len = len(cleaned)

    while start < text_len:
        end = min(start + max_chunk_size, text_len)

        if end < text_len:
            # Procura por final de frase (. ! ? ou quebra de linha) nos últimos 250 caracteres do bloco
            search_window = cleaned[max(start, end - 250):end]
            sentence_break = -1
            for punct in [".\n\n", ".\n", "! ", "? ", ". ", ",\n", "\n"]:
                pos = search_window.rfind(punct)
                if pos != -1 and pos > sentence_break:
                    sentence_break = pos + len(punct)

            if sentence_break != -1:
                end = max(start, end - 250) + sentence_break
            else:
                # Se não houver pontuação, quebra no último espaço para não fatiar palavras ao meio
                last_space = cleaned.rfind(" ", start, end)
                if last_space != -1 and last_space > start:
                    end = last_space

        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= text_len:
            break

        # Próximo início com overlap inteligente respeitando palavras inteiras
        next_start = max(start + 1, end - overlap_size)
        space_after = cleaned.find(" ", next_start, end)
        if space_after != -1:
            next_start = space_after + 1
        start = next_start

    return chunks


def build_contextual_chunk(
    raw_chunk: str,
    course_title: str,
    module_title: str,
    lesson_title: str,
    chapter_title: Optional[str] = None
) -> str:
    """
    Aplica Contextual Chunking: insere no topo do trecho um cabeçalho explícito
    de metadados, para que qualquer busca vetorial (RAG) recupere o trecho já sabendo
    o curso, módulo e aula exatos de onde foi extraído.
    """
    meta_parts = []
    if course_title:
        meta_parts.append(f'Curso: "{course_title}"')
    if module_title:
        meta_parts.append(f'Módulo: "{module_title}"')
    if lesson_title:
        meta_parts.append(f'Aula: "{lesson_title}"')
    if chapter_title:
        meta_parts.append(f'Capítulo: "{chapter_title}"')

    header = f"[Contexto da Aula: {' | '.join(meta_parts)}]\n\n"
    return f"{header}{raw_chunk.strip()}"


async def generate_qa_items_from_transcript(
    transcript: str,
    lesson_title: str,
    module_title: str,
    course_title: str,
    chapters_list: Optional[List[str]] = None,
    topics_list: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Gera 5 Perguntas e Respostas Didáticas com IA a partir da transcrição da aula,
    utilizando prioritariamente o GPT-4o-mini com prompt pedagógico estruturado.
    """
    openai_key = _get_openai_key()
    if not openai_key:
        return []

    system_prompt = (
        "Você é um especialista pedagógico em estruturação de Bases de Conhecimento RAG para robôs de atendimento ao aluno.\n"
        "Sua tarefa é analisar a transcrição de uma aula e criar 5 Perguntas e Respostas Didáticas completas, "
        "simulando as principais dúvidas reais que alunos teriam ao assistir a esta aula.\n"
        "Regras:\n"
        "1. Gere perguntas diretas e realistas sobre o tema ensinado.\n"
        "2. As respostas devem ser claras, completas e fundamentadas estritamente no conteúdo ensinado.\n"
        "3. Para cada pergunta, forneça de 2 a 3 variações de como um aluno poderia formular a mesma dúvida.\n"
        "4. Retorne OBRIGATORIAMENTE um JSON com o formato: "
        '{"items": [{"question": "...", "answer": "...", "variations": ["..."]}]}'
    )

    context_info = f"Curso: {course_title}\nMódulo: {module_title}\nAula: {lesson_title}\n"
    if chapters_list:
        context_info += f"Capítulos da Aula:\n" + "\n".join(f"- {c}" for c in chapters_list) + "\n"
    if topics_list:
        context_info += f"Tópicos Chave da Aula:\n" + "\n".join(f"- {t}" for t in topics_list) + "\n"

    user_prompt = (
        f"{context_info}\n"
        f"Transcrição da Aula:\n{transcript[:9000]}\n\n"
        "Gere 5 perguntas e respostas didáticas com variações em formato JSON."
    )

    try:
        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            res = await client.post(OPENAI_CHAT_URL, headers=headers, json=payload)

        if res.status_code == 200:
            data = res.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            items = parsed.get("items", [])
            logger.info(f"[AgentFlow Sync] {len(items)} perguntas didáticas geradas com sucesso via OpenAI.")
            return items
    except Exception as e:
        logger.warning(f"[AgentFlow Sync] Erro ao gerar P&R via OpenAI: {e}")

    return []


class AgentFlowService:
    def is_configured(self) -> bool:
        """Verifica se a chave da API do AgentFlow está preenchida."""
        cfg = _get_agentflow_env()
        return bool(cfg["api_key"])

    def get_config(self) -> Dict[str, str]:
        """Obtém configuração validada ou lança erro amigável."""
        cfg = _get_agentflow_env()
        if not cfg["api_key"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chave de API do AgentFlow (AGENTFLOW_API_KEY) não configurada no servidor (.env)."
            )
        return cfg

    async def _post_with_retry(
        self,
        url: str,
        headers: Dict[str, str],
        payload: Dict[str, Any],
        timeout: float = 120.0,
        max_attempts: int = 3
    ) -> httpx.Response:
        """Executa requisição POST com até max_attempts tentativas contra falhas transitórias de conexão."""
        last_exc: Optional[Exception] = None
        for attempt in range(1, max_attempts + 1):
            try:
                limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
                async with httpx.AsyncClient(timeout=timeout, limits=limits) as client:
                    res = await client.post(url, headers=headers, json=payload)
                    return res
            except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as exc:
                last_exc = exc
                logger.warning(
                    f"[AgentFlow] Tentativa {attempt}/{max_attempts} falhou em {url}: {exc}. "
                    f"{'Aguardando retry...' if attempt < max_attempts else 'Tentativas esgotadas.'}"
                )
                if attempt < max_attempts:
                    await asyncio.sleep(1.5 * attempt)

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Não foi possível conectar ao servidor do AgentFlow após {max_attempts} tentativas. Detalhe: {last_exc}"
        )

    async def list_knowledge_bases(self) -> List[Dict[str, Any]]:
        """Lista todas as bases de conhecimento disponíveis no AgentFlow com retentativa."""
        cfg = self.get_config()
        headers = {
            "X-API-Key": cfg["api_key"],
            "Content-Type": "application/json"
        }
        url = f"{cfg['api_url']}/knowledge-bases"

        last_exc: Optional[Exception] = None
        for attempt in range(1, 4):
            try:
                limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
                async with httpx.AsyncClient(timeout=30.0, limits=limits) as client:
                    res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    logger.error(f"[AgentFlow] Erro ao listar bases ({res.status_code}): {res.text}")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Erro na API do AgentFlow ao listar bases ({res.status_code}): {res.text[:200]}"
                    )
                return res.json()
            except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as exc:
                last_exc = exc
                logger.warning(f"[AgentFlow] Tentativa {attempt}/3 ao listar bases falhou: {exc}")
                if attempt < 3:
                    await asyncio.sleep(1.5)

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Não foi possível conectar ao servidor do AgentFlow: {last_exc}"
        )

    async def create_knowledge_base(self, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        """Cria uma nova base de conhecimento no AgentFlow."""
        cfg = self.get_config()
        headers = {
            "X-API-Key": cfg["api_key"],
            "Content-Type": "application/json"
        }
        url = f"{cfg['api_url']}/knowledge-bases"
        payload = {
            "name": name.strip(),
            "description": description.strip() if description else None,
            "kb_type": "qa"
        }
        res = await self._post_with_retry(url, headers=headers, payload=payload, timeout=30.0)
        if res.status_code not in (200, 201):
            logger.error(f"[AgentFlow] Erro ao criar base ({res.status_code}): {res.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Erro na API do AgentFlow ao criar base ({res.status_code}): {res.text[:200]}"
            )
        return res.json()

    async def sync_lesson_to_knowledge_base(
        self,
        db: Session,
        lesson_id: int,
        kb_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Sincroniza a transcrição completa da aula com o AgentFlow de forma resiliente:
        1. Formula 5 Perguntas e Respostas Didáticas com IA a partir do conteúdo;
        2. Divide a transcrição em Chunks com Overlay Contextual explícito e overlap sem cortes de palavras;
        3. Envia o Resumo Executivo da Aula e o Resumo do Módulo como itens de Q&A;
        4. Salva todos os itens de forma unificada com cálculo de embeddings vetoriais no AgentFlow.
        """
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Aula não encontrada.")

        module = lesson.module
        course = module.course if module else None

        target_kb_id = kb_id or (course.agentflow_kb_id if course else None)
        if not target_kb_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhuma Base de Conhecimento do AgentFlow está vinculada a este curso ou informada."
            )

        transcription = lesson.transcription
        if not transcription or not transcription.full_transcript or not transcription.full_transcript.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta aula ainda não possui transcrição concluída para sincronização."
            )

        cfg = self.get_config()
        headers = {
            "X-API-Key": cfg["api_key"],
            "Content-Type": "application/json"
        }

        course_title = course.title if course else "Curso"
        module_title = module.title if module else "Módulo Geral"
        lesson_title = lesson.title or "Aula"

        # 1. Extração formatada de capítulos
        chapters_list: List[str] = []
        if transcription.chapters:
            try:
                ch_data = json.loads(transcription.chapters) if isinstance(transcription.chapters, str) else transcription.chapters
                if isinstance(ch_data, list):
                    for ch in ch_data:
                        if isinstance(ch, dict) and "title" in ch:
                            t_str = ch.get("time", "00:00")
                            chapters_list.append(f"{t_str} - {ch.get('title')}")
            except Exception:
                pass

        # 2. Extração formatada de tópicos / pontos-chave
        topics_list: List[str] = []
        if transcription.key_takeaways:
            try:
                tk_data = json.loads(transcription.key_takeaways) if isinstance(transcription.key_takeaways, str) else transcription.key_takeaways
                if isinstance(tk_data, list):
                    topics_list = [str(t) for t in tk_data if str(t).strip()]
                elif isinstance(tk_data, str):
                    topics_list = [tk_data.strip()]
            except Exception:
                pass

        metadata_val_base = f"Curso: {course_title} | Módulo: {module_title} | Aula: {lesson_title}"
        if chapters_list:
            metadata_val_base += f" | Capítulos: {', '.join(chapters_list)}"
        if topics_list:
            metadata_val_base += f" | Tópicos: {', '.join(topics_list)}"

        all_items_to_save: List[Dict[str, Any]] = []

        # 3. Geração de Perguntas e Respostas Didáticas com IA (OpenAI prioritária)
        qa_pairs = await generate_qa_items_from_transcript(
            transcript=transcription.full_transcript,
            lesson_title=lesson_title,
            module_title=module_title,
            course_title=course_title,
            chapters_list=chapters_list,
            topics_list=topics_list
        )

        qa_items_count = 0
        for qa in qa_pairs:
            q_text = (qa.get("question") or qa.get("pergunta") or "").strip()
            a_text = (qa.get("answer") or qa.get("resposta") or "").strip()
            variations = qa.get("variations") or []
            if q_text and a_text:
                all_items_to_save.append({
                    "question": q_text,
                    "answer": a_text,
                    "category": "Dúvidas da Aula",
                    "metadata_val": metadata_val_base,
                    "question_variations": list(set([
                        f"Dúvida sobre {lesson_title}: {q_text}",
                        q_text
                    ] + [v.strip() for v in variations if v.strip()]))
                })
                qa_items_count += 1

        # 4. Criação dos Chunks Inteligentes com Overlay Contextual e Overlap Sem Quebra de Palavras
        smart_chunks = split_text_into_smart_chunks(
            transcription.full_transcript,
            max_chunk_size=1100,
            overlap_size=180
        )

        for idx, raw_chunk in enumerate(smart_chunks):
            chapter_for_chunk = chapters_list[idx] if idx < len(chapters_list) else None
            contextual_content = build_contextual_chunk(
                raw_chunk=raw_chunk,
                course_title=course_title,
                module_title=module_title,
                lesson_title=lesson_title,
                chapter_title=chapter_for_chunk
            )
            all_items_to_save.append({
                "question": f"Trecho da Aula #{idx + 1} ({lesson_title})",
                "answer": contextual_content,
                "category": "Transcrição Contextual",
                "metadata_val": metadata_val_base + f" | Trecho: #{idx + 1}",
                "question_variations": [
                    f"Transcrição de {lesson_title} parte {idx + 1}",
                    f"Conteúdo de {lesson_title} parte {idx + 1}",
                    f"Trecho #{idx + 1} da aula {lesson_title}"
                ]
            })

        chunks_items_count = len(smart_chunks)

        # 5. Envio do Resumo Oficial da Aula como Item de Q&A
        summary_content = (transcription.summary_markdown or "").strip()
        if not summary_content and lesson.description:
            summary_content = lesson.description.strip()

        if summary_content:
            all_items_to_save.append({
                "question": f"Qual é o resumo da aula '{lesson_title}'?",
                "answer": f"[Resumo Oficial da Aula: \"{lesson_title}\" | Módulo: \"{module_title}\" | Curso: \"{course_title}\"]\n\n{summary_content}",
                "category": "Resumo de Aula",
                "metadata_val": metadata_val_base,
                "question_variations": [
                    f"Resumo da aula {lesson_title}",
                    f"Do que se trata a aula {lesson_title}?",
                    f"O que é ensinado na aula {lesson_title}?"
                ]
            })

        # 6. Envio do Resumo do Módulo (caso ainda não sincronizado)
        if module and module.description and module.description.strip() and not module.agentflow_synced_at:
            all_items_to_save.append({
                "question": f"O que é ensinado no módulo '{module_title}'?",
                "answer": f"[Visão Geral do Módulo: \"{module_title}\" | Curso: \"{course_title}\"]\n\n{module.description.strip()}",
                "category": "Resumo de Módulo",
                "metadata_val": f"Curso: {course_title} | Módulo: {module_title}",
                "question_variations": [
                    f"Resumo do {module_title}",
                    f"Qual o conteúdo do módulo {module_title}?",
                    f"O que vou aprender no {module_title}?"
                ]
            })

        logger.info(
            f"[AgentFlow Sync] Salvando {len(all_items_to_save)} itens na base #{target_kb_id} "
            f"({qa_items_count} P&R, {chunks_items_count} chunks com overlay, resumos)..."
        )

        # 7. Envio em Lote (Add-Batch) com Retentativa e Tolerância a Falhas
        saved_count = 0
        url_add_batch = f"{cfg['api_url']}/knowledge-bases/{target_kb_id}/items/add-batch"
        res_batch = await self._post_with_retry(
            url_add_batch,
            headers=headers,
            payload={"items": all_items_to_save},
            timeout=180.0,
            max_attempts=3
        )

        if res_batch.status_code in (200, 201):
            saved_count = len(all_items_to_save)
            logger.info(f"[AgentFlow Sync] Sucesso no add-batch: {saved_count} itens salvos com sucesso.")
        else:
            logger.warning(
                f"[AgentFlow Sync] add-batch retornou status {res_batch.status_code}: {res_batch.text[:200]}. "
                "Tentando envio sequencial resiliente..."
            )
            url_single = f"{cfg['api_url']}/knowledge-bases/{target_kb_id}/items"
            for item in all_items_to_save:
                try:
                    res_single = await self._post_with_retry(
                        url_single,
                        headers=headers,
                        payload=item,
                        timeout=30.0,
                        max_attempts=2
                    )
                    if res_single.status_code in (200, 201):
                        saved_count += 1
                except Exception as ex:
                    logger.warning(f"[AgentFlow Sync] Falha ao salvar item avulso: {ex}")

        if module and module.description and module.description.strip() and not module.agentflow_synced_at:
            module.agentflow_synced_at = utc_now()

        # Atualiza status no banco de dados local
        now = utc_now()
        transcription.agentflow_kb_id = target_kb_id
        transcription.agentflow_synced_at = now
        db.commit()
        db.refresh(transcription)

        return {
            "success": True,
            "kb_id": target_kb_id,
            "lesson_id": lesson.id,
            "lesson_title": lesson.title,
            "synced_at": now.isoformat(),
            "qa_count": qa_items_count,
            "chunks_count": chunks_items_count,
            "total_saved": saved_count
        }


agentflow_service = AgentFlowService()
