import pytest
from unittest.mock import patch, MagicMock
from fastapi import FastAPI
from app.main import lifespan

@pytest.mark.asyncio
async def test_lifespan_startup_and_shutdown():
    """Testa se o ciclo de vida da API inicializa e encerra com sucesso sem travar."""
    app = FastAPI()
    async with lifespan(app):
        # Durante o lifespan, a aplicação está ativa
        assert True

@pytest.mark.asyncio
async def test_lifespan_resilient_to_ddl_failure():
    """Valida se uma falha pontual de DDL não impede o startup do servidor."""
    app = FastAPI()
    with patch("app.core.database.engine.connect") as mock_connect:
        mock_conn = MagicMock()
        mock_conn.execute.side_effect = Exception("Simulated DDL lock timeout")
        mock_connect.return_value.__enter__.return_value = mock_conn

        async with lifespan(app):
            # O startup deve concluir mesmo com erro de DDL
            assert True
