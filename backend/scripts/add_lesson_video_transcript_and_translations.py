"""
Script de migração para adicionar cache de transcrição por parte em lesson_videos
(transcript_text, transcribed_video_url) e cache de traduções em lesson_transcriptions (translations_json).
"""
import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Adicionando colunas de cache de transcrição por parte e traduções...")
    with engine.connect() as conn:
        with conn.begin():
            is_postgres = "postgresql" in engine.dialect.name
            if is_postgres:
                conn.execute(text("ALTER TABLE lesson_videos ADD COLUMN IF NOT EXISTS transcript_text TEXT;"))
                conn.execute(text("ALTER TABLE lesson_videos ADD COLUMN IF NOT EXISTS transcribed_video_url VARCHAR;"))
                conn.execute(text("ALTER TABLE lesson_transcriptions ADD COLUMN IF NOT EXISTS translations_json TEXT;"))
            else:
                for sql in [
                    "ALTER TABLE lesson_videos ADD COLUMN transcript_text TEXT;",
                    "ALTER TABLE lesson_videos ADD COLUMN transcribed_video_url VARCHAR;",
                    "ALTER TABLE lesson_transcriptions ADD COLUMN translations_json TEXT;"
                ]:
                    try:
                        conn.execute(text(sql))
                    except Exception as e:
                        logger.warning(f"[SQLite] Aviso ao adicionar coluna: {e}")
    logger.info("Migração concluída com sucesso!")


if __name__ == "__main__":
    run_migration()
