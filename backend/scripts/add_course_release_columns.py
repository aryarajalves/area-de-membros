"""
Script de migração para adicionar colunas de Fechamento e Liberação Programada por Data e Hora
na tabela courses (release_type e release_date).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def migrate_course_release_columns():
    logger.info("[MIGRAÇÃO] Verificando colunas release_type e release_date na tabela 'courses'...")
    is_postgres = "postgresql" in str(engine.url)

    with engine.begin() as conn:
        if is_postgres:
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS release_type VARCHAR(50) DEFAULT 'immediate';"))
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE NULL;"))
        else:
            for sql in [
                "ALTER TABLE courses ADD COLUMN release_type VARCHAR(50) DEFAULT 'immediate'",
                "ALTER TABLE courses ADD COLUMN release_date TIMESTAMP NULL",
            ]:
                try:
                    conn.execute(text(sql))
                except Exception:
                    pass

    logger.info("[MIGRAÇÃO] Colunas release_type e release_date sincronizadas em 'courses' com sucesso!")


if __name__ == "__main__":
    migrate_course_release_columns()
