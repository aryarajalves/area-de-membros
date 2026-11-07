"""
Script de migração para adicionar a coluna course_ids_json na tabela events,
permitindo que eventos exclusivos sejam liberados para múltiplos cursos simultaneamente.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def migrate_event_multiple_courses():
    logger.info("[MIGRAÇÃO] Verificando coluna course_ids_json na tabela 'events'...")
    is_postgres = "postgresql" in str(engine.url)

    with engine.begin() as conn:
        if is_postgres:
            conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS course_ids_json TEXT NULL;"))
        else:
            try:
                conn.execute(text("ALTER TABLE events ADD COLUMN course_ids_json TEXT NULL"))
            except Exception:
                pass

    logger.info("[MIGRAÇÃO] Coluna course_ids_json sincronizada em 'events' com sucesso!")


if __name__ == "__main__":
    migrate_event_multiple_courses()
