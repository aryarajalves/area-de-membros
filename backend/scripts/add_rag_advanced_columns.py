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
            setting_cols = [c["name"] for c in inspector.get_columns("ai_tutor_settings")]
            if "rag_top_k" not in setting_cols:
                logger.info("Adicionando coluna rag_top_k em ai_tutor_settings...")
                conn.execute(text("ALTER TABLE ai_tutor_settings ADD COLUMN rag_top_k INTEGER DEFAULT 4 NOT NULL;"))
            if "rag_min_similarity" not in setting_cols:
                logger.info("Adicionando coluna rag_min_similarity em ai_tutor_settings...")
                conn.execute(text("ALTER TABLE ai_tutor_settings ADD COLUMN rag_min_similarity FLOAT DEFAULT 0.35 NOT NULL;"))

        if "ai_knowledge_chunks" in table_names:
            chunk_cols = [c["name"] for c in inspector.get_columns("ai_knowledge_chunks")]
            if "chunk_type" not in chunk_cols:
                logger.info("Adicionando coluna chunk_type em ai_knowledge_chunks...")
                conn.execute(text("ALTER TABLE ai_knowledge_chunks ADD COLUMN chunk_type VARCHAR(30) DEFAULT 'transcript' NOT NULL;"))
            if "question_text" not in chunk_cols:
                logger.info("Adicionando coluna question_text em ai_knowledge_chunks...")
                conn.execute(text("ALTER TABLE ai_knowledge_chunks ADD COLUMN question_text TEXT NULL;"))
            if "answer_text" not in chunk_cols:
                logger.info("Adicionando coluna answer_text em ai_knowledge_chunks...")
                conn.execute(text("ALTER TABLE ai_knowledge_chunks ADD COLUMN answer_text TEXT NULL;"))

    logger.info("Migração avançada de colunas RAG concluída com sucesso!")

if __name__ == "__main__":
    migrate()
