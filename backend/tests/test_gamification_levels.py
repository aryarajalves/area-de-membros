import pytest
from app.services.gamification_level_service import calculate_student_level, get_all_rpg_levels, RPG_LEVELS


def test_rpg_levels_structure():
    levels = get_all_rpg_levels()
    assert len(levels) == 20
    assert levels[0]["level"] == 1
    assert levels[0]["title"] == "Bronze I"
    assert levels[0]["min_points"] == 0

    assert levels[1]["level"] == 2
    assert levels[1]["title"] == "Bronze II"
    assert levels[1]["min_points"] == 25

    assert levels[4]["level"] == 5
    assert levels[4]["tier"] == "Prata"
    assert levels[4]["title"] == "Prata I"

    assert levels[8]["level"] == 9
    assert levels[8]["tier"] == "Ouro"

    assert levels[12]["level"] == 13
    assert levels[12]["tier"] == "Diamante"

    assert levels[16]["level"] == 17
    assert levels[16]["tier"] == "Lenda"

    assert levels[19]["level"] == 20
    assert levels[19]["title"] == "Lenda Suprema"
    assert levels[19]["min_points"] == 5000


def test_calculate_student_level_curve():
    # 0 pontos -> Nível 1 (Bronze I)
    lv1 = calculate_student_level(0)
    assert lv1["level"] == 1
    assert lv1["level_title"] == "Bronze I"
    assert lv1["points_to_next_level"] == 25
    assert lv1["level_progress_percent"] == 0
    assert not lv1["is_max_level"]

    # 25 pontos (caso da Mariana da imagem) -> Nível 2 (Bronze II)
    lv2 = calculate_student_level(25)
    assert lv2["level"] == 2
    assert lv2["level_title"] == "Bronze II"
    assert lv2["current_level_min_points"] == 25
    assert lv2["next_level_min_points"] == 60
    assert lv2["points_to_next_level"] == 35
    assert lv2["level_progress_percent"] == 0

    # 42 pontos -> Nível 2 (Bronze II) com progresso parcial
    # (42 - 25) / (60 - 25) = 17 / 35 = ~48%
    lv2_mid = calculate_student_level(42)
    assert lv2_mid["level"] == 2
    assert lv2_mid["points_to_next_level"] == 18
    assert 40 <= lv2_mid["level_progress_percent"] <= 55

    # 180 pontos -> Nível 5 (Prata I)
    lv5 = calculate_student_level(180)
    assert lv5["level"] == 5
    assert lv5["level_tier"] == "Prata"
    assert lv5["level_title"] == "Prata I"

    # 5000 pontos -> Nível 20 (Lenda Suprema, nível máximo)
    lv20 = calculate_student_level(5000)
    assert lv20["level"] == 20
    assert lv20["level_title"] == "Lenda Suprema"
    assert lv20["is_max_level"] is True
    assert lv20["points_to_next_level"] == 0
    assert lv20["level_progress_percent"] == 100

    # Acima de 5000 pontos -> Permanece nível 20
    lv_beyond = calculate_student_level(9999)
    assert lv_beyond["level"] == 20
    assert lv_beyond["is_max_level"] is True


from tests.conftest import client
from app.core.config import settings


def test_api_gamification_levels_endpoint():
    # Login como superadmin pré-criado no conftest
    res_login = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]

    res = client.get("/api/v1/gamification/levels", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 20
    assert data[0]["level"] == 1
    assert data[0]["title"] == "Bronze I"
    assert data[19]["level"] == 20
    assert data[19]["title"] == "Lenda Suprema"

