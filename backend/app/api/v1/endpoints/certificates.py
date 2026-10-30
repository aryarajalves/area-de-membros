import re
import uuid
from typing import Optional, Tuple
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


def parse_lesson_duration_seconds(duration_str: Optional[str]) -> int:
    """Converte a string de duração de uma aula (ex: '02:31', '01:10:20', '20 min') para segundos."""
    if not duration_str:
        return 0
    trimmed = str(duration_str).strip().lower()
    if not trimmed:
        return 0

    if ":" in trimmed:
        try:
            parts = [int(p) if p.strip().isdigit() else 0 for p in trimmed.split(":")]
            if len(parts) == 3:
                return parts[0] * 3600 + parts[1] * 60 + parts[2]
            if len(parts) == 2:
                return parts[0] * 60 + parts[1]
        except Exception:
            return 0

    hm_match = re.match(r"^(?:(\d+)\s*h(?:oras?)?)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:in(?:utos?)?)?)?$", trimmed)
    if hm_match and (hm_match.group(1) or hm_match.group(2)):
        hrs = int(hm_match.group(1) or 0)
        mins = float(hm_match.group(2) or 0)
        return int(round(hrs * 3600 + mins * 60))

    try:
        return int(round(float(trimmed) * 60))
    except Exception:
        return 0


def format_seconds_to_human_workload(total_seconds: int, fallback_hours: int = 10) -> Tuple[int, str]:
    """Retorna (horas_inteiras, label_formatada) ex: (2, '1h 40min') a partir do total de segundos das aulas."""
    if not total_seconds or total_seconds <= 0:
        hrs = fallback_hours or 10
        return hrs, f"{hrs}h"

    if total_seconds < 60:
        return 1, f"{int(round(total_seconds))}s"

    total_minutes = int(round(total_seconds / 60.0))
    hours = total_minutes // 60
    minutes = total_minutes % 60
    rounded_hours = max(1, int(round(total_seconds / 3600.0)))

    if hours > 0:
        if minutes == 0:
            return rounded_hours, f"{hours}h"
        return rounded_hours, f"{hours}h {minutes:02d}min"
    return 1, f"{max(1, minutes)} min"


def calculate_course_real_workload(course: Optional[Course], db: Session, fallback_hours: int = 10) -> Tuple[int, str]:
    """Soma a duração real de todas as aulas do curso para exibir a carga horária exata no certificado."""
    if not course:
        hrs = fallback_hours or 10
        return hrs, f"{hrs}h"

    module_ids = [m.id for m in (course.modules or [])]
    total_seconds = 0
    if module_ids:
        lessons = db.query(Lesson).filter(Lesson.module_id.in_(module_ids)).all()
        for l in lessons:
            total_seconds += parse_lesson_duration_seconds(getattr(l, "duration", None))

    fb = getattr(course, "workload_hours", None) or fallback_hours or 10
    return format_seconds_to_human_workload(total_seconds, fallback_hours=fb)


def attach_real_workload_to_cert(cert: Optional[Certificate], course: Optional[Course], db: Session):
    """Garante que o certificado retorne sempre a carga horária real atualizada das aulas do curso."""
    if not cert:
        return None
    target_course = course or db.query(Course).filter(Course.id == cert.course_id).first()
    real_hours, real_label = calculate_course_real_workload(target_course, db, fallback_hours=cert.workload_hours or 10)
    if cert.workload_hours != real_hours:
        cert.workload_hours = real_hours
        db.commit()
        db.refresh(cert)
    setattr(cert, "workload_label", real_label)
    return cert


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
    if existing_cert:
        attach_real_workload_to_cert(existing_cert, course, db)

    total_lessons, completed_count, progress_pct = calculate_course_completion(course, current_user.id, db)
    cert_enabled = bool(getattr(course, "certificate_enabled", True))
    eligible = (progress_pct >= 100 and total_lessons > 0 and cert_enabled)

    return {
        "eligible": eligible,
        "certificate_enabled": cert_enabled,
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
    Superadmin e Admin podem emitir/pré-visualizar o certificado mesmo antes de 100%.
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
        return attach_real_workload_to_cert(existing_cert, course, db)

    # Verifica progresso (administradores podem emitir para pré-visualização/teste)
    is_manager = getattr(current_user, "role", None) in ("superadmin", "admin")
    total_lessons, completed_count, progress_pct = calculate_course_completion(course, current_user.id, db)
    if not is_manager and (total_lessons == 0 or progress_pct < 100):
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
    workload_hours, workload_label = calculate_course_real_workload(course, db, fallback_hours=getattr(course, "workload_hours", 10) or 10)

    cert = Certificate(
        certificate_code=certificate_code,
        user_id=current_user.id,
        course_id=course.id,
        student_name=student_name,
        course_title=course.title.strip(),
        workload_hours=workload_hours,
        instructor_name=getattr(course, "instructor_name", None),
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    setattr(cert, "workload_label", workload_label)

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
        attach_real_workload_to_cert(cert, None, db)
        pdf_bytes = generate_certificate_pdf_bytes(
            student_name=cert.student_name,
            course_title=cert.course_title,
            workload_hours=cert.workload_hours,
            certificate_code=cert.certificate_code,
            issued_at=cert.issued_at,
            instructor_name=cert.instructor_name,
            validation_base_url=base_url,
            workload_label=getattr(cert, "workload_label", None),
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="certificado_{cert.certificate_code}.pdf"',
                "Cache-Control": "no-cache, no-store, must-revalidate",
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

    attach_real_workload_to_cert(cert, None, db)
    return {
        "is_valid": True,
        "certificate_code": cert.certificate_code,
        "student_name": cert.student_name,
        "course_title": cert.course_title,
        "workload_hours": cert.workload_hours,
        "workload_label": getattr(cert, "workload_label", None),
        "instructor_name": cert.instructor_name,
        "issued_at": cert.issued_at,
    }
