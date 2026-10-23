import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from app.core.logger import logger

def migrate():
    """
    Migração de integridade de esquema:
    Adiciona colunas token_version, failed_login_attempts e locked_until na tabela users.
    """
    is_postgres = "postgresql" in engine.dialect.name
    logger.info(f"[MIGRATE] Iniciando migração de colunas de segurança em users ({'PostgreSQL' if is_postgres else 'SQLite'})...")

    with engine.connect() as conn:
        with conn.begin():
            if is_postgres:
                conn.execute(text("""
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITHOUT TIME ZONE;
                """))
            else:
                for col, col_type in [
                    ("token_version", "INTEGER DEFAULT 1"),
                    ("failed_login_attempts", "INTEGER DEFAULT 0"),
                    ("locked_until", "DATETIME")
                ]:
                    try:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                    except Exception:
                        pass

    logger.info("[MIGRATE] Migração de colunas de segurança em users concluída com sucesso.")

if __name__ == "__main__":
    migrate()
