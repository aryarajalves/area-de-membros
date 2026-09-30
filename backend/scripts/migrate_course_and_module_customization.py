import os
import sys
from sqlalchemy import create_engine, text

# Adiciona o diretório atual do backend ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def migrate():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    connect_args = {}
    is_sqlite = db_url.startswith("sqlite")
    if is_sqlite:
        connect_args = {"check_same_thread": False}

    print("Executando migração para adicionar personalização de visual (Netflix Dark Mode, cor de fundo, banner e capas de módulos)...")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        # Colunas em courses: bg_color e cover_image_url
        try:
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS bg_color VARCHAR DEFAULT '#090d16';"))
            conn.commit()
            print("Coluna 'bg_color' adicionada em 'courses'.")
        except Exception as e:
            print(f"Aviso ao adicionar bg_color em courses: {e}")

        try:
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR;"))
            conn.commit()
            print("Coluna 'cover_image_url' adicionada em 'courses'.")
        except Exception as e:
            print(f"Aviso ao adicionar cover_image_url em courses: {e}")

        # Coluna em modules: image_url
        try:
            conn.execute(text("ALTER TABLE modules ADD COLUMN IF NOT EXISTS image_url VARCHAR;"))
            conn.commit()
            print("Coluna 'image_url' adicionada em 'modules'.")
        except Exception as e:
            print(f"Aviso ao adicionar image_url em modules: {e}")

    print("Migração concluída com sucesso!")

if __name__ == "__main__":
    migrate()
