"""
Serviço de Otimização e Cache de CDN para Streaming de Vídeos e Mídias.
Garante que vídeos hospedados em nuvem (Backblaze B2 / S3) ou localmente
sejam entregues através de uma CDN com cache no Edge (Cloudflare, Bunny, Fastly),
eliminando sobrecarga de egress e latência na reprodução dos alunos.
"""
from typing import Optional, Dict
from urllib.parse import urlparse, quote
from app.core.config import settings
from app.core.logger import logger


def is_cdn_enabled() -> bool:
    """Retorna True se houver uma URL de CDN configurada e o streaming cache estiver ativo."""
    return bool(settings.VIDEO_CDN_URL and settings.STREAMING_CACHE_ENABLED)


def extract_b2_s3_key(raw_url: Optional[str]) -> Optional[str]:
    """
    Extrai com segurança a chave S3 (ex: AreaDeMembros/videos/vid_123.mp4) a partir de:
    - URL completa do Backblaze B2 ou CDN externa
    - Caminho relativo do mesmo domínio (/cdn-videos/AreaDeMembros/...)
    - Chave S3 direta iniciando em AreaDeMembros/
    Bloqueia tentativas de path traversal ('..').
    """
    if not raw_url or not isinstance(raw_url, str):
        return None
    clean = raw_url.strip().split("?", 1)[0].split("#", 1)[0]
    if not clean or ".." in clean or "\\" in clean:
        return None

    if "AreaDeMembros/" in clean:
        idx = clean.find("AreaDeMembros/")
        s3_key = clean[idx:].lstrip("/")
        return s3_key if s3_key and ".." not in s3_key else None

    parsed = urlparse(clean)
    bucket_name = (settings.B2_BUCKET_NAME or "").strip()
    if parsed.scheme in ("http", "https") and bucket_name and f"/{bucket_name}/" in parsed.path:
        after_bucket = parsed.path.split(f"/{bucket_name}/", 1)[-1].lstrip("/")
        if after_bucket.startswith("AreaDeMembros/") and ".." not in after_bucket:
            return after_bucket

    return None


def build_same_domain_proxy_url(raw_url: Optional[str]) -> Optional[str]:
    """
    Constrói a URL de fallback no mesmo domínio principal via proxy streaming do backend.
    """
    if not raw_url or not isinstance(raw_url, str):
        return None
    clean = raw_url.strip()
    if not clean:
        return None
    if clean.startswith("/api/v1/courses/video-proxy") or clean.startswith("/cdn-videos/"):
        return clean
    if clean.startswith("/api/v1/courses/videos/"):
        return clean
    s3_key = extract_b2_s3_key(clean)
    if s3_key:
        return f"/api/v1/courses/video-proxy?video_url={quote(clean, safe='')}"
    return None


def resolve_video_cdn_url(raw_url: Optional[str]) -> Optional[str]:
    """
    Transforma uma URL direta de vídeo (Backblaze B2, S3 ou endpoint local)
    na URL correspondente servida pelo proxy/Edge da CDN com cache ativo
    (incluindo suporte a caminho no mesmo domínio como /cdn-videos).

    Preserva URLs de plataformas externas com streaming próprio (YouTube, Vimeo, Bunny Stream, Panda, etc.).
    """
    if not raw_url or not isinstance(raw_url, str):
        return raw_url

    clean_url = raw_url.strip()
    if not clean_url:
        return clean_url

    # Se a CDN não estiver habilitada, retorna a URL original
    cdn_base = (settings.VIDEO_CDN_URL or settings.BACKBLAZE_CDN_URL or "").strip().rstrip("/")
    if not cdn_base or not settings.STREAMING_CACHE_ENABLED:
        return clean_url

    # Ignora players externos dedicados que gerenciam sua própria CDN
    lower = clean_url.lower()
    if any(ext in lower for ext in ["youtube.com", "youtu.be", "vimeo.com", "pandavideo", "b-cdn.net"]):
        if cdn_base.lower() in lower:
            return clean_url
        if any(embed in lower for embed in ["youtube.com", "youtu.be", "vimeo.com"]):
            return clean_url

    # Caso 1: URL já aponta para a CDN configurada
    if clean_url.startswith(cdn_base):
        return clean_url

    is_same_domain_path = (
        cdn_base.startswith("/")
        or cdn_base.endswith("/cdn-videos")
        or cdn_base.endswith("/api/v1/courses/video-proxy")
    )
    if is_same_domain_path:
        s3_key = extract_b2_s3_key(clean_url)
        if s3_key:
            return f"{cdn_base}/{s3_key}"
        if clean_url.startswith("/api/v1/courses/videos/"):
            filename = clean_url.split("/api/v1/courses/videos/")[-1].lstrip("/")
            return f"{cdn_base}/AreaDeMembros/videos/{filename}"

    # Caso 2: URL direta do Backblaze B2 (ex: https://s3.us-west-004.backblazeb2.com/bucket-name/AreaDeMembros/videos/vid_xyz.mp4)
    # ou endpoint S3 compatível
    parsed = urlparse(clean_url)
    bucket_name = (settings.B2_BUCKET_NAME or "").strip()

    # Se for uma URL com protocolo HTTP/HTTPS apontando para o bucket de origem
    if parsed.scheme in ("http", "https") and bucket_name and bucket_name in parsed.path:
        # Extrai o caminho a partir do bucket
        path_after_bucket = parsed.path.split(bucket_name, 1)[-1].lstrip("/")
        # Se a base da CDN já inclui o nome do bucket, não duplica
        if bucket_name in cdn_base:
            return f"{cdn_base}/{path_after_bucket}"
        return f"{cdn_base}/{bucket_name}/{path_after_bucket}"

    # Caso 3: URL relativa local servida pelo backend (ex: /api/v1/courses/videos/vid_123.mp4)
    if clean_url.startswith("/api/v1/courses/videos/"):
        filename = clean_url.split("/api/v1/courses/videos/")[-1].lstrip("/")
        # Se houver CDN de vídeo na frente, aponta para o caminho de streaming na CDN
        return f"{cdn_base}/AreaDeMembros/videos/{filename}"

    return clean_url


def get_streaming_cache_headers(content_type: str = "video/mp4") -> Dict[str, str]:
    """
    Gera cabeçalhos HTTP otimizados para streaming de vídeo com cache agressivo no Edge/CDN.
    Permite suporte a requisições com 'Range' (seek da barra de progresso) e imutabilidade de cache.
    """
    return {
        "Content-Type": content_type,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",
    }
