"""
Script de migração para otimizar e converter banners e thumbnails existentes para WebP com Cache-Control.
Reduz arquivos de ~3.2 MB para ~100 KB (mais de 95% de economia de dados e carregamento quase instantâneo).
"""
import io
import os
import sys
import urllib.request
from PIL import Image

# Adiciona o caminho do backend ao sys.path para imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.course import Course
from app.services.storage import upload_media_file, get_s3_client
from app.services.image_optimizer import optimize_image
from app.core.config import settings


def process_url(url: str) -> str:
    if not url:
        return url
    if url.endswith(".webp"):
        print(f"  [Pular] Imagem já está em WebP: {url}")
        return url

    print(f"  [Baixando] {url}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()

        orig_len = len(data)
        print(f"  Tamanho original: {orig_len} bytes (~{round(orig_len/1024/1024, 2)} MB)")

        opt_bytes, mime, ext = optimize_image(data, max_width=1280, quality=82)
        new_len = len(opt_bytes)
        print(f"  Tamanho otimizado: {new_len} bytes (~{round(new_len/1024, 1)} KB) - Economia: {round((1 - new_len/orig_len)*100, 1)}%")

        filename = os.path.basename(url.split("?")[0])
        name_no_ext = os.path.splitext(filename)[0]
        new_filename = f"{name_no_ext}.webp"

        new_url = upload_media_file(
            file_bytes=opt_bytes,
            filename=new_filename,
            content_type="image/webp",
            folder="AreaDeMembros/thumbnails/",
            cache_control="public, max-age=31536000, immutable"
        )
        if new_url:
            print(f"  [Sucesso] Uploaded WebP: {new_url}")
            return new_url
        else:
            print("  [Falha] Não foi possível fazer upload para B2.")
            return url
    except Exception as e:
        print(f"  [Erro] Falha ao processar {url}: {e}")
        return url


def run_migration():
    print("Iniciando otimização dos banners de cursos existentes...")
    db = SessionLocal()
    try:
        courses = db.query(Course).all()
        updated_count = 0
        for c in courses:
            print(f"\nCurso #{c.id} - '{c.title}':")
            changed = False
            if c.thumbnail_url:
                new_thumb = process_url(c.thumbnail_url)
                if new_thumb != c.thumbnail_url:
                    c.thumbnail_url = new_thumb
                    changed = True

            if c.cover_image_url:
                if c.cover_image_url == c.thumbnail_url and changed:
                    c.cover_image_url = c.thumbnail_url
                else:
                    new_cover = process_url(c.cover_image_url)
                    if new_cover != c.cover_image_url:
                        c.cover_image_url = new_cover
                        changed = True

            if changed:
                updated_count += 1
                db.commit()
                print(f"  -> Curso #{c.id} atualizado com novos banners WebP!")

        print(f"\nConcluído! {updated_count} cursos atualizados com sucesso.")
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
