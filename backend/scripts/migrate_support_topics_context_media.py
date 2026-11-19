"""Script de migração para adicionar image_urls_json, module_id, lesson_id, module_title e lesson_title em support_topics."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    dialect = engine.dialect.name
    cols = [
        ("image_urls_json", "TEXT"),
        ("module_id", "INTEGER"),
        ("lesson_id", "INTEGER"),
        ("module_title", "VARCHAR(255)"),
        ("lesson_title", "VARCHAR(255)"),
    ]
    with engine.connect() as conn:
        for col_name, col_type in cols:
            try:
                if dialect == "postgresql":
                    conn.execute(text(f"ALTER TABLE support_topics ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                else:
                    conn.execute(text(f"ALTER TABLE support_topics ADD COLUMN {col_name} {col_type}"))
            except Exception:
                pass
        conn.commit()
    logger.info("[MIGRATION] Colunas de contexto e múltiplas mídias em support_topics verificadas/criadas com sucesso.")


if __name__ == "__main__":
    run_migration()
