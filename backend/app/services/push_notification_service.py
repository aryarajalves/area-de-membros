import json
import os
from typing import Dict, Optional

from sqlalchemy.orm import Session

from app.core.logger import logger
from app.models.push_token import UserDeviceToken

try:
    import firebase_admin
    from firebase_admin import credentials, messaging
except ImportError:  # pragma: no cover
    firebase_admin = None
    credentials = None
    messaging = None

_firebase_initialized = False
_firebase_init_attempted = False


def _ensure_firebase_initialized() -> bool:
    """Inicializa o Firebase Admin SDK sob demanda a partir de variáveis de ambiente."""
    global _firebase_initialized, _firebase_init_attempted

    if _firebase_initialized:
        return True
    if _firebase_init_attempted:
        return False

    _firebase_init_attempted = True

    if firebase_admin is None or credentials is None:
        logger.warning("[PUSH] Biblioteca firebase-admin não está disponível.")
        return False

    if firebase_admin._apps:
        _firebase_initialized = True
        return True

    cred_json = (os.getenv("FIREBASE_CREDENTIALS_JSON") or "").strip()
    cred_path = (os.getenv("FIREBASE_CREDENTIALS_PATH") or "").strip()

    try:
        if cred_json:
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("[PUSH] Firebase Admin SDK inicializado via FIREBASE_CREDENTIALS_JSON.")
            return True

        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("[PUSH] Firebase Admin SDK inicializado via FIREBASE_CREDENTIALS_PATH.")
            return True

        logger.info("[PUSH] Credenciais do Firebase não configuradas. Envio de push em modo inativo.")
        return False
    except Exception as exc:
        logger.error(f"[PUSH] Falha ao inicializar Firebase Admin SDK: {exc}")
        return False


def is_push_configured() -> bool:
    """Retorna True se o Firebase Admin SDK estiver configurado e pronto para envio."""
    return _ensure_firebase_initialized()


def register_device_token(
    db: Session,
    user_id: int,
    fcm_token: str,
    platform: str = "android",
    device_name: Optional[str] = None,
) -> UserDeviceToken:
    """Registra ou atualiza o token FCM de um dispositivo para o usuário autenticado."""
    clean_token = fcm_token.strip()
    clean_platform = (platform or "android").strip().lower()[:20]
    clean_device = device_name.strip()[:120] if device_name else None

    existing = db.query(UserDeviceToken).filter(UserDeviceToken.fcm_token == clean_token).first()
    if existing:
        existing.user_id = user_id
        existing.platform = clean_platform
        existing.device_name = clean_device
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        logger.info(f"[PUSH] Token FCM atualizado para usuário {user_id} ({clean_platform}).")
        return existing

    record = UserDeviceToken(
        user_id=user_id,
        fcm_token=clean_token,
        platform=clean_platform,
        device_name=clean_device,
        is_active=True,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info(f"[PUSH] Novo token FCM registrado para usuário {user_id} ({clean_platform}).")
    return record


def unregister_device_token(db: Session, user_id: int, fcm_token: str) -> bool:
    """Remove o token FCM pertencente ao usuário autenticado (proteção contra IDOR)."""
    clean_token = fcm_token.strip()
    record = (
        db.query(UserDeviceToken)
        .filter(UserDeviceToken.user_id == user_id, UserDeviceToken.fcm_token == clean_token)
        .first()
    )
    if not record:
        return False

    db.delete(record)
    db.commit()
    logger.info(f"[PUSH] Token FCM removido para usuário {user_id}.")
    return True


def _is_unregistered_error(exc: Exception) -> bool:
    """Verifica se o erro do FCM indica token expirado, inválido ou app desinstalado."""
    err_name = type(exc).__name__.lower()
    err_msg = str(exc).lower()
    return (
        "unregistered" in err_name
        or "notfound" in err_name
        or "requested entity was not found" in err_msg
        or "registration-token-not-registered" in err_msg
    )


def send_push_to_user(
    db: Session,
    user_id: int,
    title: str,
    body: str,
    data: Optional[Dict[str, str]] = None,
) -> int:
    """Envia Push Notification via FCM para todos os dispositivos ativos de um usuário."""
    if not _ensure_firebase_initialized():
        return 0

    tokens = (
        db.query(UserDeviceToken)
        .filter(UserDeviceToken.user_id == user_id, UserDeviceToken.is_active.is_(True))
        .all()
    )
    if not tokens:
        return 0

    safe_data = {str(k): str(v) for k, v in (data or {}).items() if v is not None}
    sent_count = 0
    stale_tokens = []

    for device in tokens:
        try:
            msg = messaging.Message(
                notification=messaging.Notification(
                    title=title[:120],
                    body=(body or "")[:240],
                ),
                data=safe_data,
                token=device.fcm_token,
            )
            messaging.send(msg)
            sent_count += 1
        except Exception as exc:
            if _is_unregistered_error(exc):
                stale_tokens.append(device)
            else:
                logger.error(f"[PUSH] Erro ao enviar push para usuário {user_id}: {exc}")

    if stale_tokens:
        for stale in stale_tokens:
            stale.is_active = False
        try:
            db.commit()
            logger.info(f"[PUSH] {len(stale_tokens)} token(s) expirado(s) desativado(s) para usuário {user_id}.")
        except Exception as exc:
            db.rollback()
            logger.warning(f"[PUSH] Falha ao desativar tokens expirados: {exc}")

    return sent_count


def notify_dm_push(
    db: Session,
    recipient_id: int,
    sender_name: str,
    sender_id: int,
    message_id: int,
    content: Optional[str] = None,
) -> int:
    """Envia push notification de nova mensagem direta (DM) de forma resiliente."""
    try:
        preview_body = (content or "").strip() or "Enviou uma mídia"
        return send_push_to_user(
            db=db,
            user_id=recipient_id,
            title=f"Nova mensagem de {sender_name}",
            body=preview_body[:160],
            data={"type": "dm", "sender_id": str(sender_id), "message_id": str(message_id)},
        )
    except Exception as exc:
        logger.warning(f"Erro ao enviar push de DM: {exc}")
        return 0
