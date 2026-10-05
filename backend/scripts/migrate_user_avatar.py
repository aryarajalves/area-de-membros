"""
Script de Migração para Adição da Foto/Logo de Perfil do Usuário (avatar_url).
Data: 05/10/2026
Tabela:
  - users (adiciona coluna avatar_url VARCHAR NULL)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger

def run_migration():
    logger.info("Iniciando migração da coluna avatar_url na tabela users...")
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;
            """))
            logger.info("Coluna avatar_url garantida na tabela users.")

    logger.info("Migração de avatar_url na tabela users concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
