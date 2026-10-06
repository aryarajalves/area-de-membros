import sys
from sqlalchemy import text
from app.core.database import engine

def fix_sequences():
    print("Iniciando correção de sequências nas tabelas de chat...")
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. chat_message_favorites
            conn.execute(text("""
                CREATE SEQUENCE IF NOT EXISTS chat_message_favorites_id_seq;
                ALTER TABLE chat_message_favorites ALTER COLUMN id SET DEFAULT nextval('chat_message_favorites_id_seq');
                ALTER SEQUENCE chat_message_favorites_id_seq OWNED BY chat_message_favorites.id;
                SELECT setval('chat_message_favorites_id_seq', COALESCE((SELECT MAX(id) FROM chat_message_favorites), 0) + 1, false);
            """))
            print("✓ Sequência da tabela 'chat_message_favorites' corrigida com sucesso!")

            # 2. chat_message_likes (garantir também)
            conn.execute(text("""
                CREATE SEQUENCE IF NOT EXISTS chat_message_likes_id_seq;
                ALTER TABLE chat_message_likes ALTER COLUMN id SET DEFAULT nextval('chat_message_likes_id_seq');
                ALTER SEQUENCE chat_message_likes_id_seq OWNED BY chat_message_likes.id;
                SELECT setval('chat_message_likes_id_seq', COALESCE((SELECT MAX(id) FROM chat_message_likes), 0) + 1, false);
            """))
            print("✓ Sequência da tabela 'chat_message_likes' corrigida com sucesso!")

            trans.commit()
            print("Todas as correções foram aplicadas com sucesso!")
        except Exception as e:
            trans.rollback()
            print(f"Erro ao aplicar correção de sequências: {e}")
            sys.exit(1)

if __name__ == "__main__":
    fix_sequences()
