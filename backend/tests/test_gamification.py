import pytest
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.gamification import GamificationPoint
from app.services.gamification_service import award_points
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def setup_gamification_users():
    db = TestingSessionLocal()

    # Cria aluno A (Top 1)
    aluno_a = db.query(User).filter(User.email == "aluno_rank_a@test.com").first()
    if not aluno_a:
        aluno_a = User(
            email="aluno_rank_a@test.com",
            name="Aluno Campeão",
            role="aluno",
            hashed_password=get_password_hash("Pass123!"),
            is_active=True
        )
        db.add(aluno_a)
        db.commit()
        db.refresh(aluno_a)

    # Cria aluno B (Top 2)
    aluno_b = db.query(User).filter(User.email == "aluno_rank_b@test.com").first()
    if not aluno_b:
        aluno_b = User(
            email="aluno_rank_b@test.com",
            name="Aluno Vice",
            role="aluno",
            hashed_password=get_password_hash("Pass123!"),
            is_active=True
        )
        db.add(aluno_b)
        db.commit()
        db.refresh(aluno_b)

    # Admin (não deve pontuar)
    admin = db.query(User).filter(User.email == "admin_rank@test.com").first()
    if not admin:
        admin = User(
            email="admin_rank@test.com",
            name="Admin Instrutor",
            role="admin",
            hashed_password=get_password_hash("Pass123!"),
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # Limpar pontos anteriores dos testes para isolamento
    db.query(GamificationPoint).filter(
        GamificationPoint.user_id.in_([aluno_a.id, aluno_b.id, admin.id])
    ).delete(synchronize_session=False)
    db.commit()

    ids = {"a_id": aluno_a.id, "b_id": aluno_b.id, "admin_id": admin.id}
    db.close()
    return ids


def test_award_points_rules_and_daily_limit(setup_gamification_users):
    db = TestingSessionLocal()
    aluno_a = db.query(User).filter(User.id == setup_gamification_users["a_id"]).first()
    admin = db.query(User).filter(User.id == setup_gamification_users["admin_id"]).first()

    # 1. Admin NÃO pode pontuar (apenas alunos disputam)
    res_admin = award_points(db, admin, "support_solution", reference_id=99)
    assert res_admin is None

    # 2. Aluno ganha 50 pontos por Melhor Solução
    res_sol = award_points(db, aluno_a, "support_solution", reference_id=101)
    assert res_sol is not None
    assert res_sol.points == 50

    # 3. Aluno não ganha pontos duplicados para a mesma solução
    res_sol_dup = award_points(db, aluno_a, "support_solution", reference_id=101)
    assert res_sol_dup.id == res_sol.id

    # 4. Aluno ganha 15 pontos por Aula Concluída
    res_lesson = award_points(db, aluno_a, "lesson_completed", reference_id=201)
    assert res_lesson is not None
    assert res_lesson.points == 15

    # 5. Limite diário de Chat: até 10 mensagens pontuam, 11ª é ignorada
    for i in range(10):
        p = award_points(db, aluno_a, "chat_message", reference_id=300 + i)
        assert p is not None
        assert p.points == 2

    # A 11ª mensagem no mesmo dia deve ser bloqueada pelo limite diário
    p_11 = award_points(db, aluno_a, "chat_message", reference_id=400)
    assert p_11 is None

    db.close()


def test_ranking_endpoint_and_podium(setup_gamification_users):
    db = TestingSessionLocal()
    aluno_a = db.query(User).filter(User.id == setup_gamification_users["a_id"]).first()
    aluno_b = db.query(User).filter(User.id == setup_gamification_users["b_id"]).first()

    # Atribuir pontuações: Aluno A = 65 pts, Aluno B = 10 pts
    award_points(db, aluno_a, "support_solution", reference_id=501)
    award_points(db, aluno_a, "lesson_completed", reference_id=502)
    award_points(db, aluno_b, "support_reply", reference_id=503)
    db.close()

    headers_a = get_headers("aluno_rank_a@test.com", "Pass123!")

    # Consultar ranking mensal
    res = client.get("/api/v1/gamification/ranking?period=monthly", headers=headers_a)
    assert res.status_code == 200
    data = res.json()

    assert data["period"] == "monthly"
    ranking = data["ranking"]
    assert len(ranking) >= 2

    # Aluno A deve ser 1º lugar com badge de Mestre
    top1 = next(item for item in ranking if item["user_id"] == setup_gamification_users["a_id"])
    top2 = next(item for item in ranking if item["user_id"] == setup_gamification_users["b_id"])

    assert top1["rank"] < top2["rank"]
    assert top1["points"] >= 65
    assert "Mestre" in top1["badge"]

    # Admin NÃO deve constar no ranking
    assert not any(item["user_id"] == setup_gamification_users["admin_id"] for item in ranking)

    # Identificação da posição do usuário autenticado
    assert data["my_position"] is not None
    assert data["my_position"]["user_id"] == setup_gamification_users["a_id"]
    assert data["my_position"]["is_current_user"] is True


def test_history_and_rules_endpoints(setup_gamification_users):
    db = TestingSessionLocal()
    aluno_a = db.query(User).filter(User.id == setup_gamification_users["a_id"]).first()
    award_points(db, aluno_a, "lesson_completed", reference_id=999)
    db.close()

    headers_a = get_headers("aluno_rank_a@test.com", "Pass123!")

    # Histórico de pontos
    res_hist = client.get("/api/v1/gamification/history?limit=10", headers=headers_a)
    assert res_hist.status_code == 200
    history = res_hist.json()
    assert isinstance(history, list)
    assert len(history) > 0
    assert "points" in history[0]

    # Regras de pontuação
    res_rules = client.get("/api/v1/gamification/rules", headers=headers_a)
    assert res_rules.status_code == 200
    rules = res_rules.json()
    assert any(r["action"] == "support_solution" and r["points"] == 50 for r in rules)
    assert any(r["action"] == "chat_message" and "limite" in r["daily_limit"].lower() for r in rules)


def test_sync_student_historical_points(setup_gamification_users):
    from app.models.course import LessonProgress
    from app.services.gamification_service import sync_student_historical_points

    db = TestingSessionLocal()
    aluno_a_id = setup_gamification_users["a_id"]

    # Limpar progresso anterior do teste para isolamento
    db.query(LessonProgress).filter(
        LessonProgress.user_id == aluno_a_id,
        LessonProgress.lesson_id == 8888
    ).delete(synchronize_session=False)
    db.query(GamificationPoint).filter(
        GamificationPoint.user_id == aluno_a_id,
        GamificationPoint.reference_id == 8888
    ).delete(synchronize_session=False)
    db.commit()

    # Cria aula concluída sem ponto na tabela de gamificação (simulando aula concluída antes do módulo)
    lp = LessonProgress(
        user_id=aluno_a_id,
        lesson_id=8888,
        is_completed=True
    )
    db.add(lp)
    db.commit()

    # 1. Executa a sincronização retroativa
    synced_count = sync_student_historical_points(db, user_id=aluno_a_id)
    assert synced_count == 1

    # 2. Confirma que os 15 pontos foram creditados
    point_entry = db.query(GamificationPoint).filter(
        GamificationPoint.user_id == aluno_a_id,
        GamificationPoint.action == "lesson_completed",
        GamificationPoint.reference_id == 8888
    ).first()
    assert point_entry is not None
    assert point_entry.points == 15

    # 3. Teste de idempotência: segunda execução não gera pontos duplicados
    second_sync = sync_student_historical_points(db, user_id=aluno_a_id)
    assert second_sync == 0

    db.close()


def test_completed_periods_endpoint(setup_gamification_users):
    headers_a = get_headers("aluno_rank_a@test.com", "Pass123!")
    res = client.get("/api/v1/gamification/completed-periods", headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "completed_months" in data
    assert "completed_years" in data

    # Não deve incluir o mês corrente (2026-10) nos meses finalizados
    assert not any(m["key"] == "2026-10" for m in data["completed_months"])
    # Deve conter meses anteriores (ex: 2026-09)
    assert any(m["key"] == "2026-09" for m in data["completed_months"])

    # Não deve conter o ano corrente (2026) nos anos finalizados
    assert not any(y["key"] == "2026" for y in data["completed_years"])
    # Deve conter anos anteriores (ex: 2025)
    assert any(y["key"] == "2025" for y in data["completed_years"])


def test_closed_ranking_validation_and_top_10(setup_gamification_users):
    from datetime import datetime, timezone

    headers_a = get_headers("aluno_rank_a@test.com", "Pass123!")

    # 1. Bloqueia consultar mês em andamento
    res_curr_m = client.get("/api/v1/gamification/closed-ranking?period_type=month&period_key=2026-10", headers=headers_a)
    assert res_curr_m.status_code == 400
    assert "em andamento" in res_curr_m.json()["detail"].lower()

    # 2. Bloqueia consultar ano em andamento
    res_curr_y = client.get("/api/v1/gamification/closed-ranking?period_type=year&period_key=2026", headers=headers_a)
    assert res_curr_y.status_code == 400
    assert "em andamento" in res_curr_y.json()["detail"].lower()

    # 3. Cria pontos em período fechado (Setembro/2026)
    db = TestingSessionLocal()
    aluno_a_id = setup_gamification_users["a_id"]
    past_date = datetime(2026, 9, 15, 12, 0, 0, tzinfo=timezone.utc)
    p_past = GamificationPoint(
        user_id=aluno_a_id,
        action="support_solution",
        points=50,
        description="Solução em Setembro",
        created_at=past_date,
    )
    db.add(p_past)
    db.commit()
    db.close()

    # 4. Consulta mês finalizado 2026-09
    res_closed = client.get("/api/v1/gamification/closed-ranking?period_type=month&period_key=2026-09", headers=headers_a)
    assert res_closed.status_code == 200
    data_closed = res_closed.json()
    assert data_closed["is_closed"] is True
    assert data_closed["period_key"] == "2026-09"
    assert len(data_closed["top_students"]) <= 10
    assert data_closed["top_students"][0]["user_id"] == aluno_a_id
    assert "Campeão do Mês" in data_closed["top_students"][0]["badge"]


