"""
Script de migração para Recompensas Pedagógicas por Elo:
Adiciona a coluna required_tier na tabela modules para permitir travar módulos por nível de RPG.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("[MIGRAÇÃO] Iniciando migração de Requisitos de Elo (modules.required_tier)...")
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        if "modules" in table_names:
            module_columns = [c["name"] for c in inspector.get_columns("modules")]
            with engine.connect() as conn:
                if "required_tier" not in module_columns:
                    logger.info("[MIGRAÇÃO] Adicionando coluna required_tier na tabela modules...")
                    conn.execute(text("ALTER TABLE modules ADD COLUMN required_tier VARCHAR(50) NULL;"))
                    conn.commit()
                    logger.info("[MIGRAÇÃO] Coluna required_tier adicionada com sucesso na tabela modules.")
                else:
                    logger.info("[MIGRAÇÃO] Coluna required_tier já existe na tabela modules.")
        else:
            logger.warning("[MIGRAÇÃO] Tabela 'modules' ainda não existe no banco de dados.")

        logger.info("[MIGRAÇÃO] Migração concluída com sucesso!")
        return True
    except Exception as e:
        logger.error(f"[MIGRAÇÃO] Erro ao executar migração de required_tier: {e}")
        return False


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
