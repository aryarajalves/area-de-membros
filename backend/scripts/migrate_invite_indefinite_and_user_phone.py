"""
Script de Migração para Suporte a Convites Indefinidos e Campo de WhatsApp/Telefone.
Data: 01/10/2026
Tabelas:
  - users (adiciona coluna phone VARCHAR(50) NULL)
  - registration_verifications (adiciona coluna phone VARCHAR(50) NULL)
  - invites (altera expires_at para permitir NULL / indefinido)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger

def run_migration():
    logger.info("Iniciando migração de convites indefinidos e campo de WhatsApp/telefone...")
    with engine.connect() as conn:
        with conn.begin():
            # 1. Adicionar phone na tabela users
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
            """))
            logger.info("Coluna phone garantida na tabela users.")

            # 2. Adicionar phone na tabela registration_verifications
            conn.execute(text("""
                ALTER TABLE registration_verifications 
                ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
            """))
            logger.info("Coluna phone garantida na tabela registration_verifications.")

            # 3. Alterar expires_at para permitir NULL na tabela invites se for PostgreSQL
            try:
                conn.execute(text("""
                    ALTER TABLE invites 
                    ALTER COLUMN expires_at DROP NOT NULL;
                """))
                logger.info("Coluna expires_at alterada para DROP NOT NULL na tabela invites.")
            except Exception as e:
                logger.warning(f"Aviso ao alterar expires_at DROP NOT NULL (pode ser SQLite ou já nullable): {e}")

    logger.info("Migração de convites indefinidos e campo de WhatsApp concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
