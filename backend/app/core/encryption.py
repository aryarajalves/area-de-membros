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
    Retorna a instância singleton de Fernet para criptografia de dados sensíveis em repouso
    (mensagens diretas DMs, segredos de webhook, tokens de integrações).
    """
    global _fernet_instance
    if _fernet_instance is not None:
        return _fernet_instance

    custom_key = (settings.DM_ENCRYPTION_KEY or "").strip()
    if custom_key:
        try:
            key_bytes = custom_key.encode("utf-8")
            _fernet_instance = Fernet(key_bytes)
            return _fernet_instance
        except Exception as e:
            logger.warning(
                f"[Criptografia] Chave configurada não está no formato Fernet padrão ({e}). "
                f"Derivando chave segura de 32 bytes via SHA-256."
            )
            key_bytes = _derive_fernet_key(custom_key)
            _fernet_instance = Fernet(key_bytes)
            return _fernet_instance

    # Fallback seguro: derivação determinística a partir dos segredos da aplicação
    seed_str = f"{settings.SECRET_KEY}:{settings.SECURITY_PASSWORD_PEPPER}:app_field_cipher_salt"
    key_bytes = _derive_fernet_key(seed_str)
    _fernet_instance = Fernet(key_bytes)
    return _fernet_instance


def encrypt_field(plain_text: Optional[str]) -> Optional[str]:
    """
    Encripta um valor textual sensível (segredos de webhook, DMs, tokens).
    Retorna o texto cifrado com o prefixo 'enc:v1:'.
    Se já estiver encriptado ou for vazio/None, retorna o valor original.
    """
    if plain_text is None:
        return None
    if not plain_text.strip():
        return plain_text

    # Idempotência: não re-encripta se já estiver cifrado
    if plain_text.startswith(ENCRYPTION_PREFIX):
        return plain_text

    try:
        cipher = get_fernet()
        encrypted_bytes = cipher.encrypt(plain_text.encode("utf-8"))
        return f"{ENCRYPTION_PREFIX}{encrypted_bytes.decode('utf-8')}"
    except Exception as exc:
        logger.error(f"[Criptografia] Erro ao encriptar dado: {exc}")
        return plain_text


def decrypt_field(cipher_text: Optional[str]) -> Optional[str]:
    """
    Descriptografa um valor textual protegido em repouso.
    Se o valor não possuir o prefixo 'enc:v1:', é tratado como dado legado
    em texto plano e retornado diretamente sem alterações (retrocompatibilidade).
    """
    if cipher_text is None:
        return None
    if not cipher_text.startswith(ENCRYPTION_PREFIX):
        # Dado legado em texto plano
        return cipher_text

    raw_token = cipher_text[len(ENCRYPTION_PREFIX):]
    try:
        cipher = get_fernet()
        decrypted_bytes = cipher.decrypt(raw_token.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except InvalidToken:
        logger.warning("[Criptografia] Falha ao descriptografar: chave inválida ou adulterada.")
        return "[Dado protegido / Chave inacessível]"
    except Exception as exc:
        logger.error(f"[Criptografia] Erro inesperado ao descriptografar: {exc}")
        return "[Erro de descriptografia]"
