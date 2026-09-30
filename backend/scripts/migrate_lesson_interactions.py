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

    print(f"Executando migração para interações de aula (progresso, avaliação e reporte): {db_url.split('@')[-1] if '@' in db_url else db_url}")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        if is_sqlite:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    is_completed BOOLEAN NOT NULL DEFAULT 1,
                    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (lesson_id, user_id)
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_ratings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    rating INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (lesson_id, user_id)
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    issue_type VARCHAR NOT NULL,
                    description TEXT NOT NULL,
                    status VARCHAR NOT NULL DEFAULT 'open',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_progress (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
                    completed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    CONSTRAINT uq_lesson_user_progress UNIQUE (lesson_id, user_id)
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_ratings (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    rating INTEGER NOT NULL,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    CONSTRAINT uq_lesson_user_rating UNIQUE (lesson_id, user_id)
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_reports (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    issue_type VARCHAR NOT NULL,
                    description TEXT NOT NULL,
                    status VARCHAR NOT NULL DEFAULT 'open',
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
                );
            """))

        # Índices
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_progress_lesson_id ON lesson_progress(lesson_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_progress_user_id ON lesson_progress(user_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_ratings_lesson_id ON lesson_ratings(lesson_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_ratings_user_id ON lesson_ratings(user_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_reports_lesson_id ON lesson_reports(lesson_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_reports_user_id ON lesson_reports(user_id);"))

        conn.commit()
        print("Tabelas 'lesson_progress', 'lesson_ratings' e 'lesson_reports' criadas e indexadas com sucesso.")

if __name__ == "__main__":
    migrate()
