"""
Script de migração para adicionar colunas de Liberação Programada (Drip Content / 7 dias da garantia)
individualmente por Aula (tabela lessons).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def migrate_lesson_drip_content():
    logger.info("[MIGRAÇÃO] Verificando colunas de Drip Content na tabela 'lessons'...")
    is_postgres = "postgresql" in str(engine.url)

    with engine.begin() as conn:
        if is_postgres:
            conn.execute(text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS release_type VARCHAR(50) DEFAULT 'immediate';"))
            conn.execute(text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS release_days INTEGER DEFAULT 0;"))
            conn.execute(text("ALTER TABLE lessons ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE NULL;"))
        else:
            for sql in [
                "ALTER TABLE lessons ADD COLUMN release_type VARCHAR(50) DEFAULT 'immediate'",
                "ALTER TABLE lessons ADD COLUMN release_days INTEGER DEFAULT 0",
                "ALTER TABLE lessons ADD COLUMN release_date TIMESTAMP NULL",
            ]:
                try:
                    conn.execute(text(sql))
                except Exception:
                    pass

    logger.info("[MIGRAÇÃO] Colunas release_type, release_days e release_date sincronizadas em 'lessons' com sucesso!")


if __name__ == "__main__":
    migrate_lesson_drip_content()
