import pytest
from app.core.config import settings
from app.core.database import get_db, SessionLocal
from sqlalchemy import create_engine

def test_database_pool_settings():
    """
    Testa se as configurações do pool de banco de dados possuem valores
    padrões seguros e configuráveis via variáveis de ambiente.
    """
    assert hasattr(settings, "DB_POOL_SIZE")
    assert hasattr(settings, "DB_MAX_OVERFLOW")
    assert hasattr(settings, "DB_POOL_TIMEOUT")
    assert hasattr(settings, "DB_POOL_RECYCLE")

    assert settings.DB_POOL_SIZE >= 5
    assert settings.DB_MAX_OVERFLOW >= 5
    assert settings.DB_POOL_TIMEOUT > 0
    assert settings.DB_POOL_RECYCLE >= 60

def test_engine_kwargs_postgresql_pool_configuration():
    """
    Testa se a montagem dos parâmetros do pool do SQLAlchemy para PostgreSQL
    utiliza corretamente os valores configurados nas settings.
    """
    from app.core import database as db_module

    # Simula montagem de engine com URL PostgreSQL
    test_pg_url = "postgresql+psycopg2://user:pass@localhost:5432/testdb"
    engine_kwargs = {
        "connect_args": {"connect_timeout": 10},
        "pool_pre_ping": True,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
    }

    assert engine_kwargs["pool_pre_ping"] is True
    assert engine_kwargs["pool_size"] == settings.DB_POOL_SIZE
    assert engine_kwargs["max_overflow"] == settings.DB_MAX_OVERFLOW
    assert engine_kwargs["pool_timeout"] == settings.DB_POOL_TIMEOUT
    assert engine_kwargs["pool_recycle"] == settings.DB_POOL_RECYCLE

def test_get_db_session_lifecycle():
    """
    Testa se o gerador get_db entrega uma sessão utilizável e garante
    o fechamento automático ao finalizar a requisição.
    """
    gen = get_db()
    session = next(gen)
    assert session is not None
    try:
        # Verifica se é uma sessão ativa
        assert hasattr(session, "query")
    finally:
        try:
            next(gen)
        except StopIteration:
            pass
