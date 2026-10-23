"""
Script de migração para adicionar a coluna show_in_sidebar na tabela course_upsell_offers.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger

def migrate_show_in_sidebar():
    logger.info("[MIGRAÇÃO] Verificando coluna show_in_sidebar em course_upsell_offers...")
    try:
        inspector = inspect(engine)
        if "course_upsell_offers" not in inspector.get_table_names():
            logger.info("[MIGRAÇÃO] Tabela course_upsell_offers ainda não existe. Pulando.")
            return

        columns = [c["name"] for c in inspector.get_columns("course_upsell_offers")]
        if "show_in_sidebar" not in columns:
            logger.info("[MIGRAÇÃO] Adicionando coluna show_in_sidebar na tabela course_upsell_offers...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE course_upsell_offers ADD COLUMN show_in_sidebar BOOLEAN NOT NULL DEFAULT FALSE;"))
                conn.commit()
            logger.info("[MIGRAÇÃO] Coluna show_in_sidebar adicionada com sucesso!")
        else:
            logger.info("[MIGRAÇÃO] Coluna show_in_sidebar já existe.")
    except Exception as e:
        logger.error(f"[MIGRAÇÃO] Erro ao adicionar coluna show_in_sidebar: {e}")

if __name__ == "__main__":
    migrate_show_in_sidebar()
