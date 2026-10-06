"""
Migração do banco de dados: Criação das tabelas funnels e funnel_executions
Data: 06/10/2026
"""
import sys
import os

# Adiciona o diretório backend ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Iniciando migração para criação das tabelas de Funis de Mensagens...")
    with engine.connect() as conn:
        with conn.begin():
            # Tabela funnels
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS funnels (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        trigger_type VARCHAR(50) DEFAULT 'chat_button' NOT NULL,
                        trigger_keywords VARCHAR(500),
                        flow_data TEXT NOT NULL DEFAULT '{}',
                        is_active BOOLEAN DEFAULT TRUE NOT NULL,
                        created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                    );
                    """
                )
            )

            # Tabela funnel_executions
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS funnel_executions (
                        id SERIAL PRIMARY KEY,
                        funnel_id INTEGER NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        triggered_by VARCHAR(50) DEFAULT 'chat_button' NOT NULL,
                        current_node_id VARCHAR(100),
                        status VARCHAR(50) DEFAULT 'completed' NOT NULL,
                        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                        completed_at TIMESTAMP WITH TIME ZONE,
                        logs TEXT
                    );
                    """
                )
            )

            # Índices
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_funnels_name ON funnels(name);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_funnels_created_by ON funnels(created_by_user_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_funnel_executions_funnel_id ON funnel_executions(funnel_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_funnel_executions_user_id ON funnel_executions(user_id);"))

    logger.info("Migração de Funis de Mensagens concluída com sucesso!")


if __name__ == "__main__":
    run_migration()
