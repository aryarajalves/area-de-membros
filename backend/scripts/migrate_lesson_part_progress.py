"""
Script de migração manual para adicionar a coluna `completed_video_ids_json`
na tabela `lesson_progress` (rastreamento individual de partes concluídas por aula).
"""
import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    is_postgres = "postgresql" in engine.dialect.name
    with engine.connect() as conn:
        with conn.begin():
            if is_postgres:
                conn.execute(text("ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS completed_video_ids_json TEXT NULL;"))
            else:
                try:
                    conn.execute(text("ALTER TABLE lesson_progress ADD COLUMN completed_video_ids_json TEXT NULL"))
                except Exception:
                    pass
    logger.info("[MIGRATION] Coluna lesson_progress.completed_video_ids_json verificada/criada com sucesso.")


if __name__ == "__main__":
    run_migration()
