import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course, UserCourse, Module, Lesson, LessonVideo, LessonComment, LessonCommentLike, LessonAttachment
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseResponse, CourseDetailResponse,
    ModuleCreate, ModuleUpdate, ModuleResponse, ModuleDetailResponse,
    LessonCreate, LessonUpdate, LessonResponse,
    LessonVideoCreate, LessonVideoResponse,
    LessonAttachmentCreate, LessonAttachmentResponse,
    CommentCreate, CommentResponse, CommentLikeToggleResponse,
    PlatformThemeUpdate, PlatformThemeResponse
)
from app.api.v1.endpoints.users import get_current_user, require_admin_or_superadmin
from app.services.storage import upload_media_file, delete_media_file

router = APIRouter(prefix="/courses", tags=["Courses"])


def _is_user_course_active(uc: UserCourse) -> bool:
    """Verifica se o acesso do aluno ao curso está ativo (vitalício ou dentro do prazo de validade)."""
    if not uc.expires_at:
        return True
    now = datetime.now(timezone.utc)
    exp = uc.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    return exp > now


def _verify_student_course_access(db: Session, user_id: int, course_id: int):
    """Valida se o aluno possui acesso liberado e vigente ao curso."""
    uc = db.query(UserCourse).filter(
        UserCourse.user_id == user_id,
        UserCourse.course_id == course_id
    ).first()
    if not uc:
        raise HTTPException(status_code=403, detail="Você não possui acesso liberado a este curso.")
    if not _is_user_course_active(uc):
        raise HTTPException(status_code=403, detail="O seu período de acesso a este curso expirou.")

BASE_UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "uploads"
)
THUMBNAILS_DIR = os.path.join(BASE_UPLOAD_DIR, "thumbnails")
VIDEOS_DIR = os.path.join(BASE_UPLOAD_DIR, "videos")
ATTACHMENTS_DIR = os.path.join(BASE_UPLOAD_DIR, "attachments")
PLATFORM_THEME_FILE = os.path.join(BASE_UPLOAD_DIR, "platform_theme.json")

os.makedirs(THUMBNAILS_DIR, exist_ok=True)
os.makedirs(VIDEOS_DIR, exist_ok=True)
os.makedirs(ATTACHMENTS_DIR, exist_ok=True)


def _get_saved_platform_bg_color(db: Session) -> str:
    """Obtém a cor de fundo global da Área de Membros."""
    if os.path.exists(PLATFORM_THEME_FILE):
        try:
            with open(PLATFORM_THEME_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("bg_color"):
                    return data["bg_color"]
        except Exception:
            pass
    first_course = db.query(Course).order_by(Course.id.desc()).first()
    if first_course and first_course.bg_color:
        return first_course.bg_color
    return "#090d16"


@router.get(
    "/platform-theme",
    response_model=PlatformThemeResponse,
    tags=["Cursos e Módulos"],
    summary="Obter Tema Global da Plataforma",
    description="Retorna a cor de fundo padrão da Área de Membros configurada pelo administrador."
)
def get_platform_theme(db: Session = Depends(get_db)):
    """Retorna a cor de fundo global configurada para a Área de Membros (público para páginas de registro e login)."""
    return {"bg_color": _get_saved_platform_bg_color(db)}


@router.patch(
    "/platform-theme",
    response_model=PlatformThemeResponse,
    tags=["Cursos e Módulos"],
    summary="Atualizar Tema Global da Plataforma",
    description="Atualiza a cor de fundo global e sincroniza automaticamente com todos os cursos cadastrados."
)
def update_platform_theme(
    theme_in: PlatformThemeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza a cor de fundo global da Área de Membros e sincroniza com todos os cursos."""
    new_color = (theme_in.bg_color or "#090d16").strip()
    try:
        with open(PLATFORM_THEME_FILE, "w", encoding="utf-8") as f:
            json.dump({"bg_color": new_color}, f)
    except Exception:
        pass
    db.query(Course).update({Course.bg_color: new_color}, synchronize_session=False)
    db.commit()
    return {"bg_color": new_color}


# ============================================================================
# CURSOS (COURSES)
# ============================================================================

@router.get(
    "",
    response_model=List[CourseResponse],
    tags=["Cursos e Módulos"],
    summary="Listar Cursos",
    description="Retorna os cursos disponíveis. Alunos recebem apenas os cursos que possuem matrícula ativa."
)
def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista os cursos de acordo com o papel do usuário:
    - Superadmin e Admin visualizam todos os cursos cadastrados.
    - Alunos visualizam apenas os cursos que foram expressamente liberados para a sua conta e estão vigentes.
    - Demais usuários não visualizam nenhum curso.
    """
    if current_user.role in ["superadmin", "admin"]:
        courses = db.query(Course).order_by(Course.order_index.asc(), Course.id.desc()).offset(skip).limit(limit).all()
        for c in courses:
            setattr(c, "has_access", True)
        return courses

    if current_user.role == "aluno":
        user_courses = db.query(UserCourse).filter(UserCourse.user_id == current_user.id).all()
        user_course_ids = {uc.course_id for uc in user_courses if _is_user_course_active(uc)}
        # Alunos visualizam todos os cursos da plataforma ordenados pela ordem definida
        all_courses = db.query(Course).filter(Course.is_published == True).order_by(Course.order_index.asc(), Course.id.desc()).offset(skip).limit(limit).all()
        for c in all_courses:
            setattr(c, "has_access", c.id in user_course_ids)
        return all_courses

    return []

@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Cursos e Módulos"],
    summary="Criar Novo Curso",
    description="Cadastra um novo curso na Área de Membros com título, descrição, capa, tema visual, link de vendas e ordem de exibição."
)
def create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Cria um novo curso na plataforma (apenas admin ou superadmin)."""
    global_bg = _get_saved_platform_bg_color(db)
    new_course = Course(
        title=course_in.title.strip(),
        description=course_in.description,
        thumbnail_url=course_in.thumbnail_url,
        cover_image_url=course_in.cover_image_url,
        bg_color=course_in.bg_color or global_bg,
        is_published=course_in.is_published,
        sales_page_url=course_in.sales_page_url.strip() if course_in.sales_page_url else None,
        order_index=course_in.order_index if course_in.order_index is not None else 0
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    setattr(new_course, "has_access", True)
    return new_course


# ============================================================================
# MÓDULOS (MODULES)
# ============================================================================


@router.get(
    "/{course_id}",
    response_model=CourseDetailResponse,
    tags=["Cursos e Módulos"],
    summary="Obter Detalhes do Curso",
    description="Retorna dados completos de um curso com seus módulos e aulas para a sala de aula."
)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna detalhes completos de um curso com seus módulos e aulas."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    if current_user.role == "aluno":
        _verify_student_course_access(db, current_user.id, course_id)

    return course

@router.patch(
    "/{course_id}",
    response_model=CourseResponse,
    tags=["Cursos e Módulos"],
    summary="Atualizar Curso",
    description="Atualiza título, descrição, capa, cor de fundo ou publicação de um curso existente."
)
def update_course(
    course_id: int,
    course_update: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Atualiza as informações de um curso existente."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    if course_update.title is not None:
        course.title = course_update.title.strip()
    if course_update.description is not None:
        course.description = course_update.description
    if course_update.thumbnail_url is not None:
        if course.thumbnail_url and course.thumbnail_url != course_update.thumbnail_url:
            delete_media_file(course.thumbnail_url)
        course.thumbnail_url = course_update.thumbnail_url or None
    if course_update.cover_image_url is not None:
        if course.cover_image_url and course.cover_image_url != course_update.cover_image_url:
            delete_media_file(course.cover_image_url)
        course.cover_image_url = course_update.cover_image_url or None
    if course_update.bg_color is not None:
        course.bg_color = course_update.bg_color or "#090d16"
    if course_update.is_published is not None:
        course.is_published = course_update.is_published
    if course_update.sales_page_url is not None:
        course.sales_page_url = course_update.sales_page_url.strip() if course_update.sales_page_url else None
    if course_update.order_index is not None:
        course.order_index = course_update.order_index

    db.commit()
    db.refresh(course)
    setattr(course, "has_access", True)
    return course

@router.delete(
    "/{course_id}",
    tags=["Cursos e Módulos"],
    summary="Excluir Curso",
    description="Exclui um curso e remove permanentemente todos os módulos, aulas, vídeos e anexos vinculados."
)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Exclui um curso da plataforma e todos os módulos e aulas vinculados."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    if course.thumbnail_url:
        delete_media_file(course.thumbnail_url)
    if course.cover_image_url:
        delete_media_file(course.cover_image_url)
    for mod in course.modules:
        if mod.image_url:
            delete_media_file(mod.image_url)
        for les in mod.lessons:
            for vid in les.videos:
                if vid.video_url:
                    delete_media_file(vid.video_url)
            for att in les.attachments:
                if att.file_url:
                    delete_media_file(att.file_url)
            if les.video_url:
                delete_media_file(les.video_url)
            if les.thumbnail_url:
                delete_media_file(les.thumbnail_url)

    db.delete(course)
    db.commit()
    return {"message": "Curso excluído com sucesso."}


# ============================================================================
# MÓDULOS (MODULES)
# ============================================================================

@router.get(
    "/{course_id}/modules",
    response_model=List[ModuleDetailResponse],
    tags=["Cursos e Módulos"],
    summary="Listar Módulos do Curso"
)
def list_course_modules(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os módulos de um curso com suas respectivas aulas ordenadas."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    if current_user.role == "aluno":
        _verify_student_course_access(db, current_user.id, course_id)

    modules = db.query(Module).filter(Module.course_id == course_id).order_by(Module.order_index.asc(), Module.id.asc()).all()
    return modules

@router.post(
    "/{course_id}/modules",
    response_model=ModuleResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Cursos e Módulos"],
    summary="Criar Módulo no Curso"
)
def create_module(
    course_id: int,
    module_in: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Cria um novo módulo dentro de um curso."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    new_module = Module(
        course_id=course_id,
        title=module_in.title.strip(),
        description=module_in.description,
        image_url=module_in.image_url,
        order_index=module_in.order_index or 0
    )
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    return new_module

@router.patch(
    "/{course_id}/modules/{module_id}",
    response_model=ModuleResponse,
    tags=["Cursos e Módulos"],
    summary="Atualizar Módulo"
)
def update_module(
    course_id: int,
    module_id: int,
    module_in: ModuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Atualiza título, descrição, capa ou ordem de um módulo."""
    module = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado neste curso.")

    if module_in.title is not None:
        module.title = module_in.title.strip()
    if module_in.description is not None:
        module.description = module_in.description
    if module_in.image_url is not None:
        if module.image_url and module.image_url != module_in.image_url:
            delete_media_file(module.image_url)
        module.image_url = module_in.image_url or None
    if module_in.order_index is not None:
        module.order_index = module_in.order_index

    db.commit()
    db.refresh(module)
    return module

@router.delete(
    "/{course_id}/modules/{module_id}",
    tags=["Cursos e Módulos"],
    summary="Excluir Módulo"
)
def delete_module(
    course_id: int,
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Exclui um módulo e todas as suas aulas."""
    module = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado neste curso.")

    if module.image_url:
        delete_media_file(module.image_url)

    db.delete(module)
    db.commit()
    return {"message": "Módulo excluído com sucesso."}


# ============================================================================
# AULAS (LESSONS)
# ============================================================================

@router.post(
    "/{course_id}/modules/{module_id}/lessons",
    response_model=LessonResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Cursos e Módulos"],
    summary="Criar Aula no Módulo"
)
def create_lesson(
    course_id: int,
    module_id: int,
    lesson_in: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Cria uma nova aula dentro de um módulo com suporte a múltiplos idiomas."""
    module = db.query(Module).filter(Module.id == module_id, Module.course_id == course_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Módulo não encontrado neste curso.")

    # Se vierem vídeos multilíngues, define o vídeo principal como o primeiro da lista
    main_video_url = lesson_in.video_url
    main_video_type = lesson_in.video_type or "url"
    if lesson_in.videos and len(lesson_in.videos) > 0:
        main_video_url = lesson_in.videos[0].video_url
        main_video_type = lesson_in.videos[0].video_type or "upload"

    new_lesson = Lesson(
        module_id=module_id,
        title=lesson_in.title.strip(),
        description=lesson_in.description,
        video_type=main_video_type,
        video_url=main_video_url,
        thumbnail_url=lesson_in.thumbnail_url,
        duration=lesson_in.duration,
        order_index=lesson_in.order_index or 0,
        availability_status=lesson_in.availability_status or "available",
        content_type=lesson_in.content_type or "video",
        text_content=lesson_in.text_content,
        passing_score_pct=lesson_in.passing_score_pct if lesson_in.passing_score_pct is not None else 70
    )
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)

    # Persiste os vídeos em múltiplos idiomas
    if lesson_in.videos:
        for v in lesson_in.videos:
            db.add(LessonVideo(
                lesson_id=new_lesson.id,
                language=v.language or "pt",
                language_label=v.language_label or "Português",
                title=v.title.strip() if v.title else new_lesson.title,
                description=v.description if v.description is not None else new_lesson.description,
                video_url=v.video_url,
                video_type=v.video_type or "upload"
            ))
        db.commit()
        db.refresh(new_lesson)
    elif new_lesson.video_url:
        db.add(LessonVideo(
            lesson_id=new_lesson.id,
            language="pt",
            language_label="Português",
            title=new_lesson.title,
            description=new_lesson.description,
            video_url=new_lesson.video_url,
            video_type=new_lesson.video_type or "upload"
        ))
        db.commit()
        db.refresh(new_lesson)

    if lesson_in.attachments:
        for att in lesson_in.attachments:
            db.add(LessonAttachment(
                lesson_id=new_lesson.id,
                title=att.title.strip() if att.title else "Documento",
                description=att.description.strip() if att.description else None,
                file_url=att.file_url,
                file_type=att.file_type,
                file_size_bytes=att.file_size_bytes
            ))
        db.commit()
        db.refresh(new_lesson)

    return new_lesson

@router.patch(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}",
    response_model=LessonResponse,
    tags=["Cursos e Módulos"],
    summary="Atualizar Aula"
)
def update_lesson(
    course_id: int,
    module_id: int,
    lesson_id: int,
    lesson_in: LessonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Atualiza as informações de uma aula e sua lista de vídeos e anexos."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.module_id == module_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada neste módulo.")

    if lesson_in.title is not None:
        lesson.title = lesson_in.title.strip()
    if lesson_in.description is not None:
        lesson.description = lesson_in.description
    if lesson_in.duration is not None:
        lesson.duration = lesson_in.duration
    if lesson_in.order_index is not None:
        lesson.order_index = lesson_in.order_index
    if lesson_in.availability_status is not None:
        lesson.availability_status = lesson_in.availability_status
    if lesson_in.content_type is not None:
        lesson.content_type = lesson_in.content_type
    if lesson_in.text_content is not None:
        lesson.text_content = lesson_in.text_content
    if lesson_in.passing_score_pct is not None:
        lesson.passing_score_pct = lesson_in.passing_score_pct
    if lesson_in.thumbnail_url is not None:
        if lesson.thumbnail_url and lesson.thumbnail_url != lesson_in.thumbnail_url:
            delete_media_file(lesson.thumbnail_url)
        lesson.thumbnail_url = lesson_in.thumbnail_url.strip() if lesson_in.thumbnail_url else None

    if lesson_in.videos is not None:
        # Atualizar a lista de vídeos da aula
        db.query(LessonVideo).filter(LessonVideo.lesson_id == lesson_id).delete()
        for v in lesson_in.videos:
            db.add(LessonVideo(
                lesson_id=lesson_id,
                language=v.language or "pt",
                language_label=v.language_label or "Português",
                title=v.title.strip() if v.title else lesson.title,
                description=v.description if v.description is not None else lesson.description,
                video_url=v.video_url,
                video_type=v.video_type or "upload"
            ))
        if lesson_in.videos:
            lesson.video_url = lesson_in.videos[0].video_url
            lesson.video_type = lesson_in.videos[0].video_type or "upload"
            if lesson_in.videos[0].title:
                lesson.title = lesson_in.videos[0].title.strip()
            if lesson_in.videos[0].description is not None:
                lesson.description = lesson_in.videos[0].description
        else:
            lesson.video_url = None
    else:
        if lesson_in.video_type is not None:
            lesson.video_type = lesson_in.video_type
        if lesson_in.video_url is not None:
            lesson.video_url = lesson_in.video_url

    if lesson_in.attachments is not None:
        existing_attachments = db.query(LessonAttachment).filter(LessonAttachment.lesson_id == lesson_id).all()
        new_urls = {att.file_url for att in lesson_in.attachments}
        for old_att in existing_attachments:
            if old_att.file_url not in new_urls and old_att.file_url:
                delete_media_file(old_att.file_url)

        db.query(LessonAttachment).filter(LessonAttachment.lesson_id == lesson_id).delete()
        for att in lesson_in.attachments:
            db.add(LessonAttachment(
                lesson_id=lesson_id,
                title=att.title.strip() if att.title else "Documento",
                description=att.description.strip() if att.description else None,
                file_url=att.file_url,
                file_type=att.file_type,
                file_size_bytes=att.file_size_bytes
            ))

    db.commit()
    db.refresh(lesson)
    return lesson

@router.delete(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}",
    tags=["Cursos e Módulos"],
    summary="Excluir Aula"
)
def delete_lesson(
    course_id: int,
    module_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Exclui uma aula específica e todos os seus vídeos e anexos em nuvem."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.module_id == module_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada neste módulo.")

    for vid in lesson.videos:
        if vid.video_url:
            delete_media_file(vid.video_url)
    if lesson.video_url:
        delete_media_file(lesson.video_url)

    for att in lesson.attachments:
        if att.file_url:
            delete_media_file(att.file_url)

    if lesson.thumbnail_url:
        delete_media_file(lesson.thumbnail_url)

    db.delete(lesson)
    db.commit()
    return {"message": "Aula excluída com sucesso."}

@router.post(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/attachments",
    response_model=LessonAttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Cursos e Módulos"],
    summary="Adicionar Anexo na Aula"
)
def add_lesson_attachment(
    course_id: int,
    module_id: int,
    lesson_id: int,
    att_in: LessonAttachmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Adiciona um anexo a uma aula já existente."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.module_id == module_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada neste módulo.")

    new_att = LessonAttachment(
        lesson_id=lesson_id,
        title=att_in.title.strip() if att_in.title else "Documento",
        file_url=att_in.file_url,
        file_type=att_in.file_type,
        file_size_bytes=att_in.file_size_bytes
    )
    db.add(new_att)
    db.commit()
    db.refresh(new_att)
    return new_att

@router.delete(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/attachments/{attachment_id}",
    tags=["Cursos e Módulos"],
    summary="Excluir Anexo da Aula"
)
def delete_lesson_attachment(
    course_id: int,
    module_id: int,
    lesson_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Exclui um documento anexo da aula e limpa do Backblaze B2."""
    att = db.query(LessonAttachment).filter(
        LessonAttachment.id == attachment_id,
        LessonAttachment.lesson_id == lesson_id
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="Anexo não encontrado.")

    if att.file_url:
        delete_media_file(att.file_url)

    db.delete(att)
    db.commit()
    return {"message": "Anexo excluído com sucesso."}


# ============================================================================
# COMENTÁRIOS DE AULAS (LESSON COMMENTS)
# ============================================================================

@router.get(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/comments",
    response_model=List[CommentResponse],
    tags=["Comentários da Aula"],
    summary="Listar Comentários da Aula"
)
def list_lesson_comments(
    course_id: int,
    module_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os comentários raiz de uma aula específica com suas respectivas respostas."""
    if current_user.role == "aluno":
        _verify_student_course_access(db, current_user.id, course_id)

    comments = db.query(LessonComment).filter(
        LessonComment.lesson_id == lesson_id,
        LessonComment.parent_id.is_(None)
    ).order_by(LessonComment.created_at.asc()).all()

    # Mapeamento de curtidas para comentários e respostas
    all_comment_ids = []
    for c in comments:
        all_comment_ids.append(c.id)
        for r in (c.replies or []):
            all_comment_ids.append(r.id)

    user_liked_set = set()
    likes_count_map = {}
    if all_comment_ids:
        user_likes = db.query(LessonCommentLike.comment_id).filter(
            LessonCommentLike.comment_id.in_(all_comment_ids),
            LessonCommentLike.user_id == current_user.id
        ).all()
        user_liked_set = {row[0] for row in user_likes}

        counts = db.query(
            LessonCommentLike.comment_id,
            func.count(LessonCommentLike.id)
        ).filter(
            LessonCommentLike.comment_id.in_(all_comment_ids)
        ).group_by(LessonCommentLike.comment_id).all()
        likes_count_map = {row[0]: row[1] for row in counts}

    for c in comments:
        c.likes_count = likes_count_map.get(c.id, 0)
        c.liked_by_me = c.id in user_liked_set
        for r in (c.replies or []):
            r.likes_count = likes_count_map.get(r.id, 0)
            r.liked_by_me = r.id in user_liked_set

    return comments

@router.post(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/comments/{comment_id}/like",
    response_model=CommentLikeToggleResponse,
    tags=["Comentários da Aula"],
    summary="Curtir / Descurtir Comentário da Aula"
)
def toggle_lesson_comment_like(
    course_id: int,
    module_id: int,
    lesson_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Alterna a curtida em um comentário ou resposta de aula pelo usuário autenticado."""
    if current_user.role == "aluno":
        _verify_student_course_access(db, current_user.id, course_id)

    comment = db.query(LessonComment).filter(
        LessonComment.id == comment_id,
        LessonComment.lesson_id == lesson_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comentário não encontrado.")

    existing_like = db.query(LessonCommentLike).filter(
        LessonCommentLike.comment_id == comment_id,
        LessonCommentLike.user_id == current_user.id
    ).first()

    if existing_like:
        db.delete(existing_like)
        db.commit()
        liked_by_me = False
    else:
        new_like = LessonCommentLike(
            comment_id=comment_id,
            user_id=current_user.id
        )
        db.add(new_like)
        db.commit()
        liked_by_me = True

        try:
            from app.services.gamification_service import award_points
            comment_author = db.query(User).filter(User.id == comment.user_id).first()
            if comment_author and comment_author.id != current_user.id and comment_author.role == "aluno":
                award_points(db, comment_author, "comment_like_received", reference_id=comment.id)
        except Exception as g_exc:
            logger.error(f"Erro ao atribuir pontos de gamificação por curtida em comentário: {g_exc}")

    count = db.query(func.count(LessonCommentLike.id)).filter(LessonCommentLike.comment_id == comment_id).scalar() or 0
    return CommentLikeToggleResponse(
        comment_id=comment_id,
        likes_count=count,
        liked_by_me=liked_by_me,
        liked=liked_by_me
    )


@router.post(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Comentários da Aula"],
    summary="Criar Comentário ou Resposta"
)
def create_lesson_comment(
    course_id: int,
    module_id: int,
    lesson_id: int,
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria um novo comentário ou resposta em uma aula."""
    if not comment_in.content or not comment_in.content.strip():
        raise HTTPException(status_code=400, detail="O comentário não pode ser vazio.")

    if current_user.role == "aluno":
        _verify_student_course_access(db, current_user.id, course_id)

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.module_id == module_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Aula não encontrada.")

    parent_id = None
    if comment_in.parent_id:
        parent = db.query(LessonComment).filter(
            LessonComment.id == comment_in.parent_id,
            LessonComment.lesson_id == lesson_id
        ).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Comentário original não encontrado.")
        # Mantém estrutura de 1 nível de respostas: se o alvo já for resposta, ancora na raiz
        parent_id = parent.parent_id if parent.parent_id is not None else parent.id

    new_comment = LessonComment(
        lesson_id=lesson_id,
        user_id=current_user.id,
        parent_id=parent_id,
        content=comment_in.content.strip()
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.delete(
    "/{course_id}/modules/{module_id}/lessons/{lesson_id}/comments/{comment_id}",
    tags=["Comentários da Aula"],
    summary="Excluir Comentário da Aula"
)
def delete_lesson_comment(
    course_id: int,
    module_id: int,
    lesson_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exclui um comentário de aula. Alunos podem excluir seus próprios comentários, e admins podem moderar qualquer comentário."""
    comment = db.query(LessonComment).filter(
        LessonComment.id == comment_id,
        LessonComment.lesson_id == lesson_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comentário não encontrado.")

    is_author = comment.user_id == current_user.id
    is_admin = current_user.role in ["superadmin", "admin"]

    if not is_author and not is_admin:
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir este comentário.")

    db.delete(comment)
    db.commit()
    return {"message": "Comentário excluído com sucesso."}

