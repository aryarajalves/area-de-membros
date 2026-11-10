import os
import sys
from sqlalchemy import text

# Adiciona o diretório raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

def migrate():
    print("[MIGRAÇÃO] Adicionando coluna 'last_seen_at' na tabela 'users'...")
    with engine.connect() as conn:
        try:
            # PostgreSQL
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE NULL;"))
            conn.commit()
            print("[SUCESSO] Coluna 'last_seen_at' adicionada com sucesso no PostgreSQL.")
        except Exception as e:
            # Fallback para SQLite
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP NULL;"))
                conn.commit()
                print("[SUCESSO] Coluna 'last_seen_at' adicionada com sucesso no SQLite.")
            except Exception as e2:
                print(f"[INFO] Possivelmente a coluna já existe ou erro ignorável: {e2}")

if __name__ == "__main__":
    migrate()
