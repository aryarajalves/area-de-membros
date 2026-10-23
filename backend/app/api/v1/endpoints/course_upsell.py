from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.v1.endpoints.users import get_current_user
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course, UserCourse, CourseSalesClick
from app.models.course_upsell import CourseUpsellOffer, CourseUpsellView
from app.schemas.course_upsell import (
    CourseUpsellOfferCreate,
    CourseUpsellOfferUpdate,
    CourseUpsellOfferResponse,
    CourseUpsellEligibleResponse,
)

router = APIRouter(prefix="/courses", tags=["course-upsell"])

def _format_offer_response(offer: CourseUpsellOffer) -> CourseUpsellOfferResponse:
    target_title = offer.target_course.title if offer.target_course else "Curso Promovido"
    target_thumb = offer.target_course.thumbnail_url if offer.target_course else None
    return CourseUpsellOfferResponse(
        id=offer.id,
        course_id=offer.course_id,
        target_course_id=offer.target_course_id,
        progress_pct=offer.progress_pct,
        media_type=offer.media_type,
        media_url=offer.media_url,
        title=offer.title,
        description=offer.description,
        button_text=offer.button_text,
        button_url=offer.button_url,
        is_active=offer.is_active,
        show_in_sidebar=getattr(offer, "show_in_sidebar", False),
        created_at=offer.created_at,
        updated_at=offer.updated_at,
        target_course_title=target_title,
        target_course_thumbnail=target_thumb,
    )

def _user_has_active_target_access(db: Session, user_id: int, target_course_id: int) -> bool:
    """Verifica se o usuário já possui acesso ativo ao curso promovido (evita ofertar o que ele já comprou)."""
    now = datetime.now(timezone.utc)
    user_course = db.query(UserCourse).filter(
        UserCourse.user_id == user_id,
        UserCourse.course_id == target_course_id
    ).first()

    if not user_course:
        return False

    # Se expires_at for nulo, é vitalício. Se tiver data, verifica se ainda não expirou.
    if user_course.expires_at is None:
        return True
    
    expires_at = user_course.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    return expires_at > now

@router.get("/{course_id}/upsell-offers", response_model=List[CourseUpsellOfferResponse])
def get_course_upsell_offers(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista todas as ofertas de Upsell cadastradas para o curso (Acesso Admin/Superadmin)."""
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão negada.")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado.")

    offers = db.query(CourseUpsellOffer).filter(
        CourseUpsellOffer.course_id == course_id
    ).order_by(CourseUpsellOffer.progress_pct.asc(), CourseUpsellOffer.id.asc()).all()

    return [_format_offer_response(o) for o in offers]

@router.post("/{course_id}/upsell-offers", response_model=CourseUpsellOfferResponse, status_code=status.HTTP_201_CREATED)
def create_course_upsell_offer(
    course_id: int,
    payload: CourseUpsellOfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cria uma nova oferta de Upsell vinculada ao curso."""
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão negada.")

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso de origem não encontrado.")

    if payload.target_course_id == course_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Um curso não pode promover a si mesmo em anúncio de upsell.")

    target_course = db.query(Course).filter(Course.id == payload.target_course_id).first()
    if not target_course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso promovido (alvo) não encontrado.")

    new_offer = CourseUpsellOffer(
        course_id=course_id,
        target_course_id=payload.target_course_id,
        progress_pct=payload.progress_pct,
        media_type=payload.media_type,
        media_url=payload.media_url.strip(),
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        button_text=payload.button_text.strip() if payload.button_text else "Quero Conhecer",
        button_url=payload.button_url.strip() if payload.button_url else None,
        is_active=payload.is_active,
        show_in_sidebar=payload.show_in_sidebar,
    )
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)

    logger.info(f"[UPSELL] Oferta de upsell #{new_offer.id} criada no curso #{course_id} para o marco de {new_offer.progress_pct}%")
    return _format_offer_response(new_offer)

@router.put("/upsell-offers/{offer_id}", response_model=CourseUpsellOfferResponse)
def update_course_upsell_offer(
    offer_id: int,
    payload: CourseUpsellOfferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualiza uma oferta de Upsell existente."""
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão negada.")

    offer = db.query(CourseUpsellOffer).filter(CourseUpsellOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oferta de upsell não encontrada.")

    if payload.target_course_id is not None:
        if payload.target_course_id == offer.course_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O curso promovido não pode ser o mesmo curso de origem.")
        target_course = db.query(Course).filter(Course.id == payload.target_course_id).first()
        if not target_course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso promovido não encontrado.")
        offer.target_course_id = payload.target_course_id

    if payload.progress_pct is not None:
        offer.progress_pct = payload.progress_pct
    if payload.media_type is not None:
        offer.media_type = payload.media_type
    if payload.media_url is not None:
        offer.media_url = payload.media_url.strip()
    if payload.title is not None:
        offer.title = payload.title.strip()
    if payload.description is not None:
        offer.description = payload.description.strip() if payload.description else None
    if payload.button_text is not None:
        offer.button_text = payload.button_text.strip() if payload.button_text else "Quero Conhecer"
    if payload.button_url is not None:
        offer.button_url = payload.button_url.strip() if payload.button_url else None
    if payload.is_active is not None:
        offer.is_active = payload.is_active
    if payload.show_in_sidebar is not None:
        offer.show_in_sidebar = payload.show_in_sidebar

    db.commit()
    db.refresh(offer)
    logger.info(f"[UPSELL] Oferta de upsell #{offer.id} atualizada com sucesso.")
    return _format_offer_response(offer)

@router.delete("/upsell-offers/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_upsell_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exclui uma oferta de Upsell."""
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão negada.")

    offer = db.query(CourseUpsellOffer).filter(CourseUpsellOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oferta de upsell não encontrada.")

    db.delete(offer)
    db.commit()
    logger.info(f"[UPSELL] Oferta de upsell #{offer_id} excluída com sucesso.")
    return None

@router.get("/{course_id}/upsell-check", response_model=CourseUpsellEligibleResponse)
def check_eligible_upsell_offer(
    course_id: int,
    progress: int = Query(..., ge=0, le=100, description="Progresso atual do aluno em porcentagem"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verifica se há alguma oferta de Upsell ativa elegível para exibição ao aluno autenticado:
    1. A oferta está ativa e o progress_pct da oferta <= progresso atual do aluno.
    2. O aluno AINDA NÃO visualizou/dispensou essa oferta (CourseUpsellView).
    3. O aluno AINDA NÃO comprou/tem acesso ativo ao curso/ferramenta alvo.
    """
    offers = db.query(CourseUpsellOffer).filter(
        CourseUpsellOffer.course_id == course_id,
        CourseUpsellOffer.is_active == True,
        CourseUpsellOffer.progress_pct <= progress
    ).order_by(CourseUpsellOffer.progress_pct.asc(), CourseUpsellOffer.id.asc()).all()

    for offer in offers:
        # 1. Checa se o usuário já viu essa oferta específica
        already_viewed = db.query(CourseUpsellView).filter(
            CourseUpsellView.offer_id == offer.id,
            CourseUpsellView.user_id == current_user.id
        ).first()

        if already_viewed:
            continue

        # 2. Checa se o aluno já comprou o curso promovido
        if current_user.role == "aluno" and _user_has_active_target_access(db, current_user.id, offer.target_course_id):
            continue

        # Encontrou oferta elegível!
        target_course = offer.target_course
        action_url = offer.button_url or (target_course.sales_page_url if target_course else "") or ""

        return CourseUpsellEligibleResponse(
            has_offer=True,
            offer=_format_offer_response(offer),
            target_action_url=action_url
        )

    return CourseUpsellEligibleResponse(has_offer=False, offer=None, target_action_url=None)

@router.get("/{course_id}/upsell-sidebar", response_model=CourseUpsellEligibleResponse)
def get_sidebar_upsell_offer(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna a oferta de Upsell configurada para exibição no Card da Barra Lateral,
    desde que esteja ativa e com show_in_sidebar=True, e o aluno ainda NÃO possua o produto promovido.
    """
    offer = db.query(CourseUpsellOffer).filter(
        CourseUpsellOffer.course_id == course_id,
        CourseUpsellOffer.is_active == True,
        CourseUpsellOffer.show_in_sidebar == True
    ).order_by(CourseUpsellOffer.progress_pct.asc(), CourseUpsellOffer.id.asc()).first()

    if not offer:
        return CourseUpsellEligibleResponse(has_offer=False, offer=None, target_action_url=None)

    # Se o usuário for aluno e já comprou o curso promovido, não exibe
    if current_user.role == "aluno" and _user_has_active_target_access(db, current_user.id, offer.target_course_id):
        return CourseUpsellEligibleResponse(has_offer=False, offer=None, target_action_url=None)

    target_course = offer.target_course
    action_url = offer.button_url or (target_course.sales_page_url if target_course else "") or ""

    return CourseUpsellEligibleResponse(
        has_offer=True,
        offer=_format_offer_response(offer),
        target_action_url=action_url
    )

@router.post("/upsell-offers/{offer_id}/dismiss", status_code=status.HTTP_200_OK)
def dismiss_upsell_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marca a oferta como visualizada/dispensada para que nunca mais reapareça para o aluno."""
    offer = db.query(CourseUpsellOffer).filter(CourseUpsellOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oferta não encontrada.")

    existing_view = db.query(CourseUpsellView).filter(
        CourseUpsellView.offer_id == offer_id,
        CourseUpsellView.user_id == current_user.id
    ).first()

    if not existing_view:
        view = CourseUpsellView(
            offer_id=offer_id,
            user_id=current_user.id,
            viewed_at=datetime.now(timezone.utc),
            dismissed=True
        )
        db.add(view)
        db.commit()

    return {"message": "Oferta dispensada com sucesso."}

@router.post("/upsell-offers/{offer_id}/click", status_code=status.HTTP_200_OK)
def click_upsell_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra o clique no botão de ação da oferta e integra com os cliques de interesse de vendas."""
    offer = db.query(CourseUpsellOffer).filter(CourseUpsellOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oferta não encontrada.")

    now = datetime.now(timezone.utc)
    existing_view = db.query(CourseUpsellView).filter(
        CourseUpsellView.offer_id == offer_id,
        CourseUpsellView.user_id == current_user.id
    ).first()

    if not existing_view:
        existing_view = CourseUpsellView(
            offer_id=offer_id,
            user_id=current_user.id,
            viewed_at=now,
            dismissed=True,
            clicked_at=now
        )
        db.add(existing_view)
    else:
        existing_view.clicked_at = now

    # Registra também o clique de interesse no curso promovido (alimenta o histórico de vendas)
    sales_click = CourseSalesClick(
        course_id=offer.target_course_id,
        user_id=current_user.id,
        created_at=now
    )
    db.add(sales_click)
    db.commit()

    logger.info(f"[UPSELL] Aluno #{current_user.id} clicou no anúncio de upsell #{offer_id} (Curso Alvo #{offer.target_course_id})")
    return {"message": "Clique registrado com sucesso."}
