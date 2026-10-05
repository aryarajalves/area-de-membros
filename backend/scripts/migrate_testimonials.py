import sys
import os

# Adiciona o diretório raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models.user import User
from app.models.course import Course
from app.models.testimonial import Testimonial
from app.core.logger import logger


def run_migration():
    """
    Cria a tabela de Depoimentos (testimonials) caso ainda não exista.
    """
    logger.info("Iniciando migração da tabela de Depoimentos (testimonials)...")
    try:
        Base.metadata.create_all(
            bind=engine,
            tables=[
                Testimonial.__table__,
            ]
        )
        logger.info("Tabela testimonials criada/verificada com sucesso!")
    except Exception as exc:
        logger.error(f"Erro durante a migração da tabela testimonials: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
