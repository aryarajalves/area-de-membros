"""
Script de migração para criação da tabela community_post_views e coluna views_count
Data: 2026-11-10
"""
from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("[MIGRATION] Verificando e criando tabela community_post_views...")
    is_postgres = engine.dialect.name == "postgresql"
    with engine.begin() as conn:
        if is_postgres:
            conn.execute(text("""
                ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0 NOT NULL;

                CREATE TABLE IF NOT EXISTS community_post_views (
                    id SERIAL PRIMARY KEY,
                    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    CONSTRAINT uq_community_post_view UNIQUE (post_id, user_id)
                );
                CREATE INDEX IF NOT EXISTS ix_community_post_views_post_id ON community_post_views(post_id);
                CREATE INDEX IF NOT EXISTS ix_community_post_views_user_id ON community_post_views(user_id);
            """))
        else:
            try:
                conn.execute(text("ALTER TABLE community_posts ADD COLUMN views_count INTEGER DEFAULT 0 NOT NULL"))
            except Exception:
                pass
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS community_post_views (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    CONSTRAINT uq_community_post_view UNIQUE (post_id, user_id)
                );
            """))
            try:
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_views_post_id ON community_post_views(post_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_views_user_id ON community_post_views(user_id);"))
            except Exception:
                pass
    print("[MIGRATION] Tabela community_post_views e coluna views_count criadas com sucesso!")

if __name__ == "__main__":
    migrate()
