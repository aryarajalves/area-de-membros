"""
Script de migração para criar a tabela de reações em mensagens de chat (chat_message_reactions).
"""
import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine, get_db
from app.core.logger import logger


def run_migration():
    logger.info("Iniciando migração para criar a tabela chat_message_reactions...")
    with engine.connect() as conn:
        with conn.begin():
            if engine.dialect.name == "postgresql":
                # Garantir primary key em chat_messages caso não exista
                conn.execute(text("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint c
                            JOIN pg_class t ON c.conrelid = t.oid
                            WHERE t.relname = 'chat_messages' AND c.contype = 'p'
                        ) THEN
                            ALTER TABLE chat_messages ADD PRIMARY KEY (id);
                        END IF;
                    END $$;

                    CREATE TABLE IF NOT EXISTS chat_message_reactions (
                        id SERIAL PRIMARY KEY,
                        message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        emoji VARCHAR(50) NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        CONSTRAINT uq_chat_message_reaction_user_emoji UNIQUE (message_id, user_id, emoji)
                    );
                    CREATE INDEX IF NOT EXISTS ix_chat_message_reactions_message_id ON chat_message_reactions(message_id);
                    CREATE INDEX IF NOT EXISTS ix_chat_message_reactions_user_id ON chat_message_reactions(user_id);
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS chat_message_reactions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        emoji VARCHAR(50) NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT uq_chat_message_reaction_user_emoji UNIQUE (message_id, user_id, emoji)
                    );
                """))
    logger.info("Migração chat_message_reactions concluída com sucesso.")


if __name__ == "__main__":
    run_migration()
