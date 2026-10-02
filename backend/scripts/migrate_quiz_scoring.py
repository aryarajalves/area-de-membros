"""
Script de Migração para Pontuação e Aprovação Personalizada no Quiz.
Data: 01/10/2026
Tabelas:
  - lessons (adiciona passing_score_pct com default 70)
  - quiz_questions (adiciona points com default 1)
  - quiz_submissions (adiciona total_points e earned_points com default 0)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger

def run_migration():
    logger.info("Iniciando migração de pontuação e aprovação personalizada do quiz...")
    with engine.connect() as conn:
        with conn.begin():
            # 1. Adicionar passing_score_pct na tabela lessons
            conn.execute(text("""
                ALTER TABLE lessons 
                ADD COLUMN IF NOT EXISTS passing_score_pct INTEGER DEFAULT 70;
            """))
            logger.info("Coluna passing_score_pct garantida na tabela lessons.")

            # 2. Adicionar points na tabela quiz_questions
            conn.execute(text("""
                ALTER TABLE quiz_questions 
                ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1;
            """))
            logger.info("Coluna points garantida na tabela quiz_questions.")

            # 3. Adicionar total_points e earned_points na tabela quiz_submissions
            conn.execute(text("""
                ALTER TABLE quiz_submissions 
                ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
            """))
            conn.execute(text("""
                ALTER TABLE quiz_submissions 
                ADD COLUMN IF NOT EXISTS earned_points INTEGER DEFAULT 0;
            """))
            logger.info("Colunas total_points e earned_points garantidas na tabela quiz_submissions.")

    logger.info("Migração de pontuação do quiz concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
