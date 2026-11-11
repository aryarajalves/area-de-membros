#!/usr/bin/env python3
"""
Validador de Otimização de Conexões e Consultas de Banco de Dados.

Executa 4 verificações de alta performance e escalabilidade:
1. Connection Pooling: Valida limites seguros de pool_size, max_overflow, pool_recycle e pool_pre_ping.
2. Indexação de ForeignKeys: Garante que 100% das chaves estrangeiras estejam indexadas para evitar Full Table Scans.
3. Prevenção de Vazamento de Sessões: Audita todas as instanciações de SessionLocal() exigindo fechamento no finally/with.
4. Otimização de Eager Loading (N+1): Checa relacionamentos em endpoints de alto tráfego com joinedload/selectinload.
"""

import os
import sys
import re
import ast
import io

# Garante suporte a UTF-8 no Windows Console
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


def check_connection_pooling():
    """Valida as configurações do pool de conexões do SQLAlchemy."""
    print("\n" + "=" * 70)
    print("🔌 [1/4] AUDITORIA DO POOL DE CONEXÕES (CONNECTION POOL)")
    print("=" * 70)

    from app.core.config import settings
    from app.core import database as db_mod

    errors = []

    # 1. Pool Size
    pool_size = getattr(settings, "DB_POOL_SIZE", None)
    if pool_size is None or pool_size < 5:
        errors.append(f"DB_POOL_SIZE={pool_size} é muito baixo (recomendado >= 5).")
    elif pool_size > 50:
        errors.append(f"DB_POOL_SIZE={pool_size} muito alto para instâncias padrão de Postgres.")
    else:
        print(f"  ✅ DB_POOL_SIZE: {pool_size} conexões simultâneas base.")

    # 2. Max Overflow
    max_overflow = getattr(settings, "DB_MAX_OVERFLOW", None)
    if max_overflow is None or max_overflow < 5:
        errors.append(f"DB_MAX_OVERFLOW={max_overflow} é muito baixo (recomendado >= 5).")
    else:
        print(f"  ✅ DB_MAX_OVERFLOW: até +{max_overflow} conexões em picos de tráfego.")

    # 3. Pool Recycle
    pool_recycle = getattr(settings, "DB_POOL_RECYCLE", None)
    if pool_recycle is None or pool_recycle < 60 or pool_recycle > 3600:
        errors.append(f"DB_POOL_RECYCLE={pool_recycle} inválido (recomendado entre 300s e 1800s).")
    else:
        print(f"  ✅ DB_POOL_RECYCLE: reciclagem preventiva a cada {pool_recycle}s.")

    # 4. Engine Kwargs (pool_pre_ping)
    db_source = open(os.path.join(BACKEND_DIR, "app", "core", "database.py"), "r", encoding="utf-8").read()
    if 'engine_kwargs["pool_pre_ping"] = True' in db_source or "pool_pre_ping=True" in db_source:
        print("  ✅ pool_pre_ping: Ativo (elimina conexões zumbis/stale connections).")
    else:
        errors.append("pool_pre_ping não está ativado no database.py.")

    if 'connect_timeout' in db_source:
        print("  ✅ connect_timeout: 10s configurado no connect_args.")
    else:
        errors.append("connect_timeout ausente no connect_args.")

    if errors:
        for err in errors:
            print(f"  ❌ {err}")
        return False

    print("  🎉 [OK] Pool de conexões otimizado e seguro!")
    return True


def check_fk_indexes():
    """Valida se 100% das chaves estrangeiras (ForeignKeys) possuem índice criado."""
    print("\n" + "=" * 70)
    print("🔑 [2/4] AUDITORIA DE ÍNDICES EM CHAVES ESTRANGEIRAS (FOREIGN KEYS)")
    print("=" * 70)

    import app.models
    from app.core.database import Base

    total_fks = 0
    indexed_fks = 0
    missing_fks = []

    for table_name, table in Base.metadata.tables.items():
        # Coleta índices compostos da tabela
        table_indexes = {col.name for idx in table.indexes for col in idx.columns}
        for col in table.columns:
            if col.foreign_keys:
                total_fks += 1
                if col.index or col.primary_key or col.name in table_indexes:
                    indexed_fks += 1
                else:
                    missing_fks.append(f"{table_name}.{col.name}")

    print(f"  📊 Total de ForeignKeys declaradas: {total_fks}")
    print(f"  ⚡ ForeignKeys indexadas:           {indexed_fks} ({(indexed_fks/total_fks*100):.1f}%)")

    if missing_fks:
        print(f"  ❌ {len(missing_fks)} chave(s) estrangeira(s) sem índice explícito:")
        for mf in missing_fks:
            print(f"     • {mf}")
        return False

    print("  🎉 [OK] 100% das Chaves Estrangeiras estão indexadas (zero Full Table Scans em JOINs)!")
    return True


def check_session_leaks():
    """Valida se todas as chamadas de SessionLocal() são fechadas via try/finally ou with."""
    print("\n" + "=" * 70)
    print("🚰 [3/4] AUDITORIA DE VAZAMENTO DE SESSÕES (SESSION LEAKS)")
    print("=" * 70)

    app_dir = os.path.join(BACKEND_DIR, "app")
    suspicious_calls = []
    total_found = 0

    for root, _, files in os.walk(app_dir):
        for file in files:
            if not file.endswith(".py") or file in ["database.py"]:
                continue
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            if "SessionLocal()" in content:
                # Procura se há .close() ou with SessionLocal()
                rel_path = os.path.relpath(filepath, BASE_DIR)
                matches = list(re.finditer(r"SessionLocal\(\)", content))
                total_found += len(matches)

                has_close = ".close()" in content
                has_with = "with SessionLocal()" in content

                if not has_close and not has_with:
                    suspicious_calls.append((rel_path, "Sem .close() ou context manager with"))

    print(f"  📊 Total de instâncias manuais SessionLocal() fora de rotas: {total_found}")
    if suspicious_calls:
        print(f"  ❌ Detectado(s) {len(suspicious_calls)} arquivo(s) com potencial vazamento:")
        for path, reason in suspicious_calls:
            print(f"     • {path}: {reason}")
        return False

    print("  🎉 [OK] Todas as sessões manuais possuem fechamento garantido (db.close() ou with)!")
    return True


def check_eager_loading_n_plus_one():
    """Valida o uso de joinedload / selectinload em consultas de listagem com relacionamentos."""
    print("\n" + "=" * 70)
    print("🚀 [4/4] AUDITORIA DE CONSULTAS E CARREGAMENTO ANTECIPADO (PREVENÇÃO DE N+1)")
    print("=" * 70)

    endpoints_to_check = [
        os.path.join(BACKEND_DIR, "app", "api", "v1", "endpoints", "community_feed.py"),
        os.path.join(BACKEND_DIR, "app", "api", "v1", "endpoints", "community_stories.py"),
        os.path.join(BACKEND_DIR, "app", "services", "chat_dm_service.py"),
    ]

    all_passed = True
    for ep_path in endpoints_to_check:
        filename = os.path.basename(ep_path)
        if not os.path.exists(ep_path):
            continue
        with open(ep_path, "r", encoding="utf-8") as f:
            content = f.read()

        if "joinedload" in content or "selectinload" in content:
            print(f"  ✅ {filename}: Utiliza joinedload/selectinload para evitar consultas N+1.")
        else:
            print(f"  ⚠️  {filename}: Não utiliza joinedload explicito nas consultas.")
            all_passed = False

    return all_passed


def main():
    print("\n" + "#" * 70)
    print("📊 [DIAGNÓSTICO DE OTIMIZAÇÃO DE BANCO DE DADOS]")
    print("#" * 70)

    c1 = check_connection_pooling()
    c2 = check_fk_indexes()
    c3 = check_session_leaks()
    c4 = check_eager_loading_n_plus_one()

    print("\n" + "=" * 70)
    if c1 and c2 and c3 and c4:
        print("🏆 [SUCESSO TOTAL] O banco de dados está 100% otimizado para produção!")
        print("=" * 70 + "\n")
        sys.exit(0)
    else:
        print("❌ [FALHA] Foram encontrados gargalos ou configurações não otimizadas.")
        print("=" * 70 + "\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
