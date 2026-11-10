"""
Script de migração para adicionar colunas de rastreamento de 1º login e acessos na tabela `users`:
- `first_login_at` (TIMESTAMP WITH TIME ZONE NULL)
- `last_login_at` (TIMESTAMP WITH TIME ZONE NULL)
- `login_count` (INTEGER DEFAULT 0)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Iniciando migração de colunas de 1º login na tabela 'users'...")
    with engine.connect() as conn:
        with conn.begin():
            is_postgres = "postgresql" in engine.dialect.name
            if is_postgres:
                conn.execute(text("""
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE NULL;
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE NULL;
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0 NOT NULL;
                """))
            else:
                for sql in [
                    "ALTER TABLE users ADD COLUMN first_login_at TIMESTAMP NULL",
                    "ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL",
                    "ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0",
                ]:
                    try:
                        conn.execute(text(sql))
                    except Exception:
                        pass
    logger.info("Migração de colunas de 1º login na tabela 'users' concluída com sucesso!")


if __name__ == "__main__":
    run_migration()
