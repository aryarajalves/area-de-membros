import json
from typing import Optional, List
from math import ceil
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.core.database import get_db
from app.core.logger import logger
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, UserCourse, Module, Lesson, LessonProgress
from app.schemas.student import (
    StudentListResponse, StudentListItem, StudentCourseProgressItem, StudentImportResponse,
    StudentLessonActivityItem
)
from app.api.v1.endpoints.users import require_admin_or_superadmin, calculate_course_expiration
from app.services.student_import_export import (
    export_students_csv, export_students_xlsx,
    generate_template_csv, generate_template_xlsx,
    parse_imported_file, generate_random_password, normalize_duration
)

router = APIRouter(prefix="/students", tags=["Students"])


def _build_students_details(students: List[User], db: Session) -> List[StudentListItem]:
    now = datetime.now(timezone.utc)
    items: List[StudentListItem] = []

    for student in students:
        user_courses = db.query(UserCourse).filter(UserCourse.user_id == student.id).all()
        courses_data: List[StudentCourseProgressItem] = []
        total_progress_sum = 0

        for uc in user_courses:
            course = db.query(Course).filter(Course.id == uc.course_id).first()
            if not course:
                continue

            lessons = (
                db.query(Lesson.id, Lesson.title)
                .join(Module, Lesson.module_id == Module.id)
                .filter(Module.course_id == course.id)
                .all()
            )
            total_lessons = len(lessons)
            lesson_id_to_title = {l.id: l.title for l in lessons}
            lesson_ids = list(lesson_id_to_title.keys())

            completed_lessons = 0
            last_lesson_title = None
            last_activity_at = None

            if lesson_ids:
                progress_records = (
                    db.query(LessonProgress)
                    .filter(
                        LessonProgress.user_id == student.id,
                        LessonProgress.lesson_id.in_(lesson_ids),
                        LessonProgress.is_completed == True
                    )
                    .order_by(LessonProgress.updated_at.desc(), LessonProgress.id.desc())
                    .all()
                )
                completed_lessons = len(progress_records)
                if progress_records:
                    last_record = progress_records[0]
                    last_lesson_title = lesson_id_to_title.get(last_record.lesson_id)
                    last_activity_at = last_record.updated_at or last_record.completed_at

            progress_percent = int(round((completed_lessons / total_lessons) * 100)) if total_lessons > 0 else 0
            total_progress_sum += progress_percent

            is_expired = False
            days_remaining = None
            time_progress_percent = None
            if uc.expires_at:
                exp_dt = uc.expires_at if uc.expires_at.tzinfo else uc.expires_at.replace(tzinfo=timezone.utc)
                is_expired = exp_dt < now
                diff_seconds = (exp_dt - now).total_seconds()
                days_remaining = int(diff_seconds // 86400) if diff_seconds > 0 else 0

                enrolled_dt = uc.created_at or student.created_at
                if enrolled_dt:
                    enr_dt = enrolled_dt if enrolled_dt.tzinfo else enrolled_dt.replace(tzinfo=timezone.utc)
                    total_duration_sec = (exp_dt - enr_dt).total_seconds()
                    elapsed_sec = (now - enr_dt).total_seconds()
                    if total_duration_sec > 0:
                        time_progress_percent = int(min(max(round((elapsed_sec / total_duration_sec) * 100), 0), 100))
                    else:
                        time_progress_percent = 100

            courses_data.append(
                StudentCourseProgressItem(
                    course_id=course.id,
                    course_title=course.title,
                    thumbnail_url=course.thumbnail_url or course.cover_image_url,
                    access_duration=uc.access_duration or "lifetime",
                    enrolled_at=uc.created_at,
                    expires_at=uc.expires_at,
                    is_expired=is_expired,
                    days_remaining=days_remaining,
                    time_progress_percent=time_progress_percent,
                    total_lessons=total_lessons,
                    completed_lessons=completed_lessons,
                    progress_percent=progress_percent,
                    last_lesson_title=last_lesson_title,
                    last_activity_at=last_activity_at
                )
            )

        total_courses = len(courses_data)
        overall_progress_percent = int(round(total_progress_sum / total_courses)) if total_courses > 0 else 0

        items.append(
            StudentListItem(
                id=student.id,
                name=student.name,
                email=student.email,
                is_active=student.is_active,
                created_at=student.created_at,
                courses=courses_data,
                total_courses=total_courses,
                overall_progress_percent=overall_progress_percent
            )
        )

    return items


@router.get("", response_model=StudentListResponse)
def list_students(
    search: Optional[str] = None,
    course_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """
    Lista alunos da plataforma com seus cursos vinculados e progresso de aulas.
    """
    try:
        query = db.query(User).filter(User.role == "aluno")

        if search:
            search_clean = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_clean),
                    User.email.ilike(search_clean)
                )
            )

        if course_id:
            query = query.join(UserCourse, UserCourse.user_id == User.id).filter(
                UserCourse.course_id == course_id
            )

        total = query.count()
        pages = ceil(total / limit) if total > 0 else 1
        offset = (page - 1) * limit

        students = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
        items = _build_students_details(students, db)

        logger.info(f"Listagem de alunos: {len(items)} alunos retornados (página {page}/{pages}).")
        return StudentListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages
        )

    except Exception as exc:
        logger.error(f"Erro ao listar alunos: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar lista de alunos e progresso."
        )


@router.get("/export")
def export_students(
    format: str = Query("csv", pattern="^(csv|xlsx|excel)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """
    Exporta todos os alunos da plataforma com detalhes de acesso e progresso em CSV ou XLSX.
    """
    try:
        students = db.query(User).filter(User.role == "aluno").order_by(User.name.asc()).all()
        student_items = _build_students_details(students, db)
        students_dicts = [s.model_dump() for s in student_items]

        timestamp = datetime.now().strftime("%Y%m%d_%H%M")

        if format.lower() in ["xlsx", "excel"]:
            content = export_students_xlsx(students_dicts)
            return Response(
                content=content,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={
                    "Content-Disposition": f'attachment; filename="alunos_area_de_membros_{timestamp}.xlsx"'
                }
            )
        else:
            content = export_students_csv(students_dicts)
            return Response(
                content=content.encode("utf-8-sig"),
                media_type="text/csv; charset=utf-8",
                headers={
                    "Content-Disposition": f'attachment; filename="alunos_area_de_membros_{timestamp}.csv"'
                }
            )
    except Exception as exc:
        logger.error(f"Erro ao exportar alunos: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao gerar arquivo de exportação de alunos."
        )


@router.get("/import/template")
def download_import_template(
    format: str = Query("csv", pattern="^(csv|xlsx|excel)$"),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """
    Retorna o modelo de planilha padrão para importação de alunos (CSV ou XLSX).
    """
    try:
        if format.lower() in ["xlsx", "excel"]:
            content = generate_template_xlsx()
            return Response(
                content=content,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={
                    "Content-Disposition": 'attachment; filename="modelo_importacao_alunos.xlsx"'
                }
            )
        else:
            content = generate_template_csv()
            return Response(
                content=content.encode("utf-8-sig"),
                media_type="text/csv; charset=utf-8",
                headers={
                    "Content-Disposition": 'attachment; filename="modelo_importacao_alunos.csv"'
                }
            )
    except Exception as exc:
        logger.error(f"Erro ao gerar template de importação: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao baixar modelo de importação."
        )


@router.post("/import", response_model=StudentImportResponse)
async def import_students(
    file: UploadFile = File(...),
    default_course_ids: Optional[str] = Form(None),
    default_access_duration: Optional[str] = Form("lifetime"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """
    Importa alunos a partir de um arquivo CSV ou XLS/XLSX, vinculando os cursos indicados.
    """
    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="O arquivo enviado está vazio.")

        records = parse_imported_file(file_bytes, file.filename)
        if not records:
            raise HTTPException(
                status_code=400,
                detail="Nenhum aluno válido com nome e e-mail foi encontrado na planilha."
            )

        # Parse de default_course_ids (podendo ser JSON ou separados por vírgula)
        parsed_default_courses: List[int] = []
        if default_course_ids:
            try:
                parsed_default_courses = json.loads(default_course_ids)
                if not isinstance(parsed_default_courses, list):
                    parsed_default_courses = []
            except Exception:
                for part in default_course_ids.split(","):
                    p = part.strip()
                    if p.isdigit():
                        parsed_default_courses.append(int(p))

        # Mapeamento rápido de cursos existentes por título (lower) e ID
        all_courses = db.query(Course).all()
        course_by_id = {c.id: c for c in all_courses}
        course_by_title = {c.title.strip().lower(): c for c in all_courses}

        created_count = 0
        updated_count = 0
        errors: List[str] = []

        now = datetime.now(timezone.utc)

        for index, row in enumerate(records, start=2):
            raw_email = row.get("email", "").strip().lower()
            name = row.get("name", "").strip() or "Aluno"
            password = row.get("password", "").strip() or generate_random_password()
            row_courses_str = row.get("courses", "").strip()
            row_duration_str = row.get("access_duration", "").strip()

            if not raw_email or "@" not in raw_email:
                errors.append(f"Linha {index}: E-mail inválido ou ausente.")
                continue

            # Determina os cursos a liberar para este aluno
            target_course_ids = set(parsed_default_courses)

            if row_courses_str:
                # Separa por vírgula ou ponto-e-vírgula
                tokens = [t.strip() for t in row_courses_str.replace(";", ",").split(",") if t.strip()]
                for token in tokens:
                    if token.isdigit() and int(token) in course_by_id:
                        target_course_ids.add(int(token))
                    elif token.lower() in course_by_title:
                        target_course_ids.add(course_by_title[token.lower()].id)

            duration_type = normalize_duration(row_duration_str, default=default_access_duration or "lifetime")
            expiration_date = calculate_course_expiration(duration_type, base_time=now)

            # Verifica se o usuário já existe
            existing_user = db.query(User).filter(User.email == raw_email).first()

            if existing_user:
                if existing_user.role != "aluno":
                    errors.append(f"Linha {index}: O e-mail {raw_email} pertence a um {existing_user.role} e não pode ser sobrescrito.")
                    continue

                # Atualiza ou adiciona cursos para o aluno existente
                for cid in target_course_ids:
                    uc = db.query(UserCourse).filter(
                        UserCourse.user_id == existing_user.id,
                        UserCourse.course_id == cid
                    ).first()
                    if not uc:
                        uc = UserCourse(
                            user_id=existing_user.id,
                            course_id=cid,
                            access_duration=duration_type,
                            expires_at=expiration_date
                        )
                        db.add(uc)
                    else:
                        uc.access_duration = duration_type
                        uc.expires_at = expiration_date

                updated_count += 1
            else:
                # Cria novo aluno
                new_student = User(
                    email=raw_email,
                    name=name,
                    hashed_password=get_password_hash(password),
                    role="aluno",
                    is_active=True
                )
                db.add(new_student)
                db.flush()

                for cid in target_course_ids:
                    uc = UserCourse(
                        user_id=new_student.id,
                        course_id=cid,
                        access_duration=duration_type,
                        expires_at=expiration_date
                    )
                    db.add(uc)

                created_count += 1

        db.commit()
        logger.info(f"Importação concluída por {current_user.email}: {created_count} criados, {updated_count} atualizados, {len(errors)} erros.")

        return StudentImportResponse(
            total_processed=len(records),
            created_count=created_count,
            updated_count=updated_count,
            errors_count=len(errors),
            errors=errors
        )

    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error(f"Erro ao importar alunos: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao processar planilha: {exc}"
        )


@router.get("/{student_id}/courses/{course_id}/history", response_model=List[StudentLessonActivityItem])
def get_student_course_history(
    student_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    # Busca todas as aulas do curso com seus módulos
    lessons = (
        db.query(Lesson)
        .join(Module, Lesson.module_id == Module.id)
        .filter(Module.course_id == course_id)
        .all()
    )
    lesson_map = {l.id: (l.title, l.module.title if l.module else None) for l in lessons}
    lesson_ids = list(lesson_map.keys())

    if not lesson_ids:
        return []

    # Busca progressos concluídos do aluno
    progress_records = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.user_id == student_id,
            LessonProgress.lesson_id.in_(lesson_ids),
            LessonProgress.is_completed == True
        )
        .order_by(LessonProgress.completed_at.desc(), LessonProgress.updated_at.desc())
        .all()
    )

    activities: List[StudentLessonActivityItem] = []
    for pr in progress_records:
        lesson_info = lesson_map.get(pr.lesson_id, ("Aula Desconhecida", None))
        activities.append(
            StudentLessonActivityItem(
                lesson_id=pr.lesson_id,
                lesson_title=lesson_info[0],
                module_title=lesson_info[1],
                is_completed=pr.is_completed,
                completed_at=pr.completed_at or pr.updated_at or pr.created_at,
                updated_at=pr.updated_at,
            )
        )

    return activities

