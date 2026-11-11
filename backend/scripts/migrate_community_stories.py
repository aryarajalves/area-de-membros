"""
Script de migração para criação das tabelas de Stories da Comunidade:
- community_stories
- community_story_views
- community_story_reactions
"""
import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import engine


def migrate():
    print("Iniciando migração das tabelas de Stories da Comunidade...")
    with engine.connect() as conn:
        with conn.begin():
            is_postgres = "postgresql" in engine.dialect.name.lower()
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS community_stories (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        media_url VARCHAR(500) NOT NULL,
                        media_type VARCHAR(20) DEFAULT 'image' NOT NULL,
                        media_thumbnail_url VARCHAR(500) NULL,
                        caption VARCHAR(500) NULL,
                        duration_seconds INTEGER DEFAULT 5 NOT NULL,
                        is_highlight BOOLEAN DEFAULT FALSE NOT NULL,
                        highlight_title VARCHAR(100) NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS ix_community_stories_user_id ON community_stories(user_id);
                    CREATE INDEX IF NOT EXISTS ix_community_stories_expires_at ON community_stories(expires_at);

                    CREATE TABLE IF NOT EXISTS community_story_views (
                        id SERIAL PRIMARY KEY,
                        story_id INTEGER NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        CONSTRAINT uq_story_user_view UNIQUE (story_id, user_id)
                    );
                    CREATE INDEX IF NOT EXISTS ix_community_story_views_story_id ON community_story_views(story_id);
                    CREATE INDEX IF NOT EXISTS ix_community_story_views_user_id ON community_story_views(user_id);

                    CREATE TABLE IF NOT EXISTS community_story_reactions (
                        id SERIAL PRIMARY KEY,
                        story_id INTEGER NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        reaction_type VARCHAR(30) NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS ix_community_story_reactions_story_id ON community_story_reactions(story_id);
                    CREATE INDEX IF NOT EXISTS ix_community_story_reactions_user_id ON community_story_reactions(user_id);
                """))
            else:
                conn.execute(text("CREATE TABLE IF NOT EXISTS community_stories (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, media_url TEXT NOT NULL, media_type VARCHAR(20) DEFAULT 'image' NOT NULL, media_thumbnail_url TEXT NULL, caption VARCHAR(500) NULL, duration_seconds INTEGER DEFAULT 5 NOT NULL, is_highlight BOOLEAN DEFAULT 0 NOT NULL, highlight_title VARCHAR(100) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, expires_at TIMESTAMP NOT NULL)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_stories_user_id ON community_stories(user_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_stories_expires_at ON community_stories(expires_at)"))
                conn.execute(text("CREATE TABLE IF NOT EXISTS community_story_views (id INTEGER PRIMARY KEY AUTOINCREMENT, story_id INTEGER NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT uq_story_user_view UNIQUE (story_id, user_id))"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_story_views_story_id ON community_story_views(story_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_story_views_user_id ON community_story_views(user_id)"))
                conn.execute(text("CREATE TABLE IF NOT EXISTS community_story_reactions (id INTEGER PRIMARY KEY AUTOINCREMENT, story_id INTEGER NOT NULL REFERENCES community_stories(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, reaction_type VARCHAR(30) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_story_reactions_story_id ON community_story_reactions(story_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_story_reactions_user_id ON community_story_reactions(user_id)"))
    print("Migração das tabelas de Stories concluída com sucesso!")


if __name__ == "__main__":
    migrate()
