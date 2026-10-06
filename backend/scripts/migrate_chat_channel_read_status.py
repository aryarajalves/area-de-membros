"""
Script de migração para a tabela chat_channel_read_status:
- Cria a tabela se não existir
- Índices em user_id e channel_id
- Unique constraint em (user_id, channel_id)
"""
from app.core.database import engine
from sqlalchemy import text
from app.core.logger import logger

def migrate_chat_channel_read_status():
    with engine.connect() as conn:
        logger.info("Criando tabela chat_channel_read_status caso não exista...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_channel_read_status (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                channel_id VARCHAR(50) NOT NULL,
                last_read_message_id INTEGER NOT NULL DEFAULT 0,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_chat_channel_read_user UNIQUE (user_id, channel_id)
            );
        """))

        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_chat_channel_read_status_user_id ON chat_channel_read_status(user_id);
            CREATE INDEX IF NOT EXISTS ix_chat_channel_read_status_channel_id ON chat_channel_read_status(channel_id);
        """))

        conn.commit()
        logger.info("Migração de chat_channel_read_status concluída com sucesso!")
        print("Migração de chat_channel_read_status concluída com sucesso!")

if __name__ == "__main__":
    migrate_chat_channel_read_status()
