import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from app.core.database import engine
from app.core.logger import logger


def migrate():
    logger.info("Iniciando migração das colunas access_duration e expires_at na tabela user_courses...")
    inspector = inspect(engine)
    columns = [col["name"] for col in inspector.get_columns("user_courses")]

    with engine.begin() as conn:
        if "access_duration" not in columns:
            conn.execute(text("ALTER TABLE user_courses ADD COLUMN access_duration VARCHAR DEFAULT 'lifetime';"))
            logger.info("Coluna 'access_duration' adicionada com sucesso na tabela 'user_courses'.")
        else:
            logger.info("Coluna 'access_duration' já existe na tabela 'user_courses'.")

        if "expires_at" not in columns:
            conn.execute(text("ALTER TABLE user_courses ADD COLUMN expires_at TIMESTAMP NULL;"))
            logger.info("Coluna 'expires_at' adicionada com sucesso na tabela 'user_courses'.")
        else:
            logger.info("Coluna 'expires_at' já existe na tabela 'user_courses'.")

    logger.info("Migração de tempo de acesso por curso concluída com sucesso!")


if __name__ == "__main__":
    migrate()
