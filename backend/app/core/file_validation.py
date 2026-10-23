"""
Módulo de Validação de Conteúdo Real de Arquivos (Magic Bytes / MIME Sniffing).
Protege contra ataques de upload onde scripts maliciosos ou binários executáveis
são renomeados com extensões permitidas (.jpg, .png, .pdf, .mp4).
"""
import os
from typing import Optional
from fastapi import HTTPException, status


def validate_file_magic_bytes(content: bytes, filename: str) -> None:
    """
    Inspeciona a assinatura binária real (magic bytes) do início do arquivo.
    Se a extensão for de imagem, PDF ou vídeo e os bytes não corresponderem ao formato,
    rejeita a requisição com HTTP 400.
    """
    if not content or len(content) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo vazio ou corrompido."
        )

    ext = os.path.splitext(filename)[1].lower() if filename else ""

    # 1. Validação de Imagens
    if ext in {".jpg", ".jpeg"}:
        if not content.startswith(b"\xFF\xD8\xFF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O arquivo enviado não é uma imagem JPEG válida."
            )

    elif ext == ".png":
        if not content.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O arquivo enviado não é uma imagem PNG válida."
            )

    elif ext == ".gif":
        if not (content.startswith(b"GIF87a") or content.startswith(b"GIF89a")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O arquivo enviado não é uma imagem GIF válida."
            )

    elif ext == ".webp":
        is_webp = (
            len(content) >= 12
            and content[:4] == b"RIFF"
            and content[8:12] == b"WEBP"
        )
        if not is_webp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O arquivo enviado não é uma imagem WEBP válida."
            )

    # 2. Validação de Documentos PDF
    elif ext == ".pdf":
        if not content.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O arquivo enviado não é um documento PDF válido."
            )

    # 3. Validação de Vídeos (MP4, WebM, MKV, MOV)
    elif ext in {".mp4", ".mov", ".m4v"}:
        is_mp4_box = (
            len(content) >= 12
            and (b"ftyp" in content[:16] or b"moov" in content[:16] or content[:4] == b"\x00\x00\x00")
        )
        if not is_mp4_box:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"O arquivo enviado não é um vídeo {ext.upper()[1:]} válido."
            )

    elif ext in {".mkv", ".webm"}:
        is_ebml = content.startswith(b"\x1a\x45\xdf\xa3")
        if not is_ebml:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O arquivo enviado não é um container de mídia MKV/WebM válido."
            )

    # 4. Validação de Arquivos Compactados (ZIP, DOCX, XLSX, PPTX utilizam formato ZIP)
    elif ext in {".zip", ".docx", ".xlsx", ".pptx"}:
        is_zip = (
            content.startswith(b"PK\x03\x04")
            or content.startswith(b"PK\x05\x06")
            or content.startswith(b"PK\x07\x08")
        )
        if not is_zip:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"O arquivo enviado não é um arquivo compactado ou documento {ext.upper()[1:]} válido."
            )
