"""
Utilitário para garantir limites mínimos de descritores de arquivo (nofile)
nos processos Linux (Backend API e Worker), suportando alta concorrência.
"""
from typing import Any, Dict

from app.core.logger import logger

DEFAULT_MIN_NOFILE_LIMIT = 100000


def ensure_min_nofile_limit(target: int = DEFAULT_MIN_NOFILE_LIMIT) -> Dict[str, Any]:
    """
    Garante que o limite soft de descritores de arquivo (RLIMIT_NOFILE) seja
    pelo menos `target`, sem jamais reduzir limites já superiores (ex.: 1048576).
    """
    try:
        import resource
    except ImportError:
        return {"supported": False, "changed": False, "target": target}

    try:
        soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
    except Exception as exc:
        logger.warning(f"[LIMITES] Falha ao consultar RLIMIT_NOFILE: {exc}")
        return {"supported": True, "changed": False, "target": target, "error": str(exc)}

    if soft >= target:
        logger.info(
            f"[LIMITES] RLIMIT_NOFILE atual já atende ao mínimo ({soft} >= {target}, hard={hard})."
        )
        return {
            "supported": True,
            "changed": False,
            "previous_soft": soft,
            "soft": soft,
            "hard": hard,
            "target": target,
        }

    if hard < target:
        try:
            resource.setrlimit(resource.RLIMIT_NOFILE, (target, target))
            logger.info(
                f"[LIMITES] RLIMIT_NOFILE elevado com sucesso: soft {soft}->{target}, hard {hard}->{target}."
            )
            return {
                "supported": True,
                "changed": True,
                "previous_soft": soft,
                "soft": target,
                "hard": target,
                "target": target,
            }
        except (OSError, ValueError):
            new_soft = min(target, hard)
            if new_soft > soft:
                try:
                    resource.setrlimit(resource.RLIMIT_NOFILE, (new_soft, hard))
                    logger.info(
                        f"[LIMITES] RLIMIT_NOFILE ajustado ao teto hard disponível: soft {soft}->{new_soft} (hard={hard})."
                    )
                    return {
                        "supported": True,
                        "changed": True,
                        "previous_soft": soft,
                        "soft": new_soft,
                        "hard": hard,
                        "target": target,
                    }
                except (OSError, ValueError) as exc:
                    logger.warning(f"[LIMITES] Não foi possível elevar RLIMIT_NOFILE de {soft}: {exc}")
                    return {
                        "supported": True,
                        "changed": False,
                        "previous_soft": soft,
                        "soft": soft,
                        "hard": hard,
                        "target": target,
                        "error": str(exc),
                    }
            logger.warning(
                f"[LIMITES] RLIMIT_NOFILE limitado pelo teto hard do container (soft={soft}, hard={hard})."
            )
            return {
                "supported": True,
                "changed": False,
                "previous_soft": soft,
                "soft": soft,
                "hard": hard,
                "target": target,
            }

    try:
        resource.setrlimit(resource.RLIMIT_NOFILE, (target, hard))
        logger.info(
            f"[LIMITES] RLIMIT_NOFILE elevado com sucesso: soft {soft}->{target} (hard={hard})."
        )
        return {
            "supported": True,
            "changed": True,
            "previous_soft": soft,
            "soft": target,
            "hard": hard,
            "target": target,
        }
    except (OSError, ValueError) as exc:
        logger.warning(f"[LIMITES] Não foi possível elevar RLIMIT_NOFILE para {target}: {exc}")
        return {
            "supported": True,
            "changed": False,
            "previous_soft": soft,
            "soft": soft,
            "hard": hard,
            "target": target,
            "error": str(exc),
        }
