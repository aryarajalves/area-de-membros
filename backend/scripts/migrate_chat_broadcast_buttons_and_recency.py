"""
Script de migração para suportar Botões Interativos (CTA) e Segmentação por Recência (7, 14, 30 dias):
- Adiciona button_text, button_url e button_action_type na tabela chat_messages
- Adiciona filter_days, button_text, button_url e button_action_type na tabela chat_broadcast_campaigns
"""
from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def migrate_chat_broadcast_buttons_and_recency():
    with engine.connect() as conn:
        logger.info("Iniciando migração de botões CTA e filtro de recência no chat e broadcast...")

        # 1. Adicionar colunas de botão CTA na tabela chat_messages
        conn.execute(text("""
            ALTER TABLE chat_messages
            ADD COLUMN IF NOT EXISTS button_text VARCHAR(100) NULL;
        """))
        conn.execute(text("""
            ALTER TABLE chat_messages
            ADD COLUMN IF NOT EXISTS button_url VARCHAR(500) NULL;
        """))
        conn.execute(text("""
            ALTER TABLE chat_messages
            ADD COLUMN IF NOT EXISTS button_action_type VARCHAR(30) NULL;
        """))

        # 2. Adicionar colunas de botão CTA e filter_days na tabela chat_broadcast_campaigns
        conn.execute(text("""
            ALTER TABLE chat_broadcast_campaigns
            ADD COLUMN IF NOT EXISTS filter_days INTEGER NULL;
        """))
        conn.execute(text("""
            ALTER TABLE chat_broadcast_campaigns
            ADD COLUMN IF NOT EXISTS button_text VARCHAR(100) NULL;
        """))
        conn.execute(text("""
            ALTER TABLE chat_broadcast_campaigns
            ADD COLUMN IF NOT EXISTS button_url VARCHAR(500) NULL;
        """))
        conn.execute(text("""
            ALTER TABLE chat_broadcast_campaigns
            ADD COLUMN IF NOT EXISTS button_action_type VARCHAR(30) NULL;
        """))

        conn.commit()
        logger.info("Migração de botões CTA e filtro de recência concluída com sucesso!")


if __name__ == "__main__":
    migrate_chat_broadcast_buttons_and_recency()
