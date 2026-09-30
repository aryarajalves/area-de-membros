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

    print(f"Executando migração para 'lesson_attachments': {db_url.split('@')[-1] if '@' in db_url else db_url}")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        if is_sqlite:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_attachments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    title VARCHAR NOT NULL,
                    file_url TEXT NOT NULL,
                    file_type VARCHAR,
                    file_size_bytes INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_attachments (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    title VARCHAR NOT NULL,
                    file_url TEXT NOT NULL,
                    file_type VARCHAR,
                    file_size_bytes BIGINT,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
                );
            """))

        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_attachments_lesson_id ON lesson_attachments(lesson_id);"))
        conn.commit()
        print("Tabela 'lesson_attachments' criada e indexada com sucesso.")

if __name__ == "__main__":
    migrate()
