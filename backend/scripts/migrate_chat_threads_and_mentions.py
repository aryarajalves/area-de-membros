import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger

def run_migration():
    """
    Migração para chat_messages (PK, parent_id) e chat_mentions.
    """
    logger.info("Iniciando migração de chat_threads e chat_mentions...")
    with engine.connect() as conn:
        # 1. Garantir Primary Key em chat_messages
        try:
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conrelid = 'chat_messages'::regclass AND contype = 'p'
                    ) THEN
                        ALTER TABLE chat_messages ADD PRIMARY KEY (id);
                    END IF;
                END $$;
            """))
            conn.commit()
            logger.info("PK de chat_messages verificada/garantida!")
        except Exception as exc:
            logger.warning(f"Aviso ao verificar PK em chat_messages: {exc}")

        # 2. Adicionar coluna parent_id
        try:
            conn.execute(text("""
                ALTER TABLE chat_messages
                ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE;
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_chat_messages_parent_id ON chat_messages(parent_id);
            """))
            conn.commit()
            logger.info("Coluna parent_id e índice criados em chat_messages!")
        except Exception as exc:
            logger.error(f"Erro ao adicionar parent_id em chat_messages: {exc}")

        # 3. Criar tabela chat_mentions
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS chat_mentions (
                    id SERIAL PRIMARY KEY,
                    message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
                    mentioned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    is_read BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_chat_mentions_message_id ON chat_mentions(message_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_chat_mentions_mentioned_user_id ON chat_mentions(mentioned_user_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_chat_mentions_is_read ON chat_mentions(is_read);
            """))
            conn.commit()
            logger.info("Tabela chat_mentions e índices criados com sucesso!")
        except Exception as exc:
            logger.error(f"Erro ao criar chat_mentions: {exc}")

if __name__ == "__main__":
    run_migration()
