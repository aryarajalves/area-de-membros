"""
Script de migração para adicionar a coluna cover_image_position na tabela courses.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger

def migrate_cover_image_position():
    logger.info("[MIGRAÇÃO] Verificando coluna cover_image_position em courses...")
    try:
        inspector = inspect(engine)
        if "courses" not in inspector.get_table_names():
            logger.info("[MIGRAÇÃO] Tabela courses não encontrada. Pulando.")
            return

        columns = [c["name"] for c in inspector.get_columns("courses")]
        if "cover_image_position" not in columns:
            logger.info("[MIGRAÇÃO] Adicionando coluna cover_image_position na tabela courses...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE courses ADD COLUMN cover_image_position INTEGER NOT NULL DEFAULT 50;"))
                conn.commit()
            logger.info("[MIGRAÇÃO] Coluna cover_image_position adicionada com sucesso!")
        else:
            logger.info("[MIGRAÇÃO] Coluna cover_image_position já existe.")
    except Exception as e:
        logger.error(f"[MIGRAÇÃO] Erro ao adicionar coluna cover_image_position: {e}")

if __name__ == "__main__":
    migrate_cover_image_position()
