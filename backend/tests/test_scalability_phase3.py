"""
Testes Unitários da Fase 3 de Escalabilidade:
1. Resolução e cache de CDN para streaming de vídeos de aulas.
2. Cabeçalhos HTTP para streaming e otimização no Edge.
3. Suporte ao tipo vetorial pgvector no modelo de IA e fallback gracioso.
4. Busca semântica de RAG com suporte nativo e in-memory.
"""
import pytest
from unittest.mock import patch, MagicMock
from app.services import cdn_service
from app.services import ai_rag_service
from app.models.tutor_ia import AiKnowledgeChunk
from app.core.config import settings


def test_cdn_service_disabled_returns_original():
    """Quando a CDN não estiver habilitada, retorna a URL original sem modificação."""
    with patch.object(cdn_service.settings, "VIDEO_CDN_URL", ""):
        with patch.object(cdn_service.settings, "BACKBLAZE_CDN_URL", ""):
            url = "https://s3.us-west-004.backblazeb2.com/meu-bucket/AreaDeMembros/videos/vid_123.mp4"
            resolved = cdn_service.resolve_video_cdn_url(url)
            assert resolved == url


def test_cdn_service_b2_url_transformed_to_cdn():
    """Transforma a URL de origem do Backblaze B2 para a URL da CDN de streaming."""
    with patch.object(cdn_service.settings, "VIDEO_CDN_URL", "https://cdn.minhaplataforma.com"):
        with patch.object(cdn_service.settings, "B2_BUCKET_NAME", "area-membros-bucket"):
            with patch.object(cdn_service.settings, "STREAMING_CACHE_ENABLED", True):
                raw_b2 = "https://s3.us-west-004.backblazeb2.com/area-membros-bucket/AreaDeMembros/videos/vid_super_aula.mp4"
                resolved = cdn_service.resolve_video_cdn_url(raw_b2)
                assert resolved == "https://cdn.minhaplataforma.com/area-membros-bucket/AreaDeMembros/videos/vid_super_aula.mp4"


def test_cdn_service_local_video_transformed_to_cdn():
    """Transforma URL de vídeo local para rota CDN correspondente."""
    with patch.object(cdn_service.settings, "VIDEO_CDN_URL", "https://cdn.minhaplataforma.com"):
        with patch.object(cdn_service.settings, "STREAMING_CACHE_ENABLED", True):
            local_url = "/api/v1/courses/videos/vid_local_teste.mp4"
            resolved = cdn_service.resolve_video_cdn_url(local_url)
            assert resolved == "https://cdn.minhaplataforma.com/AreaDeMembros/videos/vid_local_teste.mp4"


def test_cdn_service_external_players_preserved():
    """Garante que URLs externas como YouTube ou Vimeo não sejam alteradas pela CDN."""
    with patch.object(cdn_service.settings, "VIDEO_CDN_URL", "https://cdn.minhaplataforma.com"):
        with patch.object(cdn_service.settings, "STREAMING_CACHE_ENABLED", True):
            youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            vimeo_url = "https://vimeo.com/123456789"
            assert cdn_service.resolve_video_cdn_url(youtube_url) == youtube_url
            assert cdn_service.resolve_video_cdn_url(vimeo_url) == vimeo_url


def test_cdn_streaming_cache_headers():
    """Valida cabeçalhos padronizados de streaming com cache no Edge."""
    headers = cdn_service.get_streaming_cache_headers(content_type="video/mp4")
    assert headers["Content-Type"] == "video/mp4"
    assert headers["Accept-Ranges"] == "bytes"
    assert "public" in headers["Cache-Control"]
    assert "max-age=" in headers["Cache-Control"]
    assert headers["X-Content-Type-Options"] == "nosniff"


def test_pgvector_attributes_exist():
    """Valida que o modelo AiKnowledgeChunk possui embedding_json e embedding declarados."""
    assert hasattr(AiKnowledgeChunk, "embedding_json")
    assert hasattr(AiKnowledgeChunk, "embedding")


@pytest.mark.asyncio
async def test_search_rag_chunks_fallback_in_memory():
    """Valida que a busca RAG funciona sem erros em modo in-memory de teste."""
    mock_db = MagicMock()
    # Mock do bind como sqlite para disparar fallback in-memory
    mock_bind = MagicMock()
    mock_bind.dialect.name = "sqlite"
    mock_db.get_bind.return_value = mock_bind
    mock_db.query.return_value.join.return_value.join.return_value.join.return_value.filter.return_value.all.return_value = []

    res = await ai_rag_service.search_rag_chunks(
        db=mock_db,
        query_text="Como emitir certificado na plataforma?",
        permitted_course_ids=[1],
        enable_multi_query=False
    )
    assert isinstance(res, list)
    assert len(res) == 0
