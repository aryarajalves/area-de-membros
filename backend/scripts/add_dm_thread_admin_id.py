import sys
import os

# Adiciona o caminho raiz da aplicação
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("Iniciando migração: adicionando dm_thread_admin_id em chat_messages...")
    with engine.connect() as conn:
        try:
            conn.execute(text("""
                ALTER TABLE chat_messages
                ADD COLUMN IF NOT EXISTS dm_thread_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_chat_messages_dm_thread_admin_id ON chat_messages(dm_thread_admin_id);
            """))
            conn.commit()
            print("Coluna dm_thread_admin_id e índice criados com sucesso!")
        except Exception as e:
            print(f"Erro na migração: {e}")

if __name__ == "__main__":
    migrate()
