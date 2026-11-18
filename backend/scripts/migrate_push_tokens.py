"""Script de migração para criar a tabela user_device_tokens (Push Notifications FCM)."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    dialect = engine.dialect.name
    with engine.connect() as conn:
        if dialect == "postgresql":
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS user_device_tokens (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        fcm_token VARCHAR(512) NOT NULL UNIQUE,
                        platform VARCHAR(20) NOT NULL DEFAULT 'android',
                        device_name VARCHAR(120) NULL,
                        is_active BOOLEAN NOT NULL DEFAULT TRUE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS ix_user_device_tokens_user_id ON user_device_tokens(user_id);
                    CREATE INDEX IF NOT EXISTS ix_user_device_tokens_fcm_token ON user_device_tokens(fcm_token);
                    """
                )
            )
        else:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS user_device_tokens (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        fcm_token VARCHAR(512) NOT NULL UNIQUE,
                        platform VARCHAR(20) NOT NULL DEFAULT 'android',
                        device_name VARCHAR(120) NULL,
                        is_active BOOLEAN NOT NULL DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                    )
                    """
                )
            )
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_device_tokens_user_id ON user_device_tokens(user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_device_tokens_fcm_token ON user_device_tokens(fcm_token)"))
        conn.commit()
    logger.info("[MIGRATION] Tabela user_device_tokens verificada/criada com sucesso.")


if __name__ == "__main__":
    run_migration()
