"""
Script de migração para adicionar a coluna media_thumbnail_url na tabela community_posts
Data: 2026-11-10
"""
from sqlalchemy import text
from app.core.database import engine

def run_migration():
    print("[MIGRATION] Adicionando coluna media_thumbnail_url em community_posts...")
    is_postgres = engine.dialect.name == "postgresql"

    with engine.begin() as conn:
        if is_postgres:
            conn.execute(text("""
                ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS media_thumbnail_url TEXT;
            """))
        else:
            try:
                conn.execute(text("""
                    ALTER TABLE community_posts ADD COLUMN media_thumbnail_url TEXT;
                """))
            except Exception as e:
                print(f"[MIGRATION] Coluna já existe ou aviso no SQLite: {e}")
    print("[MIGRATION] Coluna media_thumbnail_url adicionada/verificada com sucesso!")

if __name__ == "__main__":
    run_migration()
