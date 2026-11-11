import pytest
from app.core.version_utils import calculate_next_version, mask_secret
from app.core.database import Base
import app.models


def test_calculate_next_version_standard_increment():
    """Valida o incremento simples de patch (1.2.7 -> 1.2.8)."""
    assert calculate_next_version("1.2.7") == "1.2.8"
    assert calculate_next_version("1.2.8") == "1.2.9"


def test_calculate_next_version_decimal_overflow_patch():
    """Valida o estouro do número da direita passando de 9 para zerar e somar +1 no meio (1.2.9 -> 1.3.0)."""
    assert calculate_next_version("1.2.9") == "1.3.0"
    assert calculate_next_version("1.0.9") == "1.1.0"


def test_calculate_next_version_decimal_overflow_minor():
    """Valida o estouro do número do meio passando de 9 para zerar e somar +1 na esquerda (1.9.9 -> 2.0.0)."""
    assert calculate_next_version("1.9.9") == "2.0.0"
    assert calculate_next_version("2.9.9") == "3.0.0"


def test_calculate_next_version_invalid_format():
    """Valida tratamento de erro para formatos de versão inválidos."""
    with pytest.raises(ValueError):
        calculate_next_version("1.2")
    with pytest.raises(ValueError):
        calculate_next_version("1.2.x")


def test_secret_masking():
    """Valida se a função de máscara oculta chaves adequadamente."""
    assert mask_secret("short") == "****"
    masked = mask_secret("sk-proj-1234567890abcdef")
    assert masked.startswith("sk-p")
    assert masked.endswith("cdef")
    assert "****" in masked


def test_database_models_metadata_loaded():
    """Valida que todos os modelos do banco de dados são carregados corretamente sem mappers órfãos."""
    assert len(Base.metadata.tables) >= 70
    assert "users" in Base.metadata.tables
    assert "courses" in Base.metadata.tables
    assert "community_stories" in Base.metadata.tables
    assert "ai_tutor_messages" in Base.metadata.tables


def test_main_py_has_incremental_migration_columns():
    """Valida que as colunas críticas dos modelos estão no código do main.py."""
    import inspect
    import app.main as main_module
    
    main_source = inspect.getsource(main_module.lifespan)
    
    # Valida colunas críticas recentemente adicionadas
    assert "community_stories" in main_source
    assert "community_story_views" in main_source
    assert "community_story_reactions" in main_source
    assert "cover_image_url" in main_source
    assert "agentflow_kb_id" in main_source
    assert "button_action_type" in main_source


def test_recent_endpoints_have_openapi_summary_and_limiter():
    """Valida se todas as 43 rotas novas/recentes possuem summary explícito e parâmetro de request para slowapi."""
    from app.api.v1.endpoints.community_stories import router as stories_router
    from app.api.v1.endpoints.community_feed import router as feed_router
    from app.api.v1.endpoints.chat_superadmin_dms import router as superadmin_dms_router
    from app.api.v1.endpoints.chat_members import router as members_router
    import inspect

    routers = [stories_router, feed_router, superadmin_dms_router, members_router]
    total_routes = 0
    for r in routers:
        for route in r.routes:
            if hasattr(route, "endpoint"):
                total_routes += 1
                assert route.summary is not None and len(route.summary.strip()) > 0, f"Rota {route.path} sem summary OpenAPI"
                sig = inspect.signature(route.endpoint)
                assert "request" in sig.parameters, f"Rota {route.path} precisa receber parâmetro 'request: Request' para SlowAPI"

    assert total_routes == 43
