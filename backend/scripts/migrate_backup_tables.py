"""
Script de migração para criação das tabelas de Backup (backup_schedules e backup_histories)
Executável tanto em PostgreSQL quanto em SQLite.
"""
from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("Iniciando migração das tabelas de backup...")
    with engine.connect() as conn:
        # Tabela backup_schedules
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS backup_schedules (
                id SERIAL PRIMARY KEY,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                frequency VARCHAR NOT NULL DEFAULT '6h',
                destination_folder VARCHAR NOT NULL DEFAULT 'projetobase/backups/',
                retention_max INTEGER NOT NULL DEFAULT 30,
                last_run_at TIMESTAMP WITH TIME ZONE NULL,
                next_run_at TIMESTAMP WITH TIME ZONE NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))

        # Tabela backup_histories
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS backup_histories (
                id SERIAL PRIMARY KEY,
                filename VARCHAR NOT NULL UNIQUE,
                s3_key VARCHAR NOT NULL,
                file_size_bytes BIGINT NOT NULL DEFAULT 0,
                backup_type VARCHAR NOT NULL DEFAULT 'manual',
                status VARCHAR NOT NULL DEFAULT 'success',
                error_message VARCHAR NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.commit()
    print("Migração concluída com sucesso!")

if __name__ == "__main__":
    migrate()
