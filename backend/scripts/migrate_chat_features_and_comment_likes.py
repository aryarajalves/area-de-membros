import sys
import os

# Adiciona o diretório raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    """
    Executa migrações para:
    1. Colunas de mídia e fixação em 'chat_messages' (media_url, media_type, is_pinned, pinned_at, pinned_by_user_id).
    2. Tabela 'chat_message_likes' (curtidas em mensagens do chat).
    3. Tabela 'chat_message_favorites' (mensagens favoritadas do chat).
    4. Tabela 'lesson_comment_likes' (curtidas em comentários de aulas).
    Compatível com SQLite e PostgreSQL.
    """
    logger.info("Iniciando migração de recursos de chat (mídia, fixação, curtidas, favoritos) e curtidas de comentários...")

    with engine.begin() as conn:
        dialect_name = engine.dialect.name
        logger.info(f"Dialeto detectado: {dialect_name}")

        # 1. Colunas em chat_messages
        columns_to_add = [
            ("media_url", "VARCHAR(500)"),
            ("media_type", "VARCHAR(50)"),
            ("is_pinned", "BOOLEAN DEFAULT FALSE NOT NULL"),
            ("pinned_at", "TIMESTAMP WITH TIME ZONE"),
            ("pinned_by_user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL")
        ]

        for col_name, col_type in columns_to_add:
            try:
                sql = text(f"ALTER TABLE chat_messages ADD COLUMN {col_name} {col_type};")
                conn.execute(sql)
                logger.info(f"Coluna '{col_name}' adicionada em 'chat_messages'.")
            except Exception as exc:
                err_str = str(exc).lower()
                if "already exists" in err_str or "duplicate column" in err_str:
                    logger.info(f"Coluna '{col_name}' já existe em 'chat_messages'.")
                else:
                    logger.warning(f"Aviso ao adicionar coluna '{col_name}': {exc}")

        # Criação de índice para is_pinned
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_messages_is_pinned ON chat_messages(is_pinned);"))
        except Exception as exc:
            logger.warning(f"Aviso ao criar índice ix_chat_messages_is_pinned: {exc}")

        # 2. Tabela chat_message_likes
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS chat_message_likes (
                    id SERIAL PRIMARY KEY,
                    message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_message_like_user
                ON chat_message_likes(message_id, user_id);
            """))
            logger.info("Tabela 'chat_message_likes' pronta.")
        except Exception as exc:
            logger.error(f"Erro ao criar 'chat_message_likes': {exc}")
            raise exc

        # 3. Tabela chat_message_favorites
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS chat_message_favorites (
                    id SERIAL PRIMARY KEY,
                    message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_message_favorite_user
                ON chat_message_favorites(message_id, user_id);
            """))
            logger.info("Tabela 'chat_message_favorites' pronta.")
        except Exception as exc:
            logger.error(f"Erro ao criar 'chat_message_favorites': {exc}")
            raise exc

        # 4. Tabela lesson_comment_likes
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lesson_comment_likes (
                    id SERIAL PRIMARY KEY,
                    comment_id INTEGER NOT NULL REFERENCES lesson_comments(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_lesson_comment_like_user
                ON lesson_comment_likes(comment_id, user_id);
            """))
            logger.info("Tabela 'lesson_comment_likes' pronta.")
        except Exception as exc:
            logger.error(f"Erro ao criar 'lesson_comment_likes': {exc}")
            raise exc

    logger.info("Migração concluída com sucesso!")


if __name__ == "__main__":
    run_migration()
