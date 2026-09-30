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

    print(f"Executando migração de 'thumbnail_url' em 'lessons': {db_url.split('@')[-1] if '@' in db_url else db_url}")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        if is_sqlite:
            cursor = conn.execute(text("PRAGMA table_info(lessons)"))
            columns = [row[1] for row in cursor.fetchall()]
            if "thumbnail_url" not in columns:
                conn.execute(text("ALTER TABLE lessons ADD COLUMN thumbnail_url VARCHAR;"))
                print("Coluna 'thumbnail_url' adicionada no SQLite.")
            else:
                print("Coluna 'thumbnail_url' já existe no SQLite.")
        else:
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'lessons' AND column_name = 'thumbnail_url'
                    ) THEN
                        ALTER TABLE lessons ADD COLUMN thumbnail_url VARCHAR;
                    END IF;
                END
                $$;
            """))
            print("Coluna 'thumbnail_url' adicionada ou já existente no PostgreSQL.")

        conn.commit()
        print("Migração de thumbnail_url em lessons concluída com sucesso.")

if __name__ == "__main__":
    migrate()
