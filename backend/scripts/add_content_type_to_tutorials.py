"""
Script de migração para adicionar as colunas content_type e text_content na tabela tutorials,
e tornar video_url opcional (DROP NOT NULL) para suporte a tutoriais 100% em texto.
"""
import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.database import engine

def migrate():
    print("Iniciando migração de tutoriais (content_type e text_content)...")
    with engine.begin() as conn:
        dialect = engine.dialect.name
        if dialect == "postgresql":
            conn.execute(text("ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'video';"))
            conn.execute(text("ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS text_content TEXT NULL;"))
            conn.execute(text("ALTER TABLE tutorials ALTER COLUMN video_url DROP NOT NULL;"))
            print("[PostgreSQL] Colunas content_type e text_content adicionadas com sucesso.")
        else:
            try:
                conn.execute(text("ALTER TABLE tutorials ADD COLUMN content_type VARCHAR(50) DEFAULT 'video';"))
            except Exception as e:
                print(f"[SQLite] content_type: {e}")
            try:
                conn.execute(text("ALTER TABLE tutorials ADD COLUMN text_content TEXT;"))
            except Exception as e:
                print(f"[SQLite] text_content: {e}")
            print("[SQLite] Migração concluída.")
    print("Migração concluída com sucesso.")

if __name__ == "__main__":
    migrate()
