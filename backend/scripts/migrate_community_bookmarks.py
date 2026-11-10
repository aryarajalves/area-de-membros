"""
Script de migração para criar a tabela community_post_bookmarks (Salvar posts nos favoritos).
"""
import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.database import engine

def migrate():
    print("Iniciando migração da tabela community_post_bookmarks...")
    with engine.begin() as conn:
        dialect = engine.dialect.name
        if dialect == "postgresql":
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS community_post_bookmarks (
                    id SERIAL PRIMARY KEY,
                    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    CONSTRAINT uq_community_post_bookmark UNIQUE (post_id, user_id)
                );
                CREATE INDEX IF NOT EXISTS ix_community_post_bookmarks_post_id ON community_post_bookmarks(post_id);
                CREATE INDEX IF NOT EXISTS ix_community_post_bookmarks_user_id ON community_post_bookmarks(user_id);
            """))
            print("[PostgreSQL] Tabela community_post_bookmarks criada com sucesso.")
        else:
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS community_post_bookmarks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        CONSTRAINT uq_community_post_bookmark UNIQUE (post_id, user_id)
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_bookmarks_post_id ON community_post_bookmarks(post_id)"))
                print("[SQLite] Tabela community_post_bookmarks criada com sucesso.")
            except Exception as e:
                print(f"[SQLite] Erro: {e}")
    print("Migração concluída.")

if __name__ == "__main__":
    migrate()
