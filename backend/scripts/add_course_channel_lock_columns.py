"""
Script de migração para adicionar colunas de bloqueio independente de canais, chats e suporte na tabela `courses`:
- `channel_release_type` (VARCHAR(50) DEFAULT 'immediate')
- `channel_release_date` (TIMESTAMP WITH TIME ZONE NULL)
- `locked_channels_json` (TEXT NULL)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Iniciando migração das colunas de bloqueio de canais na tabela 'courses'...")
    with engine.connect() as conn:
        with conn.begin():
            is_postgres = "postgresql" in engine.dialect.name
            if is_postgres:
                conn.execute(text("""
                    ALTER TABLE courses ADD COLUMN IF NOT EXISTS channel_release_type VARCHAR(50) DEFAULT 'immediate';
                    ALTER TABLE courses ADD COLUMN IF NOT EXISTS channel_release_date TIMESTAMP WITH TIME ZONE NULL;
                    ALTER TABLE courses ADD COLUMN IF NOT EXISTS locked_channels_json TEXT NULL;
                """))
            else:
                for sql in [
                    "ALTER TABLE courses ADD COLUMN channel_release_type VARCHAR(50) DEFAULT 'immediate'",
                    "ALTER TABLE courses ADD COLUMN channel_release_date TIMESTAMP NULL",
                    "ALTER TABLE courses ADD COLUMN locked_channels_json TEXT NULL",
                ]:
                    try:
                        conn.execute(text(sql))
                    except Exception:
                        pass
    logger.info("Migração de bloqueio de canais em 'courses' concluída com sucesso!")


if __name__ == "__main__":
    run_migration()
