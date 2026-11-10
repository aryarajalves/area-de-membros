"""
Script de migração para criar a tabela community_notifications
Data: 2026-11-10
"""
from sqlalchemy import text
from app.core.database import engine

def run_migration():
    print("[MIGRATION] Iniciando criação da tabela community_notifications...")
    is_postgres = engine.dialect.name == "postgresql"

    with engine.begin() as conn:
        if is_postgres:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS community_notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    actor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    notification_type VARCHAR(50) NOT NULL,
                    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
                    comment_id INTEGER REFERENCES community_post_comments(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    message TEXT,
                    is_read BOOLEAN DEFAULT FALSE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                CREATE INDEX IF NOT EXISTS ix_community_notifications_user_id ON community_notifications(user_id);
                CREATE INDEX IF NOT EXISTS ix_community_notifications_actor_id ON community_notifications(actor_id);
                CREATE INDEX IF NOT EXISTS ix_community_notifications_post_id ON community_notifications(post_id);
                CREATE INDEX IF NOT EXISTS ix_community_notifications_is_read ON community_notifications(is_read);
                CREATE INDEX IF NOT EXISTS ix_community_notifications_type ON community_notifications(notification_type);
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS community_notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    actor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    notification_type VARCHAR(50) NOT NULL,
                    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
                    comment_id INTEGER REFERENCES community_post_comments(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    message TEXT,
                    is_read BOOLEAN DEFAULT 0 NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                CREATE INDEX IF NOT EXISTS ix_community_notifications_user_id ON community_notifications(user_id);
                CREATE INDEX IF NOT EXISTS ix_community_notifications_is_read ON community_notifications(is_read);
            """))
    print("[MIGRATION] Tabela community_notifications criada/verificada com sucesso!")

if __name__ == "__main__":
    run_migration()
