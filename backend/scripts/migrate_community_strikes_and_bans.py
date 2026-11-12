import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

def run_migration():
    """
    Cria as colunas community_strikes_count e is_community_banned na tabela users,
    e cria a tabela community_strikes com seus índices.
    """
    print("[MIGRATION] Iniciando migração de community_strikes e bans...")
    with engine.connect() as conn:
        dialect = engine.dialect.name
        print(f"[MIGRATION] Dialeto detectado: {dialect}")

        if dialect == "postgresql":
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS community_strikes_count INTEGER DEFAULT 0 NOT NULL;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_community_banned BOOLEAN DEFAULT FALSE NOT NULL;"))

            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS community_strikes (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    post_id INTEGER REFERENCES community_posts(id) ON DELETE SET NULL,
                    comment_id INTEGER REFERENCES community_post_comments(id) ON DELETE SET NULL,
                    reason VARCHAR(255) NOT NULL,
                    description TEXT NULL,
                    strike_number INTEGER DEFAULT 1 NOT NULL,
                    appeal_status VARCHAR(50) DEFAULT 'none' NOT NULL,
                    appeal_reason TEXT NULL,
                    appeal_reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    appeal_reviewed_at TIMESTAMP WITH TIME ZONE NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_strikes_user_id ON community_strikes(user_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_strikes_moderator_id ON community_strikes(moderator_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_strikes_appeal_status ON community_strikes(appeal_status);"))
            conn.commit()
        else:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN community_strikes_count INTEGER DEFAULT 0 NOT NULL"))
            except Exception as e:
                print(f"[MIGRATION] Coluna community_strikes_count já existe ou erro: {e}")
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_community_banned BOOLEAN DEFAULT 0 NOT NULL"))
            except Exception as e:
                print(f"[MIGRATION] Coluna is_community_banned já existe ou erro: {e}")
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS community_strikes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                        post_id INTEGER REFERENCES community_posts(id) ON DELETE SET NULL,
                        comment_id INTEGER REFERENCES community_post_comments(id) ON DELETE SET NULL,
                        reason VARCHAR(255) NOT NULL,
                        description TEXT NULL,
                        strike_number INTEGER DEFAULT 1 NOT NULL,
                        appeal_status VARCHAR(50) DEFAULT 'none' NOT NULL,
                        appeal_reason TEXT NULL,
                        appeal_reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                        appeal_reviewed_at TIMESTAMP NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_strikes_user_id ON community_strikes(user_id)"))
            except Exception as e:
                print(f"[MIGRATION] Tabela community_strikes já existe ou erro: {e}")
            conn.commit()

        print("[MIGRATION] Migração de community_strikes concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
