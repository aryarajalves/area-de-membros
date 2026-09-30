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

    print(f"Executando migração de 'parent_id' em 'lesson_comments': {db_url.split('@')[-1] if '@' in db_url else db_url}")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        if is_sqlite:
            cursor = conn.execute(text("PRAGMA table_info(lesson_comments)"))
            columns = [row[1] for row in cursor.fetchall()]
            if "parent_id" not in columns:
                conn.execute(text("ALTER TABLE lesson_comments ADD COLUMN parent_id INTEGER REFERENCES lesson_comments(id) ON DELETE CASCADE;"))
                print("Coluna 'parent_id' adicionada no SQLite.")
            else:
                print("Coluna 'parent_id' já existe no SQLite.")
        else:
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'lesson_comments' AND column_name = 'parent_id'
                    ) THEN
                        ALTER TABLE lesson_comments ADD COLUMN parent_id INTEGER REFERENCES lesson_comments(id) ON DELETE CASCADE;
                    END IF;
                END
                $$;
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_lesson_comments_parent_id ON lesson_comments(parent_id);"))
            print("Coluna 'parent_id' adicionada ou já existente no PostgreSQL.")

        conn.commit()
        print("Migração concluída com sucesso.")

if __name__ == "__main__":
    migrate()
