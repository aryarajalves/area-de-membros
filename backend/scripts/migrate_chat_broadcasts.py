"""
Script de migração para suportar Etiquetas de Alunos e Disparos em Massa de DMs:
- Criação da tabela student_tags
- Criação da tabela student_tag_assignments
- Criação da tabela chat_broadcast_campaigns
- Criação da tabela chat_broadcast_recipients
- Adição da coluna read_at na tabela chat_messages
"""
from sqlalchemy import text
from app.core.database import engine
from app.core.logger import logger


def migrate_chat_broadcasts():
    with engine.connect() as conn:
        logger.info("Iniciando migração de etiquetas de alunos e campanhas de disparo em massa...")

        # 1. Adicionar coluna read_at em chat_messages se não existir
        conn.execute(text("""
            ALTER TABLE chat_messages
            ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE NULL;
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_chat_messages_read_at ON chat_messages(read_at);
        """))

        # 2. Tabela student_tags
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS student_tags (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
                description VARCHAR(255) NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_student_tags_name ON student_tags(name);
        """))

        # 3. Tabela student_tag_assignments
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS student_tag_assignments (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                tag_id INTEGER NOT NULL REFERENCES student_tags(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                CONSTRAINT uq_student_tag_assignment UNIQUE (student_id, tag_id)
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_student_tag_assignments_student_id ON student_tag_assignments(student_id);
            CREATE INDEX IF NOT EXISTS ix_student_tag_assignments_tag_id ON student_tag_assignments(tag_id);
        """))

        # 4. Tabela chat_broadcast_campaigns
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_broadcast_campaigns (
                id SERIAL PRIMARY KEY,
                created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                title VARCHAR(150) NOT NULL,
                message TEXT NOT NULL,
                filter_type VARCHAR(50) NOT NULL DEFAULT 'all',
                filter_course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
                filter_tag_id INTEGER REFERENCES student_tags(id) ON DELETE SET NULL,
                filter_role VARCHAR(30) DEFAULT 'aluno',
                total_recipients INTEGER NOT NULL DEFAULT 0,
                sent_count INTEGER NOT NULL DEFAULT 0,
                failed_count INTEGER NOT NULL DEFAULT 0,
                delay_seconds INTEGER NOT NULL DEFAULT 1,
                status VARCHAR(30) NOT NULL DEFAULT 'pending',
                started_at TIMESTAMP WITH TIME ZONE NULL,
                completed_at TIMESTAMP WITH TIME ZONE NULL,
                duration_seconds DOUBLE PRECISION NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_chat_broadcast_campaigns_status ON chat_broadcast_campaigns(status);
            CREATE INDEX IF NOT EXISTS ix_chat_broadcast_campaigns_created_at ON chat_broadcast_campaigns(created_at);
        """))

        # 5. Tabela chat_broadcast_recipients
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_broadcast_recipients (
                id SERIAL PRIMARY KEY,
                campaign_id INTEGER NOT NULL REFERENCES chat_broadcast_campaigns(id) ON DELETE CASCADE,
                recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                message_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                error_message TEXT NULL,
                sent_at TIMESTAMP WITH TIME ZONE NULL,
                read_at TIMESTAMP WITH TIME ZONE NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_chat_broadcast_recipients_campaign_id ON chat_broadcast_recipients(campaign_id);
            CREATE INDEX IF NOT EXISTS ix_chat_broadcast_recipients_recipient_id ON chat_broadcast_recipients(recipient_id);
            CREATE INDEX IF NOT EXISTS ix_chat_broadcast_recipients_status ON chat_broadcast_recipients(status);
        """))

        conn.commit()
        logger.info("Migração de etiquetas e disparos em massa concluída com sucesso!")
        print("Migração de etiquetas e disparos em massa concluída com sucesso!")


if __name__ == "__main__":
    migrate_chat_broadcasts()
