"""
Testes Unitários de Segurança Avançada:
1. Invalidação de sessões JWT (token_version)
2. Bloqueio temporário por e-mail após 5 tentativas falhas consecutivas (Account Lockout)
3. Proteção anti-pirataria para alunos (Single-Session Enforcement)
4. Validação de conteúdo real de arquivos em uploads (Magic Bytes)
5. Trava de segurança no startup contra chaves padrão (Startup Security Check)
"""
import pytest
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from unittest.mock import MagicMock
from app.models.user import User
from app.services.auth_security_service import (
    check_account_lockout,
    record_failed_login,
    reset_failed_login,
    invalidate_user_sessions,
    enforce_single_session_on_login,
    validate_token_version,
    MAX_FAILED_ATTEMPTS,
    LOCKOUT_DURATION_MINUTES
)
from app.core.file_validation import validate_file_magic_bytes
from app.core.security import perform_startup_security_check


def test_validate_token_version_and_invalidation():
    """Valida que tokens com versão antiga são rejeitados após invalidação de sessão."""
    user = User(id=1, email="aluno@teste.com", role="aluno", token_version=1)
    db_mock = MagicMock()

    # Token com versão atual (1) é válido
    assert validate_token_version(user, 1) is True

    # Token sem claim de versão (legado) é aceito
    assert validate_token_version(user, None) is True

    # Invalidação de sessão incrementa token_version para 2
    new_ver = invalidate_user_sessions(user, db_mock)
    assert new_ver == 2
    assert user.token_version == 2
    db_mock.commit.assert_called_once()

    # O token antigo (versão 1) agora é rejeitado
    assert validate_token_version(user, 1) is False

    # O novo token (versão 2) é aceito
    assert validate_token_version(user, 2) is True


def test_account_lockout_progression_and_reset():
    """Valida bloqueio temporário após 5 tentativas consecutivas de senha incorreta."""
    user = User(id=2, email="vitima@teste.com", role="aluno", failed_login_attempts=0, locked_until=None)
    db_mock = MagicMock()

    # 4 tentativas incorretas não bloqueiam a conta
    for attempt in range(1, 5):
        result = record_failed_login(user, db_mock)
        assert result["locked"] is False
        assert result["remaining_attempts"] == (MAX_FAILED_ATTEMPTS - attempt)
        assert user.locked_until is None

    # Na 5ª tentativa incorreta, a conta é bloqueada por 15 minutos
    result_5 = record_failed_login(user, db_mock)
    assert result_5["locked"] is True
    assert result_5["remaining_attempts"] == 0
    assert result_5["lockout_minutes"] == LOCKOUT_DURATION_MINUTES
    assert user.locked_until is not None

    # Verifica lockout ativo
    remaining_min = check_account_lockout(user, db_mock)
    assert remaining_min is not None
    assert remaining_min in [14, 15]

    # Login bem-sucedido zera tentativas e limpa bloqueio
    reset_failed_login(user, db_mock)
    assert user.failed_login_attempts == 0
    assert user.locked_until is None
    assert check_account_lockout(user, db_mock) is None


def test_account_lockout_auto_expiration():
    """Valida que bloqueios com data no passado expiram automaticamente."""
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=1)
    user = User(id=3, email="desbloqueio@teste.com", failed_login_attempts=5, locked_until=expired_time)
    db_mock = MagicMock()

    # Deve retornar None e resetar o bloqueio expirado
    result = check_account_lockout(user, db_mock)
    assert result is None
    assert user.locked_until is None
    assert user.failed_login_attempts == 0


def test_single_session_enforcement_for_students():
    """Valida que apenas alunos têm a sessão anterior deslogada a cada login (anti-pirataria)."""
    db_mock = MagicMock()

    student = User(id=10, email="aluno@teste.com", role="aluno", token_version=1)
    ver_after_login_1 = enforce_single_session_on_login(student, db_mock)
    assert ver_after_login_1 == 2
    ver_after_login_2 = enforce_single_session_on_login(student, db_mock)
    assert ver_after_login_2 == 3

    # Para administradores, a versão não é incrementada no login para permitir múltiplos dispositivos
    admin = User(id=20, email="admin@teste.com", role="admin", token_version=1)
    ver_admin_1 = enforce_single_session_on_login(admin, db_mock)
    assert ver_admin_1 == 1
    ver_admin_2 = enforce_single_session_on_login(admin, db_mock)
    assert ver_admin_2 == 1


def test_magic_bytes_valid_files():
    """Valida que arquivos com assinaturas binárias autênticas são aceitos."""
    # JPEG legítimo
    jpeg_bytes = b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00"
    validate_file_magic_bytes(jpeg_bytes, "foto.jpg")
    validate_file_magic_bytes(jpeg_bytes, "foto.jpeg")

    # PNG legítimo
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    validate_file_magic_bytes(png_bytes, "imagem.png")

    # WEBP legítimo
    webp_bytes = b"RIFF\x24\x00\x00\x00WEBPVP8 "
    validate_file_magic_bytes(webp_bytes, "logo.webp")

    # PDF legítimo
    pdf_bytes = b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n"
    validate_file_magic_bytes(pdf_bytes, "documento.pdf")

    # ZIP legítimo
    zip_bytes = b"PK\x03\x04\x14\x00\x00\x00"
    validate_file_magic_bytes(zip_bytes, "material.zip")


def test_magic_bytes_spoofed_files_rejection():
    """Valida que arquivos maliciosos ou mascarados com extensões permitidas são bloqueados."""
    # Script PHP fingindo ser PNG
    fake_png = b"<?php phpinfo(); ?>"
    with pytest.raises(HTTPException) as exc_info:
        validate_file_magic_bytes(fake_png, "exploit.png")
    assert exc_info.value.status_code == 400
    assert "não é uma imagem PNG válida" in exc_info.value.detail

    # Executável Windows (MZ) fingindo ser PDF
    fake_pdf = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00"
    with pytest.raises(HTTPException) as exc_info:
        validate_file_magic_bytes(fake_pdf, "contrato.pdf")
    assert exc_info.value.status_code == 400
    assert "não é um documento PDF válido" in exc_info.value.detail

    # Arquivo de texto puro fingindo ser JPEG
    fake_jpg = b"This is a text file that was renamed to picture.jpg"
    with pytest.raises(HTTPException) as exc_info:
        validate_file_magic_bytes(fake_jpg, "foto.jpg")
    assert exc_info.value.status_code == 400
    assert "não é uma imagem JPEG válida" in exc_info.value.detail


def test_startup_security_check_detection():
    """Valida diagnóstico preventivo de chaves padrão no startup da aplicação."""
    # Chave padrão insegura conhecida
    weak_result = perform_startup_security_check(
        secret_key="supersecret-jwt-key-projeto-base-981273491",
        pepper="123456"
    )
    assert weak_result["status"] == "warning"
    assert "SECRET_KEY_INSECURE" in weak_result["warnings"]
    assert "PEPPER_INSECURE" in weak_result["warnings"]

    # Chave de alta entropia (segura)
    strong_result = perform_startup_security_check(
        secret_key="e4b5c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef01234",
        pepper="a1b2c3d4e5f67890abcdef1234567890"
    )
    assert strong_result["status"] == "ok"
    assert len(strong_result["warnings"]) == 0
