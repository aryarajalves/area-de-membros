import os
import pytest
from sqlalchemy import Column, Integer, MetaData, String, Table, create_engine, inspect, text
from app.core.database import Base, engine
from app.main import app, lifespan
from unittest.mock import MagicMock
from app.services.auto_migration_service import (
    STARTUP_MIGRATION_ADVISORY_LOCK_ID,
    cleanup_stale_postgres_connections,
    postgres_startup_migration_lock,
    sync_missing_columns,
)


def test_sync_missing_columns_creates_absent_columns_automatically():
    """
    Simula uma tabela existente sem algumas colunas novas no banco e valida que
    `sync_missing_columns` cria automaticamente todas as colunas faltantes.
    """
    mem_engine = create_engine("sqlite:///:memory:")
    with mem_engine.begin() as conn:
        conn.execute(text("CREATE TABLE demo_items (id INTEGER PRIMARY KEY, name VARCHAR(100))"))

    temp_meta = MetaData()
    Table(
        "demo_items",
        temp_meta,
        Column("id", Integer, primary_key=True),
        Column("name", String(100)),
        Column("module_title", String(255)),
        Column("extra_count", Integer, default=0),
    )

    added = sync_missing_columns(mem_engine, temp_meta)
    assert "demo_items.module_title" in added
    assert "demo_items.extra_count" in added

    cols = {c["name"] for c in inspect(mem_engine).get_columns("demo_items")}
    assert "module_title" in cols
    assert "extra_count" in cols


@pytest.mark.asyncio
async def test_main_lifespan_auto_migration_and_schema_integrity():
    """
    Garante que o bloco SQL de auto-migração no lifespan de backend/app/main.py
    contém todas as tabelas e colunas novas (PostgreSQL e SQLite) e executa sem erros.
    """
    main_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "main.py")
    migrations_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "services", "startup_migrations.py")
    with open(main_path, "r", encoding="utf-8") as f:
        main_source = f.read()
    if os.path.exists(migrations_path):
        with open(migrations_path, "r", encoding="utf-8") as f:
            main_source += "\n" + f.read()

    # Verifica presença das instruções DDL obrigatórias no bloco de auto-migração de startup
    required_ddl_snippets = [
        "CREATE TABLE IF NOT EXISTS user_device_tokens",
        "CREATE TABLE IF NOT EXISTS user_blocks",
        "ALTER TABLE support_topics ADD COLUMN IF NOT EXISTS image_urls_json TEXT",
        "ALTER TABLE support_topics ADD COLUMN IF NOT EXISTS module_id INTEGER",
        "ALTER TABLE support_topics ADD COLUMN IF NOT EXISTS lesson_id INTEGER",
        "ALTER TABLE support_topics ADD COLUMN IF NOT EXISTS module_title VARCHAR(255)",
        "ALTER TABLE support_topics ADD COLUMN IF NOT EXISTS lesson_title VARCHAR(255)",
        "ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS completed_video_ids_json TEXT NULL",
    ]
    for snippet in required_ddl_snippets:
        assert snippet in main_source, f"DDL ausente do lifespan em main.py: {snippet}"

    # Executa o lifespan completo e valida que todas as tabelas e colunas existem no banco
    async with lifespan(app):
        insp = inspect(engine)
        db_tables = set(insp.get_table_names())
        for table_name, table_obj in Base.metadata.tables.items():
            assert table_name in db_tables, f"Tabela {table_name} não foi criada automaticamente"
            db_cols = {c["name"] for c in insp.get_columns(table_name)}
            for col in table_obj.columns:
                assert col.name in db_cols, f"Coluna {table_name}.{col.name} não foi criada automaticamente"


def test_postgres_startup_migration_lock_acquires_and_releases_on_postgres():
    """Garante que o advisory lock é adquirido antes e liberado mesmo em caso de erro."""
    mock_engine = MagicMock()
    mock_engine.dialect.name = "postgresql"
    mock_conn = MagicMock()
    mock_engine.connect.return_value = mock_conn

    with pytest.raises(RuntimeError):
        with postgres_startup_migration_lock(mock_engine):
            raise RuntimeError("Falha simulada")

    executed_sql = [str(call.args[0]) for call in mock_conn.execute.call_args_list]
    assert any("pg_advisory_lock" in sql for sql in executed_sql)
    assert any("pg_advisory_unlock" in sql for sql in executed_sql)
    assert mock_conn.execute.call_args_list[0].args[1] == {"lock_id": STARTUP_MIGRATION_ADVISORY_LOCK_ID}
    mock_conn.close.assert_called_once()


def test_postgres_startup_migration_lock_noop_on_sqlite():
    """Garante que o advisory lock não faz nada em bancos não-PostgreSQL."""
    mem_engine = create_engine("sqlite:///:memory:")
    with postgres_startup_migration_lock(mem_engine):
        assert True


def test_cleanup_stale_postgres_connections_filters_by_age():
    """Valida que apenas conexões antigas (min_age_seconds) são encerradas no PostgreSQL."""
    mock_engine = MagicMock()
    mock_engine.dialect.name = "postgresql"
    mock_conn = MagicMock()
    mock_result = MagicMock()
    mock_result.returns_rows = True
    mock_result.fetchall.return_value = [(1,), (2,)]
    mock_conn.execute.return_value = mock_result
    mock_engine.connect.return_value.__enter__.return_value = mock_conn

    terminated = cleanup_stale_postgres_connections(mock_engine, min_age_seconds=45)

    assert terminated == 2
    sql_text = str(mock_conn.execute.call_args.args[0])
    params = mock_conn.execute.call_args.args[1]
    assert "pg_terminate_backend" in sql_text
    assert "make_interval(secs => :min_age_seconds)" in sql_text
    assert params == {"min_age_seconds": 45}
    mock_conn.commit.assert_called_once()


def test_cleanup_stale_postgres_connections_noop_on_sqlite():
    """Garante retorno 0 em bancos não-PostgreSQL."""
    mem_engine = create_engine("sqlite:///:memory:")
    assert cleanup_stale_postgres_connections(mem_engine) == 0
