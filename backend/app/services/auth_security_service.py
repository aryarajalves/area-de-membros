"""
Serviço de Segurança de Autenticação.
Contém regras de Account Lockout (bloqueio temporário), Invalidação de Sessão (Token Version)
e Proteção Anti-Pirataria (Single-Session Enforcement).
"""
import math
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.logger import logger

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15


def check_account_lockout(user: User, db: Optional[Session] = None) -> Optional[int]:
    """
    Verifica se a conta do usuário está bloqueada por excesso de tentativas.
    Retorna o número de minutos restantes do bloqueio, ou None se não estiver bloqueada.
    Se o tempo de bloqueio já tiver expirado, limpa os contadores no banco.
    """
    if not user.locked_until:
        return None

    now = datetime.now(timezone.utc)
    lock_time = user.locked_until
    if lock_time.tzinfo is None:
        lock_time = lock_time.replace(tzinfo=timezone.utc)

    if now < lock_time:
        remaining_seconds = (lock_time - now).total_seconds()
        remaining_minutes = max(1, math.ceil(remaining_seconds / 60))
        return remaining_minutes

    # O tempo de bloqueio expirou: redefinir automaticamente
    user.locked_until = None
    user.failed_login_attempts = 0
    if db:
        try:
            db.commit()
        except Exception as e:
            logger.warning(f"[AUTH_SECURITY] Falha ao resetar lockout expirado para user {user.id}: {e}")
            db.rollback()

    return None


def record_failed_login(user: User, db: Session) -> dict:
    """
    Registra uma tentativa de login com senha incorreta.
    Retorna um dicionário com:
    - 'locked': bool
    - 'remaining_attempts': int
    - 'lockout_minutes': int (se bloqueado)
    """
    current_attempts = (user.failed_login_attempts or 0) + 1
    user.failed_login_attempts = current_attempts

    if current_attempts >= MAX_FAILED_ATTEMPTS:
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        db.commit()
        logger.warning(
            f"[AUTH_SECURITY] Conta do usuário {user.email} (ID: {user.id}) bloqueada por {LOCKOUT_DURATION_MINUTES} minutos "
            f"após {current_attempts} tentativas incorretas."
        )
        return {
            "locked": True,
            "remaining_attempts": 0,
            "lockout_minutes": LOCKOUT_DURATION_MINUTES
        }

    db.commit()
    remaining = MAX_FAILED_ATTEMPTS - current_attempts
    logger.info(
        f"[AUTH_SECURITY] Tentativa de login incorreta para {user.email}. Tentativa {current_attempts}/{MAX_FAILED_ATTEMPTS}."
    )
    return {
        "locked": False,
        "remaining_attempts": remaining,
        "lockout_minutes": 0
    }


def reset_failed_login(user: User, db: Session) -> None:
    """
    Zera as tentativas de login falhas e remove qualquer bloqueio após login bem-sucedido.
    """
    if (user.failed_login_attempts or 0) > 0 or user.locked_until is not None:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()


def invalidate_user_sessions(user: User, db: Session) -> int:
    """
    Incrementa o token_version do usuário no banco.
    Isso invalida imediatamente todos os tokens JWT emitidos anteriormente.
    """
    current_ver = user.token_version if user.token_version is not None else 1
    new_ver = current_ver + 1
    user.token_version = new_ver
    db.commit()
    logger.info(f"[AUTH_SECURITY] Sessões do usuário {user.email} (ID: {user.id}) invalidadas. Nova token_version={new_ver}.")
    return new_ver


def enforce_single_session_on_login(user: User, db: Session) -> int:
    """
    Para alunos (anti-pirataria), incrementa a versão do token a cada novo login.
    Assim, qualquer login anterior em outro dispositivo/navegador é desconectado.
    Para administradores, mantém o token_version atual para permitir múltiplos dispositivos.
    """
    if user.role == "aluno":
        return invalidate_user_sessions(user, db)

    # Para superadmin e admin, garante ao menos token_version = 1
    if user.token_version is None:
        user.token_version = 1
        db.commit()
    return user.token_version


def validate_token_version(user: User, token_version_claim: Optional[int]) -> bool:
    """
    Verifica se o token_version do payload JWT é compatível com o do usuário no banco.
    Se o token tiver a claim e for diferente da do banco, retorna False.
    """
    if token_version_claim is None or user.token_version is None:
        return True
    return int(token_version_claim) == int(user.token_version)
