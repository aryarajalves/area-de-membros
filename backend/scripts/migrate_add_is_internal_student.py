"""
Script de migração para adicionar a coluna `is_internal_student` na tabela `users`.
Uso: python scripts/migrate_add_is_internal_student.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def migrate():
    is_postgres = "postgresql" in str(engine.url)
    with engine.connect() as conn:
        if is_postgres:
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_internal_student BOOLEAN DEFAULT FALSE NOT NULL;"
            ))
        else:
            try:
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN is_internal_student BOOLEAN DEFAULT 0 NOT NULL"
                ))
            except Exception as exc:
                if "duplicate column" not in str(exc).lower():
                    raise
        conn.commit()
    logger.info("[Migration] Coluna is_internal_student verificada/criada na tabela users.")


if __name__ == "__main__":
    migrate()
