"""
Script de migração para criação das tabelas de Anúncios e Ofertas de Upsell no Curso.
"""
import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from app.core.logger import logger

def run_migration():
    logger.info("[MIGRATE] Iniciando criação das tabelas de Upsell no Curso...")
    with engine.connect() as conn:
        with conn.begin():
            is_postgres = "postgresql" in engine.dialect.name
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS course_upsell_offers (
                        id SERIAL PRIMARY KEY,
                        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                        target_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                        progress_pct INTEGER NOT NULL DEFAULT 35,
                        media_type VARCHAR(20) NOT NULL DEFAULT 'image',
                        media_url TEXT NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        button_text VARCHAR(100) NOT NULL DEFAULT 'Quero Conhecer',
                        button_url TEXT,
                        is_active BOOLEAN NOT NULL DEFAULT TRUE,
                        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS ix_course_upsell_offers_course_id ON course_upsell_offers(course_id);
                    CREATE INDEX IF NOT EXISTS ix_course_upsell_offers_target_course_id ON course_upsell_offers(target_course_id);
                    CREATE INDEX IF NOT EXISTS ix_course_upsell_offers_progress_pct ON course_upsell_offers(progress_pct);

                    CREATE TABLE IF NOT EXISTS course_upsell_views (
                        id SERIAL PRIMARY KEY,
                        offer_id INTEGER NOT NULL REFERENCES course_upsell_offers(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        viewed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        dismissed BOOLEAN NOT NULL DEFAULT TRUE,
                        clicked_at TIMESTAMP WITHOUT TIME ZONE,
                        CONSTRAINT uq_course_upsell_view_user UNIQUE (offer_id, user_id)
                    );
                    CREATE INDEX IF NOT EXISTS ix_course_upsell_views_offer_id ON course_upsell_views(offer_id);
                    CREATE INDEX IF NOT EXISTS ix_course_upsell_views_user_id ON course_upsell_views(user_id);
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS course_upsell_offers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                        target_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                        progress_pct INTEGER NOT NULL DEFAULT 35,
                        media_type VARCHAR(20) NOT NULL DEFAULT 'image',
                        media_url TEXT NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        button_text VARCHAR(100) NOT NULL DEFAULT 'Quero Conhecer',
                        button_url TEXT,
                        is_active BOOLEAN NOT NULL DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS ix_course_upsell_offers_course_id ON course_upsell_offers(course_id);
                    CREATE INDEX IF NOT EXISTS ix_course_upsell_offers_target_course_id ON course_upsell_offers(target_course_id);
                    CREATE INDEX IF NOT EXISTS ix_course_upsell_offers_progress_pct ON course_upsell_offers(progress_pct);

                    CREATE TABLE IF NOT EXISTS course_upsell_views (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        offer_id INTEGER NOT NULL REFERENCES course_upsell_offers(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        dismissed BOOLEAN NOT NULL DEFAULT 1,
                        clicked_at DATETIME,
                        CONSTRAINT uq_course_upsell_view_user UNIQUE (offer_id, user_id)
                    );
                    CREATE INDEX IF NOT EXISTS ix_course_upsell_views_offer_id ON course_upsell_views(offer_id);
                    CREATE INDEX IF NOT EXISTS ix_course_upsell_views_user_id ON course_upsell_views(user_id);
                """))
    logger.info("[MIGRATE] Tabelas de Upsell no Curso verificadas/criadas com sucesso!")

if __name__ == "__main__":
    run_migration()
