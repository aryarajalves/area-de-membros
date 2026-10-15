import sys
import os

# Ajusta o sys.path para importar os módulos da aplicação
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect
from app.core.database import SessionLocal, engine
from app.models.chat import ChatMessage
from app.services.chat_encryption_service import encrypt_dm_message, is_dm_encrypted
from app.core.logger import logger


def migrate_encrypt_existing_dm_messages():
    """
    Migração de dados: Encripta retroativamente todas as mensagens de DM
    existentes no banco que ainda estão em texto plano.
    """
    inspector = inspect(engine)
    if not inspector.has_table("chat_messages"):
        print("[MIGRAÇÃO] Tabela 'chat_messages' ainda não existe neste banco. Nada a encriptar.")
        return

    db = SessionLocal()
    try:
        print("[MIGRAÇÃO] Iniciando encriptação de mensagens diretas (DM) existentes...")
        dms = db.query(ChatMessage).filter(ChatMessage.channel_type == "dm").all()
        encrypted_count = 0
        already_encrypted_count = 0

        for msg in dms:
            if not msg.message:
                continue

            if is_dm_encrypted(msg.message):
                already_encrypted_count += 1
                continue

            # Encripta a mensagem legada
            encrypted_text = encrypt_dm_message(msg.message)
            msg.message = encrypted_text
            encrypted_count += 1

        db.commit()
        print(f"[MIGRAÇÃO CONCLUÍDA] {encrypted_count} mensagens de DM foram encriptadas com sucesso.")
        print(f"[MIGRAÇÃO CONCLUÍDA] {already_encrypted_count} mensagens já estavam encriptadas.")
    except Exception as e:
        db.rollback()
        print(f"[ERRO MIGRAÇÃO] Falha ao encriptar mensagens de DM: {e}")
        logger.error(f"Erro na migração de encriptação de DMs: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    migrate_encrypt_existing_dm_messages()
