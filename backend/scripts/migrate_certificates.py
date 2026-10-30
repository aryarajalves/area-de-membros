"""
Script de migração para o Sistema de Certificados de Conclusão:
1. Adiciona as colunas certificate_enabled, workload_hours e instructor_name na tabela courses.
2. Cria a tabela certificates com índice único no código de autenticidade e constraint por (user_id, course_id).
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine, Base
from app.models.certificate import Certificate
from app.core.logger import logger


def run_migration():
    logger.info("[MIGRAÇÃO] Iniciando migração do Sistema de Certificados...")
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        # 1. Colunas na tabela courses
        if "courses" in table_names:
            course_columns = [c["name"] for c in inspector.get_columns("courses")]
            with engine.connect() as conn:
                if "certificate_enabled" not in course_columns:
                    logger.info("[MIGRAÇÃO] Adicionando coluna certificate_enabled na tabela courses...")
                    conn.execute(text("ALTER TABLE courses ADD COLUMN certificate_enabled BOOLEAN DEFAULT TRUE;"))
                if "workload_hours" not in course_columns:
                    logger.info("[MIGRAÇÃO] Adicionando coluna workload_hours na tabela courses...")
                    conn.execute(text("ALTER TABLE courses ADD COLUMN workload_hours INTEGER DEFAULT 10;"))
                if "instructor_name" not in course_columns:
                    logger.info("[MIGRAÇÃO] Adicionando coluna instructor_name na tabela courses...")
                    conn.execute(text("ALTER TABLE courses ADD COLUMN instructor_name VARCHAR;"))
                conn.commit()
            logger.info("[MIGRAÇÃO] Colunas na tabela courses verificadas/adicionadas com sucesso.")

        # 2. Tabela certificates
        Base.metadata.create_all(
            bind=engine,
            tables=[Certificate.__table__]
        )
        logger.info("[MIGRAÇÃO] Tabela certificates criada/verificada com sucesso.")

        # 3. Índices adicionais caso necessário
        with engine.connect() as conn:
            try:
                conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_certificates_certificate_code ON certificates (certificate_code);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_certificates_user_id ON certificates (user_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_certificates_course_id ON certificates (course_id);"))
                conn.commit()
            except Exception:
                pass

        logger.info("[MIGRAÇÃO] Migração de Certificados concluída com sucesso!")
    except Exception as exc:
        logger.error(f"[MIGRAÇÃO] Erro na migração de certificados: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
