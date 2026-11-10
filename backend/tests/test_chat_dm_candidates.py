import pytest
from app.core.config import settings
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.gamification import GamificationPoint
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def dm_candidates_seed():
    db = TestingSessionLocal()

    # Cria curso para teste de filtro
    course = db.query(Course).filter(Course.title == "Curso DM Teste").first()
    if not course:
        course = Course(title="Curso DM Teste", description="Desc")
        db.add(course)
        db.commit()

    # Aluno 1 com pontos e com curso
    u1 = db.query(User).filter(User.email == "dm_cand_aluno1@test.com").first()
    if not u1:
        u1 = User(
            name="Alice Aluna",
            email="dm_cand_aluno1@test.com",
            hashed_password="hash",
            role="aluno",
            is_active=True,
        )
        db.add(u1)
        db.commit()

    # Vincula curso ao u1
    uc = db.query(UserCourse).filter(UserCourse.user_id == u1.id, UserCourse.course_id == course.id).first()
    if not uc:
        uc = UserCourse(user_id=u1.id, course_id=course.id)
        db.add(uc)
        db.commit()

    # Pontos de gamificação para u1 (100 pts)
    gp = db.query(GamificationPoint).filter(GamificationPoint.user_id == u1.id).first()
    if not gp:
        gp = GamificationPoint(user_id=u1.id, points=100, action="test")
        db.add(gp)
        db.commit()

    # Aluno 2 sem curso e com 10 pts
    u2 = db.query(User).filter(User.email == "dm_cand_aluno2@test.com").first()
    if not u2:
        u2 = User(
            name="Bruno Aluno",
            email="dm_cand_aluno2@test.com",
            hashed_password="hash",
            role="aluno",
            is_active=True,
        )
        db.add(u2)
        db.commit()

    data = {
        "course_id": course.id,
        "u1_id": u1.id,
        "u2_id": u2.id,
    }
    db.close()
    return data


def test_list_dm_candidates_default(dm_candidates_seed):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.get("/api/v1/chat/dm/candidates", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "pages" in data
    assert data["limit"] == 20
    assert len(data["items"]) <= 20


def test_list_dm_candidates_filter_by_role(dm_candidates_seed):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.get("/api/v1/chat/dm/candidates?role=aluno", headers=headers)
    assert res.status_code == 200
    data = res.json()
    for item in data["items"]:
        assert item["role"] in ["aluno", "user"]


def test_list_dm_candidates_filter_by_course(dm_candidates_seed):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    cid = dm_candidates_seed["course_id"]
    res = client.get(f"/api/v1/chat/dm/candidates?course_id={cid}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    u1_id = dm_candidates_seed["u1_id"]
    u2_id = dm_candidates_seed["u2_id"]
    item_ids = [it["id"] for it in data["items"]]
    assert u1_id in item_ids
    assert u2_id not in item_ids


def test_list_dm_candidates_order_by_level(dm_candidates_seed):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.get("/api/v1/chat/dm/candidates?order_by=level_desc", headers=headers)
    assert res.status_code == 200
    data = res.json()
    items = data["items"]
    # Valida que os pontos estão ordenados em ordem decrescente
    points = [it["total_points"] for it in items]
    assert points == sorted(points, reverse=True)


def test_list_dm_candidates_search(dm_candidates_seed):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.get("/api/v1/chat/dm/candidates?search=Alice", headers=headers)
    assert res.status_code == 200
    data = res.json()
    for it in data["items"]:
        assert "alice" in it["name"].lower() or "alice" in it["email"].lower()
