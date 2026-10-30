"""
Testes unitários para a integração de Metadados de Gamificação RPG no Chat da Comunidade.
"""
import pytest
from app.core.database import SessionLocal
from app.models.user import User
from app.models.gamification import GamificationPoint
from app.services.chat_gamification import get_users_gamification_map, build_chat_user


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_build_chat_user_fallback():
    chat_user = build_chat_user(None)
    assert chat_user.id == 0
    assert chat_user.name == "Usuário Desconhecido"
    assert chat_user.gamification_points == 0
    assert chat_user.gamification_tier is None


def test_build_chat_user_student_with_tier():
    user = User(id=7771, name="Gamer Aluno", email="gamer@aluno.com", role="aluno")
    g_info = {
        "points": 250,
        "tier": "Prata",
        "title": "Prata I",
        "badge": "⚔️ Prata I",
        "tier_color": "#94a3b8",
        "level_color": "#94a3b8",
        "level": 5,
    }

    chat_user = build_chat_user(user, g_info)
    assert chat_user.id == 7771
    assert chat_user.name == "Gamer Aluno"
    assert chat_user.role == "aluno"
    assert chat_user.gamification_points == 250
    assert chat_user.gamification_tier == "Prata"
    assert chat_user.gamification_badge == "⚔️ Prata I"
    assert chat_user.gamification_tier_color == "#94a3b8"


def test_build_chat_user_admin_no_tier():
    admin = User(id=7772, name="Admin Chefe", email="admin@escola.com", role="admin")
    g_info = {
        "points": 5000,
        "tier": "Lenda",
        "title": "Lenda Suprema",
        "badge": "🌟 Lenda Suprema",
        "tier_color": "#fbbf24",
    }
    # Para administradores, a função não atribui elo de aluno, preservando a identidade administrativa
    chat_user = build_chat_user(admin, g_info)
    assert chat_user.id == 7772
    assert chat_user.role == "admin"
    assert chat_user.gamification_tier is None


def test_get_users_gamification_map(db_session):
    # Cria usuário de teste com hashed_password válido
    test_user = User(
        name="Teste Gamif Map",
        email="gamif_map@teste.com",
        hashed_password="hash_fake_teste",
        role="aluno"
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)

    try:
        p1 = GamificationPoint(user_id=test_user.id, action="lesson_completed", points=15, description="Aula")
        p2 = GamificationPoint(user_id=test_user.id, action="chat_message", points=2, description="Chat")
        db_session.add_all([p1, p2])
        db_session.commit()

        g_map = get_users_gamification_map(db_session, [test_user.id])
        assert test_user.id in g_map
        user_data = g_map[test_user.id]
        assert user_data["points"] == 17
        assert user_data["tier"] == "Bronze"
        assert "Bronze" in user_data["title"]
    finally:
        db_session.query(GamificationPoint).filter(GamificationPoint.user_id == test_user.id).delete()
        db_session.delete(test_user)
        db_session.commit()
