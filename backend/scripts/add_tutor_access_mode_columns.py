import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger

def migrate():
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    with engine.begin() as conn:
        if "ai_tutor_settings" in table_names:
            cols = [c["name"] for c in inspector.get_columns("ai_tutor_settings")]
            if "access_mode" not in cols:
                logger.info("Adicionando coluna access_mode em ai_tutor_settings...")
                conn.execute(text("ALTER TABLE ai_tutor_settings ADD COLUMN access_mode VARCHAR(30) DEFAULT 'public' NOT NULL;"))
            if "maintenance_message" not in cols:
                logger.info("Adicionando coluna maintenance_message em ai_tutor_settings...")
                conn.execute(text("ALTER TABLE ai_tutor_settings ADD COLUMN maintenance_message TEXT NULL;"))

    logger.info("Migração de colunas de modo de acesso e manutenção do Tutor IA concluída com sucesso!")

if __name__ == "__main__":
    migrate()
