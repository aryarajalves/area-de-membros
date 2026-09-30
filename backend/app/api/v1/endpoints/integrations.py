import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.logger import logger
from app.models.user import User
from app.models.course import Course
from app.models.webhook import Webhook, WebhookLog
from app.api.v1.endpoints.users import get_current_user
from app.schemas.webhook import (
    WebhookCreate,
    WebhookUpdate,
    WebhookResponse,
    WebhookLogResponse,
    WebhookTestResponse,
)
from app.services.webhook_service import execute_webhook_request, check_and_dispatch_renewal_events

router = APIRouter()

def require_admin_or_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores."
        )
    return current_user


def _format_webhook_response(webhook: Webhook, db: Session) -> WebhookResponse:
    events_list = [e.strip() for e in webhook.events.split(",") if e.strip()] if webhook.events else []
    course_title = None
    if webhook.course_id:
        course = db.query(Course).filter(Course.id == webhook.course_id).first()
        course_title = course.title if course else None

    # Contagem de disparos
    total_logs = db.query(WebhookLog).filter(WebhookLog.webhook_id == webhook.id).count()
    success_logs = db.query(WebhookLog).filter(
        WebhookLog.webhook_id == webhook.id,
        WebhookLog.success == True
    ).count()

    return WebhookResponse(
        id=webhook.id,
        name=webhook.name,
        url=webhook.url,
        events=events_list,
        course_id=webhook.course_id,
        course_title=course_title,
        secret_key=webhook.secret_key,
        is_active=webhook.is_active,
        total_dispatches=total_logs,
        success_dispatches=success_logs,
        created_at=webhook.created_at,
        updated_at=webhook.updated_at,
    )


@router.get("", response_model=List[WebhookResponse])
def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Lista todas as integrações de webhook cadastradas."""
    try:
        webhooks = db.query(Webhook).order_by(desc(Webhook.created_at)).all()
        return [_format_webhook_response(wh, db) for wh in webhooks]
    except Exception as exc:
        logger.error(f"Erro ao listar webhooks: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar lista de integrações."
        )


@router.post("", response_model=WebhookResponse, status_code=status.HTTP_201_CREATED)
def create_integration(
    data: WebhookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Cria uma nova integração de webhook."""
    try:
        # Se especificou curso, valida existência
        if data.course_id:
            course = db.query(Course).filter(Course.id == data.course_id).first()
            if not course:
                raise HTTPException(status_code=400, detail="Curso selecionado não encontrado.")

        events_str = ",".join(data.events) if isinstance(data.events, list) else str(data.events)

        webhook = Webhook(
            name=data.name.strip(),
            url=data.url.strip(),
            events=events_str,
            course_id=data.course_id,
            secret_key=data.secret_key.strip() if data.secret_key else None,
            is_active=data.is_active,
        )
        db.add(webhook)
        db.commit()
        db.refresh(webhook)

        logger.info(f"Integração '{webhook.name}' criada por {current_user.email} (ID: {webhook.id}).")
        return _format_webhook_response(webhook, db)

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Erro ao criar integração: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao salvar integração."
        )


@router.get("/{id}", response_model=WebhookResponse)
def get_integration(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Retorna detalhes de uma integração específica."""
    webhook = db.query(Webhook).filter(Webhook.id == id).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Integração não encontrada.")
    return _format_webhook_response(webhook, db)


@router.put("/{id}", response_model=WebhookResponse)
def update_integration(
    id: int,
    data: WebhookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Atualiza configurações de uma integração existente."""
    webhook = db.query(Webhook).filter(Webhook.id == id).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Integração não encontrada.")

    try:
        if data.name is not None:
            webhook.name = data.name.strip()
        if data.url is not None:
            webhook.url = data.url.strip()
        if data.events is not None:
            webhook.events = ",".join(data.events) if isinstance(data.events, list) else str(data.events)
        if data.course_id is not None:
            if data.course_id == 0 or data.course_id is None:
                webhook.course_id = None
            else:
                course = db.query(Course).filter(Course.id == data.course_id).first()
                if not course:
                    raise HTTPException(status_code=400, detail="Curso selecionado não encontrado.")
                webhook.course_id = data.course_id
        if data.secret_key is not None:
            webhook.secret_key = data.secret_key.strip() if data.secret_key else None
        if data.is_active is not None:
            webhook.is_active = data.is_active

        db.commit()
        db.refresh(webhook)
        logger.info(f"Integração ID {id} atualizada por {current_user.email}.")
        return _format_webhook_response(webhook, db)

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Erro ao atualizar integração {id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar integração."
        )


@router.delete("/{id}")
def delete_integration(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Exclui uma integração e todo seu histórico de logs."""
    webhook = db.query(Webhook).filter(Webhook.id == id).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Integração não encontrada.")

    try:
        name = webhook.name
        db.delete(webhook)
        db.commit()
        logger.info(f"Integração '{name}' (ID {id}) removida por {current_user.email}.")
        return {"detail": f"Integração '{name}' removida com sucesso."}
    except Exception as exc:
        logger.error(f"Erro ao excluir integração {id}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao excluir integração."
        )


@router.post("/{id}/test", response_model=WebhookTestResponse)
def test_integration(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Envia um disparo de teste imediato para validar a conexão com a URL de webhook."""
    webhook = db.query(Webhook).filter(Webhook.id == id).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Integração não encontrada.")

    # Gera payload de exemplo
    course_name = "Curso de Exemplo"
    if webhook.course_id:
        course = db.query(Course).filter(Course.id == webhook.course_id).first()
        if course:
            course_name = course.title

    sample_payload = {
        "event": "webhook.test",
        "timestamp": "2026-09-30T18:00:00Z",
        "data": {
            "student": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
            },
            "course": {
                "id": webhook.course_id or 1,
                "title": course_name,
            },
            "progress": {
                "previous_percent": 25,
                "current_percent": 50,
                "completed_lessons": 5,
                "total_lessons": 10,
                "last_completed_lesson": "Aula 5 - Prática e Integração",
            },
            "is_test": True,
        }
    }

    result = execute_webhook_request(
        webhook_id=webhook.id,
        url=webhook.url,
        event="webhook.test",
        payload=sample_payload,
        secret_key=webhook.secret_key,
        db=db,
    )

    if result["success"]:
        return WebhookTestResponse(
            success=True,
            status_code=result["status_code"],
            message=f"Disparo de teste realizado com sucesso! HTTP {result['status_code']}",
            response_body=result["response_body"],
        )
    else:
        return WebhookTestResponse(
            success=False,
            status_code=result["status_code"],
            message=result["error_message"] or "Falha ao enviar webhook de teste.",
            response_body=result["response_body"],
        )


@router.get("/{id}/logs", response_model=List[WebhookLogResponse])
def get_integration_logs(
    id: int,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """Retorna os últimos logs de disparos de um webhook específico."""
    webhook = db.query(Webhook).filter(Webhook.id == id).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Integração não encontrada.")

    logs = (
        db.query(WebhookLog)
        .filter(WebhookLog.webhook_id == id)
        .order_by(desc(WebhookLog.created_at))
        .limit(limit)
        .all()
    )

    result = []
    for l in logs:
        try:
            payload_dict = json.loads(l.payload)
        except Exception:
            payload_dict = {"raw": l.payload}

        result.append(
            WebhookLogResponse(
                id=l.id,
                webhook_id=l.webhook_id,
                event=l.event,
                payload=payload_dict,
                response_status=l.response_status,
                response_body=l.response_body,
                success=l.success,
                error_message=l.error_message,
                created_at=l.created_at,
            )
        )

    return result


@router.post("/check-renewals", status_code=status.HTTP_200_OK)
def trigger_check_renewals(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_superadmin)
):
    """
    Executa verificação de vencimento de cursos dos alunos e despacha webhooks para:
    - course.renewal.warning_7d (aviso 1 semana antes)
    - course.renewal.expired (curso expirado, status: Renovação do Curso)
    """
    results = check_and_dispatch_renewal_events(db=db)
    logger.info(f"Checagem de renovação executada por {current_user.email}: {results}")
    return {
        "success": True,
        "message": "Verificação de renovações executada com sucesso.",
        "details": results
    }

