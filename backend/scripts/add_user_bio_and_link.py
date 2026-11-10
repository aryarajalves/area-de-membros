"""
Script de migração para adicionar as colunas bio e bio_link na tabela users
Data: 2026-11-10
"""
from sqlalchemy import text
from app.core.database import engine

def run_migration():
    print("[MIGRATION] Adicionando colunas bio e bio_link na tabela users...")
    is_postgres = engine.dialect.name == "postgresql"

    with engine.begin() as conn:
        if is_postgres:
            conn.execute(text("""
                ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(150);
                ALTER TABLE users ADD COLUMN IF NOT EXISTS bio_link VARCHAR(255);
            """))
        else:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN bio VARCHAR(150)"))
            except Exception as e:
                print(f"[MIGRATION] Coluna bio já existe ou aviso: {e}")
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN bio_link VARCHAR(255)"))
            except Exception as e:
                print(f"[MIGRATION] Coluna bio_link já existe ou aviso: {e}")
    print("[MIGRATION] Colunas bio e bio_link adicionadas/verificadas com sucesso!")

if __name__ == "__main__":
    run_migration()
