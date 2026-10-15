import base64
import hashlib
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings
from app.core.logger import logger

ENCRYPTION_PREFIX = "enc:v1:"

_fernet_instance: Optional[Fernet] = None


def _derive_fernet_key(raw_secret: str) -> bytes:
    """
    Deriva uma chave segura de 32 bytes em formato URL-safe Base64
    a partir de qualquer string secreta fornecida.
    """
    digest = hashlib.sha256(raw_secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def get_fernet() -> Fernet:
    """
    Retorna a instância singleton de Fernet para criptografia de DMs.
    Utiliza DM_ENCRYPTION_KEY configurada no ambiente ou deriva deterministicamente
    a partir de SECRET_KEY e SECURITY_PASSWORD_PEPPER.
    """
    global _fernet_instance
    if _fernet_instance is not None:
        return _fernet_instance

    custom_key = (settings.DM_ENCRYPTION_KEY or "").strip()
    if custom_key:
        try:
            # Valida se a chave informada já é uma chave Fernet válida
            key_bytes = custom_key.encode("utf-8")
            _fernet_instance = Fernet(key_bytes)
            return _fernet_instance
        except Exception as e:
            logger.warning(
                f"[Criptografia DM] Chave DM_ENCRYPTION_KEY não está no formato Fernet padrão ({e}). "
                f"Derivando chave segura de 32 bytes via SHA-256."
            )
            key_bytes = _derive_fernet_key(custom_key)
            _fernet_instance = Fernet(key_bytes)
            return _fernet_instance

    # Fallback seguro: derivação determinística a partir dos segredos da aplicação
    seed_str = f"{settings.SECRET_KEY}:{settings.SECURITY_PASSWORD_PEPPER}:dm_cipher_salt"
    key_bytes = _derive_fernet_key(seed_str)
    _fernet_instance = Fernet(key_bytes)
    return _fernet_instance


def encrypt_dm_message(plain_text: Optional[str]) -> Optional[str]:
    """
    Encripta o conteúdo textual de uma mensagem direta (DM).
    Retorna o texto cifrado com o prefixo 'enc:v1:'.
    Se já estiver encriptado ou for vazio/None, retorna o valor original.
    """
    if plain_text is None:
        return None
    if not plain_text.strip():
        return plain_text

    # Idempotência: não re-encripta se já estiver encriptado
    if plain_text.startswith(ENCRYPTION_PREFIX):
        return plain_text

    try:
        cipher = get_fernet()
        encrypted_bytes = cipher.encrypt(plain_text.encode("utf-8"))
        return f"{ENCRYPTION_PREFIX}{encrypted_bytes.decode('utf-8')}"
    except Exception as exc:
        logger.error(f"[Criptografia DM] Erro ao encriptar mensagem: {exc}")
        # Retorna o texto original em caso de falha inesperada para não perder o dado
        return plain_text


def decrypt_dm_message(cipher_text: Optional[str]) -> Optional[str]:
    """
    Descriptografa o conteúdo de uma mensagem direta (DM).
    Se a mensagem não possuir o prefixo 'enc:v1:', é tratada como mensagem legada
    em texto plano e retornada diretamente sem alterações (retrocompatibilidade).
    """
    if cipher_text is None:
        return None
    if not cipher_text.startswith(ENCRYPTION_PREFIX):
        # Mensagem legada em texto plano ou vazia
        return cipher_text

    raw_token = cipher_text[len(ENCRYPTION_PREFIX):]
    try:
        cipher = get_fernet()
        decrypted_bytes = cipher.decrypt(raw_token.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except InvalidToken:
        logger.warning("[Criptografia DM] Falha ao descriptografar token: chave inválida ou adulterada.")
        return "[Mensagem protegida / Criptografada]"
    except Exception as exc:
        logger.error(f"[Criptografia DM] Erro inesperado ao descriptografar: {exc}")
        return "[Mensagem protegida / Criptografada]"


def is_dm_encrypted(text: Optional[str]) -> bool:
    """Verifica se uma string de mensagem está encriptada."""
    return bool(text and text.startswith(ENCRYPTION_PREFIX))
