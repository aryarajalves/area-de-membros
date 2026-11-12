from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user import User
from app.models.community_feed import CommunityStrike
from app.schemas.community_strikes import (
    StrikeCreateIn,
    StrikeAppealIn,
    StrikeOut,
    MyStrikesStatusOut,
    StrikeAppealReviewIn,
)
from app.services.community_strikes_service import (
    apply_strike_to_user,
    get_user_strikes_status,
    submit_strike_appeal,
    review_strike_appeal,
)
from app.services.community_follow_service import require_community_manager
from app.api.v1.endpoints.users import get_current_user

router = APIRouter()


@router.get("/community/strikes/my-status", response_model=MyStrikesStatusOut, summary="Meu Status de Strikes e Banimento", description="Retorna os strikes ativos do usuário autenticado e se ele está banido da comunidade.")
@limiter.limit("60/minute")
def get_my_strikes_status(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_strikes_status(db, current_user.id)


@router.post("/community/strikes/{strike_id}/appeal", response_model=StrikeOut, summary="Recorrer de um Strike", description="Permite ao aluno enviar justificativa/defesa para um strike recebido.")
@limiter.limit("20/minute")
def appeal_strike(
    request: Request,
    strike_id: int,
    payload: StrikeAppealIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return submit_strike_appeal(db, strike_id, current_user.id, payload.reason)


@router.post("/community/admin/strikes", response_model=StrikeOut, summary="Aplicar Strike em Usuário (Admin)", description="Aplica um strike formal contra um usuário. Se atingir 3 strikes, o usuário é banido automaticamente.")
@limiter.limit("30/minute")
def admin_apply_strike(
    request: Request,
    payload: StrikeCreateIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    if current_user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")

    return apply_strike_to_user(
        db=db,
        user_id=payload.user_id,
        moderator_id=current_user.id,
        reason=payload.reason,
        description=payload.description,
        post_id=payload.post_id,
        comment_id=payload.comment_id,
    )


@router.get("/community/admin/strikes/appeals", response_model=List[StrikeOut], summary="Listar Recursos de Strikes (Admin)", description="Retorna os recursos de strikes pendentes de julgamento pela moderação.")
@limiter.limit("40/minute")
def list_pending_appeals(
    request: Request,
    status_filter: str = Query("pending", description="'pending', 'approved', 'rejected', 'all'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    if current_user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")

    query = db.query(CommunityStrike)
    if status_filter != "all":
        query = query.filter(CommunityStrike.appeal_status == status_filter)

    strikes = query.order_by(desc(CommunityStrike.created_at)).all()
    results = []
    for s in strikes:
        results.append(StrikeOut(
            id=s.id,
            user_id=s.user_id,
            user_name=s.user.name if s.user else "Membro",
            user_avatar=s.user.avatar_url if s.user else None,
            moderator_id=s.moderator_id,
            post_id=s.post_id,
            comment_id=s.comment_id,
            reason=s.reason,
            description=s.description,
            strike_number=s.strike_number,
            appeal_status=s.appeal_status,
            appeal_reason=s.appeal_reason,
            appeal_reviewed_at=s.appeal_reviewed_at,
            created_at=s.created_at,
        ))
    return results


@router.put("/community/admin/strikes/{strike_id}/appeal", response_model=StrikeOut, summary="Julgar Recurso de Strike (Admin)", description="Aprova ou rejeita o recurso de um aluno contra um strike.")
@limiter.limit("30/minute")
def judge_strike_appeal(
    request: Request,
    strike_id: int,
    payload: StrikeAppealReviewIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    if current_user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")

    return review_strike_appeal(db, strike_id, current_user.id, payload.action)


@router.delete("/community/admin/strikes/{strike_id}", summary="Revogar Strike Manualmente (Admin)", description="Remove um strike diretamente e reabilita o aluno caso estivesse banido.")
@limiter.limit("20/minute")
def delete_strike_manually(
    request: Request,
    strike_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_community_manager),
):
    if current_user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")

    strike = db.query(CommunityStrike).filter(CommunityStrike.id == strike_id).first()
    if not strike:
        raise HTTPException(status_code=404, detail="Strike não encontrado.")

    user = strike.user
    if user:
        user.community_strikes_count = max(0, (user.community_strikes_count or 1) - 1)
        if user.community_strikes_count < 3:
            user.is_community_banned = False

    db.delete(strike)
    db.commit()
    return {"message": "Strike removido com sucesso e status atualizado."}
