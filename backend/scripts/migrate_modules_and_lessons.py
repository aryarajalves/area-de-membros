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

    print(f"Executando migração para 'modules' e 'lessons': {db_url.split('@')[-1] if '@' in db_url else db_url}")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        if is_sqlite:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS modules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    title VARCHAR NOT NULL,
                    description TEXT,
                    order_index INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lessons (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
                    title VARCHAR NOT NULL,
                    description TEXT,
                    video_type VARCHAR DEFAULT 'url',
                    video_url VARCHAR,
                    duration VARCHAR,
                    order_index INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS modules (
                    id SERIAL PRIMARY KEY,
                    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    title VARCHAR NOT NULL,
                    description TEXT,
                    order_index INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
                );
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lessons (
                    id SERIAL PRIMARY KEY,
                    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
                    title VARCHAR NOT NULL,
                    description TEXT,
                    video_type VARCHAR DEFAULT 'url',
                    video_url VARCHAR,
                    duration VARCHAR,
                    order_index INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
                );
            """))

        # Criação de índices
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_modules_course_id ON modules(course_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_modules_order_index ON modules(order_index);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lessons_module_id ON lessons(module_id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lessons_order_index ON lessons(order_index);"))

        conn.commit()
        print("Tabelas 'modules' e 'lessons' criadas e indexadas com sucesso.")

if __name__ == "__main__":
    migrate()
