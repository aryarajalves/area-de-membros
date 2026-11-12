import os
import sys

# Garante path do backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

def run_migration():
    """
    Adiciona as colunas bookmarks_count e shares_count na tabela community_posts
    e sincroniza a contagem inicial de bookmarks_count.
    """
    print("[MIGRATION] Iniciando migração de shares_count e bookmarks_count em community_posts...")
    with engine.connect() as conn:
        dialect = engine.dialect.name
        print(f"[MIGRATION] Dialeto detectado: {dialect}")

        if dialect == "postgresql":
            conn.execute(text("ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS bookmarks_count INTEGER DEFAULT 0 NOT NULL;"))
            conn.execute(text("ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0 NOT NULL;"))
            # Sincroniza a contagem inicial de bookmarks baseada nos registros existentes
            conn.execute(text("""
                UPDATE community_posts
                SET bookmarks_count = (
                    SELECT COUNT(*) FROM community_post_bookmarks WHERE community_post_bookmarks.post_id = community_posts.id
                );
            """))
            conn.commit()
        else:
            try:
                conn.execute(text("ALTER TABLE community_posts ADD COLUMN bookmarks_count INTEGER DEFAULT 0 NOT NULL"))
            except Exception as e:
                print(f"[MIGRATION] Coluna bookmarks_count já existe ou erro: {e}")
            try:
                conn.execute(text("ALTER TABLE community_posts ADD COLUMN shares_count INTEGER DEFAULT 0 NOT NULL"))
            except Exception as e:
                print(f"[MIGRATION] Coluna shares_count já existe ou erro: {e}")
            conn.commit()

        print("[MIGRATION] Migração de shares_count e bookmarks_count concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
