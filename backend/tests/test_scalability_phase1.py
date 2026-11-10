import pytest
from app.core.config import settings
from app.models.user import User
from app.models.gamification import GamificationPoint
from app.models.introduction import IntroductionPost
from tests.conftest import TestingSessionLocal, client


def get_token(email: str = "superadmin@example.com", password: str = "SuperAdmin@2026!"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"]
    # Fallback criando usuário se necessário
    db = TestingSessionLocal()
    from app.core.security import get_password_hash
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name="Super Admin Scalability",
            role="superadmin",
            hashed_password=get_password_hash(password),
            is_active=True
        )
        db.add(user)
        db.commit()
    db.close()
    res2 = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res2.status_code == 200
    return res2.json()["access_token"]


def test_database_pool_settings_phase1():
    """Valida se as novas configurações de pool do banco para escala estão ativas."""
    assert settings.DB_POOL_SIZE >= 30
    assert settings.DB_MAX_OVERFLOW >= 50
    assert settings.DB_POOL_TIMEOUT >= 20


def test_introductions_pagination_and_limit():
    """Valida se o endpoint de introduções aceita e respeita parâmetros skip e limit."""
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}

    db = TestingSessionLocal()
    user = db.query(User).filter(User.role == "superadmin").first()

    # Cria 3 posts de teste para checar paginação
    for i in range(3):
        post = IntroductionPost(
            user_id=user.id,
            title=f"Teste Escala Post {i}",
            content=f"Conteúdo do post de escala {i}",
            niche="Tecnologia",
            location="São Paulo"
        )
        db.add(post)
    db.commit()
    db.close()

    # Testa limit 1
    res = client.get("/api/v1/introductions?skip=0&limit=1", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) == 1

    # Testa limit 2
    res2 = client.get("/api/v1/introductions?skip=0&limit=2", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2) == 2


def test_gamification_ranking_sql_limit():
    """Valida se o ranking de gamificação respeita o parâmetro limit e responde corretamente."""
    token = get_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/gamification/ranking?period=monthly&limit=5", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "ranking" in data
    assert "total_participants" in data
    assert len(data["ranking"]) <= 5
