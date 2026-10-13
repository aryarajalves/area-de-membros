import sys
import os

# Adiciona o diretório raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine, Base
from app.models.introduction import IntroductionPost, IntroductionComment, IntroductionLike
from app.core.logger import logger


def run_migration():
    """
    Cria as tabelas de Apresente-se (introduction_posts, introduction_comments, introduction_likes) caso ainda não existam.
    """
    logger.info("Iniciando migração das tabelas de Apresente-se (introductions)...")
    try:
        Base.metadata.create_all(
            bind=engine,
            tables=[
                IntroductionPost.__table__,
                IntroductionComment.__table__,
                IntroductionLike.__table__,
            ]
        )
        logger.info("Tabelas de Apresente-se criadas/verificadas com sucesso!")

        # Garante sequence do PostgreSQL se aplicável
        with engine.connect() as conn:
            for seq_table in ["introduction_posts", "introduction_comments", "introduction_likes"]:
                try:
                    conn.execute(text(f"ALTER TABLE {seq_table} ALTER COLUMN id SET DEFAULT nextval('{seq_table}_id_seq');"))
                    conn.commit()
                except Exception:
                    pass

        logger.info("Migração de Apresente-se finalizada com êxito.")
    except Exception as exc:
        logger.error(f"Erro durante a migração das tabelas de Apresente-se: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
