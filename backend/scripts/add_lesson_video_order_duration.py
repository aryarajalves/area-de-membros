"""
Script de migração para adicionar as colunas order_index e duration na tabela lesson_videos.
Permite ordenação e duração de múltiplas partes de vídeo em uma mesma aula.
"""
import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Adicionando colunas 'order_index' e 'duration' em 'lesson_videos'...")
    with engine.connect() as conn:
        with conn.begin():
            is_postgres = "postgresql" in engine.dialect.name
            if is_postgres:
                conn.execute(text("ALTER TABLE lesson_videos ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;"))
                conn.execute(text("ALTER TABLE lesson_videos ADD COLUMN IF NOT EXISTS duration VARCHAR;"))
            else:
                for col in ["order_index INTEGER DEFAULT 0", "duration VARCHAR"]:
                    try:
                        conn.execute(text(f"ALTER TABLE lesson_videos ADD COLUMN {col};"))
                    except Exception as e:
                        logger.warning(f"[SQLite] Aviso ao adicionar coluna: {e}")
    logger.info("Migração de lesson_videos concluída com sucesso!")


if __name__ == "__main__":
    run_migration()
