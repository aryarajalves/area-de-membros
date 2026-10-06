from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query, Header
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonVideo, LessonTranscription, UserCourse
from app.schemas.course import LessonTranscriptionResponse, LessonTranscriptionTriggerRequest
from app.api.v1.endpoints.users import get_current_user, require_admin_or_superadmin
from app.api.v1.endpoints.courses import _verify_student_course_access
from app.services.ai_transcription_service import (
    ai_transcription_service,
    run_transcription_background_task,
    get_or_calculate_transcription_cost
)

router = APIRouter(prefix="/courses", tags=["Lesson Transcriptions"])


def get_current_user_from_header_or_query(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Permite autenticação via Header Authorization/X-Api-Key ou via Query Parameter 'token'.
    Isso é essencial para abertura direta de documentos HTML em novas abas do navegador (window.open).
    """
    auth_header = authorization
    if not auth_header and token:
        auth_header = f"Bearer {token.strip()}"
    return get_current_user(authorization=auth_header, x_api_key=x_api_key, db=db)


def _check_lesson_access(db: Session, course_id: int, module_id: int, lesson_id: int, user: User) -> Lesson:
    """Valida se a aula pertence ao curso/módulo e se o usuário tem permissão para acessá-la."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    module = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado.")

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.module_id == module_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    # Se não for gestor/admin, valida se o aluno tem acesso liberado ao curso
    if user.role not in ["admin", "superadmin"]:
        _verify_student_course_access(db, user.id, course_id)

    return lesson


@router.get(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/transcription",
    response_model=LessonTranscriptionResponse
)
def get_lesson_transcription(
    course_id: int,
    module_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna a transcrição e resumo inteligente gerados para a aula."""
    lesson = _check_lesson_access(db, course_id, module_id, lesson_id, current_user)

    transcription = db.query(LessonTranscription).filter(
        LessonTranscription.lesson_id == lesson_id
    ).first()

    if not transcription:
        # Retorna status inicial para facilitar o frontend
        return LessonTranscriptionResponse(
            id=0,
            lesson_id=lesson_id,
            full_transcript="",
            summary_html="",
            summary_markdown="",
            key_takeaways=[],
            status="not_started",
            error_message=None,
            audio_duration_seconds=None,
            prompt_tokens=None,
            completion_tokens=None,
            estimated_cost_usd=None,
            estimated_cost_brl=None,
            estimated_cost_formatted=None,
            created_at=None,
            updated_at=None
        )

    # Controle rigoroso: Apenas Admin e Super Admin têm permissão para ver custos e consumo de tokens
    is_admin = current_user.role in ["admin", "superadmin"]
    cost_info = get_or_calculate_transcription_cost(transcription, lesson) if is_admin else {}

    # Se a transcrição no banco ainda não tinha os custos gravados e agora calculamos, persiste de forma lazy
    if is_admin and transcription.status == "completed" and transcription.estimated_cost_brl is None and cost_info.get("estimated_cost_brl") is not None:
        try:
            transcription.audio_duration_seconds = cost_info.get("audio_duration_seconds")
            transcription.prompt_tokens = cost_info.get("prompt_tokens")
            transcription.completion_tokens = cost_info.get("completion_tokens")
            transcription.estimated_cost_usd = cost_info.get("estimated_cost_usd")
            transcription.estimated_cost_brl = cost_info.get("estimated_cost_brl")
            db.commit()
            db.refresh(transcription)
        except Exception:
            db.rollback()

    return LessonTranscriptionResponse(
        id=transcription.id,
        lesson_id=transcription.lesson_id,
        full_transcript=(transcription.full_transcript or "") if is_admin else "",
        summary_html=transcription.summary_html,
        summary_markdown=transcription.summary_markdown,
        key_takeaways=transcription.key_takeaways,
        status=transcription.status or "ready",
        error_message=transcription.error_message,
        audio_duration_seconds=cost_info.get("audio_duration_seconds") if is_admin else None,
        prompt_tokens=cost_info.get("prompt_tokens") if is_admin else None,
        completion_tokens=cost_info.get("completion_tokens") if is_admin else None,
        estimated_cost_usd=cost_info.get("estimated_cost_usd") if is_admin else None,
        estimated_cost_brl=cost_info.get("estimated_cost_brl") if is_admin else None,
        estimated_cost_formatted=cost_info.get("estimated_cost_formatted") if is_admin else None,
        created_at=transcription.created_at,
        updated_at=transcription.updated_at
    )


from app.services.ai_transcription_service import ai_transcription_service, run_transcription_background_task


@router.post(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/transcribe",
    response_model=LessonTranscriptionResponse
)
def trigger_lesson_transcription(
    course_id: int,
    module_id: int,
    lesson_id: int,
    background_tasks: BackgroundTasks,
    payload: LessonTranscriptionTriggerRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """
    Dispara a transcrição do vídeo da aula com a API Whisper da OpenAI
    e gera o documento HTML de resumo inteligente com GPT-4o em background task.
    Restrito a administradores e instrutores para gestão de custos de API.
    """
    lesson = _check_lesson_access(db, course_id, module_id, lesson_id, current_user)

    # Identifica fonte de vídeo
    video_url = payload.video_url if payload and payload.video_url else None
    if not video_url:
        first_video = db.query(LessonVideo).filter(LessonVideo.lesson_id == lesson_id).order_by(LessonVideo.id.asc()).first()
        if first_video:
            video_url = first_video.video_url

    if not video_url:
        raise HTTPException(
            status_code=400,
            detail="Nenhum vídeo foi encontrado para esta aula. Adicione um vídeo antes de gerar a transcrição."
        )

    # Inicializa ou atualiza registro no banco com status 'processing'
    transcription = db.query(LessonTranscription).filter(
        LessonTranscription.lesson_id == lesson_id
    ).first()

    if not transcription:
        transcription = LessonTranscription(
            lesson_id=lesson_id,
            full_transcript="",
            status="processing",
            generated_by_user_id=current_user.id
        )
        db.add(transcription)
    else:
        transcription.status = "processing"
        transcription.error_message = None
        transcription.generated_by_user_id = current_user.id

    db.commit()
    db.refresh(transcription)

    logger.info(f"Enfileirando tarefa de transcrição IA para a aula {lesson_id} pelo usuário {current_user.email}")
    background_tasks.add_task(
        run_transcription_background_task,
        lesson_id=lesson_id,
        video_source=video_url,
        user_id=current_user.id
    )

    return transcription


@router.get(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/transcription/html",
    response_class=HTMLResponse
)
def get_lesson_transcription_html(
    course_id: int,
    module_id: int,
    lesson_id: int,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_header_or_query)
):
    """
    Retorna o documento HTML5 inteligente gerado por IA para visualização e impressão direta.
    """
    lesson = _check_lesson_access(db, course_id, module_id, lesson_id, current_user)

    transcription = db.query(LessonTranscription).filter(
        LessonTranscription.lesson_id == lesson_id
    ).first()

    if not transcription or not transcription.summary_html:
        raise HTTPException(
            status_code=404,
            detail="O documento de resumo inteligente ainda não foi gerado para esta aula."
        )

    return HTMLResponse(
        content=transcription.summary_html,
        status_code=200,
        media_type="text/html; charset=utf-8"
    )


@router.delete(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/transcription",
    status_code=status.HTTP_200_OK
)
def reset_lesson_transcription(
    course_id: int,
    module_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """
    Cancela ou redefine o registro de transcrição da aula, permitindo reiniciar o processo caso fique travado.
    """
    _check_lesson_access(db, course_id, module_id, lesson_id, current_user)

    transcription = db.query(LessonTranscription).filter(
        LessonTranscription.lesson_id == lesson_id
    ).first()

    if transcription:
        transcription.status = "not_started"
        transcription.error_message = None
        db.commit()

    return {"message": "Status de transcrição resetado com sucesso."}

