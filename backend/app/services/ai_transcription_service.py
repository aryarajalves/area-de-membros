"""
Serviço de Transcrição e Resumo Inteligente com IA (OpenAI Whisper & GPT).
Extrai o áudio do vídeo com FFmpeg (mono 16kHz a 48kbps para ficar abaixo dos 25MB),
transcreve via Whisper e gera um Documento HTML formatado com Resumo Executivo e Destaques.
Totalmente assíncrono e sem bloqueio do event loop.
"""
import os
import re
import json
import shutil
import tempfile
import asyncio
import subprocess
from typing import Dict, Any, Optional, List
import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.core.database import SessionLocal
from app.core.logger import logger
from app.models.course import Lesson, LessonTranscription

OPENAI_API_URL = "https://api.openai.com/v1"
WHISPER_ENDPOINT = f"{OPENAI_API_URL}/audio/transcriptions"
CHAT_COMPLETIONS_ENDPOINT = f"{OPENAI_API_URL}/chat/completions"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VIDEOS_DIR = os.path.join(BASE_DIR, "uploads", "videos")


def get_openai_api_key() -> str:
    """Recupera e valida a chave da API da OpenAI das variáveis de ambiente."""
    env_file = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_file):
        load_dotenv(env_file, override=True)
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    api_key = api_key.replace("\n", "").replace("\r", "").strip('"').strip("'")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chave da OpenAI (OPENAI_API_KEY) não configurada no servidor. Por favor, adicione sua chave no arquivo .env."
        )
    return api_key


def resolve_local_video_path(video_url: str) -> Optional[str]:
    """Se a URL apontar para um arquivo local de upload, retorna o caminho absoluto no disco."""
    if not video_url:
        return None
    if "/api/v1/courses/videos/" in video_url:
        filename = video_url.split("/api/v1/courses/videos/")[-1].split("?")[0]
        local_path = os.path.join(VIDEOS_DIR, os.path.basename(filename))
        if os.path.exists(local_path):
            return local_path
    elif os.path.exists(video_url):
        return video_url
    return None


async def download_video_stream(video_url: str, dest_path: str):
    """Baixa um vídeo remoto via stream HTTP assíncrono para o arquivo temporário de destino."""
    logger.info(f"[AI Transcription] Baixando vídeo para extração de áudio: {video_url[:80]}...")
    async with httpx.AsyncClient(timeout=300.0, follow_redirects=True) as client:
        async with client.stream("GET", video_url) as response:
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Não foi possível acessar o arquivo de vídeo remoto (HTTP {response.status_code})."
                )
            with open(dest_path, "wb") as f:
                async for chunk in response.aiter_bytes(chunk_size=65536):
                    f.write(chunk)


def _execute_ffmpeg_cmd(input_video_path: str, output_audio_path: str) -> str:
    """Executa o FFmpeg em processo síncrono em worker thread sem bloquear o event loop."""
    cmd = ["ffmpeg", "-y"]
    if input_video_path.startswith("http://") or input_video_path.startswith("https://"):
        cmd.extend([
            "-analyzeduration", "20M",
            "-probesize", "20M",
            "-reconnect", "1",
            "-reconnect_streamed", "1",
            "-reconnect_delay_max", "5"
        ])
    cmd.extend([
        "-i", input_video_path,
        "-vn",                 # Sem faixa de vídeo
        "-ar", "16000",        # Sample rate ideal para Whisper
        "-ac", "1",            # Mono
        "-b:a", "48k",         # Bitrate compacto
        "-f", "mp3",
        output_audio_path
    ])

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        err_msg = result.stderr.decode("utf-8", errors="ignore")
        logger.error(f"[AI Transcription] Erro no FFmpeg: {err_msg[:400]}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha ao extrair áudio do vídeo via FFmpeg: {err_msg[-200:]}"
        )
    return output_audio_path


def _get_audio_duration_seconds(audio_path: str) -> float:
    """Extrai a duração exata do áudio em segundos via ffprobe com tratamento seguro."""
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0 and res.stdout.strip():
            return float(res.stdout.strip())
    except Exception as e:
        logger.warning(f"[AI Transcription] Falha ao ler duração com ffprobe: {e}")
    return 0.0


def format_seconds_to_clock(seconds: Optional[float]) -> str:
    """Converte segundos para o formato cronômetro exato MM:SS ou HH:MM:SS (ex: 15:30, 25:40)."""
    if not seconds or seconds <= 0:
        return "00:00"
    total_sec = int(round(seconds))
    hours = total_sec // 3600
    minutes = (total_sec % 3600) // 60
    secs = total_sec % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def format_cost_brl(cost_brl: Optional[float]) -> str:
    """Formata valor em reais para exibição amigável (ex: R$ 0,18)."""
    if cost_brl is None or cost_brl < 0:
        return "R$ 0,00"
    if 0 < cost_brl < 0.01:
        return "R$ < 0,01"
    return f"R$ {cost_brl:.2f}".replace(".", ",")


def get_or_calculate_transcription_cost(
    transcription: LessonTranscription,
    lesson: Optional[Lesson] = None
) -> Dict[str, Any]:
    """
    Retorna os custos em BRL/USD e tokens da transcrição.
    Para transcrições já geradas anteriormente sem métricas gravadas,
    calcula uma estimativa retroativa realista baseada no tamanho do texto e duração.
    """
    try:
        usd_rate = float(os.getenv("OPENAI_USD_BRL_RATE", "5.50"))
    except Exception:
        usd_rate = 5.50

    if transcription.estimated_cost_brl is not None and transcription.estimated_cost_brl >= 0:
        return {
            "audio_duration_seconds": transcription.audio_duration_seconds,
            "prompt_tokens": transcription.prompt_tokens,
            "completion_tokens": transcription.completion_tokens,
            "estimated_cost_usd": transcription.estimated_cost_usd,
            "estimated_cost_brl": transcription.estimated_cost_brl,
            "estimated_cost_formatted": format_cost_brl(transcription.estimated_cost_brl)
        }

    # Cálculo retroativo / estimado
    full_text = transcription.full_transcript or ""
    if not full_text:
        return {
            "audio_duration_seconds": None,
            "prompt_tokens": None,
            "completion_tokens": None,
            "estimated_cost_usd": None,
            "estimated_cost_brl": None,
            "estimated_cost_formatted": None
        }

    # Estima duração do áudio (~130 palavras por minuto)
    words = len(full_text.split())
    if lesson and lesson.duration and isinstance(lesson.duration, (int, float)) and lesson.duration > 0:
        duration_sec = float(lesson.duration) * 60.0
    else:
        duration_sec = max(30.0, (words / 130.0) * 60.0)

    # Estima tokens (~3.8 caracteres por token em português)
    prompt_tokens = int(len(full_text) / 3.8) + 400
    comp_text = transcription.summary_html or transcription.summary_markdown or ""
    completion_tokens = int(len(comp_text) / 3.8) + 200

    whisper_usd = (duration_sec / 60.0) * 0.006
    gpt_usd = (prompt_tokens * 0.15 / 1_000_000.0) + (completion_tokens * 0.60 / 1_000_000.0)
    total_usd = whisper_usd + gpt_usd
    total_brl = total_usd * usd_rate

    return {
        "audio_duration_seconds": round(duration_sec, 2),
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "estimated_cost_usd": round(total_usd, 4),
        "estimated_cost_brl": round(total_brl, 2),
        "estimated_cost_formatted": format_cost_brl(round(total_brl, 2))
    }


class AITranscriptionService:
    """Serviço para gerenciar transcrição e resumos gerados por IA."""

    async def extract_audio_from_video(self, input_video_path: str, output_audio_path: str) -> str:
        """
        Extrai o áudio do vídeo com FFmpeg em formato MP3 mono 16kHz a 48kbps.
        Executado em thread do sistema operacional para manter o FastAPI 100% responsivo.
        """
        logger.info(f"[AI Transcription] Extraindo áudio via FFmpeg de {input_video_path}...")
        return await asyncio.to_thread(_execute_ffmpeg_cmd, input_video_path, output_audio_path)

    async def transcribe_audio_whisper(self, audio_path: str, language: str = "pt", api_key: str = None) -> Dict[str, Any]:
        """
        Envia o arquivo de áudio para a API OpenAI Whisper e retorna a transcrição textual completa
        e os segmentos temporais (timestamps) para minutagem e capítulos automáticos.
        """
        if not api_key:
            api_key = get_openai_api_key()

        file_size = os.path.getsize(audio_path)
        logger.info(f"[AI Transcription] Enviando áudio de {file_size / (1024*1024):.2f} MB para a API OpenAI Whisper...")

        if file_size > 25 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O arquivo de áudio excede o limite máximo permitido de 25 MB da API Whisper."
            )

        with open(audio_path, "rb") as f:
            files = {
                "file": ("audio.mp3", f, "audio/mpeg")
            }
            data = {
                "model": "whisper-1",
                "language": language,
                "response_format": "verbose_json",
                "timestamp_granularities[]": "segment"
            }
            headers = {
                "Authorization": f"Bearer {api_key}"
            }

            async with httpx.AsyncClient(timeout=300.0) as client:
                res = await client.post(WHISPER_ENDPOINT, headers=headers, files=files, data=data)

        if res.status_code != 200:
            logger.error(f"[AI Transcription] Erro OpenAI Whisper ({res.status_code}): {res.text}")
            try:
                err_json = res.json()
                msg = err_json.get("error", {}).get("message", res.text)
                code = err_json.get("error", {}).get("code")
                if code == "credit_balance_exhausted" or "no credits remaining" in msg.lower() or "insufficient_quota" in res.text.lower():
                    msg = "Saldo de créditos da OpenAI esgotado. Recarregue seus créditos na OpenAI (platform.openai.com) para utilizar a transcrição e resumo com IA."
            except Exception:
                msg = res.text
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Erro na API da OpenAI (Whisper): {msg}"
            )

        try:
            whisper_json = res.json()
            full_text = whisper_json.get("text", "").strip()
            segments = whisper_json.get("segments", [])
            return {
                "text": full_text,
                "segments": segments
            }
        except Exception:
            return {
                "text": res.text.strip(),
                "segments": []
            }

    async def generate_summary_and_html(
        self,
        transcript: str,
        lesson_title: str,
        segments: Optional[list] = None,
        audio_duration_seconds: Optional[float] = None,
        api_key: str = None
    ) -> Dict[str, Any]:
        """
        Envia a transcrição para o GPT-4o-mini solicitando:
        1. Resumo Executivo
        2. Principais Pontos (Key Takeaways)
        3. Minutagem e Capítulos (estilo YouTube) divididos cronologicamente com time, seconds e title
        4. Documento HTML completo, moderno e responsivo para visualização e impressão.
        """
        if not api_key:
            api_key = get_openai_api_key()

        system_prompt = (
            "Você é um especialista em síntese pedagógica, design editorial de cursos online e estruturação de vídeos em capítulos. "
            "A partir da transcrição de uma aula em vídeo (e eventuais trechos com minutagens), seu objetivo é produzir um resumo executivo de alto impacto, "
            "listar os pontos-chave indispensáveis, detalhar a aplicação prática, segmentar o vídeo em capítulos com minutagem cronológica (estilo YouTube: 00:00, 01:30, etc.) "
            "e gerar um documento HTML elegante, responsivo e visualmente profissional."
        )

        # Monta amostra de segmentos com timestamps se disponíveis
        segments_preview = ""
        if segments and isinstance(segments, list) and len(segments) > 0:
            sample_lines = []
            for seg in segments:
                s_start = seg.get("start", 0)
                m, s = divmod(int(s_start), 60)
                h, m = divmod(m, 60)
                ts_str = f"{h:02d}:{m:02d}:{s:02d}" if h > 0 else f"{m:02d}:{s:02d}"
                text_part = seg.get("text", "").strip()
                if text_part:
                    sample_lines.append(f"[{ts_str}] {text_part}")
            if sample_lines:
                # Limita para não estourar tokens desnecessariamente
                joined_sample = "\n".join(sample_lines[:150])
                segments_preview = f"\n\nTrechos com Minutagem Detectada:\n{joined_sample}\n"

        user_prompt = f"""
Título da Aula: "{lesson_title}"

Transcrição Completa do Vídeo:
\"\"\"
{transcript}
\"\"\"{segments_preview}

Gere uma resposta estritamente em formato JSON com as seguintes chaves:
{{
  "generated_lesson_title": "Título claro, didático e atrativo para a aula com base no tema real ensinado no vídeo (máximo 60 caracteres, sem aspas, ex: 'Lua na Casa 2: Recursos, Finanças e Segurança')",
  "generated_lesson_description": "Descrição pedagógica completa e didática da aula em 2 a 3 parágrafos curtos explicando o objetivo da aula, conceitos fundamentais e impacto prático.",
  "summary_executive": "Resumo executivo da aula em 1 ou 2 parágrafos claros e objetivos explicando o foco e o propósito do conteúdo.",
  "key_takeaways": [
    "Ponto principal 1 detalhado com o aprendizado ou técnica essencial",
    "Ponto principal 2...",
    "Ponto principal 3..."
  ],
  "action_plan": [
    "Passo prático 1 sugerido para o aluno aplicar",
    "Passo prático 2...",
    "Passo prático 3..."
  ],
  "chapters": [
    {{
      "time": "00:00",
      "seconds": 0,
      "title": "Introdução ao Conteúdo"
    }},
    {{
      "time": "01:15",
      "seconds": 75,
      "title": "Conceito Principal..."
    }}
  ],
  "summary_html": "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'><title>Resumo da Aula - {lesson_title}</title><style>...</style></head><body>...</body></html>"
}}

Instruções para "generated_lesson_title":
- Crie 1 título profissional, claro, didático e atraente para a aula com base no tema real ensinado no vídeo a partir da transcrição completa.
- O título deve ter no máximo 60 a 70 caracteres, sem aspas e sem prefixos como "Aula:" ou "Vídeo:".
- Se o título atual for genérico ou bruto (ex: "Lua na 2 (1)", "Aula 01.mp4", "01 - Video"), produza um título específico e elegante do assunto real explicado (ex: "Lua na Casa 2: Finanças, Valores e Segurança").

Instruções para "generated_lesson_description":
- Crie uma descrição textual didática, clara e motivadora para a aula (2 a 3 parágrafos curtos, sem tags HTML, separando parágrafos por quebras de linha duplas).
- Explique o objetivo pedagógico, os conceitos ensinados e o aprendizado prático que o aluno obterá ao assistir à aula.

Instruções para "chapters" (Minutagem estilo YouTube):
- Sempre inicie o primeiro capítulo em "00:00" (seconds: 0).
- Crie entre 3 e 10 capítulos relevantes que dividam a aula por tópicos e momentos-chave.
- Cada capítulo deve conter: "time" (formato "MM:SS" ou "HH:MM:SS"), "seconds" (número inteiro ou float de segundos) e "title" (título curto e objetivo do assunto).
- A ordem deve ser estritamente cronológica crescente.

Instruções para o "summary_html":
- O HTML deve ser um documento HTML5 completo e autônomo (inline CSS moderno, paleta escura com vidro e azul royal, tipografia legível 'Inter' ou sans-serif, cantos arredondados, cabeçalho limpo com título da aula, seções bem separadas para Resumo Executivo, Capítulos e Minutagem, Pontos-Chave com marcadores visuais, Plano de Ação e Transcrição Integral retrátil/completa).
- Inclua estilos de impressão (@media print) para fundo branco e texto escuro para quem desejar imprimir ou salvar em PDF.
"""

        headers = {
            "Authorization": f"Bearer {api_key}",
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

        logger.info(f"[AI Transcription] Solicitando resumo, capítulos e documento HTML ao GPT-4o-mini para '{lesson_title}'...")

        async with httpx.AsyncClient(timeout=180.0) as client:
            res = await client.post(CHAT_COMPLETIONS_ENDPOINT, headers=headers, json=payload)

        if res.status_code != 200:
            logger.error(f"[AI Transcription] Erro OpenAI Chat ({res.status_code}): {res.text}")
            try:
                err_json = res.json()
                msg = err_json.get("error", {}).get("message", res.text)
                code = err_json.get("error", {}).get("code")
                if code == "credit_balance_exhausted" or "no credits remaining" in msg.lower() or "insufficient_quota" in res.text.lower():
                    msg = "Saldo de créditos da OpenAI esgotado. Recarregue seus créditos na OpenAI (platform.openai.com) para utilizar a transcrição e resumo com IA."
            except Exception:
                msg = res.text
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Erro na API da OpenAI (Resumo GPT): {msg}"
            )

        data = res.json()
        content_raw = data["choices"][0]["message"]["content"]
        parsed = json.loads(content_raw)

        usage = data.get("usage", {})
        prompt_tokens = usage.get("prompt_tokens") or 0
        completion_tokens = usage.get("completion_tokens") or 0

        # Normaliza capítulos para garantir segundos numéricos e ordem
        raw_chapters = parsed.get("chapters", [])
        clean_chapters = []
        if isinstance(raw_chapters, list):
            for c in raw_chapters:
                if isinstance(c, dict) and "time" in c and "title" in c:
                    t_str = str(c.get("time", "00:00")).strip()
                    sec = c.get("seconds")
                    if sec is None or not isinstance(sec, (int, float)):
                        # Converte string MM:SS ou HH:MM:SS para segundos
                        parts = t_str.split(":")
                        try:
                            if len(parts) == 3:
                                sec = int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
                            elif len(parts) == 2:
                                sec = int(parts[0]) * 60 + float(parts[1])
                            else:
                                sec = 0.0
                        except Exception:
                            sec = 0.0
                    clean_chapters.append({
                        "time": t_str,
                        "seconds": float(sec),
                        "title": str(c.get("title", "")).strip()
                    })

        raw_title = str(parsed.get("generated_lesson_title", "")).strip().strip('"').strip("'").strip()
        raw_desc = str(parsed.get("generated_lesson_description", "")).strip()
        if not raw_desc:
            raw_desc = str(parsed.get("summary_executive", "")).strip()
        return {
            "generated_lesson_title": raw_title,
            "generated_lesson_description": raw_desc,
            "summary_executive": parsed.get("summary_executive", ""),
            "key_takeaways": parsed.get("key_takeaways", []),
            "action_plan": parsed.get("action_plan", []),
            "chapters": clean_chapters,
            "summary_html": parsed.get("summary_html", ""),
            "summary_markdown": f"## Resumo Executivo\n{parsed.get('summary_executive', '')}\n\n## Principais Pontos\n" + "\n".join(f"- {pt}" for pt in parsed.get("key_takeaways", [])),
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens
        }

    async def process_lesson_transcription(
        self,
        db: Session,
        lesson_id: int,
        video_source: str,
        user_id: Optional[int] = None
    ) -> LessonTranscription:
        """Executa o pipeline completo e persiste o resultado no banco."""
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Aula não encontrada.")

        # Busca ou inicializa registro de transcrição
        transcription = db.query(LessonTranscription).filter(
            LessonTranscription.lesson_id == lesson_id
        ).first()

        if not transcription:
            transcription = LessonTranscription(
                lesson_id=lesson_id,
                full_transcript="",
                status="processing",
                generated_by_user_id=user_id
            )
            db.add(transcription)
        else:
            transcription.status = "processing"
            transcription.error_message = None
            if user_id:
                transcription.generated_by_user_id = user_id
        db.commit()
        db.refresh(transcription)

        temp_dir = tempfile.mkdtemp(prefix="transcribe_")
        temp_audio_file = os.path.join(temp_dir, "audio.mp3")

        try:
            local_path = resolve_local_video_path(video_source)
            if local_path:
                input_video = local_path
            else:
                if not video_source.startswith("http://") and not video_source.startswith("https://"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="A transcrição requer um vídeo enviado na aula (upload local ou B2) ou uma URL pública válida."
                    )
                # O FFmpeg lê URLs HTTP/HTTPS diretamente por stream, extraindo apenas os pacotes de áudio.
                # Isso elimina o download pesado de centenas de megabytes do arquivo de vídeo.
                input_video = video_source

            # 1. Extração do áudio em thread não-bloqueante
            await self.extract_audio_from_video(input_video, temp_audio_file)
            audio_duration_seconds = await asyncio.to_thread(_get_audio_duration_seconds, temp_audio_file)
            if not audio_duration_seconds or audio_duration_seconds <= 0:
                if lesson.duration and isinstance(lesson.duration, (int, float)) and lesson.duration > 0:
                    audio_duration_seconds = float(lesson.duration) * 60.0

            # 2. Transcrição com Whisper (obtém texto e segmentos com timestamps)
            whisper_result = await self.transcribe_audio_whisper(temp_audio_file)
            if isinstance(whisper_result, dict):
                full_transcript = whisper_result.get("text", "").strip()
                segments = whisper_result.get("segments", [])
            else:
                full_transcript = str(whisper_result).strip()
                segments = []

            if not full_transcript:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Nenhuma fala audível foi detectada no vídeo para transcrição."
                )

            # 3. Resumo inteligente, minutagem/capítulos e HTML com GPT-4o-mini
            ai_data = await self.generate_summary_and_html(
                transcript=full_transcript,
                lesson_title=lesson.title,
                segments=segments,
                audio_duration_seconds=audio_duration_seconds
            )
            prompt_tokens = ai_data.get("prompt_tokens") or 0
            completion_tokens = ai_data.get("completion_tokens") or 0

            # 4. Cálculo oficial de custos (OpenAI Whisper + GPT-4o-mini)
            # Whisper: $0.006 por minuto ($0.0001 por segundo)
            whisper_cost_usd = (audio_duration_seconds / 60.0) * 0.006 if audio_duration_seconds else 0.0
            # GPT-4o-mini: $0.15 por 1M de prompt tokens, $0.60 por 1M de completion tokens
            gpt_cost_usd = (prompt_tokens * 0.15 / 1_000_000.0) + (completion_tokens * 0.60 / 1_000_000.0)
            total_cost_usd = whisper_cost_usd + gpt_cost_usd

            try:
                usd_rate = float(os.getenv("OPENAI_USD_BRL_RATE", "5.50"))
            except Exception:
                usd_rate = 5.50

            total_cost_brl = total_cost_usd * usd_rate

            # 5. Atualiza registro com métricas completas
            transcription.full_transcript = full_transcript
            transcription.summary_html = ai_data["summary_html"]
            transcription.summary_markdown = ai_data["summary_markdown"]
            takeaways = ai_data.get("key_takeaways")
            transcription.key_takeaways = json.dumps(takeaways, ensure_ascii=False) if isinstance(takeaways, list) else (takeaways or "")
            chapters = ai_data.get("chapters")
            transcription.chapters = json.dumps(chapters, ensure_ascii=False) if isinstance(chapters, list) else (chapters or "")
            transcription.audio_duration_seconds = round(audio_duration_seconds, 2) if audio_duration_seconds else None
            transcription.prompt_tokens = prompt_tokens
            transcription.completion_tokens = completion_tokens
            transcription.estimated_cost_usd = round(total_cost_usd, 4)
            transcription.estimated_cost_brl = round(total_cost_brl, 2)
            transcription.status = "completed"
            transcription.error_message = None

            # 6. Atualização automática do título e descrição da aula gerados pela IA com base na transcrição completa
            generated_title = ai_data.get("generated_lesson_title", "").strip()
            generated_desc = ai_data.get("generated_lesson_description", "").strip()
            if not generated_desc and ai_data.get("summary_executive"):
                generated_desc = str(ai_data.get("summary_executive", "")).strip()

            if generated_title and len(generated_title) >= 3:
                generated_title = generated_title.strip('"').strip("'").strip()
                old_title = lesson.title
                lesson.title = generated_title
                logger.info(f"[AI Transcription] Nome da aula {lesson.id} atualizado automaticamente de '{old_title}' para '{generated_title}'")

            if generated_desc and len(generated_desc) >= 10:
                lesson.description = generated_desc
                logger.info(f"[AI Transcription] Descrição pedagógica da aula {lesson.id} atualizada automaticamente com IA")

            # Mantém faixas de vídeo associadas à aula em sincronia com o novo título e descrição
            for v in (lesson.videos or []):
                if getattr(v, "language", "pt") == "pt" or len(lesson.videos) == 1:
                    if generated_title and len(generated_title) >= 3:
                        v.title = lesson.title
                    if generated_desc and len(generated_desc) >= 10:
                        v.description = lesson.description

            # 7. Atualização automática da duração estimada no formato cronômetro exato (ex: 15:30)
            if audio_duration_seconds and audio_duration_seconds > 0:
                clock_duration = format_seconds_to_clock(audio_duration_seconds)
                old_duration = lesson.duration
                lesson.duration = clock_duration
                logger.info(f"[AI Transcription] Duração da aula {lesson.id} atualizada automaticamente para '{clock_duration}' (anterior: '{old_duration}')")

            db.commit()
            db.refresh(transcription)
            db.refresh(lesson)

            # 8. Sincronização automática com a Base de Conhecimento do AgentFlow (se vinculada no curso)
            try:
                module = lesson.module
                course = module.course if module else None
                if course and course.agentflow_kb_id:
                    from app.services.agentflow_service import agentflow_service
                    if agentflow_service.is_configured():
                        logger.info(f"[AgentFlow AutoSync] Sincronizando aula {lesson.id} com a base #{course.agentflow_kb_id}...")
                        await agentflow_service.sync_lesson_to_knowledge_base(db, lesson.id, kb_id=course.agentflow_kb_id)
            except Exception as af_err:
                logger.error(f"[AgentFlow AutoSync] Erro na sincronização automática da aula {lesson.id}: {af_err}")

            return transcription

        except Exception as e:
            detail_msg = e.detail if isinstance(e, HTTPException) else str(e)
            logger.error(f"[AI Transcription] Falha no processamento da aula {lesson_id}: {detail_msg}")
            transcription.status = "failed"
            transcription.error_message = detail_msg
            db.commit()
            db.refresh(transcription)
            raise e
        finally:
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass

    async def generate_module_overview(
        self,
        module_title: str,
        lessons_data: List[Dict[str, str]]
    ) -> Dict[str, str]:
        """Gera título atraente e descrição pedagógica completa para um módulo usando GPT-4o-mini."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Chave de API da OpenAI (OPENAI_API_KEY) não configurada no servidor."
            )

        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json"
        }

        lessons_context = []
        for idx, l in enumerate(lessons_data, 1):
            t = l.get("title", f"Aula {idx}")
            s = l.get("summary", "")
            tr = l.get("transcript", "")
            details = []
            if s:
                details.append(f"Resumo: {s[:250]}")
            if tr:
                details.append(f"Transcrição das falas: {tr[:500]}")
            detail_str = " | ".join(details)
            lessons_context.append(f"- Aula {idx}: {t}" + (f" ({detail_str})" if detail_str else ""))

        lessons_str = "\n".join(lessons_context) if lessons_context else "Aulas do módulo."

        prompt = f"""Você é um especialista em design instrucional e copywriting pedagógico para plataformas de cursos online.
Analise a lista de aulas que compõem o módulo '{module_title}':

AULAS DO MÓDULO:
{lessons_str}

Sua missão:
1. "generated_module_title": Gere um título profissional, moderno e atrativo para o módulo.
   - REGRA DE OURO: Se o título original contiver número ou identificador (ex: 'Módulo 01', 'Modulo 2', '03'), PRESERVE o identificador e adicione o tema central (ex: 'Módulo 01 - Fundamentos e Estrutura dos Signos' ou 'Módulo 03 - Trânsitos Planetários e Previsões'). Máximo de 65 caracteres. Sem aspas.
2. "generated_module_description": Uma descrição clara, motivadora e didática do módulo (2 a 3 parágrafos curtos).
   - Explique o objetivo pedagógico, o que o aluno aprenderá a dominar e o impacto prático dessa etapa.

Retorne estritamente um objeto JSON válido:
{{
  "generated_module_title": "Módulo 01 - ...",
  "generated_module_description": "Neste módulo..."
}}"""

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "Você é um assistente de IA especializado em redação de cursos e arquitetura pedagógica. Responda estritamente em formato JSON válido."
                },
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(CHAT_COMPLETIONS_ENDPOINT, headers=headers, json=payload)

        if res.status_code != 200:
            logger.error(f"[AI Transcription] Erro OpenAI ao gerar visão do módulo: {res.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Erro na API da OpenAI ao gerar título e descrição do módulo."
            )

        data = res.json()
        content_raw = data["choices"][0]["message"]["content"]
        parsed = json.loads(content_raw)
        return {
            "title": str(parsed.get("generated_module_title", module_title)).strip().strip('"').strip("'"),
            "description": str(parsed.get("generated_module_description", "")).strip()
        }

    async def generate_lesson_title_and_description(
        self,
        transcript: str,
        current_title: str = ""
    ) -> Dict[str, str]:
        """Gera título cativante e descrição pedagógica completa para uma aula individual com base na sua transcrição."""
        api_key = get_openai_api_key()
        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json"
        }

        context_text = transcript[:24000] if len(transcript) > 24000 else transcript

        prompt = f"""Você é um especialista em design instrucional e redação para plataformas de cursos online.
Analise a transcrição completa desta aula (título atual de referência: '{current_title}'):

TRANSCRIÇÃO DA AULA:
{context_text}

Sua missão:
1. "generated_title": Crie um título profissional, moderno e atrativo para esta aula (máximo de 65 caracteres, sem aspas, focado no conteúdo ensinado).
2. "generated_description": Crie uma descrição textual didática e envolvente para a aula (2 a 3 parágrafos curtos).
   - Explique o objetivo da aula, os conceitos essenciais transmitidos e o aprendizado prático que o aluno obterá.

Retorne estritamente um objeto JSON válido:
{{
  "generated_title": "...",
  "generated_description": "..."
}}"""

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "Você é um assistente de IA especializado em redação de cursos e arquitetura pedagógica. Responda estritamente em formato JSON válido."
                },
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(CHAT_COMPLETIONS_ENDPOINT, headers=headers, json=payload)

        if res.status_code != 200:
            logger.error(f"[AI Transcription] Erro OpenAI ao gerar título e descrição da aula: {res.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Erro na API da OpenAI ao gerar título e descrição da aula."
            )

        data = res.json()
        content_raw = data["choices"][0]["message"]["content"]
        parsed = json.loads(content_raw)
        return {
            "title": str(parsed.get("generated_title", current_title)).strip().strip('"').strip("'"),
            "description": str(parsed.get("generated_description", "")).strip()
        }

    async def generate_course_description(
        self,
        course_title: str,
        modules_data: List[Dict[str, Any]]
    ) -> str:
        """Gera uma descrição completa, estruturada e atraente para o curso analisando todos os seus módulos usando GPT-4o-mini."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Chave de API da OpenAI (OPENAI_API_KEY) não configurada no servidor."
            )

        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json"
        }

        modules_context = []
        for idx, m in enumerate(modules_data, 1):
            title = m.get("title", f"Módulo {idx}")
            desc = m.get("description", "")
            lessons = m.get("lessons", [])
            details = []
            if desc:
                details.append(f"Descrição: {desc[:250]}")
            if lessons:
                details.append(f"Aulas: {', '.join(lessons[:6])}")
            detail_str = " | ".join(details)
            modules_context.append(f"- Módulo {idx}: {title}" + (f" ({detail_str})" if detail_str else ""))

        modules_str = "\n".join(modules_context) if modules_context else "Módulos do treinamento."

        prompt = f"""Você é um especialista sênior em design pedagógico e redação de alto impacto para cursos e áreas de membros.
Analise a estrutura completa dos módulos do curso '{course_title}':

MÓDULOS DO CURSO:
{modules_str}

Sua missão:
Crie uma descrição completa, atrativa e didática para o curso '{course_title}' (2 a 4 parágrafos bem estruturados):
1. Apresente o objetivo do curso, a jornada do aluno e o propósito central do treinamento.
2. Sintetize o que o aluno vai vivenciar ao longo dos módulos, destacando as etapas de evolução do aprendizado.
3. Destaque os resultados práticos, transformações e competências que o aluno dominará ao concluir.

Mantenha o tom profissional, engajador e inspirador. Não use markdown exagerado.
Retorne estritamente um objeto JSON válido:
{{
  "generated_course_description": "..."
}}"""

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "Você é um assistente de IA especializado em redação de cursos e arquitetura pedagógica. Responda estritamente em formato JSON válido."
                },
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.5
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(CHAT_COMPLETIONS_ENDPOINT, headers=headers, json=payload)

        if res.status_code != 200:
            logger.error(f"[AI Course Description] Erro OpenAI ao gerar descrição do curso: {res.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Erro na API da OpenAI ao gerar descrição do curso."
            )

        data = res.json()
        content_raw = data["choices"][0]["message"]["content"]
        parsed = json.loads(content_raw)
        return str(parsed.get("generated_course_description", "")).strip()


ai_transcription_service = AITranscriptionService()


async def run_transcription_background_task(lesson_id: int, video_source: str, user_id: Optional[int] = None):
    """Executa a transcrição em background task sem segurar a conexão HTTP do cliente."""
    logger.info(f"[Background Transcription] Iniciando tarefa em segundo plano para aula {lesson_id}...")
    db = SessionLocal()
    try:
        await ai_transcription_service.process_lesson_transcription(
            db=db,
            lesson_id=lesson_id,
            video_source=video_source,
            user_id=user_id
        )
        logger.info(f"[Background Transcription] Aula {lesson_id} transcrita e resumida com sucesso!")
    except Exception as e:
        logger.error(f"[Background Transcription] Erro durante processamento da aula {lesson_id}: {e}")
    finally:
        db.close()
