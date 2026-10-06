"""
Script de Migração: Adiciona colunas de duração do áudio, tokens e custos em reais (BRL) e dólares (USD)
na tabela lesson_transcriptions para controle de custos de IA (Whisper + GPT-4o-mini).
"""
import os
import sys
from sqlalchemy import text

# Adicionar a pasta backend ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Iniciando migração: adicionando colunas de métricas e custo na tabela lesson_transcriptions...")

    migration_sql = """
    ALTER TABLE lesson_transcriptions ADD COLUMN IF NOT EXISTS audio_duration_seconds FLOAT;
    ALTER TABLE lesson_transcriptions ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER;
    ALTER TABLE lesson_transcriptions ADD COLUMN IF NOT EXISTS completion_tokens INTEGER;
    ALTER TABLE lesson_transcriptions ADD COLUMN IF NOT EXISTS estimated_cost_usd FLOAT;
    ALTER TABLE lesson_transcriptions ADD COLUMN IF NOT EXISTS estimated_cost_brl FLOAT;
    """

    with engine.begin() as conn:
        conn.execute(text(migration_sql))

    logger.info("Migração concluída com sucesso: colunas de custo adicionadas à tabela lesson_transcriptions.")


if __name__ == "__main__":
    run_migration()
