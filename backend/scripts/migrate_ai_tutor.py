"""
Script de Migração para o Sistema de Tutor IA Interativo:
1. Adiciona as colunas ai_tutor_active, ai_tutor_expires_at e ai_tutor_custom_monthly_limit na tabela users.
2. Cria a tabela ai_tutor_settings para parametrização global (prompt, temperatura, cota padrão, checkout).
3. Cria a tabela ai_tutor_messages para armazenamento do histórico de dúvidas e métricas de custo/tokens.
Compatível com SQLite e PostgreSQL.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text
from app.core.database import engine
from app.core.logger import logger


DEFAULT_SYSTEM_PROMPT = """Você é o Tutor de IA da plataforma de membros, especializado no curso "{curso_atual}".
Seu objetivo é guiar o aluno {nome_aluno} com didática acolhedora, objetiva e clara.

Diretrizes Obrigatórias:
1. Responda com base estrita no conteúdo da aula atual "{aula_atual}" e nas transcrições disponíveis.
2. Sempre que oportuno, mencione a minutagem aproximada em que o instrutor aborda o tema (ex: "Aos 02:15 do vídeo...").
3. Se a dúvida do aluno for abordada em outra aula do mesmo curso ou em outros cursos que ele já possui acesso, indique expressamente o módulo e aula.
4. Se o aluno perguntar sobre um assunto avançado disponível em outro curso da lista {cursos_nao_adquiridos}, responda cordialmente a dúvida básica e informe que o aprofundamento prático está disponível no respectivo treinamento.
5. Seja conciso: respostas em 2 a 4 parágrafos curtos, formatadas com tópicos e negritos para leitura fluida."""


def run_migration():
    logger.info("[MIGRAÇÃO] Iniciando migração do Tutor IA...")
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        with engine.connect() as conn:
            # 1. Adicionar colunas na tabela users se necessário
            if "users" in table_names:
                user_cols = [c["name"] for c in inspector.get_columns("users")]
                if "ai_tutor_active" not in user_cols:
                    logger.info("[MIGRAÇÃO] Adicionando coluna ai_tutor_active na tabela users...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN ai_tutor_active BOOLEAN DEFAULT FALSE;"))
                if "ai_tutor_expires_at" not in user_cols:
                    logger.info("[MIGRAÇÃO] Adicionando coluna ai_tutor_expires_at na tabela users...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN ai_tutor_expires_at TIMESTAMP;"))
                if "ai_tutor_custom_monthly_limit" not in user_cols:
                    logger.info("[MIGRAÇÃO] Adicionando coluna ai_tutor_custom_monthly_limit na tabela users...")
                    conn.execute(text("ALTER TABLE users ADD COLUMN ai_tutor_custom_monthly_limit INTEGER;"))
                conn.commit()

            # 2. Criar tabela ai_tutor_settings se não existir
            is_postgres = "postgresql" in str(engine.url).lower()
            id_pk = "SERIAL PRIMARY KEY" if is_postgres else "INTEGER PRIMARY KEY AUTOINCREMENT"

            if "ai_tutor_settings" not in table_names:
                logger.info("[MIGRAÇÃO] Criando tabela ai_tutor_settings...")
                conn.execute(text(f"""
                    CREATE TABLE ai_tutor_settings (
                        id {id_pk},
                        default_monthly_free_questions INTEGER NOT NULL DEFAULT 3,
                        system_prompt TEXT,
                        temperature FLOAT NOT NULL DEFAULT 0.3,
                        model_name VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
                        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                        sales_checkout_url VARCHAR(500),
                        monthly_price_brl FLOAT NOT NULL DEFAULT 10.0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.commit()

            # Inserir configuração inicial se a tabela estiver vazia
            existing_setting = conn.execute(text("SELECT id FROM ai_tutor_settings LIMIT 1;")).fetchone()
            if not existing_setting:
                logger.info("[MIGRAÇÃO] Inserindo configuração padrão do Tutor IA...")
                conn.execute(text("""
                    INSERT INTO ai_tutor_settings (
                        default_monthly_free_questions,
                        system_prompt,
                        temperature,
                        model_name,
                        is_enabled,
                        monthly_price_brl
                    ) VALUES (
                        3,
                        :prompt,
                        0.3,
                        'gpt-4o-mini',
                        TRUE,
                        10.0
                    );
                """), {"prompt": DEFAULT_SYSTEM_PROMPT})
                conn.commit()

            # 3. Criar tabela ai_tutor_messages se não existir
            if "ai_tutor_messages" not in table_names:
                logger.info("[MIGRAÇÃO] Criando tabela ai_tutor_messages...")
                conn.execute(text(f"""
                    CREATE TABLE ai_tutor_messages (
                        id {id_pk},
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                        lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
                        role VARCHAR(20) NOT NULL,
                        content TEXT NOT NULL,
                        prompt_tokens INTEGER DEFAULT 0,
                        completion_tokens INTEGER DEFAULT 0,
                        cost_brl FLOAT NOT NULL DEFAULT 0.0,
                        related_lessons_json TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_tutor_messages_user_id ON ai_tutor_messages(user_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_tutor_messages_course_id ON ai_tutor_messages(course_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_tutor_messages_lesson_id ON ai_tutor_messages(lesson_id);"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_ai_tutor_messages_created_at ON ai_tutor_messages(created_at);"))
                conn.commit()

        logger.info("[MIGRAÇÃO] Migração do Tutor IA executada com sucesso!")
        return True
    except Exception as e:
        logger.error(f"[MIGRAÇÃO] Falha ao executar migração do Tutor IA: {e}")
        return False


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
