import os
import json
import asyncio
import tempfile
import shutil
import httpx
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.logger import logger
from app.core.database import SessionLocal
from app.models.course import Lesson, LessonVideo, LessonTranscription
from app.services.ai_transcription_service import (
    ai_transcription_service,
    get_openai_api_key,
    resolve_local_video_path,
    _get_audio_duration_seconds,
    set_transcription_progress,
    clear_transcription_progress,
)


def _get_main_language_parts(lesson: Lesson) -> List[LessonVideo]:
    """Retorna os vídeos do idioma principal da aula (pt ou o primeiro disponível), ordenados."""
    if not lesson.videos:
        return []
    pt_parts = [v for v in lesson.videos if (v.language or "pt") == "pt"]
    if pt_parts:
        return sorted(pt_parts, key=lambda v: (v.order_index or 0, v.id or 0))
    first_lang = lesson.videos[0].language
    return sorted(
        [v for v in lesson.videos if v.language == first_lang],
        key=lambda v: (v.order_index or 0, v.id or 0),
    )


async def transcribe_single_video_part(
    video_source: str,
    lesson_id: int,
    part_num: int,
    total_parts: int,
) -> Dict[str, Any]:
    """Extrai o áudio e transcreve via Whisper uma única parte de vídeo."""
    temp_dir = tempfile.mkdtemp(prefix=f"transcribe_p{part_num}_")
    temp_audio_file = os.path.join(temp_dir, "audio.mp3")
    try:
        local_path = resolve_local_video_path(video_source)
        input_video = local_path if local_path else video_source
        if not local_path and not (video_source.startswith("http://") or video_source.startswith("https://")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parte {part_num}: URL de vídeo inválida para transcrição."
            )

        base_pct = int(((part_num - 1) / max(total_parts, 1)) * 75) + 5
        set_transcription_progress(
            lesson_id,
            base_pct,
            f"Extraindo áudio da Parte {part_num}/{total_parts}...",
            estimated_remaining_seconds=45 * (total_parts - part_num + 1),
        )
        await ai_transcription_service.extract_audio_from_video(input_video, temp_audio_file)
        duration_sec = await asyncio.to_thread(_get_audio_duration_seconds, temp_audio_file)

        set_transcription_progress(
            lesson_id,
            base_pct + 10,
            f"Transcrevendo fala da Parte {part_num}/{total_parts} com Whisper...",
            estimated_remaining_seconds=30 * (total_parts - part_num + 1),
        )
        whisper_res = await ai_transcription_service.transcribe_audio_whisper(
            temp_audio_file, lesson_id=lesson_id
        )
        text = whisper_res.get("text", "").strip() if isinstance(whisper_res, dict) else str(whisper_res).strip()
        segments = whisper_res.get("segments", []) if isinstance(whisper_res, dict) else []
        return {"text": text, "segments": segments, "duration_seconds": duration_sec or 0.0}
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


async def process_multipart_lesson_transcription(
    db: Session,
    lesson_id: int,
    user_id: Optional[int] = None,
    force_retranscribe: bool = False,
) -> LessonTranscription:
    """
    Executa transcrição incremental para aulas com 1 ou múltiplas partes.
    Verifica se cada parte já possui transcrição válida em cache antes de chamar a OpenAI.
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    parts = _get_main_language_parts(lesson)
    if not parts:
        # Fallback para aula legada sem registros em lesson_videos
        if not lesson.video_url:
            raise HTTPException(status_code=400, detail="Nenhum vídeo encontrado nesta aula para transcrever.")
        return await ai_transcription_service.process_lesson_transcription(
            db=db, lesson_id=lesson_id, video_source=lesson.video_url, user_id=user_id
        )

    transcription = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == lesson_id).first()
    if not transcription:
        transcription = LessonTranscription(
            lesson_id=lesson_id,
            full_transcript="",
            status="processing",
            generated_by_user_id=user_id,
        )
        db.add(transcription)
    else:
        transcription.status = "processing"
        transcription.error_message = None
        if user_id:
            transcription.generated_by_user_id = user_id
    db.commit()
    db.refresh(transcription)

    try:
        total_parts = len(parts)
        part_sections: List[str] = []
        all_segments: List[Dict[str, Any]] = []
        total_audio_seconds = 0.0
        reused_count = 0

        for idx, vid in enumerate(parts):
            part_num = idx + 1
            part_title = vid.title or f"Parte {part_num}"

            # Verificação inteligente de cache por parte!
            if not force_retranscribe and vid.transcript_text and vid.transcribed_video_url == vid.video_url:
                logger.info(
                    f"[Transcrição Incremental] Aula {lesson_id} - Parte {part_num} já transcrita! "
                    "Reaproveitando cache sem chamar Whisper."
                )
                part_text = vid.transcript_text.strip()
                reused_count += 1
            else:
                logger.info(f"[Transcrição Incremental] Aula {lesson_id} - Transcrevendo Parte {part_num}/{total_parts}...")
                res = await transcribe_single_video_part(vid.video_url, lesson_id, part_num, total_parts)
                part_text = res["text"]
                total_audio_seconds += res["duration_seconds"]
                for seg in res["segments"]:
                    seg_copy = dict(seg)
                    seg_copy["part_index"] = idx
                    all_segments.append(seg_copy)

                # Salva o cache imediatamente nesta parte
                vid.transcript_text = part_text
                vid.transcribed_video_url = vid.video_url
                db.commit()

            if part_text:
                if total_parts > 1:
                    part_sections.append(f"=== Parte {part_num}: {part_title} ===\n{part_text}")
                else:
                    part_sections.append(part_text)

        full_transcript = "\n\n".join(part_sections).strip()
        if not full_transcript:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Nenhuma fala audível foi detectada nos vídeos desta aula."
            )

        set_transcription_progress(
            lesson_id,
            85,
            f"Consolidando resumo e capítulos ({reused_count}/{total_parts} partes reaproveitadas do cache)...",
            estimated_remaining_seconds=20,
        )
        ai_data = await ai_transcription_service.generate_summary_and_html(
            transcript=full_transcript,
            lesson_title=lesson.title,
            segments=all_segments,
            audio_duration_seconds=total_audio_seconds if total_audio_seconds > 0 else None,
        )
        prompt_tokens = ai_data.get("prompt_tokens") or 0
        completion_tokens = ai_data.get("completion_tokens") or 0

        whisper_cost_usd = (total_audio_seconds / 60.0) * 0.006 if total_audio_seconds else 0.0
        gpt_cost_usd = (prompt_tokens * 0.15 / 1_000_000.0) + (completion_tokens * 0.60 / 1_000_000.0)
        total_cost_usd = whisper_cost_usd + gpt_cost_usd
        try:
            usd_rate = float(os.getenv("OPENAI_USD_BRL_RATE", "5.50"))
        except Exception:
            usd_rate = 5.50

        transcription.full_transcript = full_transcript
        transcription.summary_html = ai_data["summary_html"]
        transcription.summary_markdown = ai_data["summary_markdown"]
        takeaways = ai_data.get("key_takeaways")
        transcription.key_takeaways = json.dumps(takeaways, ensure_ascii=False) if isinstance(takeaways, list) else str(takeaways or "[]")
        chapters = ai_data.get("chapters")
        transcription.chapters = json.dumps(chapters, ensure_ascii=False) if isinstance(chapters, list) else "[]"
        transcription.audio_duration_seconds = total_audio_seconds or transcription.audio_duration_seconds
        transcription.prompt_tokens = prompt_tokens
        transcription.completion_tokens = completion_tokens
        transcription.estimated_cost_usd = round(total_cost_usd, 6)
        transcription.estimated_cost_brl = round(total_cost_usd * usd_rate, 4)
        transcription.translations_json = None  # Limpa cache de traduções antigas pois o texto base mudou
        transcription.status = "completed"
        transcription.error_message = None
        transcription.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(transcription)
        clear_transcription_progress(lesson_id)
        return transcription
    except Exception as exc:
        clear_transcription_progress(lesson_id)
        raise exc


async def run_multipart_transcription_background_task(
    lesson_id: int,
    user_id: Optional[int] = None,
    force_retranscribe: bool = False,
):
    """Task em segundo plano para transcrição incremental multi-partes."""
    db = SessionLocal()
    try:
        await process_multipart_lesson_transcription(
            db=db, lesson_id=lesson_id, user_id=user_id, force_retranscribe=force_retranscribe
        )
        logger.info(f"[Background Transcription] Aula {lesson_id} (multi-partes) concluída com sucesso!")
    except Exception as e:
        logger.error(f"[Background Transcription] Erro na aula {lesson_id}: {e}")
        try:
            trans = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == lesson_id).first()
            if trans and trans.status == "processing":
                trans.status = "failed"
                trans.error_message = getattr(e, "detail", None) or str(e)
                trans.updated_at = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()


async def translate_lesson_transcription(
    db: Session,
    lesson_id: int,
    target_language: str,
    target_language_label: Optional[str] = None,
    force_retranslate: bool = False,
) -> Dict[str, Any]:
    """
    Traduz os textos da transcrição (Resumo HTML/Markdown, Pontos-chave e Capítulos)
    para o idioma escolhido e salva em cache na coluna translations_json.
    """
    transcription = db.query(LessonTranscription).filter(LessonTranscription.lesson_id == lesson_id).first()
    if not transcription or transcription.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A aula ainda não possui transcrição concluída para traduzir."
        )

    lang_code = (target_language or "pt").strip().lower()
    if lang_code == "pt":
        return {
            "summary_html": transcription.summary_html,
            "summary_markdown": transcription.summary_markdown,
            "key_takeaways": json.loads(transcription.key_takeaways or "[]"),
            "chapters": json.loads(transcription.chapters or "[]"),
            "full_transcript": transcription.full_transcript,
        }

    translations = {}
    if transcription.translations_json:
        try:
            translations = json.loads(transcription.translations_json)
        except Exception:
            translations = {}

    if lang_code in translations and not force_retranslate:
        logger.info(f"[Tradução Cache] Retornando tradução em '{lang_code}' do cache para aula {lesson_id}.")
        return translations[lang_code]

    api_key = get_openai_api_key()
    lang_name = target_language_label or lang_code
    base_takeaways = json.loads(transcription.key_takeaways or "[]")
    base_chapters = json.loads(transcription.chapters or "[]")

    prompt_payload = {
        "summary_markdown": transcription.summary_markdown or "",
        "summary_html": transcription.summary_html or "",
        "key_takeaways": base_takeaways,
        "chapters": base_chapters,
    }

    system_msg = (
        f"Você é um tradutor técnico e didático especialista. Traduza fielmente todo o conteúdo JSON abaixo "
        f"para o idioma '{lang_name}' (código: {lang_code}). "
        "Mantenha exatamente a mesma estrutura JSON, as tags HTML em 'summary_html', a formatação Markdown em 'summary_markdown' "
        "e os campos 'time', 'seconds' e 'part_index' de 'chapters' intactos, traduzindo apenas os textos (títulos, resumo e pontos-chave). "
        "Responda APENAS com um JSON válido."
    )

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o-mini",
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
                "messages": [
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": json.dumps(prompt_payload, ensure_ascii=False)},
                ],
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Erro na OpenAI ao traduzir textos: {resp.text}")
        data = resp.json()
        content_str = data["choices"][0]["message"]["content"]
        translated_obj = json.loads(content_str)

    # Traduz também a transcrição completa se houver (em blocos se necessário, aqui limite razoável)
    translated_obj["full_transcript"] = transcription.full_transcript

    translations[lang_code] = translated_obj
    transcription.translations_json = json.dumps(translations, ensure_ascii=False)
    transcription.updated_at = datetime.now(timezone.utc)
    db.commit()
    logger.info(f"[Tradução] Aula {lesson_id} traduzida com sucesso para '{lang_code}' e salva em cache.")
    return translated_obj
