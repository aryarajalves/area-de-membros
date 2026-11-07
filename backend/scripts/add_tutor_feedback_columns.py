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
        if "ai_tutor_messages" in table_names:
            msg_cols = [c["name"] for c in inspector.get_columns("ai_tutor_messages")]
            if "feedback_rating" not in msg_cols:
                logger.info("Adicionando coluna feedback_rating em ai_tutor_messages...")
                conn.execute(text("ALTER TABLE ai_tutor_messages ADD COLUMN feedback_rating VARCHAR(10) NULL;"))
            if "feedback_text" not in msg_cols:
                logger.info("Adicionando coluna feedback_text em ai_tutor_messages...")
                conn.execute(text("ALTER TABLE ai_tutor_messages ADD COLUMN feedback_text TEXT NULL;"))
            if "feedback_at" not in msg_cols:
                logger.info("Adicionando coluna feedback_at em ai_tutor_messages...")
                conn.execute(text("ALTER TABLE ai_tutor_messages ADD COLUMN feedback_at TIMESTAMP NULL;"))

    logger.info("Migração de colunas de avaliação do Tutor IA concluída com sucesso!")

if __name__ == "__main__":
    migrate()
