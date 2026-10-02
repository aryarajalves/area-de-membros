import os
import sys
from sqlalchemy import create_engine, text

# Adiciona o diretório atual do backend ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def migrate():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    connect_args = {}
    is_sqlite = db_url.startswith("sqlite")
    if is_sqlite:
        connect_args = {"check_same_thread": False}

    print("Executando migração para criar tabela 'api_tokens'...")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        try:
            if is_sqlite:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS api_tokens (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        name VARCHAR(100) NOT NULL,
                        token VARCHAR(255) NOT NULL UNIQUE,
                        masked_token VARCHAR(64) NOT NULL,
                        is_active BOOLEAN NOT NULL DEFAULT 1,
                        last_used_at TIMESTAMP NULL,
                        expires_at TIMESTAMP NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_api_tokens_token ON api_tokens(token);"))
                conn.commit()
                print("Tabela 'api_tokens' criada com sucesso no SQLite.")
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS api_tokens (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        name VARCHAR(100) NOT NULL,
                        token VARCHAR(255) NOT NULL UNIQUE,
                        masked_token VARCHAR(64) NOT NULL,
                        is_active BOOLEAN NOT NULL DEFAULT TRUE,
                        last_used_at TIMESTAMP WITH TIME ZONE NULL,
                        expires_at TIMESTAMP WITH TIME ZONE NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_api_tokens_token ON api_tokens(token);"))
                conn.commit()
                print("Tabela 'api_tokens' criada com sucesso no PostgreSQL.")
        except Exception as e:
            print(f"Erro ao executar migração: {e}")

if __name__ == "__main__":
    migrate()
