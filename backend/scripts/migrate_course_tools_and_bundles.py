"""
Script de Migração para Adição do Tipo de Item (Curso/Ferramenta), URL da Ferramenta e Pacotes/Combos (course_bundles).
Data: 14/10/2026
Tabelas:
  - courses:
      - item_type (VARCHAR DEFAULT 'course')
      - tool_url (VARCHAR NULL)
  - course_bundles:
      - id (SERIAL PRIMARY KEY)
      - parent_course_id (INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE)
      - bundled_course_id (INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE)
      - created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
      - UNIQUE (parent_course_id, bundled_course_id)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger

def run_migration():
    logger.info("Iniciando migração de colunas e tabela de ferramentas e pacotes (course_bundles)...")
    with engine.connect() as conn:
        with conn.begin():
            # 1. Garantir que a tabela courses possui PRIMARY KEY em id (necessário para FKs no Postgres)
            try:
                conn.execute(text("""
                    DO $pk$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conrelid = 'courses'::regclass AND contype = 'p'
                        ) THEN
                            ALTER TABLE courses ADD PRIMARY KEY (id);
                        END IF;
                    END
                    $pk$;
                """))
                logger.info("Chave primária na tabela courses garantida.")
            except Exception as e:
                logger.warning(f"Aviso ao verificar/adicionar PK em courses: {e}")

            # 2. Colunas item_type e tool_url na tabela courses
            conn.execute(text("""
                ALTER TABLE courses 
                ADD COLUMN IF NOT EXISTS item_type VARCHAR DEFAULT 'course';
            """))
            conn.execute(text("""
                ALTER TABLE courses 
                ADD COLUMN IF NOT EXISTS tool_url VARCHAR;
            """))
            logger.info("Colunas item_type e tool_url garantidas na tabela courses.")

            # 3. Tabela de pacotes / cursos vinculados (course_bundles)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS course_bundles (
                    id SERIAL PRIMARY KEY,
                    parent_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    bundled_course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_course_bundle UNIQUE (parent_course_id, bundled_course_id)
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_course_bundles_parent ON course_bundles(parent_course_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_course_bundles_bundled ON course_bundles(bundled_course_id);
            """))
            logger.info("Tabela course_bundles e índices garantidos com sucesso.")

    logger.info("Migração de ferramentas e pacotes concluída com sucesso!")

if __name__ == "__main__":
    run_migration()
