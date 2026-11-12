"""
Script de migração: Adiciona a coluna autoplay_enabled na tabela users.
Permite aos alunos e usuários ativar ou desativar o avanço/reprodução automática de aulas no perfil.
"""
import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

def migrate():
    print("Iniciando migração: Adicionando coluna autoplay_enabled na tabela users...")
    with engine.begin() as conn:
        dialect = engine.dialect.name
        if dialect == "postgresql":
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS autoplay_enabled BOOLEAN DEFAULT TRUE NOT NULL;"))
            print("Coluna autoplay_enabled verificada/adicionada com sucesso no PostgreSQL.")
        else:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN autoplay_enabled BOOLEAN DEFAULT 1;"))
                print("Coluna autoplay_enabled adicionada com sucesso no SQLite.")
            except Exception as e:
                print(f"Coluna autoplay_enabled já existia ou fallback ignorado: {e}")

if __name__ == "__main__":
    migrate()
