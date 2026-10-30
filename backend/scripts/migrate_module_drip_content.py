"""
Script de migração para o Sistema de Liberação Programada de Módulos (Drip Content):
Adiciona as colunas release_type, release_days e release_date na tabela modules.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("[MIGRAÇÃO] Iniciando migração de Liberação Programada de Módulos (Drip Content)...")
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        if "modules" in table_names:
            module_columns = [c["name"] for c in inspector.get_columns("modules")]
            with engine.connect() as conn:
                if "release_type" not in module_columns:
                    logger.info("[MIGRAÇÃO] Adicionando coluna release_type na tabela modules...")
                    conn.execute(text("ALTER TABLE modules ADD COLUMN release_type VARCHAR(50) DEFAULT 'immediate';"))
                if "release_days" not in module_columns:
                    logger.info("[MIGRAÇÃO] Adicionando coluna release_days na tabela modules...")
                    conn.execute(text("ALTER TABLE modules ADD COLUMN release_days INTEGER DEFAULT 0;"))
                if "release_date" not in module_columns:
                    logger.info("[MIGRAÇÃO] Adicionando coluna release_date na tabela modules...")
                    conn.execute(text("ALTER TABLE modules ADD COLUMN release_date TIMESTAMP WITH TIME ZONE NULL;"))
                conn.commit()
                logger.info("[MIGRAÇÃO] Colunas de Drip Content verificadas/adicionadas com sucesso na tabela modules.")
        else:
            logger.warning("[MIGRAÇÃO] Tabela 'modules' ainda não existe no banco de dados.")

        logger.info("[MIGRAÇÃO] Migração de Drip Content concluída com sucesso!")
        return True
    except Exception as e:
        logger.error(f"[MIGRAÇÃO] Erro ao executar migração de Drip Content: {e}")
        return False


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
