import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger

def migrate():
    logger.info("Verificando se a coluna tutor_name existe na tabela ai_tutor_settings...")
    inspector = inspect(engine)
    existing_cols = [c["name"] for c in inspector.get_columns("ai_tutor_settings")] if "ai_tutor_settings" in inspector.get_table_names() else []
    
    with engine.begin() as conn:
        if "tutor_name" not in existing_cols:
            logger.info("Adicionando coluna tutor_name...")
            conn.execute(text("ALTER TABLE ai_tutor_settings ADD COLUMN tutor_name VARCHAR(100) DEFAULT 'Tutor IA 24h';"))
            logger.info("Coluna tutor_name adicionada com sucesso!")
        else:
            logger.info("Coluna tutor_name já existe.")

if __name__ == "__main__":
    migrate()
