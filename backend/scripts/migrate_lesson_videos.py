import os
import sys
from sqlalchemy import create_engine, text

# Adiciona o diretório atual do backend ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def migrate():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    connect_args = {}
    is_sqlite = db_url.startswith("sqlite")
    if is_sqlite:
        connect_args = {"check_same_thread": False}

    print(f"Executando migração para 'lesson_videos': {db_url.split('@')[-1] if '@' in db_url else db_url}")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        if is_sqlite:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_videos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    language VARCHAR(20) NOT NULL DEFAULT 'pt',
                    language_label VARCHAR(100) NOT NULL DEFAULT 'Português',
                    video_url TEXT NOT NULL,
                    video_type VARCHAR(50) DEFAULT 'upload',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_videos (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    language VARCHAR(20) NOT NULL DEFAULT 'pt',
                    language_label VARCHAR(100) NOT NULL DEFAULT 'Português',
                    video_url TEXT NOT NULL,
                    video_type VARCHAR(50) DEFAULT 'upload',
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
                );
            """))

        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_videos_lesson_id ON lesson_videos(lesson_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_videos_language ON lesson_videos(language);"))

        # Migrar vídeos legados de lessons que já possuem video_url e ainda não estão em lesson_videos
        conn.execute(text("""
            INSERT INTO lesson_videos (lesson_id, language, language_label, video_url, video_type)
            SELECT l.id, 'pt', 'Português', l.video_url, COALESCE(l.video_type, 'upload')
            FROM lessons l
            WHERE l.video_url IS NOT NULL 
              AND l.video_url != ''
              AND NOT EXISTS (
                  SELECT 1 FROM lesson_videos lv WHERE lv.lesson_id = l.id
              );
        """))

        conn.commit()
        print("Tabela 'lesson_videos' criada, indexada e sincronizada com sucesso.")

if __name__ == "__main__":
    migrate()
