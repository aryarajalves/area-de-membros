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
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    print(f"Executando migração para 'user_courses' e 'invites.allowed_course_ids': {db_url.split('@')[-1] if '@' in db_url else db_url}")
    engine = create_engine(db_url, connect_args=connect_args)

    with engine.connect() as conn:
        # 1. Cria a tabela user_courses
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_courses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
            );
            CREATE INDEX IF NOT EXISTS ix_user_courses_user_id ON user_courses(user_id);
            CREATE INDEX IF NOT EXISTS ix_user_courses_course_id ON user_courses(course_id);
        """))

        # 2. Adiciona coluna allowed_course_ids em invites se não existir
        conn.execute(text("""
            ALTER TABLE invites ADD COLUMN IF NOT EXISTS allowed_course_ids VARCHAR;
        """))

        conn.commit()
        print("Tabela 'user_courses' e coluna 'allowed_course_ids' aplicadas com sucesso.")

if __name__ == "__main__":
    migrate()
