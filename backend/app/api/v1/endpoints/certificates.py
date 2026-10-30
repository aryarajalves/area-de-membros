import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.endpoints.users import get_current_user
from app.models.user import User
from app.models.course import Course, Lesson, LessonProgress
from app.models.certificate import Certificate
from app.schemas.certificate import (
    CertificateResponse,
    CertificateStatusResponse,
    CertificatePublicValidationResponse,
)
from app.services.certificate_pdf import generate_certificate_pdf_bytes
from app.core.logger import logger

router = APIRouter(prefix="/certificates", tags=["Certificates"])


def calculate_course_completion(course: Course, user_id: int, db: Session):
    """Calcula total de aulas e aulas concluídas pelo aluno no curso."""
    module_ids = [m.id for m in course.modules]
    if not module_ids:
        return 0, 0, 0

    lessons = db.query(Lesson).filter(Lesson.module_id.in_(module_ids)).all()
    total_lessons = len(lessons)
    if total_lessons == 0:
        return 0, 0, 0

    lesson_ids = [l.id for l in lessons]
    completed_count = db.query(LessonProgress.id).filter(
        LessonProgress.user_id == user_id,
        LessonProgress.lesson_id.in_(lesson_ids),
        LessonProgress.is_completed == True
    ).count()

    progress_pct = int((completed_count / total_lessons) * 100)
    return total_lessons, completed_count, progress_pct


@router.get("/course/{course_id}/status", response_model=CertificateStatusResponse)
def get_certificate_status(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verifica o status de emissão e elegibilidade do certificado para o aluno no curso.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado."
        )

    # Verifica se já existe certificado emitido
    existing_cert = db.query(Certificate).filter(
        Certificate.course_id == course_id,
        Certificate.user_id == current_user.id
    ).first()

    total_lessons, completed_count, progress_pct = calculate_course_completion(course, current_user.id, db)
    eligible = (progress_pct >= 100 and total_lessons > 0 and getattr(course, "certificate_enabled", True))

    return {
        "eligible": eligible,
        "progress_pct": progress_pct,
        "completed_lessons": completed_count,
        "total_lessons": total_lessons,
        "certificate": existing_cert,
    }


@router.post("/course/{course_id}/issue", response_model=CertificateResponse)
def issue_certificate(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Emite o certificado de conclusão caso o aluno tenha atingido 100% das aulas.
    Operação idempotente: caso já emitido, retorna o certificado existente.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado."
        )

    if not getattr(course, "certificate_enabled", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A emissão de certificados não está habilitada para este curso."
        )

    # Verifica se já emitiu
    existing_cert = db.query(Certificate).filter(
        Certificate.course_id == course_id,
        Certificate.user_id == current_user.id
    ).first()
    if existing_cert:
        return existing_cert

    # Verifica progresso
    total_lessons, completed_count, progress_pct = calculate_course_completion(course, current_user.id, db)
    if total_lessons == 0 or progress_pct < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Para emitir o certificado é necessário concluir 100% das aulas do curso. Progresso atual: {progress_pct}%."
        )

    # Gera código único CERT-XXXXXXXX
    certificate_code = None
    for _ in range(5):
        candidate_code = f"CERT-{uuid.uuid4().hex[:8].upper()}"
        if not db.query(Certificate).filter(Certificate.certificate_code == candidate_code).first():
            certificate_code = candidate_code
            break

    if not certificate_code:
        certificate_code = f"CERT-{uuid.uuid4().hex[:12].upper()}"

    student_name = (current_user.name or current_user.email.split("@")[0]).strip()
    workload = getattr(course, "workload_hours", 10) or 10

    cert = Certificate(
        certificate_code=certificate_code,
        user_id=current_user.id,
        course_id=course.id,
        student_name=student_name,
        course_title=course.title.strip(),
        workload_hours=workload,
        instructor_name=getattr(course, "instructor_name", None),
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    logger.info(f"[Certificados] Certificado {cert.certificate_code} emitido para {student_name} no curso '{course.title}'")
    return cert


@router.get("/{certificate_code}/download")
def download_certificate_pdf(
    certificate_code: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Gera e entrega o arquivo PDF vetorial oficial do Certificado para visualização/download.
    """
    cert = db.query(Certificate).filter(Certificate.certificate_code == certificate_code.strip()).first()
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificado não encontrado."
        )

    # Determina a URL base pública para o QR Code
    base_url = str(request.base_url).rstrip("/")
    # Se acessando via container/porta 8000/8010, aponta para a porta do frontend (3010)
    if ":8010" in base_url or ":8000" in base_url:
        base_url = "http://localhost:3010"

    try:
        pdf_bytes = generate_certificate_pdf_bytes(
            student_name=cert.student_name,
            course_title=cert.course_title,
            workload_hours=cert.workload_hours,
            certificate_code=cert.certificate_code,
            issued_at=cert.issued_at,
            instructor_name=cert.instructor_name,
            validation_base_url=base_url,
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="certificado_{cert.certificate_code}.pdf"',
                "Cache-Control": "public, max-age=3600",
            }
        )
    except Exception as exc:
        logger.error(f"[Certificados] Erro ao renderizar PDF do certificado {certificate_code}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao renderizar arquivo PDF do certificado."
        )


@router.get("/public/{certificate_code}", response_model=CertificatePublicValidationResponse)
def validate_public_certificate(
    certificate_code: str,
    db: Session = Depends(get_db),
):
    """
    Endpoint público de validação de autenticidade (acessado ao ler o QR Code ou consultar o código).
    Não exige autenticação.
    """
    cert = db.query(Certificate).filter(Certificate.certificate_code == certificate_code.strip()).first()
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificado de conclusão não encontrado ou código inválido."
        )

    return {
        "is_valid": True,
        "certificate_code": cert.certificate_code,
        "student_name": cert.student_name,
        "course_title": cert.course_title,
        "workload_hours": cert.workload_hours,
        "instructor_name": cert.instructor_name,
        "issued_at": cert.issued_at,
    }
