import pytest
from tests.conftest import client
from app.core.limiter import limiter

@pytest.fixture(autouse=True)
def enable_limiter_for_this_test_module():
    limiter.enabled = True
    limiter.reset()
    yield
    limiter.enabled = False

def test_login_rate_limiting():
    """
    Testa se o endpoint de login bloqueia requisições em excesso
    com HTTP 429 Too Many Requests após atingir o limite de 5 req/min.
    """
    limiter.reset()

    # Faz 5 requisições com credenciais inválidas (devem retornar 401)
    for i in range(5):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": f"fake_user_{i}@teste.com", "password": "WrongPassword123!"}
        )
        assert resp.status_code == 401, f"Requisição #{i+1} deveria retornar 401 mas retornou {resp.status_code}"

    # A 6ª requisição deve ser bloqueada pelo slowapi com 429
    excess_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "attacker@teste.com", "password": "WrongPassword123!"}
    )
    assert excess_resp.status_code == 429, f"Requisição excessiva deveria retornar 429 mas retornou {excess_resp.status_code}"
    data = excess_resp.json()
    assert "detail" in data
    assert "Muitas tentativas" in data["detail"]

def test_public_register_rate_limiting():
    """
    Testa se o endpoint de cadastro público bloqueia requisições
    após atingir o limite configurado (5/hour).
    """
    limiter.reset()

    # 5 tentativas com emails
    for i in range(5):
        resp = client.post(
            "/api/v1/auth/public-register",
            json={"name": f"User {i}", "email": f"existent_{i}@test.com", "password": "Password123!"}
        )
        assert resp.status_code in [201, 400]

    # 6ª tentativa deve retornar 429
    excess_resp = client.post(
        "/api/v1/auth/public-register",
        json={"name": "Attacker", "email": "attacker@test.com", "password": "Password123!"}
    )
    assert excess_resp.status_code == 429
    assert "detail" in excess_resp.json()

def test_cors_middleware_headers():
    """
    Testa se a API responde corretamente às requisições com cabeçalhos de CORS.
    """
    resp = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3010",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        }
    )
    assert resp.status_code in [200, 204]
    assert "access-control-allow-origin" in resp.headers
