import hmac
import hashlib
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import httpx
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.logger import logger
from app.models.webhook import Webhook, WebhookLog
from app.models.course import Course, UserCourse

SUPPORTED_EVENTS = [
    "course.progress.25",
    "course.progress.50",
    "course.progress.75",
    "course.progress.100",
    "lesson.completed",
    "student.enrolled",
    "course.renewal.warning_7d",
    "course.renewal.expired",
]

def calculate_hmac_signature(secret: str, payload_bytes: bytes) -> str:
    """Calcula a assinatura HMAC SHA-256 do payload."""
    return hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()

def execute_webhook_request(
    webhook_id: int,
    url: str,
    event: str,
    payload: Dict[str, Any],
    secret_key: Optional[str] = None,
    db: Optional[Session] = None
) -> Dict[str, Any]:
    """
    Executa a requisição HTTP POST para o webhook e persiste o log no banco de dados.
    """
    own_db = False
    if db is None:
        db = SessionLocal()
        own_db = True

    try:
        payload_json = json.dumps(payload, ensure_ascii=False)
        payload_bytes = payload_json.encode("utf-8")

        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "AreaDeMembros-Webhooks/1.0",
            "X-Webhook-Event": event,
            "X-Webhook-Delivery": datetime.now(timezone.utc).isoformat(),
        }

        if secret_key:
            signature = calculate_hmac_signature(secret_key, payload_bytes)
            headers["X-Webhook-Signature"] = signature

        logger.info(f"Disparando webhook ID {webhook_id} ({event}) para {url}")

        response_status = None
        response_body = None
        success = False
        error_message = None

        try:
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                res = client.post(url, content=payload_bytes, headers=headers)
                response_status = res.status_code
                response_body = res.text[:2000] if res.text else ""
                success = 200 <= res.status_code < 300
                if not success:
                    error_message = f"HTTP {res.status_code}: {response_body[:200]}"
        except httpx.TimeoutException:
            error_message = "Timeout ao conectar ao endpoint do webhook (10s)."
            logger.error(f"Webhook {webhook_id} timeout: {url}")
        except Exception as exc:
            error_message = f"Erro de conexão: {str(exc)}"
            logger.error(f"Erro ao disparar webhook {webhook_id}: {exc}")

        # Salva o log no banco
        log_entry = WebhookLog(
            webhook_id=webhook_id,
            event=event,
            payload=payload_json,
            response_status=response_status,
            response_body=response_body,
            success=success,
            error_message=error_message,
        )
        db.add(log_entry)
        db.commit()

        return {
            "success": success,
            "status_code": response_status,
            "response_body": response_body or "",
            "error_message": error_message,
        }

    except Exception as e:
        logger.error(f"Falha catastrófica ao registrar log do webhook {webhook_id}: {e}")
        return {
            "success": False,
            "status_code": None,
            "response_body": "",
            "error_message": str(e),
        }
    finally:
        if own_db:
            db.close()


def dispatch_event_to_webhooks(
    event: str,
    data: Dict[str, Any],
    course_id: Optional[int] = None,
    db: Optional[Session] = None
):
    """
    Localiza todos os webhooks ativos que assinam o evento e agenda o envio.
    """
    own_db = False
    if db is None:
        db = SessionLocal()
        own_db = True

    try:
        webhooks = db.query(Webhook).filter(Webhook.is_active == True).all()
        target_webhooks = []

        for wh in webhooks:
            subscribed_events = [e.strip() for e in wh.events.split(",") if e.strip()]
            if event in subscribed_events:
                # Verifica filtro de curso
                if wh.course_id is None or wh.course_id == course_id:
                    target_webhooks.append(wh)

        logger.info(f"Evento {event}: {len(target_webhooks)} webhooks encontrados para envio.")

        payload = {
            "event": event,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data,
        }

        for wh in target_webhooks:
            execute_webhook_request(
                webhook_id=wh.id,
                url=wh.url,
                event=event,
                payload=payload,
                secret_key=wh.secret_key,
                db=db,
            )

    except Exception as exc:
        logger.error(f"Erro ao despachar evento {event}: {exc}")
    finally:
        if own_db:
            db.close()


def check_and_dispatch_progress_events(
    user_id: int,
    course_id: int,
    previous_percent: int,
    current_percent: int,
    completed_lessons: int,
    total_lessons: int,
    last_lesson_title: str = "",
    db: Optional[Session] = None
):
    """
    Verifica se o progresso cruzou os marcos de 25%, 50%, 75% ou 100% e dispara os eventos apropriados.
    """
    own_db = False
    if db is None:
        db = SessionLocal()
        own_db = True

    try:
        user = db.query(User).filter(User.id == user_id).first()
        course = db.query(Course).filter(Course.id == course_id).first()

        if not user or not course:
            return

        base_data = {
            "student": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
            },
            "course": {
                "id": course.id,
                "title": course.title,
            },
            "progress": {
                "previous_percent": previous_percent,
                "current_percent": current_percent,
                "completed_lessons": completed_lessons,
                "total_lessons": total_lessons,
                "last_completed_lesson": last_lesson_title,
            }
        }

        # 1. Evento de aula concluída
        dispatch_event_to_webhooks("lesson.completed", base_data, course_id=course.id, db=db)

        # 2. Marcos de porcentagem de progresso:
        milestones = [
            (25, "course.progress.25"),
            (50, "course.progress.50"),
            (75, "course.progress.75"),
            (100, "course.progress.100"),
        ]

        for milestone_val, event_name in milestones:
            # Se atingiu ou cruzou a marca
            if previous_percent < milestone_val <= current_percent:
                logger.info(f"Aluno {user.email} atingiu marco de {milestone_val}% no curso '{course.title}'!")
                dispatch_event_to_webhooks(event_name, base_data, course_id=course.id, db=db)

    except Exception as exc:
        logger.error(f"Erro ao verificar marcos de progresso do usuário {user_id}: {exc}")
    finally:
        if own_db:
            db.close()


def check_and_dispatch_renewal_events(db: Optional[Session] = None) -> Dict[str, int]:
    """
    Verifica matrículas com data de expiração e dispara eventos de:
    - 'course.renewal.warning_7d': Acesso a 1 semana (entre 6 e 7 dias) de expirar.
    - 'course.renewal.expired': Acesso expirado com status 'Renovação do Curso'.
    """
    own_db = False
    if db is None:
        db = SessionLocal()
        own_db = True

    warnings_sent = 0
    expired_sent = 0

    try:
        now = datetime.now(timezone.utc)
        user_courses = db.query(UserCourse).filter(UserCourse.expires_at.isnot(None)).all()

        for uc in user_courses:
            exp_dt = uc.expires_at if uc.expires_at.tzinfo else uc.expires_at.replace(tzinfo=timezone.utc)
            student = db.query(User).filter(User.id == uc.user_id).first()
            course = db.query(Course).filter(Course.id == uc.course_id).first()

            if not student or not course:
                continue

            diff_seconds = (exp_dt - now).total_seconds()
            days_diff = diff_seconds / 86400.0

            # Caso 1: Curso expirado (já venceu)
            if exp_dt <= now:
                payload_expired = {
                    "event": "course.renewal.expired",
                    "status": "Renovação do Curso",
                    "message": f"O prazo de acesso ao curso '{course.title}' expirou.",
                    "student": {
                        "id": student.id,
                        "name": student.name,
                        "email": student.email,
                    },
                    "course": {
                        "id": course.id,
                        "title": course.title,
                    },
                    "access_duration": uc.access_duration or "com prazo",
                    "expires_at": exp_dt.isoformat(),
                    "enrolled_at": uc.created_at.isoformat() if uc.created_at else None,
                }
                logger.info(f"Disparando evento course.renewal.expired para aluno {student.email} no curso {course.title}")
                dispatched = dispatch_event_to_webhooks("course.renewal.expired", payload_expired, course_id=course.id, db=db)
                expired_sent += len(dispatched)

            # Caso 2: Aviso de 1 semana antes (entre 6.0 e 7.5 dias para expirar)
            elif 6.0 <= days_diff <= 7.5:
                payload_warning = {
                    "event": "course.renewal.warning_7d",
                    "status": "Aviso de Renovação",
                    "message": f"O acesso ao curso '{course.title}' expirará em aproximadamente 1 semana.",
                    "days_remaining": int(round(days_diff)),
                    "student": {
                        "id": student.id,
                        "name": student.name,
                        "email": student.email,
                    },
                    "course": {
                        "id": course.id,
                        "title": course.title,
                    },
                    "access_duration": uc.access_duration or "com prazo",
                    "expires_at": exp_dt.isoformat(),
                    "enrolled_at": uc.created_at.isoformat() if uc.created_at else None,
                }
                logger.info(f"Disparando evento course.renewal.warning_7d para aluno {student.email} no curso {course.title}")
                dispatched = dispatch_event_to_webhooks("course.renewal.warning_7d", payload_warning, course_id=course.id, db=db)
                warnings_sent += len(dispatched)

        return {"warnings_sent": warnings_sent, "expired_sent": expired_sent}

    except Exception as exc:
        logger.error(f"Erro ao verificar eventos de renovação de cursos: {exc}")
        return {"warnings_sent": warnings_sent, "expired_sent": expired_sent, "error": str(exc)}
    finally:
        if own_db:
            db.close()

