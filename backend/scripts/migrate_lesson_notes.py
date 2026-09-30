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

    print(f"Executando migração para a tabela 'lesson_notes' (Anotações Pessoais do Aluno)...")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        try:
            if is_sqlite:
                conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    content TEXT NOT NULL DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_lesson_user_note UNIQUE (lesson_id, user_id)
                );
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_notes_lesson_id ON lesson_notes (lesson_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_notes_user_id ON lesson_notes (user_id);"))
                conn.commit()
                print("Tabela 'lesson_notes' criada com sucesso no SQLite.")
            else:
                conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_notes (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    content TEXT NOT NULL DEFAULT '',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_lesson_user_note UNIQUE (lesson_id, user_id)
                );
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_notes_lesson_id ON lesson_notes (lesson_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_notes_user_id ON lesson_notes (user_id);"))
                conn.commit()
                print("Tabela 'lesson_notes' criada com sucesso no PostgreSQL.")
        except Exception as e:
            print(f"Erro durante a migração de lesson_notes: {e}")

if __name__ == "__main__":
    migrate()
