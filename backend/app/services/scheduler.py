"""
Agendador de Tarefas em Background (APScheduler) para Execução Periódica de Backups.
"""
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.logger import logger
from app.core.database import SessionLocal
from app.models.backup import BackupSchedule
from app.services.backup_service import create_backup_record

scheduler = BackgroundScheduler(timezone="UTC")

def parse_frequency_to_timedelta(freq_str: str) -> timedelta:
    """Converte '1h', '6h', '12h', '24h', '7d' em timedelta."""
    if freq_str == "1h":
        return timedelta(hours=1)
    elif freq_str == "6h":
        return timedelta(hours=6)
    elif freq_str == "12h":
        return timedelta(hours=12)
    elif freq_str == "24h":
        return timedelta(hours=24)
    elif freq_str == "7d":
        return timedelta(days=7)
    return timedelta(hours=6)

def run_scheduled_backup_job():
    """Job disparado pelo scheduler."""
    logger.info("Executando rotina automática de backup do banco de dados...")
    db = SessionLocal()
    try:
        schedule = db.query(BackupSchedule).first()
        if not schedule or not schedule.is_active:
            logger.info("Rotina de backup está desativada no momento. Pulando execução.")
            return

        now = datetime.now(timezone.utc)
        delta = parse_frequency_to_timedelta(schedule.frequency)
        schedule.next_run_at = now + delta
        db.commit()

        # Cria o backup automático
        create_backup_record(db, backup_type="automatic")
        logger.info(f"Backup automático concluído com sucesso. Próximo backup em: {schedule.next_run_at}")
    except Exception as e:
        logger.error(f"Erro durante a execução do backup agendado: {e}")
    finally:
        db.close()

def setup_scheduler():
    """Inicia ou reconfigura o agendamento a partir das preferências do banco."""
    db = SessionLocal()
    try:
        schedule = db.query(BackupSchedule).first()
        if not schedule:
            # Cria configuração padrão se não existir
            schedule = BackupSchedule(
                is_active=True,
                frequency="6h",
                destination_folder="projetobase/backups/",
                retention_max=30,
                next_run_at=datetime.now(timezone.utc) + timedelta(hours=6)
            )
            db.add(schedule)
            db.commit()
            db.refresh(schedule)

        # Remove job existente se houver
        if scheduler.get_job("automated_backup_job"):
            scheduler.remove_job("automated_backup_job")

        if schedule.is_active:
            delta = parse_frequency_to_timedelta(schedule.frequency)
            hours = int(delta.total_seconds() // 3600)
            scheduler.add_job(
                run_scheduled_backup_job,
                trigger=IntervalTrigger(hours=hours),
                id="automated_backup_job",
                name="Job de Backup Automático do Banco de Dados",
                replace_existing=True
            )
            logger.info(f"Agendador de backup configurado com sucesso (a cada {hours}h).")
        else:
            logger.info("Agendador de backup configurado como desativado.")

        if not scheduler.running:
            scheduler.start()
            logger.info("BackgroundScheduler iniciado com sucesso.")
    except Exception as e:
        logger.error(f"Erro ao inicializar agendador de backup: {e}")
    finally:
        db.close()
