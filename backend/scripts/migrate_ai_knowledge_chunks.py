"""
Script de Migração para Criação da Tabela de RAG Vetorial (ai_knowledge_chunks):
Armazena fragmentos de transcrições de aulas e seus embeddings normalizados (OpenAI text-embedding-3-small).
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger

def run_migration():
    logger.info("[MIGRAÇÃO RAG] Verificando existência da tabela ai_knowledge_chunks...")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    with engine.begin() as conn:
        if "ai_knowledge_chunks" not in existing_tables:
            logger.info("[MIGRAÇÃO RAG] Criando tabela ai_knowledge_chunks...")
            conn.execute(text("""
                CREATE TABLE ai_knowledge_chunks (
                    id SERIAL PRIMARY KEY,
                    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    chunk_index INTEGER NOT NULL DEFAULT 0,
                    content TEXT NOT NULL,
                    start_time_seconds INTEGER NULL,
                    end_time_seconds INTEGER NULL,
                    embedding_json TEXT NOT NULL,
                    token_count INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_knowledge_chunks_course_id ON ai_knowledge_chunks(course_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_knowledge_chunks_module_id ON ai_knowledge_chunks(module_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_knowledge_chunks_lesson_id ON ai_knowledge_chunks(lesson_id);"))
            logger.info("[MIGRAÇÃO RAG] Tabela ai_knowledge_chunks e índices criados com sucesso!")
        else:
            logger.info("[MIGRAÇÃO RAG] Tabela ai_knowledge_chunks já existe.")

if __name__ == "__main__":
    run_migration()
