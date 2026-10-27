import sys
import os

# Adiciona o diretório raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine, Base
from app.models.event import Event
from app.core.logger import logger


def run_migration():
    """
    Cria a tabela de Eventos e Mentorias (events) caso ainda não exista.
    """
    logger.info("Iniciando migração da tabela de Eventos (events)...")
    try:
        Base.metadata.create_all(
            bind=engine,
            tables=[
                Event.__table__,
            ]
        )
        logger.info("Tabela events criada/verificada com sucesso!")

        # Garante sequence e índices do PostgreSQL se aplicável
        with engine.connect() as conn:
            try:
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_events_start_time ON events (start_time);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_events_course_id ON events (course_id);"))
                conn.commit()
            except Exception:
                pass

        logger.info("Migração da tabela events finalizada com êxito.")
    except Exception as exc:
        logger.error(f"Erro durante a migração da tabela events: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
