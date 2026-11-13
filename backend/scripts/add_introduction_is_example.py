import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine


def run_migration():
    is_sqlite = engine.dialect.name == "sqlite"
    with engine.begin() as conn:
        if is_sqlite:
            try:
                conn.execute(text("ALTER TABLE introduction_posts ADD COLUMN is_example BOOLEAN DEFAULT 0 NOT NULL"))
                print("Coluna 'is_example' adicionada em introduction_posts (SQLite).")
            except Exception as exc:
                print(f"Aviso SQLite (coluna provavelmente já existe): {exc}")
        else:
            conn.execute(text("ALTER TABLE introduction_posts ADD COLUMN IF NOT EXISTS is_example BOOLEAN DEFAULT FALSE NOT NULL;"))
            print("Coluna 'is_example' verificada/adicionada em introduction_posts (PostgreSQL).")


if __name__ == "__main__":
    run_migration()
