"""
Script de migração para criação da tabela community_follows
Data: 2026-11-10
"""
from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("[MIGRATION] Verificando e criando tabela community_follows...")
    is_postgres = engine.dialect.name == "postgresql"
    with engine.begin() as conn:
        if is_postgres:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS community_follows (
                    id SERIAL PRIMARY KEY,
                    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    CONSTRAINT uq_community_follow UNIQUE (follower_id, following_id)
                );
                CREATE INDEX IF NOT EXISTS ix_community_follows_follower_id ON community_follows(follower_id);
                CREATE INDEX IF NOT EXISTS ix_community_follows_following_id ON community_follows(following_id);
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS community_follows (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    CONSTRAINT uq_community_follow UNIQUE (follower_id, following_id)
                );
            """))
            try:
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_follows_follower_id ON community_follows(follower_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_follows_following_id ON community_follows(following_id);"))
            except Exception:
                pass
    print("[MIGRATION] Tabela community_follows criada/verificada com sucesso!")

if __name__ == "__main__":
    migrate()
