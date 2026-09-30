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

    print(f"Executando migração para adicionar 'description' em 'lesson_attachments'...")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        try:
            if is_sqlite:
                # No SQLite, verifica se a coluna já existe antes de rodar ALTER TABLE
                res = conn.execute(text("PRAGMA table_info(lesson_attachments)")).fetchall()
                existing_cols = [r[1] for r in res]
                if "description" not in existing_cols:
                    conn.execute(text("ALTER TABLE lesson_attachments ADD COLUMN description TEXT;"))
                    conn.commit()
                    print("Coluna 'description' adicionada com sucesso no SQLite.")
                else:
                    print("Coluna 'description' já existe no SQLite.")
            else:
                conn.execute(text("ALTER TABLE lesson_attachments ADD COLUMN IF NOT EXISTS description TEXT;"))
                conn.commit()
                print("Coluna 'description' adicionada com sucesso no PostgreSQL.")
        except Exception as e:
            print(f"Erro ao executar migração: {e}")

if __name__ == "__main__":
    migrate()
