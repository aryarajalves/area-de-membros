"""
Serviço de auto-sincronização preventiva de schema no startup.
Inspeciona todas as tabelas e colunas definidas nos modelos SQLAlchemy (Base.metadata)
e adiciona automaticamente qualquer coluna faltante no PostgreSQL ou SQLite.
"""
from typing import List
from sqlalchemy import inspect, text
from app.core.logger import logger


def _format_scalar_default(col, is_postgres: bool) -> str:
    """Retorna cláusula DEFAULT SQL segura para defaults escalares simples, ou string vazia."""
    default = col.default
    if default is None or not getattr(default, "is_scalar", False):
        return ""
    arg = default.arg
    if isinstance(arg, bool):
        return f" DEFAULT {'TRUE' if arg else 'FALSE'}" if is_postgres else f" DEFAULT {1 if arg else 0}"
    if isinstance(arg, (int, float)):
        return f" DEFAULT {arg}"
    if isinstance(arg, str):
        escaped = arg.replace("'", "''")
        return f" DEFAULT '{escaped}'"
    return ""


def sync_missing_columns(engine, base) -> List[str]:
    """
    Compara todas as tabelas e colunas declaradas em `base.metadata.tables` com o banco atual
    e executa `ALTER TABLE ... ADD COLUMN` para qualquer coluna ausente.
    Retorna a lista de colunas adicionadas no formato `tabela.coluna`.
    """
    added_columns: List[str] = []
    metadata = getattr(base, "metadata", base)
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    is_postgres = "postgresql" in engine.dialect.name

    for table_name, table_obj in metadata.tables.items():
        if table_name not in existing_tables:
            continue

        existing_cols = {c["name"] for c in inspector.get_columns(table_name)}
        missing_cols = [col for col in table_obj.columns if col.name not in existing_cols]
        if not missing_cols:
            continue

        for col in missing_cols:
            try:
                col_type_sql = col.type.compile(dialect=engine.dialect)
            except Exception as exc:
                logger.warning(f"[AUTO-MIGRATE] Tipo não compilável para {table_name}.{col.name}: {exc}")
                continue

            default_clause = _format_scalar_default(col, is_postgres=is_postgres)
            if_not_exists = "IF NOT EXISTS " if is_postgres else ""
            # Sempre permite NULL ao adicionar coluna em tabela já existente sem default garantido
            alter_sql = f'ALTER TABLE "{table_name}" ADD COLUMN {if_not_exists}"{col.name}" {col_type_sql}{default_clause}'

            try:
                with engine.begin() as conn:
                    if is_postgres:
                        conn.execute(text("SET lock_timeout = '4s';"))
                        conn.execute(text("SET statement_timeout = '15s';"))
                    conn.execute(text(alter_sql))
                added_columns.append(f"{table_name}.{col.name}")
                logger.info(f"[AUTO-MIGRATE] Coluna faltante criada automaticamente: {table_name}.{col.name} ({col_type_sql})")
            except Exception as exc:
                logger.warning(f"[AUTO-MIGRATE] Aviso ao criar coluna {table_name}.{col.name}: {exc}")

    return added_columns
