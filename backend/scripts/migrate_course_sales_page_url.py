"""
Script de Migração para Adição do Link da Página de Vendas do Curso (sales_page_url).
Data: 05/10/2026
Tabela:
  - courses (adiciona coluna sales_page_url VARCHAR NULL)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger

def run_migration():
    logger.info("Iniciando migração da coluna sales_page_url na tabela courses...")
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(text("""
                ALTER TABLE courses 
                ADD COLUMN IF NOT EXISTS sales_page_url VARCHAR;
            """))
            logger.info("Coluna sales_page_url garantida na tabela courses.")

    logger.info("Migração de sales_page_url na tabela courses concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
