import sys
import os

# Adiciona o diretório raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def run_migration():
    """
    Garante a unicidade de 1 depoimento por curso por usuário na tabela 'testimonials'.
    1. Remove duplicatas existentes mantendo apenas o depoimento mais recente (caso existam).
    2. Cria o índice único 'uq_testimonials_user_course' em (user_id, course_id).
    Compatível com SQLite e PostgreSQL.
    """
    logger.info("Iniciando migração de restrição única (user_id, course_id) em testimonials...")

    with engine.begin() as conn:
        dialect_name = engine.dialect.name
        logger.info(f"Dialeto detectado: {dialect_name}")

        # Limpeza defensiva de duplicatas mantendo apenas o registro com maior id
        try:
            cleanup_sql = text("""
                DELETE FROM testimonials
                WHERE id NOT IN (
                    SELECT MAX(id)
                    FROM testimonials
                    GROUP BY user_id, course_id
                );
            """)
            conn.execute(cleanup_sql)
            logger.info("Verificação e limpeza de eventuais duplicatas concluída.")
        except Exception as exc:
            logger.warning(f"Aviso durante limpeza de duplicatas: {exc}")

        # Criação do índice único
        try:
            create_index_sql = text("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_testimonials_user_course
                ON testimonials (user_id, course_id);
            """)
            conn.execute(create_index_sql)
            logger.info("Índice único 'uq_testimonials_user_course' criado com sucesso!")
        except Exception as exc:
            logger.error(f"Erro ao criar índice único uq_testimonials_user_course: {exc}")
            raise exc

    logger.info("Migração concluída com sucesso.")


if __name__ == "__main__":
    run_migration()
