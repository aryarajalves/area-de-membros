import sys
import os

# Adiciona o diretório raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine, Base, SessionLocal
from app.models.tutorial import Tutorial
from app.core.logger import logger


def run_migration():
    """
    Cria a tabela de Vídeos Tutoriais Iniciais (tutorials) caso ainda não exista.
    """
    logger.info("Iniciando migração da tabela de Tutoriais Iniciais (tutorials)...")
    try:
        Base.metadata.create_all(
            bind=engine,
            tables=[
                Tutorial.__table__,
            ]
        )
        logger.info("Tabela tutorials criada/verificada com sucesso!")

        # Garante sequence do PostgreSQL se aplicável
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE tutorials ALTER COLUMN id SET DEFAULT nextval('tutorials_id_seq');"))
                conn.commit()
            except Exception:
                pass

        logger.info("Migração da tabela tutorials finalizada com êxito.")
    except Exception as exc:
        logger.error(f"Erro durante a migração da tabela tutorials: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
