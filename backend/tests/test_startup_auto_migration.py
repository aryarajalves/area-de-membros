import os
import pytest
from sqlalchemy import inspect
from app.core.database import Base, engine
from app.main import app, lifespan


@pytest.mark.asyncio
async def test_main_lifespan_auto_migration_and_schema_integrity():
    """
    Garante que o bloco SQL de auto-migração no lifespan de backend/app/main.py
    contém todas as tabelas e colunas novas (PostgreSQL e SQLite) e executa sem erros.
    """
    main_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "main.py")
    with open(main_path, "r", encoding="utf-8") as f:
        main_source = f.read()

    # Verifica presença das instruções DDL obrigatórias no bloco de auto-migração de main.py
    required_ddl_snippets = [
        "CREATE TABLE IF NOT EXISTS user_device_tokens",
        "CREATE TABLE IF NOT EXISTS user_blocks",
        "ALTER TABLE support_topics ADD COLUMN IF NOT EXISTS image_urls_json TEXT",
        "ALTER TABLE support_topics ADD COLUMN IF NOT EXISTS module_id INTEGER",
        "ALTER TABLE support_topics ADD COLUMN IF NOT EXISTS lesson_id INTEGER",
        "ALTER TABLE support_topics ADD COLUMN IF NOT EXISTS module_title VARCHAR(255)",
        "ALTER TABLE support_topics ADD COLUMN IF NOT EXISTS lesson_title VARCHAR(255)",
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
