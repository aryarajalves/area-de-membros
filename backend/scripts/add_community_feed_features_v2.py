"""
Script de migração para o Community Feed v2:
- Novas colunas em community_posts: category, poll_question, poll_options, achievement_type, achievement_data
- Novas colunas em community_post_comments: media_type, media_url
- Novas tabelas: community_post_poll_votes, community_post_reports
"""
import os
import sys

# Adiciona o diretório backend ao sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("[MIGRATION] Iniciando migração de recursos do Community Feed v2...")
    with engine.connect() as conn:
        # Colunas de community_posts
        post_cols = [
            ("category", "VARCHAR(50) DEFAULT 'geral'"),
            ("poll_question", "VARCHAR(255)"),
            ("poll_options", "JSON"),
            ("achievement_type", "VARCHAR(50)"),
            ("achievement_data", "JSON"),
        ]
        for col_name, col_type in post_cols:
            try:
                conn.execute(text(f"ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                print(f"  + Coluna community_posts.{col_name} garantida.")
            except Exception as e:
                print(f"  ~ Coluna community_posts.{col_name}: {e}")

        # Índice de categoria
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_posts_category ON community_posts(category);"))
            print("  + Índice ix_community_posts_category garantido.")
        except Exception as e:
            print(f"  ~ Índice ix_community_posts_category: {e}")

        # Colunas de community_post_comments
        comment_cols = [
            ("media_type", "VARCHAR(20) DEFAULT 'text'"),
            ("media_url", "TEXT"),
        ]
        for col_name, col_type in comment_cols:
            try:
                conn.execute(text(f"ALTER TABLE community_post_comments ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                print(f"  + Coluna community_post_comments.{col_name} garantida.")
            except Exception as e:
                print(f"  ~ Coluna community_post_comments.{col_name}: {e}")

        # Tabela community_post_poll_votes
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS community_post_poll_votes (
                    id SERIAL PRIMARY KEY,
                    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    option_id INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_community_post_poll_vote UNIQUE (post_id, user_id)
                );
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_poll_votes_post_id ON community_post_poll_votes(post_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_poll_votes_user_id ON community_post_poll_votes(user_id);"))
            print("  + Tabela community_post_poll_votes e índices garantidos.")
        except Exception as e:
            print(f"  ~ Tabela community_post_poll_votes: {e}")

        # Tabela community_post_reports
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS community_post_reports (
                    id SERIAL PRIMARY KEY,
                    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
                    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    reason VARCHAR(50) NOT NULL,
                    description TEXT,
                    status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_community_post_report UNIQUE (post_id, reporter_id)
                );
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_reports_post_id ON community_post_reports(post_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_community_post_reports_reporter_id ON community_post_reports(reporter_id);"))
            print("  + Tabela community_post_reports e índices garantidos.")
        except Exception as e:
            print(f"  ~ Tabela community_post_reports: {e}")

        conn.commit()
    print("[MIGRATION] Migração do Community Feed v2 concluída com sucesso!")

if __name__ == "__main__":
    migrate()
