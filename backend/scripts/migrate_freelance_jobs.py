"""Script de migração para criar a tabela freelance_jobs."""
from sqlalchemy import text
from app.core.database import engine


def run_migration():
    is_postgres = engine.dialect.name == "postgresql"
    with engine.begin() as conn:
        if is_postgres:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS freelance_jobs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(160) NOT NULL,
                    description TEXT NOT NULL,
                    category VARCHAR(60) NOT NULL,
                    budget_type VARCHAR(20) NOT NULL DEFAULT 'negotiable',
                    budget_value VARCHAR(60) NULL,
                    deadline VARCHAR(100) NULL,
                    contact_whatsapp VARCHAR(30) NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'open',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
                CREATE INDEX IF NOT EXISTS ix_freelance_jobs_user_id ON freelance_jobs(user_id);
                CREATE INDEX IF NOT EXISTS ix_freelance_jobs_category ON freelance_jobs(category);
                CREATE INDEX IF NOT EXISTS ix_freelance_jobs_status ON freelance_jobs(status);
            """))
        else:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS freelance_jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(160) NOT NULL,
                    description TEXT NOT NULL,
                    category VARCHAR(60) NOT NULL,
                    budget_type VARCHAR(20) NOT NULL DEFAULT 'negotiable',
                    budget_value VARCHAR(60) NULL,
                    deadline VARCHAR(100) NULL,
                    contact_whatsapp VARCHAR(30) NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'open',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_freelance_jobs_user_id ON freelance_jobs(user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_freelance_jobs_category ON freelance_jobs(category)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_freelance_jobs_status ON freelance_jobs(status)"))


if __name__ == "__main__":
    run_migration()
    print("Migração freelance_jobs concluída com sucesso.")
