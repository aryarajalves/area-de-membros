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

    print("Executando migração para adicionar colunas de integração AgentFlow...")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        try:
            if is_sqlite:
                # 1. Tabela courses
                res_courses = conn.execute(text("PRAGMA table_info(courses)")).fetchall()
                cols_courses = [r[1] for r in res_courses]
                if "agentflow_kb_id" not in cols_courses:
                    conn.execute(text("ALTER TABLE courses ADD COLUMN agentflow_kb_id INTEGER;"))
                if "agentflow_kb_name" not in cols_courses:
                    conn.execute(text("ALTER TABLE courses ADD COLUMN agentflow_kb_name VARCHAR(255);"))

                # 2. Tabela modules
                res_modules = conn.execute(text("PRAGMA table_info(modules)")).fetchall()
                cols_modules = [r[1] for r in res_modules]
                if "agentflow_synced_at" not in cols_modules:
                    conn.execute(text("ALTER TABLE modules ADD COLUMN agentflow_synced_at DATETIME;"))

                # 3. Tabela lesson_transcriptions
                res_transcriptions = conn.execute(text("PRAGMA table_info(lesson_transcriptions)")).fetchall()
                cols_transcriptions = [r[1] for r in res_transcriptions]
                if "agentflow_kb_id" not in cols_transcriptions:
                    conn.execute(text("ALTER TABLE lesson_transcriptions ADD COLUMN agentflow_kb_id INTEGER;"))
                if "agentflow_synced_at" not in cols_transcriptions:
                    conn.execute(text("ALTER TABLE lesson_transcriptions ADD COLUMN agentflow_synced_at DATETIME;"))

                conn.commit()
                print("Colunas do AgentFlow adicionadas com sucesso no SQLite.")
            else:
                # PostgreSQL
                conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS agentflow_kb_id INTEGER;"))
                conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS agentflow_kb_name VARCHAR(255);"))
                conn.execute(text("ALTER TABLE modules ADD COLUMN IF NOT EXISTS agentflow_synced_at TIMESTAMP WITH TIME ZONE;"))
                conn.execute(text("ALTER TABLE lesson_transcriptions ADD COLUMN IF NOT EXISTS agentflow_kb_id INTEGER;"))
                conn.execute(text("ALTER TABLE lesson_transcriptions ADD COLUMN IF NOT EXISTS agentflow_synced_at TIMESTAMP WITH TIME ZONE;"))
                conn.commit()
                print("Colunas do AgentFlow adicionadas com sucesso no PostgreSQL.")
        except Exception as e:
            print(f"Erro ao executar migração: {e}")

if __name__ == "__main__":
    migrate()
