"""
Serviço de auto-sincronização preventiva de schema no startup.
Inspeciona todas as tabelas e colunas definidas nos modelos SQLAlchemy (Base.metadata)
e adiciona automaticamente qualquer coluna faltante no PostgreSQL ou SQLite.
"""
from contextlib import contextmanager
from typing import List
from sqlalchemy import inspect, text
from app.core.logger import logger

STARTUP_MIGRATION_ADVISORY_LOCK_ID = 74829103


@contextmanager
def postgres_startup_migration_lock(engine, lock_id: int = STARTUP_MIGRATION_ADVISORY_LOCK_ID):
    """
    Serializa a rotina de limpeza e auto-migração no startup entre múltiplos workers Uvicorn
    usando PostgreSQL Advisory Lock, evitando que um worker derrube ou cause lock/deadlock
    nos DDLs de outro worker. Em outros bancos (ex.: SQLite), é um no-op.
    """
    is_postgres = "postgresql" in engine.dialect.name
    if not is_postgres:
        yield
        return

    conn = None
    locked = False
    try:
        conn = engine.connect()
        conn.execute(text("SELECT pg_advisory_lock(:lock_id)"), {"lock_id": lock_id})
        conn.commit()
        locked = True
        logger.info("[MAIN] Advisory lock de startup adquirido no PostgreSQL.")
    except Exception as exc:
        logger.warning(f"[MAIN] Aviso ao adquirir advisory lock de startup: {exc}")

    try:
        yield
    finally:
        if conn is not None:
            if locked:
                try:
                    conn.execute(text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": lock_id})
                    conn.commit()
                except Exception as exc:
                    logger.warning(f"[MAIN] Aviso ao liberar advisory lock de startup: {exc}")
            try:
                conn.close()
            except Exception:
                pass


def cleanup_stale_postgres_connections(engine, min_age_seconds: int = 30) -> int:
    """
    Encerra apenas conexões órfãs antigas no PostgreSQL ('idle in transaction' ou DDLs travados)
    com idade superior a `min_age_seconds`, evitando encerrar conexões recém-abertas por outros workers.
    """
    if "postgresql" not in engine.dialect.name:
        return 0

    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = current_database()
                      AND pid <> pg_backend_pid()
                      AND state_change < NOW() - make_interval(secs => :min_age_seconds)
                      AND (
                          state IN ('idle in transaction', 'idle in transaction (aborted)')
                          OR (state = 'active' AND query ILIKE 'ALTER TABLE%')
                      );
                """),
                {"min_age_seconds": min_age_seconds},
            )
            terminated = len(result.fetchall()) if result.returns_rows else 0
            conn.commit()
            logger.info(
                f"[MAIN] Conexões órfãs e transações pendentes no PostgreSQL limpas com sucesso ({terminated} encerradas)."
            )
            return terminated
    except Exception as exc:
        logger.warning(f"[MAIN] Aviso na verificação inicial de conexões do banco: {exc}")
        return 0


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
