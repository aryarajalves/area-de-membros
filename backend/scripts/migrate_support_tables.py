import sys
import os

# Adiciona o diretório raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models.user import User
from app.models.course import Course
from app.models.support import SupportTopic, SupportReply, SupportTopicLike
from app.core.logger import logger


def run_migration():
    """
    Cria as tabelas do módulo de Suporte/Dúvidas se não existirem.
    """
    logger.info("Iniciando migração das tabelas do módulo de Suporte...")
    try:
        # Cria as tabelas associadas ao Support
        Base.metadata.create_all(
            bind=engine,
            tables=[
                SupportTopic.__table__,
                SupportReply.__table__,
                SupportTopicLike.__table__,
            ]
        )
        logger.info("Tabelas support_topics, support_replies e support_topic_likes verificadas/criadas com sucesso!")
    except Exception as exc:
        logger.error(f"Erro durante a migração das tabelas de Suporte: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
