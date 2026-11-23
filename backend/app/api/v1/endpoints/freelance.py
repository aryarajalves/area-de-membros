from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.course import UserCourse
from app.models.freelance import FreelanceJob
from app.schemas.freelance import (
    FreelanceJobCreate,
    FreelanceJobUpdate,
    FreelanceJobResponse,
    FreelanceJobsListResponse,
    FreelanceAuthorOut,
)
from app.api.v1.endpoints.users import get_current_user
from app.api.v1.endpoints.whitelabel import get_stored_whitelabel_data

router = APIRouter()


def _is_freelance_module_enabled() -> bool:
    return bool(get_stored_whitelabel_data().get("freelance_enabled", True))


def _user_can_publish(user: User, db: Session) -> bool:
    """Permite acesso/publicação quando o módulo está ativo no WhiteLabel e o usuário é gestor ou tem curso."""
    if not _is_freelance_module_enabled():
        return False
    if user.role in ("superadmin", "admin"):
        return True
    has_course = db.query(UserCourse.id).filter(UserCourse.user_id == user.id).first() is not None
    return has_course


def _serialize_job(job: FreelanceJob, current_user: User) -> FreelanceJobResponse:
    author = job.author
    is_manager = current_user.role in ("superadmin", "admin")
    return FreelanceJobResponse(
        id=job.id,
        user_id=job.user_id,
        title=job.title,
        description=job.description,
        category=job.category,
        budget_type=job.budget_type,
        budget_value=job.budget_value,
        deadline=job.deadline,
        contact_whatsapp=job.contact_whatsapp,
        status=job.status,
        created_at=job.created_at,
        updated_at=job.updated_at,
        author=FreelanceAuthorOut(
            id=author.id,
            name=author.name,
            email=author.email,
            avatar_url=author.avatar_url,
            role=author.role,
            phone=author.phone,
        ),
        can_manage=is_manager or (job.user_id == current_user.id),
    )


@router.get("/access")
def get_freelance_access(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna se o usuário tem acesso à aba de Freelancers (admin/superadmin ou aluno com curso)."""
    return {"has_access": _user_can_publish(current_user, db)}


@router.get("/jobs", response_model=FreelanceJobsListResponse)
def list_freelance_jobs(
    status_filter: Optional[str] = Query(default="all", alias="status"),
    category: Optional[str] = Query(default="all"),
    search: Optional[str] = Query(default=None),
    mine_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista oportunidades de freelancer publicadas na comunidade."""
    if not _user_can_publish(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas alunos com curso liberado ou administradores têm acesso à aba de Freelancers.",
        )

    query = db.query(FreelanceJob).options(joinedload(FreelanceJob.author))

    if status_filter and status_filter != "all":
        query = query.filter(FreelanceJob.status == status_filter)
    if category and category != "all":
        query = query.filter(FreelanceJob.category == category)
    if mine_only:
        query = query.filter(FreelanceJob.user_id == current_user.id)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                FreelanceJob.title.ilike(term),
                FreelanceJob.description.ilike(term),
                FreelanceJob.category.ilike(term),
            )
        )

    jobs = query.order_by(desc(FreelanceJob.created_at), desc(FreelanceJob.id)).all()
    can_publish = _user_can_publish(current_user, db)
    items = [_serialize_job(job, current_user) for job in jobs if job.author is not None]
    return FreelanceJobsListResponse(items=items, can_publish=can_publish, total=len(items))


@router.post("/jobs", response_model=FreelanceJobResponse, status_code=status.HTTP_201_CREATED)
def create_freelance_job(
    payload: FreelanceJobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Publica uma nova oportunidade de contratação de freelancer."""
    if not _user_can_publish(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas alunos com curso ativo ou administradores podem publicar vagas.",
        )

    job = FreelanceJob(
        user_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        budget_type=payload.budget_type,
        budget_value=payload.budget_value.strip() if payload.budget_value else None,
        deadline=payload.deadline.strip() if payload.deadline else None,
        contact_whatsapp=payload.contact_whatsapp.strip() if payload.contact_whatsapp else None,
        status="open",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    job = db.query(FreelanceJob).options(joinedload(FreelanceJob.author)).filter(FreelanceJob.id == job.id).first()
    logger.info(f"[FREELANCE] Vaga ID {job.id} publicada por {current_user.email} ({job.category})")
    return _serialize_job(job, current_user)


@router.patch("/jobs/{job_id}", response_model=FreelanceJobResponse)
def update_freelance_job(
    job_id: int,
    payload: FreelanceJobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualiza ou encerra/reabre uma vaga de freelancer."""
    job = db.query(FreelanceJob).options(joinedload(FreelanceJob.author)).filter(FreelanceJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada.")

    is_manager = current_user.role in ("superadmin", "admin")
    if job.user_id != current_user.id and not is_manager:
        raise HTTPException(status_code=403, detail="Você não tem permissão para editar esta vaga.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if isinstance(value, str):
            value = value.strip() or None
        setattr(job, field, value)

    job.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    logger.info(f"[FREELANCE] Vaga ID {job.id} atualizada por {current_user.email} (status={job.status})")
    return _serialize_job(job, current_user)


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_freelance_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exclui uma vaga de freelancer (autor ou admin/superadmin)."""
    job = db.query(FreelanceJob).filter(FreelanceJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada.")

    is_manager = current_user.role in ("superadmin", "admin")
    if job.user_id != current_user.id and not is_manager:
        raise HTTPException(status_code=403, detail="Você não tem permissão para excluir esta vaga.")

    db.delete(job)
    db.commit()
    logger.info(f"[FREELANCE] Vaga ID {job_id} excluída por {current_user.email}")
    return None
