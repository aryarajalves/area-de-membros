from fastapi.testclient import TestClient
from fastapi import HTTPException
from app.main import app

def test_global_exception_handler_returns_json_on_unhandled_exception():
    # Cria endpoint temporário na aplicação para simular falha inesperada
    @app.get("/test-unexpected-error")
    def trigger_unexpected_error():
        raise RuntimeError("Falha interna de teste simulada")

    client = TestClient(app, raise_server_exceptions=False)
    response = client.get("/test-unexpected-error")

    assert response.status_code == 500
    assert response.headers.get("content-type") == "application/json"
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Erro interno do servidor. Tente novamente mais tarde."

def test_global_exception_handler_preserves_intentional_http_exceptions():
    @app.get("/test-intentional-http-error")
    def trigger_http_error():
        raise HTTPException(status_code=400, detail="Erro de validação intencional.")

    client = TestClient(app, raise_server_exceptions=False)
    response = client.get("/test-intentional-http-error")

    assert response.status_code == 400
    assert response.headers.get("content-type") == "application/json"
    data = response.json()
    assert data["detail"] == "Erro de validação intencional."
