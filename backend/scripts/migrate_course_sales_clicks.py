"""
Script de Migração para Criação da Tabela de Histórico de Cliques na Página de Vendas (course_sales_clicks).
Data: 15/10/2026
Tabelas:
  - course_sales_clicks:
      - id (SERIAL PRIMARY KEY)
      - course_id (INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE)
      - user_id (INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE)
      - created_at (TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Iniciando migração da tabela course_sales_clicks...")
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS course_sales_clicks (
                    id SERIAL PRIMARY KEY,
                    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_course_sales_clicks_course_id ON course_sales_clicks(course_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_course_sales_clicks_user_id ON course_sales_clicks(user_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_course_sales_clicks_created_at ON course_sales_clicks(created_at);
            """))
            logger.info("Tabela course_sales_clicks e índices garantidos com sucesso.")
    logger.info("Migração de course_sales_clicks concluída com sucesso!")


if __name__ == "__main__":
    run_migration()
