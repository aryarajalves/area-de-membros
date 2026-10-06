"""
Script de migração para suportar DMs (Mensagens Diretas) em chat_messages:
- Adiciona coluna recipient_id (INTEGER FK users.id)
- Adiciona coluna is_read (BOOLEAN default FALSE)
- Cria índices necessários
"""
from app.core.database import engine
from sqlalchemy import text
from app.core.logger import logger

def migrate_chat_dms():
    with engine.connect() as conn:
        logger.info("Verificando colunas recipient_id e is_read em chat_messages...")
        
        # recipient_id
        conn.execute(text("""
            ALTER TABLE chat_messages
            ADD COLUMN IF NOT EXISTS recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        """))
        
        # is_read
        conn.execute(text("""
            ALTER TABLE chat_messages
            ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
        """))
        
        # Índices
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_chat_messages_recipient_id ON chat_messages(recipient_id);
            CREATE INDEX IF NOT EXISTS ix_chat_messages_is_read ON chat_messages(is_read);
        """))
        
        conn.commit()
        logger.info("Migração de DMs concluída com sucesso no banco de dados!")
        print("Migração de DMs concluída com sucesso!")

if __name__ == "__main__":
    migrate_chat_dms()
