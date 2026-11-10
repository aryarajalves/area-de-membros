"""
Script de migração para criar as tabelas do Feed da Comunidade:
- community_posts
- community_post_likes
- community_post_comments
"""
import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.database import engine

def migrate():
    print("Iniciando migração das tabelas do Feed Social da Comunidade...")
    with engine.begin() as conn:
        dialect = engine.dialect.name
        if dialect == "postgresql":
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS community_posts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    course_id INTEGER NULL REFERENCES courses(id) ON DELETE SET NULL,
                    content TEXT NOT NULL,
                    media_urls JSONB NULL,
                    media_type VARCHAR(50) DEFAULT 'none' NOT NULL,
                    likes_count INTEGER DEFAULT 0 NOT NULL,
                    comments_count INTEGER DEFAULT 0 NOT NULL,
                    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                CREATE INDEX IF NOT EXISTS ix_community_posts_user_id ON community_posts(user_id);
                CREATE INDEX IF NOT EXISTS ix_community_posts_course_id ON community_posts(course_id);
                CREATE INDEX IF NOT EXISTS ix_community_posts_created_at ON community_posts(created_at);

                CREATE TABLE IF NOT EXISTS community_post_likes (
                    id SERIAL PRIMARY KEY,
                    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    CONSTRAINT uq_community_post_like UNIQUE (post_id, user_id)
                );
                CREATE INDEX IF NOT EXISTS ix_community_post_likes_post_id ON community_post_likes(post_id);
                CREATE INDEX IF NOT EXISTS ix_community_post_likes_user_id ON community_post_likes(user_id);

                CREATE TABLE IF NOT EXISTS community_post_comments (
                    id SERIAL PRIMARY KEY,
                    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    parent_id INTEGER NULL REFERENCES community_post_comments(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                CREATE INDEX IF NOT EXISTS ix_community_post_comments_post_id ON community_post_comments(post_id);
                CREATE INDEX IF NOT EXISTS ix_community_post_comments_user_id ON community_post_comments(user_id);
                CREATE INDEX IF NOT EXISTS ix_community_post_comments_parent_id ON community_post_comments(parent_id);
            """))
            print("[PostgreSQL] Tabelas e índices do Feed criados com sucesso.")
        else:
            try:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS community_posts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        course_id INTEGER NULL REFERENCES courses(id) ON DELETE SET NULL,
                        content TEXT NOT NULL,
                        media_urls JSON NULL,
                        media_type VARCHAR(50) DEFAULT 'none' NOT NULL,
                        likes_count INTEGER DEFAULT 0 NOT NULL,
                        comments_count INTEGER DEFAULT 0 NOT NULL,
                        is_pinned BOOLEAN DEFAULT 0 NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_posts_user_id ON community_posts(user_id)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_posts_course_id ON community_posts(course_id)"))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS community_post_likes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        CONSTRAINT uq_community_post_like UNIQUE (post_id, user_id)
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_likes_post_id ON community_post_likes(post_id)"))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS community_post_comments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        parent_id INTEGER NULL REFERENCES community_post_comments(id) ON DELETE CASCADE,
                        content TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                    )
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_comments_post_id ON community_post_comments(post_id)"))
                print("[SQLite] Tabelas do Feed criadas com sucesso.")
            except Exception as e:
                print(f"[SQLite] Erro: {e}")
    print("Migração do Feed concluída com sucesso.")

if __name__ == "__main__":
    migrate()
