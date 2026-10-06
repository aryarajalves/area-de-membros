import sys
from sqlalchemy import text
from app.core.database import engine

def migrate_support_topic_favorites():
    print("Iniciando migração da tabela 'support_topic_favorites'...")
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS support_topic_favorites (
                    id SERIAL PRIMARY KEY,
                    topic_id INTEGER NOT NULL REFERENCES support_topics(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_support_topic_favorite UNIQUE (topic_id, user_id)
                );

                CREATE INDEX IF NOT EXISTS ix_support_topic_favorites_id ON support_topic_favorites(id);
                CREATE INDEX IF NOT EXISTS ix_support_topic_favorites_topic_id ON support_topic_favorites(topic_id);
                CREATE INDEX IF NOT EXISTS ix_support_topic_favorites_user_id ON support_topic_favorites(user_id);
            """))
            trans.commit()
            print("✓ Tabela 'support_topic_favorites' criada com sucesso!")
        except Exception as e:
            trans.rollback()
            print(f"Erro ao criar tabela 'support_topic_favorites': {e}")
            sys.exit(1)

if __name__ == "__main__":
    migrate_support_topic_favorites()
