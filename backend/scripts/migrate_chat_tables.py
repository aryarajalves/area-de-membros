import sys
import os

# Adiciona o diretório raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models.user import User
from app.models.course import Course
from app.models.chat import ChatMessage
from app.core.logger import logger


def run_migration():
    """
    Cria as tabelas do módulo de Chat da Comunidade (chat_messages) se não existirem.
    """
    logger.info("Iniciando migração da tabela do módulo de Chat...")
    try:
        Base.metadata.create_all(
            bind=engine,
            tables=[
                ChatMessage.__table__,
            ]
        )
        logger.info("Tabela chat_messages verificada/criada com sucesso!")
    except Exception as exc:
        logger.error(f"Erro durante a migração da tabela do Chat: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
