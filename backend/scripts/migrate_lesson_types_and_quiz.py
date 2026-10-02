"""
Script de Migração para Tipos de Aula (Vídeo, Texto, Quiz) e Tabelas de Quiz.
Data: 30/09/2026
Tabelas:
  - lessons (adiciona content_type, text_content)
  - quiz_questions (criação)
  - quiz_options (criação)
  - quiz_submissions (criação)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger

def run_migration():
    logger.info("Iniciando migração de tipos de aula e tabelas de quiz...")
    with engine.connect() as conn:
        with conn.begin():
            # 1. Adicionar colunas na tabela lessons
            conn.execute(text("""
                ALTER TABLE lessons 
                ADD COLUMN IF NOT EXISTS content_type VARCHAR DEFAULT 'video';
            """))
            conn.execute(text("""
                ALTER TABLE lessons 
                ADD COLUMN IF NOT EXISTS text_content TEXT;
            """))
            logger.info("Colunas content_type e text_content garantidas na tabela lessons.")

            # 2. Criar tabela quiz_questions
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS quiz_questions (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    question TEXT NOT NULL,
                    order_index INTEGER DEFAULT 0,
                    explanation TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
                );
                CREATE INDEX IF NOT EXISTS ix_quiz_questions_id ON quiz_questions(id);
                CREATE INDEX IF NOT EXISTS ix_quiz_questions_lesson_id ON quiz_questions(lesson_id);
            """))
            logger.info("Tabela quiz_questions garantida com sucesso.")

            # 3. Criar tabela quiz_options
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS quiz_options (
                    id SERIAL PRIMARY KEY,
                    question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
                    option_text TEXT NOT NULL,
                    is_correct BOOLEAN DEFAULT FALSE,
                    order_index INTEGER DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS ix_quiz_options_id ON quiz_options(id);
                CREATE INDEX IF NOT EXISTS ix_quiz_options_question_id ON quiz_options(question_id);
            """))
            logger.info("Tabela quiz_options garantida com sucesso.")

            # 4. Criar tabela quiz_submissions
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS quiz_submissions (
                    id SERIAL PRIMARY KEY,
                    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    score INTEGER DEFAULT 0,
                    total_questions INTEGER DEFAULT 0,
                    correct_answers INTEGER DEFAULT 0,
                    passed BOOLEAN DEFAULT TRUE,
                    answers_json TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
                );
                CREATE INDEX IF NOT EXISTS ix_quiz_submissions_id ON quiz_submissions(id);
                CREATE INDEX IF NOT EXISTS ix_quiz_submissions_lesson_id ON quiz_submissions(lesson_id);
                CREATE INDEX IF NOT EXISTS ix_quiz_submissions_user_id ON quiz_submissions(user_id);
            """))
            logger.info("Tabela quiz_submissions garantida com sucesso.")

    logger.info("Migração concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
