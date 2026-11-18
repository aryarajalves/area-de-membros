"""Script de migração para criar a tabela user_blocks (bloqueio entre usuários)."""
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
                    CREATE TABLE IF NOT EXISTS user_blocks (
                        id SERIAL PRIMARY KEY,
                        blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        CONSTRAINT uq_user_block_pair UNIQUE (blocker_id, blocked_id)
                    );
                    CREATE INDEX IF NOT EXISTS ix_user_blocks_blocker_id ON user_blocks(blocker_id);
                    CREATE INDEX IF NOT EXISTS ix_user_blocks_blocked_id ON user_blocks(blocked_id);
                    """
                )
            )
        else:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS user_blocks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        CONSTRAINT uq_user_block_pair UNIQUE (blocker_id, blocked_id)
                    )
                    """
                )
            )
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_blocks_blocker_id ON user_blocks(blocker_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_blocks_blocked_id ON user_blocks(blocked_id)"))
        conn.commit()
    logger.info("[MIGRATION] Tabela user_blocks verificada/criada com sucesso.")


if __name__ == "__main__":
    run_migration()
