import pytest
from app.services.chat_encryption_service import (
    encrypt_dm_message,
    decrypt_dm_message,
    is_dm_encrypted,
    ENCRYPTION_PREFIX,
    get_fernet,
)


def test_encrypt_and_decrypt_dm_message():
    """Valida ciclo completo de encriptação e descriptografia de mensagem direta."""
    original_text = "Esta é uma mensagem estritamente confidencial entre aluno e admin."
    
    # 1. Encripta a mensagem
    encrypted = encrypt_dm_message(original_text)
    assert encrypted is not None
    assert encrypted.startswith(ENCRYPTION_PREFIX)
    assert encrypted != original_text
    assert is_dm_encrypted(encrypted) is True

    # 2. Descriptografa a mensagem
    decrypted = decrypt_dm_message(encrypted)
    assert decrypted == original_text


def test_legacy_unencrypted_message_backward_compatibility():
    """Mensagens antigas do banco sem o prefixo 'enc:v1:' devem ser retornadas intactas."""
    legacy_text = "Olá, mensagem antiga sem criptografia!"
    assert is_dm_encrypted(legacy_text) is False

    decrypted = decrypt_dm_message(legacy_text)
    assert decrypted == legacy_text


def test_idempotent_encryption():
    """Chamar encrypt_dm_message em uma mensagem já criptografada não deve re-encriptar."""
    original_text = "Segredo empresarial"
    encrypted_once = encrypt_dm_message(original_text)
    encrypted_twice = encrypt_dm_message(encrypted_once)

    assert encrypted_once == encrypted_twice
    assert decrypt_dm_message(encrypted_twice) == original_text


def test_empty_and_none_handling():
    """Valida comportamento defensivo para None, strings vazias e espaços em branco."""
    assert encrypt_dm_message(None) is None
    assert decrypt_dm_message(None) is None

    assert encrypt_dm_message("") == ""
    assert decrypt_dm_message("") == ""

    assert encrypt_dm_message("   ") == "   "
    assert decrypt_dm_message("   ") == "   "


def test_tampered_token_safe_fallback():
    """Token adulterado ou inválido deve retornar fallback amigável sem quebrar o sistema."""
    tampered_ciphertext = f"{ENCRYPTION_PREFIX}token_adulterado_invalido_12345"
    assert is_dm_encrypted(tampered_ciphertext) is True

    result = decrypt_dm_message(tampered_ciphertext)
    assert result == "[Mensagem protegida / Criptografada]"
