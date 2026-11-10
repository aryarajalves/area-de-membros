"""
Script de migração para garantir a tabela `registration_verifications` e a coluna `attempts` (e `phone`):
- `attempts` (INTEGER DEFAULT 0 NOT NULL)
- `phone` (VARCHAR NULL)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Iniciando migração da tabela e colunas de 'registration_verifications'...")
    with engine.connect() as conn:
        with conn.begin():
            is_postgres = "postgresql" in engine.dialect.name
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS registration_verifications (
                        id SERIAL PRIMARY KEY,
                        email VARCHAR NOT NULL,
                        name VARCHAR NOT NULL,
                        hashed_password VARCHAR NOT NULL,
                        role VARCHAR NOT NULL,
                        invite_token VARCHAR NOT NULL,
                        code VARCHAR NOT NULL,
                        phone VARCHAR,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        is_used BOOLEAN DEFAULT FALSE,
                        attempts INTEGER DEFAULT 0 NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS ix_registration_verifications_email ON registration_verifications(email);
                    ALTER TABLE registration_verifications ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;
                    ALTER TABLE registration_verifications ADD COLUMN IF NOT EXISTS phone VARCHAR;
                """))
            else:
                for sql in [
                    "CREATE TABLE IF NOT EXISTS registration_verifications (id INTEGER PRIMARY KEY AUTOINCREMENT, email VARCHAR NOT NULL, name VARCHAR NOT NULL, hashed_password VARCHAR NOT NULL, role VARCHAR NOT NULL, invite_token VARCHAR NOT NULL, code VARCHAR NOT NULL, phone VARCHAR, expires_at TIMESTAMP NOT NULL, is_used BOOLEAN DEFAULT 0, attempts INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
                    "ALTER TABLE registration_verifications ADD COLUMN attempts INTEGER DEFAULT 0",
                    "ALTER TABLE registration_verifications ADD COLUMN phone VARCHAR",
                ]:
                    try:
                        conn.execute(text(sql))
                    except Exception:
                        pass
    logger.info("Migração da tabela 'registration_verifications' e coluna 'attempts' concluída com sucesso!")


if __name__ == "__main__":
    run_migration()
