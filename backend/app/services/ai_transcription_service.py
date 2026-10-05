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
from typing import Dict, Any, Optional
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



class AITranscriptionService:
    """Serviço para gerenciar transcrição e resumos gerados por IA."""

    async def extract_audio_from_video(self, input_video_path: str, output_audio_path: str) -> str:
        """
        Extrai o áudio do vídeo com FFmpeg em formato MP3 mono 16kHz a 48kbps.
        Executado em thread do sistema operacional para manter o FastAPI 100% responsivo.
        """
        logger.info(f"[AI Transcription] Extraindo áudio via FFmpeg de {input_video_path}...")
        return await asyncio.to_thread(_execute_ffmpeg_cmd, input_video_path, output_audio_path)

    async def transcribe_audio_whisper(self, audio_path: str, language: str = "pt", api_key: str = None) -> str:
        """Envia o arquivo de áudio para a API OpenAI Whisper e retorna a transcrição textual completa."""
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
                "response_format": "text"
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

        return res.text.strip()

    async def generate_summary_and_html(self, transcript: str, lesson_title: str, api_key: str = None) -> Dict[str, Any]:
        """
        Envia a transcrição para o GPT-4o-mini solicitando:
        1. Resumo Executivo
        2. Principais Pontos (Key Takeaways)
        3. Documento HTML completo, moderno e responsivo para visualização e impressão.
        """
        if not api_key:
            api_key = get_openai_api_key()

        system_prompt = (
            "Você é um especialista em síntese pedagógica e design editorial de cursos online. "
            "A partir da transcrição de uma aula em vídeo, seu objetivo é produzir um resumo executivo de alto impacto, "
            "listar os pontos-chave indispensáveis, detalhar a aplicação prática e gerar um documento HTML elegante, "
            "responsivo e visualmente profissional."
        )

        user_prompt = f"""
Título da Aula: "{lesson_title}"

Transcrição Completa do Vídeo:
\"\"\"
{transcript}
\"\"\"

Gere uma resposta estritamente em formato JSON com as seguintes chaves:
{{
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
  "summary_html": "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'><title>Resumo da Aula - {lesson_title}</title><style>...</style></head><body>...</body></html>"
}}

Instruções para o "summary_html":
- O HTML deve ser um documento HTML5 completo e autônomo (inline CSS moderno, paleta escura com vidro e azul royal, tipografia legível 'Inter' ou sans-serif, cantos arredondados, cabeçalho limpo com título da aula, seções bem separadas para Resumo Executivo, Pontos-Chave com marcadores visuais, Plano de Ação e Transcrição Integral retrátil/completa).
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

        logger.info(f"[AI Transcription] Solicitando resumo e documento HTML ao GPT-4o-mini para '{lesson_title}'...")

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

        return {
            "summary_executive": parsed.get("summary_executive", ""),
            "key_takeaways": parsed.get("key_takeaways", []),
            "action_plan": parsed.get("action_plan", []),
            "summary_html": parsed.get("summary_html", ""),
            "summary_markdown": f"## Resumo Executivo\n{parsed.get('summary_executive', '')}\n\n## Principais Pontos\n" + "\n".join(f"- {pt}" for pt in parsed.get("key_takeaways", []))
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

            # 2. Transcrição com Whisper
            full_transcript = await self.transcribe_audio_whisper(temp_audio_file)
            if not full_transcript or not full_transcript.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Nenhuma fala audível foi detectada no vídeo para transcrição."
                )

            # 3. Resumo inteligente e HTML com GPT-4o-mini
            ai_data = await self.generate_summary_and_html(full_transcript, lesson.title)

            # 4. Atualiza registro
            transcription.full_transcript = full_transcript
            transcription.summary_html = ai_data["summary_html"]
            transcription.summary_markdown = ai_data["summary_markdown"]
            takeaways = ai_data.get("key_takeaways")
            transcription.key_takeaways = json.dumps(takeaways, ensure_ascii=False) if isinstance(takeaways, list) else (takeaways or "")
            transcription.status = "completed"
            transcription.error_message = None
            db.commit()
            db.refresh(transcription)
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
