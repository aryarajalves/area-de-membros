"""
Endpoints para Geração e Gestão de Mapas Mentais Interativos com IA.
Permite acionamento individual por aula, por módulo e em lote para todo o curso.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course, Module, Lesson, LessonTranscription, LessonAttachment
from app.api.v1.endpoints.users import require_admin_or_superadmin, get_current_user
from app.services.ai_mindmap_service import ai_mindmap_service

router = APIRouter(prefix="/courses", tags=["Mapas Mentais IA"])


@router.get(
    "/{course_id}/mindmaps/overview",
    summary="Visão Geral de Mapas Mentais do Curso",
    description="Retorna estatísticas de transcrições e mapas mentais existentes no curso."
)
def get_course_mindmaps_overview(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
) -> Dict[str, Any]:
    """Retorna o total de aulas, aulas com transcrição e com mapa mental já gerado."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    modules = db.query(Module).filter(Module.course_id == course_id).all()
    mod_ids = [m.id for m in modules]

    lessons = db.query(Lesson).filter(Lesson.module_id.in_(mod_ids)).all() if mod_ids else []
    lesson_ids = [l.id for l in lessons]

    if not lesson_ids:
        return {
            "total_lessons": 0,
            "with_transcript": 0,
            "with_mindmap": 0,
            "pending": 0,
            "lessons_overview": []
        }

    # Transcrições prontas com texto
    transcriptions = db.query(LessonTranscription.lesson_id).filter(
        LessonTranscription.lesson_id.in_(lesson_ids),
        LessonTranscription.full_transcript != None,
        LessonTranscription.full_transcript != ""
    ).all()
    transcript_lesson_ids = {t[0] for t in transcriptions}

    # Anexos de mapa mental
    mindmap_attachments = db.query(LessonAttachment.lesson_id).filter(
        LessonAttachment.lesson_id.in_(lesson_ids),
        LessonAttachment.title.ilike("%Mapa Mental%")
    ).all()
    mindmap_lesson_ids = {m[0] for m in mindmap_attachments}

    lessons_overview = []
    for l in lessons:
        has_t = l.id in transcript_lesson_ids
        has_m = l.id in mindmap_lesson_ids
        lessons_overview.append({
            "lesson_id": l.id,
            "title": l.title,
            "module_id": l.module_id,
            "has_transcription": has_t,
            "has_mindmap": has_m
        })

    return {
        "total_lessons": len(lessons),
        "with_transcript": len(transcript_lesson_ids),
        "with_mindmap": len(mindmap_lesson_ids),
        "pending": max(0, len(transcript_lesson_ids) - len(mindmap_lesson_ids)),
        "lessons_overview": lessons_overview
    }


@router.post(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/mindmap",
    summary="Gerar Mapa Mental de Uma Aula com IA",
    description="Gera a estrutura visual em Mermaid e salva o HTML autônomo nos anexos da aula."
)
async def generate_lesson_mindmap(
    course_id: int,
    module_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
) -> Dict[str, Any]:
    """Aciona a geração do mapa mental para a aula especificada."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.module_id == module_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada neste módulo.")

    return await ai_mindmap_service.generate_mindmap_for_lesson(lesson_id, db)


@router.post(
    "/{course_id}/modules/{module_id}/mindmaps",
    summary="Gerar Mapas Mentais do Módulo em Lote",
    description="Gera mapas mentais para todas as aulas do módulo que possuam transcrição."
)
async def generate_module_mindmaps(
    course_id: int,
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
) -> Dict[str, Any]:
    """Processa todas as aulas transcritas do módulo em lote."""
    module = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado neste curso.")

    return await ai_mindmap_service.generate_mindmaps_for_module(module_id, course_id, db)


@router.post(
    "/{course_id}/mindmaps",
    summary="Gerar Mapas Mentais do Curso Inteiro em Lote",
    description="Gera mapas mentais para todas as aulas de todos os módulos que possuam transcrição."
)
async def generate_course_mindmaps(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
) -> Dict[str, Any]:
    """Processa todas as aulas transcritas do curso inteiro em lote."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    return await ai_mindmap_service.generate_mindmaps_for_course(course_id, db)
