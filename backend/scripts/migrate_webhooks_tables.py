import os
import sys
from pathlib import Path

# Adiciona o diretório do backend ao sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("Iniciando migração das tabelas de Webhooks e Integrações...")
    with engine.connect() as conn:
        # Criação da tabela webhooks
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS webhooks (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                url VARCHAR NOT NULL,
                events VARCHAR NOT NULL,
                course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
                secret_key VARCHAR,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
            );
        """))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_webhooks_id ON webhooks (id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_webhooks_course_id ON webhooks (course_id);"))

        # Criação da tabela webhook_logs
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS webhook_logs (
                id SERIAL PRIMARY KEY,
                webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
                event VARCHAR NOT NULL,
                payload TEXT NOT NULL,
                response_status INTEGER,
                response_body TEXT,
                success BOOLEAN DEFAULT FALSE,
                error_message TEXT,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
            );
        """))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_webhook_logs_id ON webhook_logs (id);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_webhook_logs_webhook_id ON webhook_logs (webhook_id);"))

        conn.commit()
    print("Migração de tabelas de Webhooks concluída com sucesso!")

if __name__ == "__main__":
    migrate()
