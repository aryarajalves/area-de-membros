import os
import uuid
import json
import tempfile
from typing import List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import asc

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.tutorial import Tutorial
from app.schemas.tutorial import (
    TutorialCreate,
    TutorialUpdate,
    TutorialResponse,
    TutorialReorderRequest,
)
from app.api.v1.endpoints.users import get_current_user
from app.services.storage import upload_media_file, delete_media_file
from app.services.ai_transcription_service import (
    ai_transcription_service,
    get_openai_api_key,
    _get_audio_duration_seconds,
    format_seconds_to_clock,
    CHAT_COMPLETIONS_ENDPOINT,
    resolve_local_video_path,
)

router = APIRouter()

BASE_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "uploads"
)
TUTORIAL_VIDEOS_DIR = os.path.join(BASE_UPLOAD_DIR, "videos")
os.makedirs(TUTORIAL_VIDEOS_DIR, exist_ok=True)


def require_admin_or_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores."
        )
    return current_user


@router.get("", response_model=List[TutorialResponse])
def list_tutorials(
    include_inactive: bool = Query(False, description="Incluir tutoriais inativos (apenas administradores)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna a lista de vídeos tutoriais de navegação.
    Alunos visualizam apenas tutoriais ativos.
    Administradores podem solicitar todos para edição.
    """
    try:
        query = db.query(Tutorial)
        if current_user.role not in ["superadmin", "admin"] or not include_inactive:
            query = query.filter(Tutorial.is_active == True)

        tutorials = query.order_by(asc(Tutorial.order_index), asc(Tutorial.id)).all()
        return tutorials
    except Exception as exc:
        logger.error(f"[Tutorials] Erro ao listar tutoriais: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar tutoriais da plataforma."
        )


@router.post("", response_model=TutorialResponse, status_code=status.HTTP_201_CREATED)
def create_tutorial(
    data: TutorialCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Cria uma nova aula de tutorial de navegação (Restrito a Admin/Superadmin).
    """
    try:
        # Se order_index não for passado ou for 0, coloca no final
        order_idx = data.order_index
        if order_idx is None or order_idx == 0:
            max_order = db.query(Tutorial).count()
            order_idx = max_order + 1

        tutorial = Tutorial(
            title=data.title.strip(),
            description=data.description.strip() if data.description else None,
            video_url=data.video_url.strip(),
            video_key=data.video_key,
            thumbnail_url=data.thumbnail_url,
            duration=data.duration,
            order_index=order_idx,
            is_active=data.is_active if data.is_active is not None else True,
        )
        db.add(tutorial)
        db.commit()
        db.refresh(tutorial)
        logger.info(f"[Tutorials] Tutorial '{tutorial.title}' criado por {admin.email}")
        return tutorial
    except Exception as exc:
        db.rollback()
        logger.error(f"[Tutorials] Erro ao criar tutorial: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar aula de tutorial."
        )


@router.put("/reorder", status_code=status.HTTP_200_OK)
def reorder_tutorials(
    request: TutorialReorderRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Atualiza a ordem de exibição da playlist de tutoriais em lote.
    """
    try:
        for item in request.items:
            tutorial = db.query(Tutorial).filter(Tutorial.id == item.id).first()
            if tutorial:
                tutorial.order_index = item.order_index
        db.commit()
        return {"detail": "Ordem dos tutoriais atualizada com sucesso."}
    except Exception as exc:
        db.rollback()
        logger.error(f"[Tutorials] Erro ao reordenar tutoriais: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao salvar nova ordem dos tutoriais."
        )


@router.put("/{tutorial_id}", response_model=TutorialResponse)
def update_tutorial(
    tutorial_id: int,
    data: TutorialUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Atualiza dados de uma aula de tutorial existente.
    """
    tutorial = db.query(Tutorial).filter(Tutorial.id == tutorial_id).first()
    if not tutorial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutorial não encontrado."
        )

    try:
        if data.title is not None:
            tutorial.title = data.title.strip()
        if data.description is not None:
            tutorial.description = data.description.strip() if data.description else None
        if data.video_url is not None:
            tutorial.video_url = data.video_url.strip()
        if data.video_key is not None:
            tutorial.video_key = data.video_key
        if data.thumbnail_url is not None:
            tutorial.thumbnail_url = data.thumbnail_url
        if data.duration is not None:
            tutorial.duration = data.duration
        if data.order_index is not None:
            tutorial.order_index = data.order_index
        if data.is_active is not None:
            tutorial.is_active = data.is_active

        db.commit()
        db.refresh(tutorial)
        logger.info(f"[Tutorials] Tutorial {tutorial_id} atualizado por {admin.email}")
        return tutorial
    except Exception as exc:
        db.rollback()
        logger.error(f"[Tutorials] Erro ao atualizar tutorial {tutorial_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar tutorial."
        )


@router.delete("/{tutorial_id}", status_code=status.HTTP_200_OK)
def delete_tutorial(
    tutorial_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Remove uma aula de tutorial (Restrito a Admin/Superadmin).
    """
    tutorial = db.query(Tutorial).filter(Tutorial.id == tutorial_id).first()
    if not tutorial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutorial não encontrado."
        )

    try:
        # Se tiver mídia no B2, tenta remover
        if tutorial.video_url:
            delete_media_file(tutorial.video_url)

        db.delete(tutorial)
        db.commit()
        logger.info(f"[Tutorials] Tutorial {tutorial_id} ('{tutorial.title}') deletado por {admin.email}")
        return {"detail": "Tutorial excluído com sucesso."}
    except Exception as exc:
        db.rollback()
        logger.error(f"[Tutorials] Erro ao excluir tutorial {tutorial_id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao excluir tutorial."
        )


@router.post("/upload-video", status_code=status.HTTP_200_OK)
async def upload_tutorial_video(
    file: UploadFile = File(...),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Faz upload de arquivo de vídeo para a aula de tutorial.
    Suporta envio para o Backblaze B2 ou fallback local.
    """
    try:
        content = await file.read()
        file_ext = os.path.splitext(file.filename)[1].lower() or ".mp4"
        unique_filename = f"tutorial_{uuid.uuid4().hex[:12]}{file_ext}"

        # Tenta envio no B2
        b2_url = upload_media_file(
            file_bytes=content,
            filename=unique_filename,
            content_type=file.content_type or "video/mp4",
            folder="AreaDeMembros/tutorials/"
        )

        if b2_url:
            video_url = b2_url
            video_key = f"AreaDeMembros/tutorials/{unique_filename}"
        else:
            # Fallback para armazenamento local
            local_path = os.path.join(TUTORIAL_VIDEOS_DIR, unique_filename)
            with open(local_path, "wb") as f:
                f.write(content)
            video_url = f"/api/v1/courses/videos/{unique_filename}"
            video_key = unique_filename

        return {
            "video_url": video_url,
            "video_key": video_key,
            "filename": file.filename,
        }
    except Exception as exc:
        logger.error(f"[Tutorials] Erro no upload de vídeo de tutorial: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao realizar upload do arquivo de vídeo."
        )


@router.post("/generate-ai-description", status_code=status.HTTP_200_OK)
async def generate_tutorial_ai_description(
    file: Optional[UploadFile] = File(None),
    video_url: Optional[str] = Form(None),
    video_key: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    admin: User = Depends(require_admin_or_superadmin),
):
    """
    Transcreve o vídeo do tutorial via OpenAI Whisper e gera uma descrição
    pedagógica detalhada citando todos os passos e tópicos abordados com o GPT.
    Suporta arquivo enviado diretamente ou vídeo já hospedado/URL.
    """
    if (file is None or not getattr(file, "filename", None)) and not (video_url and video_url.strip()) and not (video_key and video_key.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Por favor, forneça um arquivo de vídeo ou a URL do vídeo para gerar a descrição com IA."
        )

    api_key = get_openai_api_key()
    tutorial_title = (title or "").strip() or "Tutorial da Plataforma"

    logger.info(f"[Tutorials AI] Iniciando transcrição e geração de descrição para tutorial '{tutorial_title}' solicitada por {admin.email}")

    with tempfile.TemporaryDirectory() as temp_dir:
        input_video_path = None

        # 1. Trata arquivo enviado no form
        # 1. Trata arquivo enviado no form
        if file is not None and getattr(file, "filename", None):
            file_ext = os.path.splitext(file.filename)[1].lower() or ".mp4"
            input_video_path = os.path.join(temp_dir, f"temp_input{file_ext}")
            with open(input_video_path, "wb") as f_out:
                bytes_written = 0
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    f_out.write(chunk)
                    bytes_written += len(chunk)
            if bytes_written == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="O arquivo de vídeo enviado está vazio."
                )
            logger.info(f"[Tutorials AI] Arquivo de vídeo gravado com sucesso ({bytes_written / (1024*1024):.2f} MB)")
        else:
            # 2. Trata URL ou key existente
            raw_url = (video_url or "").strip()
            local_resolved = resolve_local_video_path(raw_url)

            if not local_resolved and "/api/v1/courses/videos/" in raw_url:
                filename = raw_url.split("/api/v1/courses/videos/")[-1].split("?")[0]
                candidate = os.path.join(TUTORIAL_VIDEOS_DIR, os.path.basename(filename))
                if os.path.exists(candidate):
                    local_resolved = candidate

            if local_resolved and os.path.exists(local_resolved):
                input_video_path = local_resolved
            elif raw_url.startswith("http://") or raw_url.startswith("https://"):
                input_video_path = raw_url
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Arquivo de vídeo não encontrado no servidor ou URL externa inválida."
                )

        output_audio_path = os.path.join(temp_dir, "extracted_audio.mp3")

        # 3. Extrai áudio via FFmpeg
        try:
            await ai_transcription_service.extract_audio_from_video(input_video_path, output_audio_path)
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"[Tutorials AI] Falha na extração de áudio do tutorial: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Não foi possível extrair o áudio do vídeo com FFmpeg: {exc}"
            )

        # 4. Mede duração precisa do áudio
        audio_duration = _get_audio_duration_seconds(output_audio_path)
        formatted_duration = format_seconds_to_clock(audio_duration)

        # 5. Transcreve com OpenAI Whisper
        try:
            whisper_result = await ai_transcription_service.transcribe_audio_whisper(
                output_audio_path, language="pt", api_key=api_key
            )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"[Tutorials AI] Erro no Whisper: {exc}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Falha na transcrição de áudio com OpenAI Whisper: {exc}"
            )

        full_transcript = (whisper_result.get("full_transcript") or "").strip()
        if not full_transcript or len(full_transcript) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não foram detectadas falas ou áudio inteligível no vídeo para formular a descrição."
            )

        # Trunca transcrição se ultrapassar 45.000 caracteres para garantir que não estoure tokens do modelo
        transcript_for_prompt = full_transcript if len(full_transcript) <= 45000 else full_transcript[:45000] + "..."

        # 6. Gera descrição didática completa citando tudo o que é falado com GPT
        prompt = f"""Você é um especialista em educação digital e redação pedagógica para plataformas de membros.
Analise a transcrição completa do vídeo de tutorial da plataforma e formule uma descrição didática, detalhada e altamente explicativa que cite com clareza tudo o que o instrutor fala e demonstra ao longo do vídeo.

TÍTULO DA AULA: {tutorial_title}
TRANSCRIÇÃO COMPLETA DO VÍDEO:
{transcript_for_prompt}

DIRETRIZES DA DESCRIÇÃO:
1. Inicie com um parágrafo introdutório contextualizando o propósito do tutorial e o benefício direto para o aluno.
2. Em seguida, elabore tópicos com marcadores (hífens) citando em ordem cronológica o que o instrutor aborda, ensina e demonstra (cada passo, tela, botão e funcionalidade explicada no vídeo).
3. Se o instrutor der dicas ou orientações especiais, destaque em uma seção 'Dicas e Recomendações'.
4. Finalize com uma breve frase de conclusão encorajadora.
5. Escreva em Português do Brasil de forma clara, profissional e sem marcações markdown complexas (use texto com quebras de linha e hífens).

Retorne estritamente um objeto JSON válido no formato:
{{
  "generated_description": "..."
}}"""

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "Você é um assistente de IA especializado em redação pedagógica e experiência do usuário. Responda estritamente em JSON válido.",
                },
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4,
        }

        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                gpt_res = await client.post(CHAT_COMPLETIONS_ENDPOINT, headers=headers, json=payload)

            if gpt_res.status_code != 200:
                logger.error(f"[Tutorials AI] Erro OpenAI GPT: {gpt_res.text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Erro na API da OpenAI ao processar a descrição do tutorial."
                )

            gpt_data = gpt_res.json()
            content_raw = gpt_data["choices"][0]["message"]["content"]
            parsed = json.loads(content_raw)
            generated_description = str(parsed.get("generated_description", "")).strip()

            logger.info(f"[Tutorials AI] Descrição gerada com sucesso para tutorial '{tutorial_title}' por {admin.email}")
            return {
                "description": generated_description,
                "full_transcript": full_transcript,
                "duration": formatted_duration,
            }
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"[Tutorials AI] Erro inesperado ao gerar descrição com GPT: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Falha ao gerar descrição pedagógica com IA: {exc}"
            )

