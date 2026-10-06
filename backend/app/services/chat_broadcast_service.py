import asyncio
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from fastapi import HTTPException, status

from app.core.database import SessionLocal
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.student_tag import StudentTag, StudentTagAssignment
from app.models.chat import ChatMessage
from app.models.chat_broadcast import ChatBroadcastCampaign, ChatBroadcastRecipient
from app.schemas.chat_broadcast import (
    BroadcastEstimateRequest,
    BroadcastEstimateResponse,
    BroadcastCampaignCreate,
    BroadcastCampaignSummary,
    BroadcastCampaignDetail,
    BroadcastRecipientItem,
)
from app.services.chat_ws_manager import chat_manager


def resolve_broadcast_recipients(
    db: Session,
    filter_type: str,
    filter_course_id: Optional[int] = None,
    filter_tag_id: Optional[int] = None,
    filter_role: Optional[str] = "aluno",
    manual_student_ids: Optional[List[int]] = None,
    filter_days: Optional[int] = None,
) -> List[User]:
    """
    Retorna a lista de usuários destinatários com base no tipo de filtro, papel e recência de cadastro.
    """
    query = db.query(User).filter(User.is_active == True)

    # Filtro por perfil
    if filter_role == "aluno":
        query = query.filter(User.role == "aluno")
    elif filter_role in ("all", "all_users"):
        query = query.filter(User.role.in_(["aluno", "admin"]))

    # Filtro de audiência
    if filter_type == "course" and filter_course_id:
        now = datetime.now(timezone.utc)
        subq = (
            db.query(UserCourse.user_id)
            .filter(
                UserCourse.course_id == filter_course_id,
                or_(UserCourse.expires_at.is_(None), UserCourse.expires_at > now),
            )
        )
        query = query.filter(User.id.in_(subq))

    elif filter_type in ("no_course", "without_course"):
        now = datetime.now(timezone.utc)
        users_with_courses = (
            db.query(UserCourse.user_id)
            .filter(
                or_(UserCourse.expires_at.is_(None), UserCourse.expires_at > now),
            )
        )
        query = query.filter(~User.id.in_(users_with_courses))

    elif filter_type == "tag" and filter_tag_id:
        subq = (
            db.query(StudentTagAssignment.student_id)
            .filter(StudentTagAssignment.tag_id == filter_tag_id)
        )
        query = query.filter(User.id.in_(subq))

    elif filter_type == "manual" and manual_student_ids:
        query = query.filter(User.id.in_(manual_student_ids))

    # Filtro de recência por data de cadastro (ex: últimos 7, 14 ou 30 dias)
    active_days = filter_days
    if filter_type == "recent_days" and not active_days:
        active_days = 30  # padrão para recent_days se não especificado

    if active_days and active_days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=active_days)
        query = query.filter(User.created_at >= cutoff)

    return query.order_by(User.name.asc()).all()



def estimate_broadcast(db: Session, req: BroadcastEstimateRequest) -> BroadcastEstimateResponse:
    """
    Calcula a quantidade de destinatários e o tempo estimado da campanha (delay de 1s por envio).
    """
    recipients = resolve_broadcast_recipients(
        db=db,
        filter_type=req.filter_type,
        filter_course_id=req.filter_course_id,
        filter_tag_id=req.filter_tag_id,
        filter_role=req.filter_role,
        manual_student_ids=req.manual_student_ids,
        filter_days=req.filter_days,
    )

    total = len(recipients)
    # 1 segundo de intervalo entre cada mensagem disparada
    estimated_seconds = max(1, total * 1) if total > 0 else 0

    sample = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "avatar_url": u.avatar_url,
        }
        for u in recipients[:10]
    ]

    return BroadcastEstimateResponse(
        total_recipients=total,
        estimated_duration_seconds=estimated_seconds,
        delay_seconds=1,
        sample_students=sample,
    )


async def run_broadcast_worker(
    campaign_id: int,
    sender_id: int,
    db_session_factory=None,
):
    """
    Worker assíncrono executado em background para enviar as mensagens com delay estrito de 1s.
    Possui travas rigorosas de idempotência:
    - Se a campanha já estiver 'completed' ou 'cancelled', aborta imediatamente.
    - Se o destinatário já estiver com status 'sent', ignora e não reenvia a mensagem.
    - Atualiza a contagem sent_count com base no total real de destinatários enviados.
    """
    logger.info(f"[BROADCAST #{campaign_id}] Iniciando disparo assíncrono em background (Sender {sender_id})...")
    factory = db_session_factory or SessionLocal
    db: Session = factory()
    try:
        campaign = db.query(ChatBroadcastCampaign).filter(ChatBroadcastCampaign.id == campaign_id).first()
        if not campaign:
            logger.error(f"[BROADCAST #{campaign_id}] Campanha não encontrada.")
            return

        # Trava 1: Se a campanha já foi finalizada, abortar imediatamente para evitar reenvios duplicados
        if campaign.status in ("completed", "cancelled"):
            logger.warning(
                f"[BROADCAST #{campaign_id}] Campanha já finalizada com status '{campaign.status}'. "
                f"Execução abortada para prevenir reenvio duplicado."
            )
            return

        recipients = (
            db.query(ChatBroadcastRecipient)
            .filter(ChatBroadcastRecipient.campaign_id == campaign_id)
            .order_by(ChatBroadcastRecipient.id.asc())
            .all()
        )

        total = len(recipients)
        now_start = datetime.now(timezone.utc)
        if not campaign.started_at:
            campaign.started_at = now_start
        campaign.status = "processing"
        db.commit()

        for idx, rec in enumerate(recipients):
            # Trava 2: Se este destinatário específico já recebeu a mensagem nesta campanha, pular
            if rec.status == "sent":
                logger.info(
                    f"[BROADCAST #{campaign_id}] Destinatário {rec.recipient_id} já recebeu a mensagem anteriormente (status='sent'). "
                    f"Ignorando para garantir idempotência."
                )
                continue

            try:
                # Criar a mensagem DM privada no chat
                new_msg = ChatMessage(
                    channel_type="dm",
                    user_id=sender_id,
                    recipient_id=rec.recipient_id,
                    message=campaign.message,
                    button_text=campaign.button_text,
                    button_url=campaign.button_url,
                    button_action_type=campaign.button_action_type,
                    is_read=False,
                )
                db.add(new_msg)
                db.flush()

                rec.message_id = new_msg.id
                rec.status = "sent"
                rec.sent_at = datetime.now(timezone.utc)
                rec.error_message = None

                # Atualizar contagem real de enviados
                sent_total = (
                    db.query(func.count(ChatBroadcastRecipient.id))
                    .filter(
                        ChatBroadcastRecipient.campaign_id == campaign_id,
                        ChatBroadcastRecipient.status == "sent",
                    )
                    .scalar()
                    or 0
                )
                campaign.sent_count = sent_total
                db.commit()

                # Notificar cliente em tempo real via WebSocket
                try:
                    await chat_manager.broadcast_event(
                        event_type="new_dm",
                        data={
                            "recipient_id": rec.recipient_id,
                            "sender_id": sender_id,
                            "message_id": new_msg.id,
                            "text": campaign.message,
                            "button_text": campaign.button_text,
                            "button_url": campaign.button_url,
                            "button_action_type": campaign.button_action_type,
                        },
                        channel_type="dm",
                    )
                except Exception as ws_err:
                    logger.warning(f"[BROADCAST #{campaign_id}] Erro ao emitir evento WS: {ws_err}")

            except Exception as item_err:
                logger.error(f"[BROADCAST #{campaign_id}] Falha ao enviar para aluno {rec.recipient_id}: {item_err}")
                rec.status = "failed"
                rec.error_message = str(item_err)
                failed_total = (
                    db.query(func.count(ChatBroadcastRecipient.id))
                    .filter(
                        ChatBroadcastRecipient.campaign_id == campaign_id,
                        ChatBroadcastRecipient.status == "failed",
                    )
                    .scalar()
                    or 0
                )
                campaign.failed_count = failed_total
                db.commit()

            # Delay obrigatório de 1 segundo entre envios
            if idx < total - 1:
                await asyncio.sleep(1)

        # Finalizar campanha
        now_completed = datetime.now(timezone.utc)
        campaign.completed_at = now_completed
        started = campaign.started_at
        if started and started.tzinfo is None:
            started = started.replace(tzinfo=timezone.utc)
        duration = (now_completed - (started or now_completed)).total_seconds()
        campaign.duration_seconds = max(1.0, round(duration, 2))
        campaign.status = "completed"

        # Sincronização final de contadores
        campaign.sent_count = (
            db.query(func.count(ChatBroadcastRecipient.id))
            .filter(
                ChatBroadcastRecipient.campaign_id == campaign_id,
                ChatBroadcastRecipient.status == "sent",
            )
            .scalar()
            or 0
        )
        campaign.failed_count = (
            db.query(func.count(ChatBroadcastRecipient.id))
            .filter(
                ChatBroadcastRecipient.campaign_id == campaign_id,
                ChatBroadcastRecipient.status == "failed",
            )
            .scalar()
            or 0
        )
        db.commit()

        logger.info(
            f"[BROADCAST #{campaign_id}] Concluído com sucesso! Duração: {campaign.duration_seconds}s. "
            f"Enviados: {campaign.sent_count}/{campaign.total_recipients}. Falhas: {campaign.failed_count}."
        )

    except Exception as exc:
        logger.error(f"[BROADCAST #{campaign_id}] Erro inesperado na execução do worker: {exc}")
        try:
            campaign = db.query(ChatBroadcastCampaign).filter(ChatBroadcastCampaign.id == campaign_id).first()
            if campaign:
                campaign.status = "failed"
                campaign.completed_at = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


def create_and_start_broadcast(
    db: Session,
    current_user: User,
    campaign_in: BroadcastCampaignCreate,
) -> BroadcastCampaignSummary:
    """
    Cria a campanha no banco de dados e agenda o disparo assíncrono em segundo plano.
    """
    recipients = resolve_broadcast_recipients(
        db=db,
        filter_type=campaign_in.filter_type,
        filter_course_id=campaign_in.filter_course_id,
        filter_tag_id=campaign_in.filter_tag_id,
        filter_role=campaign_in.filter_role,
        manual_student_ids=campaign_in.manual_student_ids,
        filter_days=campaign_in.filter_days,
    )

    if not recipients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum aluno encontrado para os filtros selecionados.",
        )

    now = datetime.now(timezone.utc)
    campaign = ChatBroadcastCampaign(
        created_by_user_id=current_user.id,
        title=campaign_in.title.strip(),
        message=campaign_in.message.strip(),
        filter_type=campaign_in.filter_type,
        filter_course_id=campaign_in.filter_course_id,
        filter_tag_id=campaign_in.filter_tag_id,
        filter_days=campaign_in.filter_days,
        filter_role=campaign_in.filter_role or "aluno",
        button_text=campaign_in.button_text.strip() if campaign_in.button_text else None,
        button_url=campaign_in.button_url.strip() if campaign_in.button_url else None,
        button_action_type=campaign_in.button_action_type or "url",
        total_recipients=len(recipients),
        sent_count=0,
        failed_count=0,
        delay_seconds=1,
        status="pending",
        started_at=now,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # Criar registros de destinatários pendentes
    for student in recipients:
        db.add(
            ChatBroadcastRecipient(
                campaign_id=campaign.id,
                recipient_id=student.id,
                status="pending",
            )
        )
    db.commit()

    return _build_campaign_summary(campaign, db), campaign.id


def list_campaigns(db: Session, limit: int = 50) -> List[BroadcastCampaignSummary]:
    """
    Lista as campanhas de disparo com métricas de entrega e leitura.
    """
    campaigns = (
        db.query(ChatBroadcastCampaign)
        .order_by(desc(ChatBroadcastCampaign.created_at))
        .limit(limit)
        .all()
    )
    return [_build_campaign_summary(c, db) for c in campaigns]


def get_campaign_detail(db: Session, campaign_id: int) -> BroadcastCampaignDetail:
    """
    Retorna o detalhe da campanha com a lista completa de destinatários e status de visualização.
    """
    campaign = db.query(ChatBroadcastCampaign).filter(ChatBroadcastCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campanha não encontrada.")

    summary = _build_campaign_summary(campaign, db)

    recipients_rows = (
        db.query(ChatBroadcastRecipient)
        .filter(ChatBroadcastRecipient.campaign_id == campaign_id)
        .order_by(ChatBroadcastRecipient.id.asc())
        .all()
    )

    recipient_items: List[BroadcastRecipientItem] = []
    for r in recipients_rows:
        student = r.recipient
        msg = r.message
        is_read = False
        read_at = r.read_at

        if msg:
            if msg.is_read:
                is_read = True
                read_at = msg.read_at or r.read_at or msg.updated_at

        recipient_items.append(
            BroadcastRecipientItem(
                id=r.id,
                recipient_id=r.recipient_id,
                recipient_name=student.name if student else "Aluno",
                recipient_email=student.email if student else "",
                recipient_avatar_url=student.avatar_url if student else None,
                status=r.status,
                is_read=is_read,
                read_at=read_at,
                sent_at=r.sent_at,
                error_message=r.error_message,
            )
        )

    return BroadcastCampaignDetail(
        **summary.model_dump(),
        recipients=recipient_items,
    )


def _build_campaign_summary(campaign: ChatBroadcastCampaign, db: Session) -> BroadcastCampaignSummary:
    """
    Constrói o resumo da campanha calculando taxa de leitura em tempo real.
    """
    filter_target_name = None
    if campaign.filter_type == "course" and campaign.filter_course_id:
        c = db.query(Course.title).filter(Course.id == campaign.filter_course_id).first()
        if c:
            filter_target_name = c[0]
    elif campaign.filter_type == "tag" and campaign.filter_tag_id:
        t = db.query(StudentTag.name).filter(StudentTag.id == campaign.filter_tag_id).first()
        if t:
            filter_target_name = t[0]
    elif campaign.filter_type == "manual":
        filter_target_name = "Seleção Manual"
    elif campaign.filter_type in ("no_course", "without_course"):
        filter_target_name = "Sem Nenhum Curso"
    elif campaign.filter_type == "recent_days":
        filter_target_name = f"Cadastrados nos Últimos {campaign.filter_days or 30} Dias"
    elif campaign.filter_type == "all":
        filter_target_name = "Todos os Alunos"

    if campaign.filter_days and campaign.filter_type != "recent_days" and filter_target_name:
        filter_target_name += f" (Últimos {campaign.filter_days} Dias)"

    # Calcular quantos leram a mensagem
    read_count = (
        db.query(func.count(ChatBroadcastRecipient.id))
        .join(ChatMessage, ChatBroadcastRecipient.message_id == ChatMessage.id)
        .filter(
            ChatBroadcastRecipient.campaign_id == campaign.id,
            ChatMessage.is_read == True,
        )
        .scalar()
        or 0
    )

    sent = campaign.sent_count or 0
    read_pct = round((read_count / sent) * 100, 1) if sent > 0 else 0.0

    created_by_name = None
    if campaign.created_by_user:
        created_by_name = campaign.created_by_user.name

    return BroadcastCampaignSummary(
        id=campaign.id,
        title=campaign.title,
        message=campaign.message,
        filter_type=campaign.filter_type,
        filter_target_name=filter_target_name,
        filter_days=campaign.filter_days,
        filter_role=campaign.filter_role or "aluno",
        button_text=campaign.button_text,
        button_url=campaign.button_url,
        button_action_type=campaign.button_action_type,
        total_recipients=campaign.total_recipients,
        sent_count=campaign.sent_count,
        failed_count=campaign.failed_count,
        read_count=read_count,
        read_percentage=read_pct,
        delay_seconds=campaign.delay_seconds or 1,
        status=campaign.status,
        started_at=campaign.started_at,
        completed_at=campaign.completed_at,
        duration_seconds=campaign.duration_seconds,
        created_at=campaign.created_at,
        created_by_name=created_by_name,
    )
