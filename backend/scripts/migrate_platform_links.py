import sys
import os

# Adiciona o diretório raiz do backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base, SessionLocal
from app.models.platform_link import PlatformLink
from app.core.logger import logger


def run_migration():
    """
    Cria a tabela de Links da Plataforma (platform_links) caso ainda não exista.
    Insere links iniciais de demonstração (Instagram e YouTube) caso a tabela esteja vazia.
    """
    logger.info("Iniciando migração da tabela de Links da Plataforma (platform_links)...")
    try:
        Base.metadata.create_all(
            bind=engine,
            tables=[
                PlatformLink.__table__,
            ]
        )
        logger.info("Tabela platform_links criada/verificada com sucesso!")

        # Inserção de links iniciais caso a tabela esteja vazia
        db = SessionLocal()
        count = db.query(PlatformLink).count()
        if count == 0:
            initial_links = [
                PlatformLink(
                    title="Instagram",
                    url="https://instagram.com",
                    icon="instagram",
                    order_index=1,
                    is_active=True
                ),
                PlatformLink(
                    title="YouTube",
                    url="https://youtube.com",
                    icon="youtube",
                    order_index=2,
                    is_active=True
                ),
            ]
            db.add_all(initial_links)
            db.commit()
            logger.info("Links padrão (Instagram e YouTube) inseridos com sucesso!")
        db.close()
    except Exception as exc:
        logger.error(f"Erro durante a migração da tabela platform_links: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
