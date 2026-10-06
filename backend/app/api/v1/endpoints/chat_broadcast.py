from typing import List
from fastapi import APIRouter, Depends, Query, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.v1.endpoints.users import require_admin_or_superadmin
from app.schemas.chat_broadcast import (
    BroadcastEstimateRequest,
    BroadcastEstimateResponse,
    BroadcastCampaignCreate,
    BroadcastCampaignSummary,
    BroadcastCampaignDetail,
)
from app.services.chat_broadcast_service import (
    estimate_broadcast,
    create_and_start_broadcast,
    run_broadcast_worker,
    list_campaigns,
    get_campaign_detail,
)

router = APIRouter(prefix="/chat/broadcast", tags=["Disparo em Massa de DMs"])


@router.post(
    "/estimate",
    response_model=BroadcastEstimateResponse,
    summary="Calcular Estimativa de Destinatários e Duração",
)
def estimate_broadcast_audience(
    req: BroadcastEstimateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Retorna a contagem de destinatários que atendem aos filtros especificados
    e o tempo estimado total com delay de 1s por envio.
    """
    return estimate_broadcast(db, req)


@router.post(
    "/send",
    response_model=BroadcastCampaignSummary,
    status_code=status.HTTP_201_CREATED,
    summary="Iniciar Disparo em Massa de Mensagens Diretas",
)
def start_broadcast(
    campaign_in: BroadcastCampaignCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Cria a campanha de disparo em massa e agenda o envio assíncrono em segundo plano
    com intervalo estrito de 1 segundo entre cada mensagem.
    """
    summary, campaign_id = create_and_start_broadcast(db, current_user, campaign_in)
    background_tasks.add_task(run_broadcast_worker, campaign_id, current_user.id)
    return summary


@router.get(
    "/campaigns",
    response_model=List[BroadcastCampaignSummary],
    summary="Listar Histórico de Campanhas de Disparo",
)
def list_broadcast_campaigns(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Retorna o histórico de campanhas disparadas, com total de destinatários,
    tempo de duração e taxa de visualização/leitura.
    """
    return list_campaigns(db, limit=limit)


@router.get(
    "/campaigns/{campaign_id}",
    response_model=BroadcastCampaignDetail,
    summary="Obter Detalhes da Campanha e Destinatários",
)
def get_broadcast_campaign_details(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin),
):
    """
    Retorna os detalhes completos de uma campanha com a lista individual de destinatários,
    status de envio ('sent'/'failed') e confirmação de leitura ('is_read' e 'read_at').
    """
    return get_campaign_detail(db, campaign_id)
