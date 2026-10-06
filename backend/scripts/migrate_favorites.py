import os
import sys

# Adiciona o diretório backend ao sys.path para permitir importações relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger

def run_migration():
    """
    Cria as tabelas lesson_favorites e lesson_comment_favorites caso ainda não existam.
    Garante também que a tabela lesson_comments possua chave primária em id.
    Compatível com SQLite e PostgreSQL.
    """
    logger.info("Iniciando migração para tabelas de favoritos (aulas e comentários)...")
    with engine.connect() as conn:
        # Garante Primary Key em lesson_comments se não houver
        try:
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conrelid = 'lesson_comments'::regclass AND contype = 'p'
                    ) THEN
                        ALTER TABLE lesson_comments ADD PRIMARY KEY (id);
                    END IF;
                END $$;
            """))
            conn.commit()
        except Exception as exc:
            logger.warning(f"Aviso ao verificar PK em lesson_comments: {exc}")

        # 1. Tabela lesson_favorites
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS lesson_favorites (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_lesson_favorite_user UNIQUE (lesson_id, user_id)
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_lesson_favorites_lesson_id ON lesson_favorites (lesson_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_lesson_favorites_user_id ON lesson_favorites (user_id);
        """))

        # 2. Tabela lesson_comment_favorites
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS lesson_comment_favorites (
                id SERIAL PRIMARY KEY,
                comment_id INTEGER NOT NULL REFERENCES lesson_comments(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_lesson_comment_favorite_user UNIQUE (comment_id, user_id)
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_lesson_comment_favorites_comment_id ON lesson_comment_favorites (comment_id);
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_lesson_comment_favorites_user_id ON lesson_comment_favorites (user_id);
        """))

        conn.commit()
    logger.info("Migração de tabelas de favoritos concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
