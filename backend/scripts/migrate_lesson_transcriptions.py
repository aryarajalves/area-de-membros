"""
Script de Migração: Cria a tabela lesson_transcriptions para armazenar
transcrições completas do Whisper e resumos executivos/HTML da OpenAI.
"""
import os
import sys
from sqlalchemy import text

# Adicionar a pasta backend ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Iniciando migração: criação da tabela lesson_transcriptions...")

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS lesson_transcriptions (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
        full_transcript TEXT NOT NULL,
        summary_html TEXT,
        summary_markdown TEXT,
        key_takeaways TEXT,
        status VARCHAR(50) DEFAULT 'ready',
        error_message TEXT,
        generated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS ix_lesson_transcriptions_id ON lesson_transcriptions(id);
    CREATE INDEX IF NOT EXISTS ix_lesson_transcriptions_lesson_id ON lesson_transcriptions(lesson_id);
    """

    with engine.begin() as conn:
        conn.execute(text(create_table_sql))

    logger.info("Migração concluída com sucesso: tabela lesson_transcriptions criada.")


if __name__ == "__main__":
    run_migration()
