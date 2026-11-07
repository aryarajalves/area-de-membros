"""
Migração: Adiciona colunas de diretrizes de conduta (permitido vs proibido) e tabela de sugestões de melhoria do Tutor IA
"""
import sys
import os
from sqlalchemy import text

# Adiciona o diretório backend ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

def migrate():
    print("Iniciando migração de diretrizes e sugestões do Tutor IA...")
    with engine.connect() as conn:
        # 1. Colunas em ai_tutor_settings
        columns_to_add = [
            ("allowed_topics", "TEXT NULL"),
            ("prohibited_topics", "TEXT NULL"),
            ("redirect_app_url", "VARCHAR(500) NULL"),
            ("redirect_app_name", "VARCHAR(150) NULL"),
            ("prohibited_response_guideline", "TEXT NULL")
        ]

        for col_name, col_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE ai_tutor_settings ADD COLUMN {col_name} {col_type};"))
                conn.commit()
                print(f"[OK] Coluna '{col_name}' adicionada à tabela ai_tutor_settings.")
            except Exception as e:
                conn.rollback()
                if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                    print(f"[INFO] Coluna '{col_name}' já existe em ai_tutor_settings.")
                else:
                    print(f"[ERRO] Falha ao adicionar coluna '{col_name}': {e}")

        # 2. Tabela de sugestões de melhoria coletadas pelo tutor
        try:
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS ai_tutor_suggestions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER NULL REFERENCES courses(id) ON DELETE SET NULL,
                lesson_id INTEGER NULL REFERENCES lessons(id) ON DELETE SET NULL,
                suggestion_text TEXT NOT NULL,
                category VARCHAR(50) DEFAULT 'platform_improvement',
                status VARCHAR(30) DEFAULT 'new',
                admin_notes TEXT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """
            conn.execute(text(create_table_sql))
            conn.commit()
            print("[OK] Tabela 'ai_tutor_suggestions' criada/validada com sucesso.")
        except Exception as e:
            conn.rollback()
            print(f"[ERRO] Falha ao criar tabela 'ai_tutor_suggestions': {e}")

    print("Migração de diretrizes e sugestões finalizada!")

if __name__ == "__main__":
    migrate()
