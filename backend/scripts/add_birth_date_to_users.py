"""
Script de migração para adicionar a coluna `birth_date` na tabela `users`:
- `birth_date` (DATE NULL)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Iniciando migração de coluna birth_date na tabela 'users'...")
    with engine.connect() as conn:
        with conn.begin():
            is_postgres = "postgresql" in engine.dialect.name
            if is_postgres:
                conn.execute(text("SET lock_timeout = '4s';"))
                conn.execute(text("SET statement_timeout = '10s';"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;"))
            else:
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN birth_date DATE"))
                except Exception:
                    pass
    logger.info("Migração de coluna birth_date na tabela 'users' concluída com sucesso!")


if __name__ == "__main__":
    run_migration()
