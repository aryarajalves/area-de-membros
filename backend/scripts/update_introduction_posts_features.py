"""
Script de migração para adicionar colunas de Mídia, Redes Sociais, Matchmaking e Pin na tabela introduction_posts.
Data: 09/11/2026
"""
import sys
import os
from sqlalchemy import text

# Garante path para importar app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import engine
from app.core.logger import logger

def run_migration():
    logger.info("Iniciando migração de colunas adicionais para introduction_posts...")
    statements = [
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS media_type VARCHAR(50) DEFAULT 'none';",
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS media_url TEXT;",
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS video_embed_url TEXT;",
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);",
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);",
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);",
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS website VARCHAR(255);",
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS niche VARCHAR(100);",
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS location VARCHAR(100);",
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS seeking TEXT;",
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS offering TEXT;",
        "ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;",
    ]

    with engine.connect() as conn:
        with conn.begin():
            conn.execute(text("SET lock_timeout = '4s';"))
            for stmt in statements:
                try:
                    conn.execute(text(stmt))
                    logger.info(f"Executado com sucesso: {stmt.split()[0:5]}")
                except Exception as err:
                    logger.warning(f"Erro ao executar '{stmt}': {err}")

    logger.info("Migração de introduction_posts finalizada com sucesso!")

if __name__ == "__main__":
    run_migration()
