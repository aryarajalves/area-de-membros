import sys
import os

# Adiciona o caminho raiz da aplicação
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def migrate():
    """
    Adiciona a coluna reaction_type na tabela introduction_likes se não existir.
    Permite suporte a múltiplas reações estilo LinkedIn (like, love, celebrate, insightful, fire, rocket).
    """
    with engine.begin() as conn:
        try:
            logger.info("Verificando/adicionando coluna reaction_type em introduction_likes...")
            conn.execute(
                text(
                    "ALTER TABLE introduction_likes ADD COLUMN IF NOT EXISTS reaction_type VARCHAR(20) DEFAULT 'like';"
                )
            )
            logger.info("Coluna reaction_type garantida com sucesso em introduction_likes.")
        except Exception as e:
            logger.error(f"Erro na migração de reaction_type: {e}")
            raise e


if __name__ == "__main__":
    migrate()
