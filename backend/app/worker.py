"""
Worker de Processamento em Background e Verificações Periódicas.
Responsável por executar rotinas automáticas de forma isolada do processo web da API:
- Verificação diária de renovação e expiração de cursos dos alunos.
- Execução de backups periódicos do banco de dados (S3/Backblaze B2).
"""
import sys
import time
import signal
from datetime import datetime, timezone
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.logger import logger
from app.core.config import settings
import app.models  # Garante registro prévio de todos os modelos e relacionamentos do SQLAlchemy
from app.models.user import User, Invite
from app.models.course import Course, UserCourse, Module, Lesson, LessonComment
from app.models.backup import BackupSchedule, BackupHistory
from app.models.webhook import Webhook, WebhookLog
from app.services.webhook_service import check_and_dispatch_renewal_events
from app.services.scheduler import run_scheduled_backup_job, setup_scheduler, scheduler as bg_scheduler

# Scheduler de execução bloqueante dedicado ao processo do Worker
worker_scheduler = BlockingScheduler(timezone="UTC")


def run_renewal_check_job():
    """
    Executa a verificação periódica de renovações de matrículas de cursos:
    - course.renewal.warning_7d: Alerta com 7 dias de antecedência para término do curso.
    - course.renewal.expired: Notificação de expiração com status 'Renovação do Curso'.
    """
    logger.info("[WORKER] >>> Iniciando rotina periódica de verificação de renovação de cursos...")
    try:
        results = check_and_dispatch_renewal_events()
        warnings = results.get("warnings_sent", 0)
        expired = results.get("expired_sent", 0)
        logger.info(
            f"[WORKER] <<< Verificação de renovações finalizada com sucesso! "
            f"Avisos 7 dias enviados: {warnings} | Notificações de expiração enviadas: {expired}"
        )
        return results
    except Exception as exc:
        logger.error(f"[WORKER] Erro inesperado na rotina de renovação de cursos: {exc}")
        return {"error": str(exc)}


def run_backup_check_job():
    """
    Executa a rotina agendada de backup do banco de dados.
    """
    logger.info("[WORKER] >>> Iniciando rotina periódica de backup do banco de dados...")
    try:
        run_scheduled_backup_job()
        logger.info("[WORKER] <<< Rotina de backup finalizada com sucesso.")
    except Exception as exc:
        logger.error(f"[WORKER] Erro inesperado na rotina de backup: {exc}")


def setup_worker_jobs(scheduler_instance=None):
    """
    Configura e registra todos os jobs periódicos no scheduler do Worker.
    """
    target_scheduler = scheduler_instance or worker_scheduler

    # 1. Job de Verificação de Renovações de Alunos (Padrão: A cada 24 horas)
    interval_hours = max(1, settings.WORKER_RENEWAL_CHECK_INTERVAL_HOURS)
    target_scheduler.add_job(
        run_renewal_check_job,
        trigger=IntervalTrigger(hours=interval_hours),
        id="worker_renewal_check_job",
        name="Verificação Diária de Renovação e Expiração de Cursos",
        replace_existing=True,
    )
    logger.info(f"[WORKER] Job de verificação de renovação configurado a cada {interval_hours} horas.")

    # 2. Job de Backup Automático (A cada 6 horas por padrão ou conforme configuração)
    target_scheduler.add_job(
        run_backup_check_job,
        trigger=IntervalTrigger(hours=6),
        id="worker_backup_job",
        name="Rotina Periódica de Backup Automático do Banco",
        replace_existing=True,
    )
    logger.info("[WORKER] Job de backup periódico configurado com sucesso.")


def graceful_shutdown(signum, frame):
    """Trata sinais de encerramento do Docker (SIGTERM, SIGINT) de forma limpa."""
    logger.info(f"[WORKER] Sinal de parada recebido ({signum}). Encerrando o worker graciosamente...")
    if worker_scheduler.running:
        worker_scheduler.shutdown(wait=False)
    sys.exit(0)


def start_worker():
    """
    Ponto de entrada do serviço Worker.
    """
    logger.info("============================================================")
    logger.info("       INICIANDO SERVIÇO WORKER - ÁREA DE MEMBROS           ")
    logger.info("============================================================")
    logger.info(f"[WORKER] Frequência de verificação de renovação: {settings.WORKER_RENEWAL_CHECK_INTERVAL_HOURS}h")

    # Registra interceptadores de sinais de término do sistema
    signal.signal(signal.SIGINT, graceful_shutdown)
    signal.signal(signal.SIGTERM, graceful_shutdown)

    # Configura os jobs periódicos
    setup_worker_jobs(worker_scheduler)

    # Executa uma checagem inicial de renovações na inicialização do worker
    try:
        logger.info("[WORKER] Executando checagem inicial de renovações no startup...")
        run_renewal_check_job()
    except Exception as exc:
        logger.error(f"[WORKER] Falha na checagem inicial: {exc}")

    logger.info("[WORKER] Worker operacional e aguardando próximos agendamentos...")
    try:
        worker_scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("[WORKER] Worker finalizado com sucesso.")


if __name__ == "__main__":
    start_worker()
