"""
Script de migração para adicionar colunas de soft delete na tabela chat_messages:
- is_deleted: BOOLEAN DEFAULT FALSE
- deleted_at: TIMESTAMP WITH TIME ZONE NULL
- deleted_by_user_id: INTEGER REFERENCES users(id) ON DELETE SET NULL
"""
import sys
import os

# Adiciona a raiz do backend ao sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.core.database import engine
from app.core.config import settings

def migrate():
    is_sqlite = "sqlite" in settings.DATABASE_URL.lower()
    print(f"Executando migração de soft delete para chat_messages ({'SQLite' if is_sqlite else 'PostgreSQL'})...")

    with engine.begin() as conn:
        if is_sqlite:
            statements = [
                "ALTER TABLE chat_messages ADD COLUMN is_deleted BOOLEAN DEFAULT 0;",
                "ALTER TABLE chat_messages ADD COLUMN deleted_at TIMESTAMP NULL;",
                "ALTER TABLE chat_messages ADD COLUMN deleted_by_user_id INTEGER;",
            ]
            for stmt in statements:
                try:
                    conn.execute(text(stmt))
                    print(f"Executado com sucesso: {stmt}")
                except Exception as exc:
                    print(f"Aviso (pode já existir): {exc}")
        else:
            statements = [
                "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;",
                "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;",
                "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS deleted_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;",
                "CREATE INDEX IF NOT EXISTS ix_chat_messages_is_deleted ON chat_messages (is_deleted);",
                "CREATE INDEX IF NOT EXISTS ix_chat_messages_deleted_by_user_id ON chat_messages (deleted_by_user_id);",
            ]
            for stmt in statements:
                try:
                    conn.execute(text(stmt))
                    print(f"Executado com sucesso: {stmt}")
                except Exception as exc:
                    print(f"Aviso: {exc}")

    print("Migração de soft delete em chat_messages finalizada com sucesso!")

if __name__ == "__main__":
    migrate()
