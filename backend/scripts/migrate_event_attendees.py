import sys
import os

# Adiciona o diretório raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine, Base
from app.models.event import EventAttendee
from app.core.logger import logger


def run_migration():
    """
    Cria a tabela de Inscrições/Presença em Eventos (event_attendees) caso ainda não exista.
    """
    logger.info("Iniciando migração da tabela de Inscrições em Eventos (event_attendees)...")
    try:
        Base.metadata.create_all(
            bind=engine,
            tables=[
                EventAttendee.__table__,
            ]
        )
        logger.info("Tabela event_attendees criada/verificada com sucesso!")

        with engine.connect() as conn:
            try:
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_event_attendees_event_id ON event_attendees (event_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_event_attendees_user_id ON event_attendees (user_id);"))
                conn.commit()
            except Exception:
                pass

        logger.info("Migração da tabela event_attendees finalizada com êxito.")
    except Exception as exc:
        logger.error(f"Erro durante a migração da tabela event_attendees: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
