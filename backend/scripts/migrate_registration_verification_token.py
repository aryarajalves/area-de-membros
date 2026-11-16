"""Script de migração: adiciona coluna verification_token e torna invite_token/code opcionais em registration_verifications."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine


def run_migration():
    dialect = engine.dialect.name
    with engine.connect() as conn:
        if dialect == "postgresql":
            conn.execute(text("ALTER TABLE registration_verifications ADD COLUMN IF NOT EXISTS verification_token VARCHAR;"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_registration_verifications_verification_token ON registration_verifications(verification_token);"))
            conn.execute(text("ALTER TABLE registration_verifications ALTER COLUMN invite_token DROP NOT NULL;"))
            conn.execute(text("ALTER TABLE registration_verifications ALTER COLUMN code DROP NOT NULL;"))
            conn.commit()
        else:
            try:
                conn.execute(text("ALTER TABLE registration_verifications ADD COLUMN verification_token VARCHAR;"))
                conn.commit()
            except Exception as exc:
                print(f"Aviso SQLite (coluna pode já existir): {exc}")
    print("Migração de registration_verifications concluída com sucesso.")


if __name__ == "__main__":
    run_migration()
