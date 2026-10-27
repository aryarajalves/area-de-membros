"""
Script de migração para adicionar a coluna bundle_title na tabela courses.
Permite personalizar o título de exibição de pacotes/combos de cursos.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger

def migrate_bundle_title():
    logger.info("[MIGRAÇÃO] Verificando coluna bundle_title em courses...")
    try:
        inspector = inspect(engine)
        if "courses" not in inspector.get_table_names():
            logger.info("[MIGRAÇÃO] Tabela courses não encontrada. Pulando.")
            return

        columns = [c["name"] for c in inspector.get_columns("courses")]
        if "bundle_title" not in columns:
            logger.info("[MIGRAÇÃO] Adicionando coluna bundle_title na tabela courses...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE courses ADD COLUMN bundle_title VARCHAR;"))
                conn.commit()
            logger.info("[MIGRAÇÃO] Coluna bundle_title adicionada com sucesso!")
        else:
            logger.info("[MIGRAÇÃO] Coluna bundle_title já existe.")
    except Exception as e:
        logger.error(f"[MIGRAÇÃO] Erro ao adicionar coluna bundle_title: {e}")

if __name__ == "__main__":
    migrate_bundle_title()
