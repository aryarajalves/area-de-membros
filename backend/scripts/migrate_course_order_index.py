"""
Script de Migração para Adição da Ordem de Posição do Curso (order_index).
Data: 05/10/2026
Tabela:
  - courses (adiciona coluna order_index INTEGER DEFAULT 0)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger

def run_migration():
    logger.info("Iniciando migração da coluna order_index na tabela courses...")
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(text("""
                ALTER TABLE courses 
                ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
            """))
            # Cria índice para order_index se não existir
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_courses_order_index ON courses (order_index);
                """))
            except Exception:
                pass
            logger.info("Coluna order_index garantida na tabela courses.")

    logger.info("Migração de order_index na tabela courses concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
