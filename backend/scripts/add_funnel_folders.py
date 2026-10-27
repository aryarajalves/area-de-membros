"""
Script de migração para criar a tabela funnel_folders e adicionar a coluna folder_id na tabela funnels.
Permite organizar e categorizar funis de mensagens em pastas.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger


def migrate_funnel_folders():
    logger.info("[MIGRAÇÃO] Iniciando migração de pastas de funis (funnel_folders)...")
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        is_postgres = "postgresql" in engine.dialect.name

        with engine.connect() as conn:
            # 1. Criação da tabela funnel_folders se não existir
            if "funnel_folders" not in existing_tables:
                logger.info("[MIGRAÇÃO] Criando tabela funnel_folders...")
                if is_postgres:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS funnel_folders (
                            id SERIAL PRIMARY KEY,
                            name VARCHAR(100) NOT NULL,
                            color VARCHAR(30) DEFAULT '#6366f1',
                            order_index INTEGER DEFAULT 0 NOT NULL,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                        CREATE INDEX IF NOT EXISTS ix_funnel_folders_name ON funnel_folders(name);
                    """))
                else:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS funnel_folders (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name VARCHAR(100) NOT NULL,
                            color VARCHAR(30) DEFAULT '#6366f1',
                            order_index INTEGER DEFAULT 0 NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                        CREATE INDEX IF NOT EXISTS ix_funnel_folders_name ON funnel_folders(name);
                    """))
                conn.commit()
                logger.info("[MIGRAÇÃO] Tabela funnel_folders criada com sucesso!")
            else:
                logger.info("[MIGRAÇÃO] Tabela funnel_folders já existe.")

            # 2. Adição da coluna folder_id na tabela funnels
            inspector = inspect(engine)
            if "funnels" in inspector.get_table_names():
                columns = [c["name"] for c in inspector.get_columns("funnels")]
                if "folder_id" not in columns:
                    logger.info("[MIGRAÇÃO] Adicionando coluna folder_id na tabela funnels...")
                    if is_postgres:
                        conn.execute(text("""
                            ALTER TABLE funnels ADD COLUMN folder_id INTEGER REFERENCES funnel_folders(id) ON DELETE SET NULL;
                            CREATE INDEX IF NOT EXISTS ix_funnels_folder_id ON funnels(folder_id);
                        """))
                    else:
                        conn.execute(text("""
                            ALTER TABLE funnels ADD COLUMN folder_id INTEGER REFERENCES funnel_folders(id) ON DELETE SET NULL;
                        """))
                    conn.commit()
                    logger.info("[MIGRAÇÃO] Coluna folder_id adicionada com sucesso na tabela funnels!")
                else:
                    logger.info("[MIGRAÇÃO] Coluna folder_id já existe na tabela funnels.")

    except Exception as e:
        logger.error(f"[MIGRAÇÃO] Erro ao executar migração de funnel_folders: {e}")
        raise e


if __name__ == "__main__":
    migrate_funnel_folders()
