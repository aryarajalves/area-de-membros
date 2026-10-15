from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course, CourseSalesClick
from app.schemas.course import CourseSalesClicksListResponse
from app.api.v1.endpoints.users import get_current_user, require_admin_or_superadmin

router = APIRouter(prefix="/courses", tags=["Course Sales Clicks"])


@router.post("/{course_id}/sales-click", status_code=status.HTTP_201_CREATED)
def record_sales_click(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registra quando um usuário (aluno ou visitante) clica no curso/produto
    para ir até a página de vendas.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        logger.warning(f"Tentativa de registrar clique em curso inexistente: course_id={course_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado."
        )

    new_click = CourseSalesClick(
        course_id=course_id,
        user_id=current_user.id
    )
    db.add(new_click)
    db.commit()
    db.refresh(new_click)

    logger.info(
        f"Clique de interesse registrado na página de vendas: "
        f"user_id={current_user.id} ({current_user.email}), "
        f"course_id={course_id} ('{course.title}')"
    )

    # Dispara funis com gatilho de interesse em curso (acontece 1 única vez por aluno)
    try:
        from app.services.funnel_service import dispatch_course_interest_funnels
        dispatch_course_interest_funnels(db=db, student_id=current_user.id, course_id=course_id)
    except Exception as funnel_err:
        logger.warning(f"Falha ao acionar funis de interesse para o aluno {current_user.id}: {funnel_err}")

    return {
        "status": "success",
        "message": "Clique na página de vendas registrado com sucesso.",
        "id": new_click.id,
        "course_id": course_id,
        "user_id": current_user.id
    }


@router.get("/{course_id}/sales-clicks", response_model=CourseSalesClicksListResponse)
def get_course_sales_clicks(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Retorna o histórico de todos os alunos que clicaram para ir até a página de vendas do curso.
    Requer privilégios de gestor (admin ou superadmin).
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso não encontrado."
        )

    clicks = (
        db.query(CourseSalesClick)
        .options(joinedload(CourseSalesClick.user))
        .filter(CourseSalesClick.course_id == course_id)
        .order_by(CourseSalesClick.created_at.desc())
        .all()
    )

    logger.info(
        f"Histórico de cliques consultado: course_id={course_id} ('{course.title}') "
        f"por {current_user.email} (total={len(clicks)})"
    )

    return CourseSalesClicksListResponse(
        course_id=course.id,
        course_title=course.title,
        total_clicks=len(clicks),
        clicks=clicks
    )
