"""
Script de Migração: Adiciona coluna chapters na tabela lesson_transcriptions
para armazenar a lista de minutagem / capítulos em JSON (ex: [{"time": "00:00", "seconds": 0, "title": "Introdução"}]).
"""
import os
import sys
from sqlalchemy import text

# Adicionar a pasta backend ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Iniciando migração: adicionando coluna chapters na tabela lesson_transcriptions...")

    migration_sql = """
    ALTER TABLE lesson_transcriptions ADD COLUMN IF NOT EXISTS chapters TEXT;
    """

    with engine.begin() as conn:
        conn.execute(text(migration_sql))

    logger.info("Migração concluída com sucesso: coluna chapters adicionada à tabela lesson_transcriptions.")


if __name__ == "__main__":
    run_migration()
