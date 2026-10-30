"""
Script de migração para Usabilidade do Player e Classroom:
Adiciona a coluna playback_rate na tabela users para memorizar a velocidade de reprodução do aluno.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("[MIGRAÇÃO] Iniciando migração de Usabilidade do Player (users.playback_rate)...")
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        if "users" in table_names:
            user_columns = [c["name"] for c in inspector.get_columns("users")]
            with engine.connect() as conn:
                if "playback_rate" not in user_columns:
                    logger.info("[MIGRAÇÃO] Adicionando coluna playback_rate na tabela users...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN playback_rate FLOAT DEFAULT 1.0;"))
                    conn.commit()
                    logger.info("[MIGRAÇÃO] Coluna playback_rate adicionada com sucesso na tabela users.")
                else:
                    logger.info("[MIGRAÇÃO] Coluna playback_rate já existe na tabela users.")
        else:
            logger.warning("[MIGRAÇÃO] Tabela 'users' ainda não existe no banco de dados.")

        logger.info("[MIGRAÇÃO] Migração concluída com sucesso!")
        return True
    except Exception as e:
        logger.error(f"[MIGRAÇÃO] Erro ao executar migração de playback_rate: {e}")
        return False


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
