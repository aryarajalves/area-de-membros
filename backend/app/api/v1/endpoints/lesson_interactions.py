from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.user import User
from app.models.course import (
    Course, UserCourse, Module, Lesson,
    LessonProgress, LessonRating, LessonReport, LessonNote
)
from app.schemas.course import (
    LessonProgressUpdate, LessonProgressResponse, CourseProgressResponse,
    LessonRatingUpdate, LessonRatingResponse,
    LessonReportCreate, LessonReportUpdate, LessonReportResponse, LessonReportsCountResponse,
    LessonNoteCreate, LessonNoteUpdate, LessonNoteResponse
)
from app.api.v1.endpoints.users import get_current_user, require_admin_or_superadmin
from app.core.logger import logger
from app.services.webhook_service import check_and_dispatch_progress_events

router = APIRouter(prefix="/courses", tags=["Interações e Progresso"])

def utc_now():
    return datetime.now(timezone.utc)

def verify_course_access(db: Session, user: User, course_id: int):
    """Verifica se o usuário tem permissão para acessar o curso."""
    if user.role in ["superadmin", "admin"]:
        return True
    if user.role == "aluno":
        access = db.query(UserCourse).filter(
            UserCourse.user_id == user.id,
            UserCourse.course_id == course_id
        ).first()
        if not access:
            raise HTTPException(status_code=403, detail="Você não possui acesso liberado a este curso.")
        return True
    raise HTTPException(status_code=403, detail="Acesso não autorizado aos cursos.")


# ============================================================================
# PROGRESSO DA AULA (MARCAR COMO ASSISTIDA / CONCLUÍDA)
# ============================================================================

@router.get(
    "/{course_id}/progress",
    response_model=CourseProgressResponse,
    summary="Obter Progresso Geral do Curso",
    description="Retorna a lista de IDs de todas as aulas que o aluno já concluiu/assistiu no curso selecionado."
)
def get_course_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna todas as aulas que o usuário atual já marcou como concluídas/assistidas neste curso."""
    verify_course_access(db, current_user, course_id)

    # Coleta todas as lessons do curso
    lesson_ids = [
        item[0] for item in db.query(Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course_id).all()
    ]

    if not lesson_ids:
        return CourseProgressResponse(course_id=course_id, completed_lesson_ids=[])

    completed = db.query(LessonProgress.lesson_id).filter(
        LessonProgress.user_id == current_user.id,
        LessonProgress.lesson_id.in_(lesson_ids),
        LessonProgress.is_completed == True
    ).all()

    completed_ids = [c[0] for c in completed]
    return CourseProgressResponse(course_id=course_id, completed_lesson_ids=completed_ids)


@router.post(
    "/{course_id}/lessons/{lesson_id}/progress",
    response_model=LessonProgressResponse,
    summary="Marcar/Desmarcar Aula Concluída",
    description="Alterna o status de conclusão da aula pelo aluno. Dispara automaticamente eventos de webhook quando marcos de 25%, 50%, 75% ou 100% são alcançados."
)
def toggle_lesson_progress(
    course_id: int,
    lesson_id: int,
    background_tasks: BackgroundTasks,
    progress_in: Optional[LessonProgressUpdate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marca ou desmarca a aula como assistida pelo usuário autenticado."""
    verify_course_access(db, current_user, course_id)

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    record = db.query(LessonProgress).filter(
        LessonProgress.lesson_id == lesson_id,
        LessonProgress.user_id == current_user.id
    ).first()

    target_status = progress_in.is_completed if progress_in is not None else (not record.is_completed if record else True)

    # Coleta todas as lessons do curso para cálculo de marcos de progresso
    all_course_lesson_ids = [
        item[0] for item in db.query(Lesson.id)
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course_id).all()
    ]
    total_course_lessons = len(all_course_lesson_ids)

    # Aulas concluídas antes
    completed_before_count = 0
    if total_course_lessons > 0:
        completed_before_count = db.query(LessonProgress).filter(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id.in_(all_course_lesson_ids),
            LessonProgress.is_completed == True
        ).count()

    if record:
        record.is_completed = target_status
        record.completed_at = utc_now() if target_status else None
        record.updated_at = utc_now()
    else:
        record = LessonProgress(
            lesson_id=lesson_id,
            user_id=current_user.id,
            is_completed=target_status,
            completed_at=utc_now() if target_status else None
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    logger.info(f"Usuário {current_user.id} alterou progresso da aula {lesson_id} para {target_status}")

    # Se a aula foi marcada como assistida, verifica marcos (25%, 50%, 75%, 100%) e dispara webhooks
    if target_status and total_course_lessons > 0:
        completed_after_count = db.query(LessonProgress).filter(
            LessonProgress.user_id == current_user.id,
            LessonProgress.lesson_id.in_(all_course_lesson_ids),
            LessonProgress.is_completed == True
        ).count()

        previous_pct = int((completed_before_count / total_course_lessons) * 100)
        current_pct = int((completed_after_count / total_course_lessons) * 100)

        background_tasks.add_task(
            check_and_dispatch_progress_events,
            user_id=current_user.id,
            course_id=course_id,
            previous_percent=previous_pct,
            current_percent=current_pct,
            completed_lessons=completed_after_count,
            total_lessons=total_course_lessons,
            last_lesson_title=lesson.title or "",
        )

    return record


# ============================================================================
# AVALIAÇÃO DA AULA (0 A 5 ESTRELAS)
# ============================================================================

@router.get(
    "/{course_id}/lessons/{lesson_id}/rating",
    response_model=LessonRatingResponse,
    summary="Obter Avaliação da Aula",
    description="Retorna a nota dada pelo aluno logado, a média geral (1 a 5 estrelas) e o total de avaliações da aula."
)
def get_lesson_rating(
    course_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna a avaliação do usuário atual e as estatísticas globais (média e total) da aula."""
    verify_course_access(db, current_user, course_id)

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    # Avaliação do usuário atual
    user_rating_record = db.query(LessonRating).filter(
        LessonRating.lesson_id == lesson_id,
        LessonRating.user_id == current_user.id
    ).first()
    user_rating = user_rating_record.rating if user_rating_record else 0

    # Estatísticas agregadas
    stats = db.query(
        func.avg(LessonRating.rating),
        func.count(LessonRating.id)
    ).filter(
        LessonRating.lesson_id == lesson_id,
        LessonRating.rating > 0
    ).first()

    avg_rating = round(float(stats[0]), 1) if stats and stats[0] is not None else 0.0
    total_ratings = int(stats[1]) if stats and stats[1] is not None else 0

    return LessonRatingResponse(
        lesson_id=lesson_id,
        user_rating=user_rating,
        average_rating=avg_rating,
        total_ratings=total_ratings
    )


@router.post(
    "/{course_id}/lessons/{lesson_id}/rating",
    response_model=LessonRatingResponse,
    summary="Avaliar Aula com Estrelas",
    description="Atribui nota de 1 a 5 estrelas para a aula pelo aluno logado (envie 0 para remover a nota)."
)
def rate_lesson(
    course_id: int,
    lesson_id: int,
    rating_in: LessonRatingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atribui ou atualiza a nota de 1 a 5 estrelas na aula (0 para remover avaliação)."""
    verify_course_access(db, current_user, course_id)

    if rating_in.rating < 0 or rating_in.rating > 5:
        raise HTTPException(status_code=400, detail="A avaliação deve ser entre 0 e 5 estrelas.")

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    record = db.query(LessonRating).filter(
        LessonRating.lesson_id == lesson_id,
        LessonRating.user_id == current_user.id
    ).first()

    if rating_in.rating == 0:
        if record:
            db.delete(record)
            db.commit()
    else:
        if record:
            record.rating = rating_in.rating
            record.updated_at = utc_now()
        else:
            record = LessonRating(
                lesson_id=lesson_id,
                user_id=current_user.id,
                rating=rating_in.rating
            )
            db.add(record)
        db.commit()

    # Recalcula estatísticas
    stats = db.query(
        func.avg(LessonRating.rating),
        func.count(LessonRating.id)
    ).filter(
        LessonRating.lesson_id == lesson_id,
        LessonRating.rating > 0
    ).first()

    avg_rating = round(float(stats[0]), 1) if stats and stats[0] is not None else 0.0
    total_ratings = int(stats[1]) if stats and stats[1] is not None else 0

    return LessonRatingResponse(
        lesson_id=lesson_id,
        user_rating=rating_in.rating,
        average_rating=avg_rating,
        total_ratings=total_ratings
    )


# ============================================================================
# RELATO DE PROBLEMA NA AULA
# ============================================================================

@router.post(
    "/{course_id}/lessons/{lesson_id}/reports",
    response_model=LessonReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Denunciar/Reportar Problema na Aula",
    description="Permite ao aluno reportar problemas técnicos ou de conteúdo em uma aula (vídeo, áudio, material, conteúdo)."
)
def report_lesson_issue(
    course_id: int,
    lesson_id: int,
    report_in: LessonReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Envia um reporte de problema na aula (vídeo fora do ar, áudio com falha, material quebrado, etc)."""
    verify_course_access(db, current_user, course_id)

    if not report_in.description or not report_in.description.strip():
        raise HTTPException(status_code=400, detail="Por favor, descreva detalhadamente o problema encontrado.")

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    new_report = LessonReport(
        lesson_id=lesson_id,
        user_id=current_user.id,
        issue_type=report_in.issue_type.strip(),
        description=report_in.description.strip(),
        status="open"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    logger.warning(
        f"Problema relatado na aula {lesson_id} pelo usuário {current_user.id} ({current_user.email}): "
        f"Tipo: {report_in.issue_type} - {report_in.description[:80]}"
    )

    return LessonReportResponse(
        id=new_report.id,
        lesson_id=new_report.lesson_id,
        user_id=new_report.user_id,
        issue_type=new_report.issue_type,
        description=new_report.description,
        status=new_report.status,
        created_at=new_report.created_at,
        user_name=current_user.name,
        user_role=current_user.role
    )


@router.get(
    "/reports/summary",
    response_model=LessonReportsCountResponse,
    summary="Resumo de Relatórios de Problemas",
    description="Retorna o consolidado de contadores de problemas reportados nas aulas (pendentes, resolvidos e total). Exige perfil de Admin ou Superadmin."
)
def get_reports_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Retorna contadores de relatórios de aulas (pendentes, resolvidos e total)."""
    pending = db.query(func.count(LessonReport.id)).filter(LessonReport.status == "open").scalar() or 0
    resolved = db.query(func.count(LessonReport.id)).filter(LessonReport.status == "resolved").scalar() or 0
    total = db.query(func.count(LessonReport.id)).scalar() or 0
    return LessonReportsCountResponse(pending_count=pending, resolved_count=resolved, total_count=total)


@router.get(
    "/reports",
    response_model=List[LessonReportResponse],
    summary="Listar Problemas Reportados",
    description="Lista todos os relatórios de problemas técnicos ou de conteúdo enviados pelos alunos nas aulas. Exige perfil de Admin ou Superadmin."
)
def list_reported_issues(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Lista todos os problemas reportados nas aulas com dados completos de curso, aula e aluno."""
    reports = db.query(LessonReport).order_by(LessonReport.created_at.desc()).all()
    results = []
    for rep in reports:
        user_name = rep.user.name if rep.user else None
        user_email = rep.user.email if rep.user else None
        user_role = rep.user.role if rep.user else None
        lesson_title = rep.lesson.title if rep.lesson else None
        course_id = rep.lesson.module.course_id if (rep.lesson and rep.lesson.module) else None
        course_title = rep.lesson.module.course.title if (rep.lesson and rep.lesson.module and rep.lesson.module.course) else None

        results.append(LessonReportResponse(
            id=rep.id,
            lesson_id=rep.lesson_id,
            user_id=rep.user_id,
            issue_type=rep.issue_type,
            description=rep.description,
            status=rep.status,
            created_at=rep.created_at,
            user_name=user_name,
            user_email=user_email,
            user_role=user_role,
            lesson_title=lesson_title,
            course_id=course_id,
            course_title=course_title
        ))
    return results


@router.patch(
    "/reports/{report_id}",
    response_model=LessonReportResponse,
    summary="Atualizar Status do Relato de Problema",
    description="Atualiza o estado de resolução de um problema reportado ('open' para pendente, 'resolved' para resolvido). Exige perfil de Admin ou Superadmin."
)
def update_report_status(
    report_id: int,
    report_update: LessonReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Atualiza o status de um reporte de problema ('open' ou 'resolved')."""
    rep = db.query(LessonReport).filter(LessonReport.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Relato não encontrado.")

    new_status = report_update.status.strip().lower()
    if new_status not in ["open", "resolved"]:
        raise HTTPException(status_code=400, detail="Status inválido. Use 'open' ou 'resolved'.")

    rep.status = new_status
    db.commit()
    db.refresh(rep)

    user_name = rep.user.name if rep.user else None
    user_email = rep.user.email if rep.user else None
    user_role = rep.user.role if rep.user else None
    lesson_title = rep.lesson.title if rep.lesson else None
    course_id = rep.lesson.module.course_id if (rep.lesson and rep.lesson.module) else None
    course_title = rep.lesson.module.course.title if (rep.lesson and rep.lesson.module and rep.lesson.module.course) else None

    logger.info(f"Relato {report_id} atualizado para status '{new_status}' por {current_user.email}")

    return LessonReportResponse(
        id=rep.id,
        lesson_id=rep.lesson_id,
        user_id=rep.user_id,
        issue_type=rep.issue_type,
        description=rep.description,
        status=rep.status,
        created_at=rep.created_at,
        user_name=user_name,
        user_email=user_email,
        user_role=user_role,
        lesson_title=lesson_title,
        course_id=course_id,
        course_title=course_title
    )


@router.delete(
    "/reports/{report_id}",
    summary="Excluir Relato de Problema",
    description="Remove definitivamente o registro de relato de problema de aula do banco de dados. Exige perfil de Admin ou Superadmin."
)
def delete_reported_issue(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Exclui um registro de problema reportado."""
    rep = db.query(LessonReport).filter(LessonReport.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Relato não encontrado.")

    db.delete(rep)
    db.commit()
    logger.info(f"Relato {report_id} excluído por {current_user.email}")
    return {"message": "Relato excluído com sucesso."}


# ============================================================================
# ANOTAÇÕES PESSOAIS DA AULA (LESSON NOTES) - PRIVADAS POR ALUNO
# ============================================================================

@router.get(
    "/{course_id}/lessons/{lesson_id}/notes",
    response_model=List[LessonNoteResponse],
    summary="Listar Anotações Pessoais da Aula",
    description="Retorna todas as notas e apontamentos privados criados pelo aluno logado na respectiva aula."
)
def list_lesson_notes(
    course_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todas as anotações privadas do usuário para a aula especificada."""
    verify_course_access(db, current_user, course_id)

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    notes = db.query(LessonNote).filter(
        LessonNote.lesson_id == lesson_id,
        LessonNote.user_id == current_user.id
    ).order_by(LessonNote.created_at.desc()).all()

    return notes


@router.post(
    "/{course_id}/lessons/{lesson_id}/notes",
    response_model=LessonNoteResponse,
    summary="Criar Anotação Pessoal na Aula",
    description="Cria uma nova anotação/bloco de notas pessoal associada à aula e visível apenas para o próprio aluno."
)
def create_lesson_note(
    course_id: int,
    lesson_id: int,
    note_in: LessonNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria uma nova anotação privada (badge/card) para a aula."""
    verify_course_access(db, current_user, course_id)

    if not note_in.content.strip():
        raise HTTPException(status_code=400, detail="O conteúdo da anotação não pode estar vazio.")

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    note = LessonNote(
        lesson_id=lesson_id,
        user_id=current_user.id,
        content=note_in.content.strip()
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    logger.info(f"Usuário {current_user.id} ({current_user.email}) criou anotação {note.id} na aula {lesson_id}")
    return note


@router.put(
    "/{course_id}/lessons/{lesson_id}/notes/{note_id}",
    response_model=LessonNoteResponse,
    summary="Atualizar Anotação Pessoal da Aula",
    description="Atualiza o texto de uma anotação pessoal existente do aluno logado."
)
def update_lesson_note(
    course_id: int,
    lesson_id: int,
    note_id: int,
    note_in: LessonNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza uma anotação privada existente."""
    verify_course_access(db, current_user, course_id)

    if not note_in.content.strip():
        raise HTTPException(status_code=400, detail="O conteúdo da anotação não pode estar vazio.")

    note = db.query(LessonNote).filter(
        LessonNote.id == note_id,
        LessonNote.lesson_id == lesson_id,
        LessonNote.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Anotação não encontrada ou sem permissão.")

    note.content = note_in.content.strip()
    note.updated_at = utc_now()
    db.commit()
    db.refresh(note)
    logger.info(f"Usuário {current_user.id} atualizou anotação {note_id} na aula {lesson_id}")
    return note


@router.delete(
    "/{course_id}/lessons/{lesson_id}/notes/{note_id}",
    summary="Excluir Anotação Pessoal da Aula",
    description="Remove definitivamente uma anotação pessoal de aula pertencente ao aluno logado."
)
def delete_lesson_note(
    course_id: int,
    lesson_id: int,
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exclui uma anotação privada do aluno."""
    verify_course_access(db, current_user, course_id)

    note = db.query(LessonNote).filter(
        LessonNote.id == note_id,
        LessonNote.lesson_id == lesson_id,
        LessonNote.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Anotação não encontrada ou sem permissão.")

    db.delete(note)
    db.commit()
    logger.info(f"Usuário {current_user.id} excluiu anotação {note_id} na aula {lesson_id}")
    return {"message": "Anotação excluída com sucesso."}


