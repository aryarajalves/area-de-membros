"""
Script de Migração da Fase 3:
1. Ativação da extensão pgvector no PostgreSQL.
2. Adição da coluna nativa `embedding vector(1536)` em `ai_knowledge_chunks`.
3. Criação de índice HNSW (vector_cosine_ops) para busca semântica em tempo real do Tutor IA.
4. Migração retroativa dos vetores existentes em `embedding_json` para a nova coluna `embedding`.
"""
import sys
import os
import json

# Garante path para importar módulos do app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.core.database import engine, SessionLocal
from app.core.logger import logger


def run_migration():
    print("[MIGRAÇÃO FASE 3] Iniciando migração de pgvector...")
    db = SessionLocal()
    try:
        # 1. Verifica dialeto
        dialect = engine.dialect.name
        print(f"[MIGRAÇÃO FASE 3] Dialeto do banco: {dialect}")

        if dialect == "postgresql":
            # Cria extensão se suportado
            try:
                db.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                db.commit()
                print("[MIGRAÇÃO FASE 3] Extensão pgvector ativada com sucesso.")
            except Exception as ext_err:
                db.rollback()
                print(f"[MIGRAÇÃO FASE 3] Aviso ao ativar extensão vector: {ext_err}")

            # Adiciona coluna nativa vector se a extensão existir
            try:
                db.execute(text("ALTER TABLE ai_knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector(1536);"))
                db.commit()
                print("[MIGRAÇÃO FASE 3] Coluna ai_knowledge_chunks.embedding criada com sucesso.")
            except Exception as col_err:
                db.rollback()
                print(f"[MIGRAÇÃO FASE 3] Aviso ao adicionar coluna embedding: {col_err}")

            # Cria índice HNSW para busca por similaridade de cosseno
            try:
                db.execute(text("""
                    CREATE INDEX IF NOT EXISTS ix_ai_knowledge_chunks_embedding_hnsw 
                    ON ai_knowledge_chunks USING hnsw (embedding vector_cosine_ops);
                """))
                db.commit()
                print("[MIGRAÇÃO FASE 3] Índice HNSW criado com sucesso.")
            except Exception as idx_err:
                db.rollback()
                print(f"[MIGRAÇÃO FASE 3] Aviso ao criar índice HNSW: {idx_err}")

            # Migra registros antigos que têm embedding_json mas não têm embedding
            try:
                rows = db.execute(text("SELECT id, embedding_json FROM ai_knowledge_chunks WHERE embedding IS NULL AND embedding_json IS NOT NULL;")).fetchall()
                updated = 0
                for r in rows:
                    chunk_id, emb_json = r[0], r[1]
                    try:
                        emb_list = json.loads(emb_json)
                        if isinstance(emb_list, list) and len(emb_list) == 1536:
                            vec_str = "[" + ",".join(str(f) for f in emb_list) + "]"
                            db.execute(
                                text("UPDATE ai_knowledge_chunks SET embedding = :vec WHERE id = :id"),
                                {"vec": vec_str, "id": chunk_id}
                            )
                            updated += 1
                    except Exception:
                        pass
                if updated > 0:
                    db.commit()
                    print(f"[MIGRAÇÃO FASE 3] {updated} chunks antigos convertidos para vetor nativo.")
            except Exception as mig_err:
                db.rollback()
                print(f"[MIGRAÇÃO FASE 3] Aviso na conversão de registros antigos: {mig_err}")

        else:
            print("[MIGRAÇÃO FASE 3] Banco SQLite detectado. pgvector ignorado no dialeto local.")

        print("[MIGRAÇÃO FASE 3] Migração finalizada com sucesso!")

    except Exception as exc:
        print(f"[MIGRAÇÃO FASE 3] Erro geral: {exc}")
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
