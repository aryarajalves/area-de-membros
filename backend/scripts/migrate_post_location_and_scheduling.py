"""
Script de migração para adicionar suporte a localização e agendamento de posts no Feed da Comunidade.
Colunas adicionadas:
  - community_posts.location (VARCHAR(100) NULL)
  - community_posts.scheduled_at (TIMESTAMP NULL)
  - community_posts.is_scheduled (BOOLEAN DEFAULT FALSE/0)
"""
from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    is_sqlite = engine.dialect.name == "sqlite"
    logger.info(f"Iniciando migração de localização e agendamento de postagens (Dialeto: {engine.dialect.name})...")

    with engine.begin() as conn:
        if is_sqlite:
            cols = [r[1] for r in conn.execute(text("PRAGMA table_info(community_posts)")).fetchall()]
            if "location" not in cols:
                conn.execute(text("ALTER TABLE community_posts ADD COLUMN location VARCHAR(100) NULL"))
            if "scheduled_at" not in cols:
                conn.execute(text("ALTER TABLE community_posts ADD COLUMN scheduled_at TIMESTAMP NULL"))
            if "is_scheduled" not in cols:
                conn.execute(text("ALTER TABLE community_posts ADD COLUMN is_scheduled BOOLEAN DEFAULT 0 NOT NULL"))
        else:
            conn.execute(text("""
                ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS location VARCHAR(100) NULL;
                ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE NULL;
                ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE NOT NULL;
                CREATE INDEX IF NOT EXISTS ix_community_posts_scheduled_at ON community_posts(scheduled_at);
                CREATE INDEX IF NOT EXISTS ix_community_posts_is_scheduled ON community_posts(is_scheduled);
            """))

    logger.info("Migração de localização e agendamento de posts concluída com sucesso!")


if __name__ == "__main__":
    run_migration()
