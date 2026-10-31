"""
Script de migração para Controle de Marca d'Água Anti-Pirataria por Curso:
Adiciona a coluna watermark_enabled na tabela courses (default=True).
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("[MIGRAÇÃO] Iniciando migração de Marca d'Água do Curso (courses.watermark_enabled)...")
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        if "courses" in table_names:
            course_columns = [c["name"] for c in inspector.get_columns("courses")]
            with engine.connect() as conn:
                if "watermark_enabled" not in course_columns:
                    logger.info("[MIGRAÇÃO] Adicionando coluna watermark_enabled na tabela courses...")
                    conn.execute(text("ALTER TABLE courses ADD COLUMN watermark_enabled BOOLEAN NOT NULL DEFAULT TRUE;"))
                    conn.commit()
                    logger.info("[MIGRAÇÃO] Coluna watermark_enabled adicionada com sucesso na tabela courses.")
                else:
                    logger.info("[MIGRAÇÃO] Coluna watermark_enabled já existe na tabela courses.")
        else:
            logger.warning("[MIGRAÇÃO] Tabela 'courses' ainda não existe no banco de dados.")

        logger.info("[MIGRAÇÃO] Migração concluída com sucesso!")
        return True
    except Exception as e:
        logger.error(f"[MIGRAÇÃO] Erro ao executar migração de watermark_enabled: {e}")
        return False


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
