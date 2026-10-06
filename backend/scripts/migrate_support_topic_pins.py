"""
Script de Migração: Cria a tabela support_topic_pins para permitir que
cada usuário fixe até 5 dúvidas de suporte de forma personalizada.
"""
import os
import sys
from sqlalchemy import text

# Adicionar a pasta backend ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from app.core.logger import logger


def run_migration():
    logger.info("Iniciando migração: criação da tabela support_topic_pins...")

    migration_sql = """
    CREATE TABLE IF NOT EXISTS support_topic_pins (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER NOT NULL REFERENCES support_topics(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_support_topic_pin UNIQUE (topic_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS ix_support_topic_pins_id ON support_topic_pins(id);
    CREATE INDEX IF NOT EXISTS ix_support_topic_pins_topic_id ON support_topic_pins(topic_id);
    CREATE INDEX IF NOT EXISTS ix_support_topic_pins_user_id ON support_topic_pins(user_id);
    """

    with engine.begin() as conn:
        conn.execute(text(migration_sql))

    logger.info("Migração concluída com sucesso: tabela support_topic_pins criada.")


if __name__ == "__main__":
    run_migration()
