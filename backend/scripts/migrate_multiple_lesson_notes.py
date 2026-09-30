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

    print(f"Executando migração para permitir múltiplas anotações (badges) por aluno...")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        try:
            if not is_sqlite:
                conn.execute(text("ALTER TABLE lesson_notes DROP CONSTRAINT IF EXISTS uq_lesson_user_note;"))
                conn.commit()
                print("Constraint 'uq_lesson_user_note' removida com sucesso no PostgreSQL.")
            else:
                print("SQLite em execução (sem necessidade de drop constraint direta).")
        except Exception as e:
            print(f"Erro ou aviso durante a migração de lesson_notes: {e}")

if __name__ == "__main__":
    migrate()
