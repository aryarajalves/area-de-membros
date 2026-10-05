from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.core.database import get_db
from app.core.logger import logger
from app.api.v1.endpoints.users import get_current_user
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.testimonial import Testimonial
from app.schemas.testimonial import (
    TestimonialCreate,
    TestimonialUpdate,
    TestimonialResponse,
    TestimonialStats,
    TestimonialUser,
    TestimonialCourse,
)

router = APIRouter()


@router.get("", response_model=List[TestimonialResponse])
def list_testimonials(
    course_id: Optional[int] = Query(None, description="Filtrar depoimentos por ID do curso"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filtrar por status: pending, approved, rejected"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista depoimentos de cursos.
    Alunos visualizam depoimentos aprovados de toda a comunidade e seus próprios depoimentos (mesmo pendentes).
    Administradores visualizam todos os status com suporte a moderação.
    """
    query = db.query(Testimonial)

    if course_id:
        query = query.filter(Testimonial.course_id == course_id)

    is_manager = current_user.role in ["admin", "superadmin"]

    if not is_manager:
        # Aluno: vê todos os aprovados OU os seus próprios (para acompanhar status)
        query = query.filter(
            or_(
                Testimonial.status == "approved",
                Testimonial.user_id == current_user.id
            )
        )
    else:
        # Admin / Superadmin: pode filtrar por status se especificado
        if status_filter:
            query = query.filter(Testimonial.status == status_filter)

    # Ordenação: Destacados primeiro, depois mais recentes
    testimonials = query.order_by(
        Testimonial.is_featured.desc(),
        Testimonial.created_at.desc()
    ).all()

    response_items = []
    for item in testimonials:
        t_user = TestimonialUser(
            id=item.user.id,
            name=item.user.name,
            email=item.user.email,
            role=item.user.role,
            avatar_url=getattr(item.user, "avatar_url", None),
        )
        t_course = TestimonialCourse(
            id=item.course.id,
            title=item.course.title,
            thumbnail_url=item.course.thumbnail_url,
        )

        can_edit = (item.user_id == current_user.id)
        can_delete = (item.user_id == current_user.id) or is_manager
        can_moderate = is_manager

        response_items.append(
            TestimonialResponse(
                id=item.id,
                user_id=item.user_id,
                course_id=item.course_id,
                rating=item.rating,
                title=item.title,
                content=item.content,
                status=item.status,
                is_featured=item.is_featured,
                created_at=item.created_at,
                updated_at=item.updated_at,
                user=t_user,
                course=t_course,
                can_edit=can_edit,
                can_delete=can_delete,
                can_moderate=can_moderate,
            )
        )

    return response_items


@router.get("/stats", response_model=TestimonialStats)
def get_testimonial_stats(
    course_id: Optional[int] = Query(None, description="Estatísticas filtradas por curso"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna métricas gerais de depoimentos (total, pendentes, aprovados, nota média).
    """
    query = db.query(Testimonial)
    if course_id:
        query = query.filter(Testimonial.course_id == course_id)

    all_items = query.all()
    total = len(all_items)
    pending = sum(1 for t in all_items if t.status == "pending")
    approved = sum(1 for t in all_items if t.status == "approved")
    rejected = sum(1 for t in all_items if t.status == "rejected")

    approved_ratings = [t.rating for t in all_items if t.status == "approved"]
    avg_rating = round(sum(approved_ratings) / len(approved_ratings), 1) if approved_ratings else 5.0

    return TestimonialStats(
        total=total,
        pending=pending,
        approved=approved,
        rejected=rejected,
        average_rating=avg_rating,
    )


@router.post("", response_model=TestimonialResponse, status_code=status.HTTP_201_CREATED)
def create_testimonial(
    data: TestimonialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cria um novo depoimento para um curso.
    Alunos só podem deixar depoimento em cursos aos quais possuem acesso liberado.
    Depoimento inicia com status 'pending' para moderação pelo administrador.
    """
    # 1. Verifica existência do curso
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado.")

    # 2. Se for aluno, valida se possui acesso ao curso
    if current_user.role == "aluno":
        user_course = (
            db.query(UserCourse)
            .filter(
                UserCourse.user_id == current_user.id,
                UserCourse.course_id == data.course_id
            )
            .first()
        )
        if not user_course:
            raise HTTPException(
                status_code=403,
                detail="Você só pode enviar depoimento para cursos aos quais possui acesso liberado."
            )
        # Checa expiração caso haja
        if user_course.expires_at and user_course.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=403,
                detail="Seu período de acesso a este curso já expirou."
            )

    # 3. Verifica se já cadastrou depoimento para este curso
    existing = (
        db.query(Testimonial)
        .filter(
            Testimonial.user_id == current_user.id,
            Testimonial.course_id == data.course_id
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Você já enviou um depoimento para este curso. É permitido apenas 1 depoimento por curso por pessoa. Caso deseje alterar, edite o depoimento existente."
        )

    # 4. Cria o depoimento
    testimonial = Testimonial(
        user_id=current_user.id,
        course_id=data.course_id,
        rating=data.rating,
        title=data.title,
        content=data.content,
        status="pending",
        is_featured=False,
    )
    try:
        db.add(testimonial)
        db.commit()
        db.refresh(testimonial)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Você já enviou um depoimento para este curso. É permitido apenas 1 depoimento por curso por pessoa. Caso deseje alterar, edite o depoimento existente."
        )

    logger.info(f"Depoimento #{testimonial.id} cadastrado com sucesso pelo usuário #{current_user.id} para o curso #{course.id}")


    is_manager = current_user.role in ["admin", "superadmin"]
    return TestimonialResponse(
        id=testimonial.id,
        user_id=testimonial.user_id,
        course_id=testimonial.course_id,
        rating=testimonial.rating,
        title=testimonial.title,
        content=testimonial.content,
        status=testimonial.status,
        is_featured=testimonial.is_featured,
        created_at=testimonial.created_at,
        updated_at=testimonial.updated_at,
        user=TestimonialUser(
            id=current_user.id,
            name=current_user.name,
            email=current_user.email,
            role=current_user.role,
            avatar_url=getattr(current_user, "avatar_url", None),
        ),
        course=TestimonialCourse(
            id=course.id,
            title=course.title,
            thumbnail_url=course.thumbnail_url,
        ),
        can_edit=True,
        can_delete=True,
        can_moderate=is_manager,
    )


@router.patch("/{testimonial_id}", response_model=TestimonialResponse)
def update_testimonial(
    testimonial_id: int,
    data: TestimonialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atualiza depoimento.
    - Autor (aluno): pode editar rating, title, content (volta status para 'pending').
    - Administrador: pode moderar status ('approved', 'rejected', 'pending') e alterar destaque (is_featured).
    """
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(status_code=404, detail="Depoimento não encontrado.")

    is_owner = (testimonial.user_id == current_user.id)
    is_manager = current_user.role in ["admin", "superadmin"]

    if not is_owner and not is_manager:
        raise HTTPException(status_code=403, detail="Você não tem permissão para editar este depoimento.")

    # Edição de conteúdo pelo autor
    if is_owner:
        if data.rating is not None:
            testimonial.rating = data.rating
        if data.title is not None:
            testimonial.title = data.title
        if data.content is not None:
            testimonial.content = data.content
        # Se for aluno alterando, o depoimento volta para moderação
        if not is_manager:
            testimonial.status = "pending"

    # Moderação pelo Administrador
    if is_manager:
        if data.status is not None:
            if data.status not in ["pending", "approved", "rejected"]:
                raise HTTPException(status_code=400, detail="Status inválido. Use 'pending', 'approved' ou 'rejected'.")
            testimonial.status = data.status
        if data.is_featured is not None:
            testimonial.is_featured = data.is_featured

    testimonial.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(testimonial)

    logger.info(f"Depoimento #{testimonial.id} atualizado. Status: {testimonial.status}, Destaque: {testimonial.is_featured}")

    return TestimonialResponse(
        id=testimonial.id,
        user_id=testimonial.user_id,
        course_id=testimonial.course_id,
        rating=testimonial.rating,
        title=testimonial.title,
        content=testimonial.content,
        status=testimonial.status,
        is_featured=testimonial.is_featured,
        created_at=testimonial.created_at,
        updated_at=testimonial.updated_at,
        user=TestimonialUser(
            id=testimonial.user.id,
            name=testimonial.user.name,
            email=testimonial.user.email,
            role=testimonial.user.role,
            avatar_url=getattr(testimonial.user, "avatar_url", None),
        ),
        course=TestimonialCourse(
            id=testimonial.course.id,
            title=testimonial.course.title,
            thumbnail_url=testimonial.course.thumbnail_url,
        ),
        can_edit=is_owner,
        can_delete=is_owner or is_manager,
        can_moderate=is_manager,
    )


@router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Exclui um depoimento. Permitido para o autor ou administradores.
    """
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(status_code=404, detail="Depoimento não encontrado.")

    is_owner = (testimonial.user_id == current_user.id)
    is_manager = current_user.role in ["admin", "superadmin"]

    if not is_owner and not is_manager:
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir este depoimento.")

    db.delete(testimonial)
    db.commit()

    logger.info(f"Depoimento #{testimonial_id} excluído pelo usuário #{current_user.id}")
    return None
