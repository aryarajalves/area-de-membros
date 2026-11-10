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
    assert levels[1]["min_points"] == 100

    assert levels[4]["level"] == 5
    assert levels[4]["tier"] == "Prata"
    assert levels[4]["title"] == "Prata I"
    assert levels[4]["min_points"] == 850

    assert levels[8]["level"] == 9
    assert levels[8]["tier"] == "Ouro"
    assert levels[8]["title"] == "Ouro I"
    assert levels[8]["min_points"] == 3500

    assert levels[12]["level"] == 13
    assert levels[12]["tier"] == "Diamante"
    assert levels[12]["title"] == "Diamante I"
    assert levels[12]["min_points"] == 9200

    assert levels[16]["level"] == 17
    assert levels[16]["tier"] == "Lenda"
    assert levels[16]["title"] == "Lenda I"
    assert levels[16]["min_points"] == 20000

    assert levels[19]["level"] == 20
    assert levels[19]["title"] == "Lenda Suprema"
    assert levels[19]["min_points"] == 40000


def test_calculate_student_level_curve():
    # 0 pontos -> Nível 1 (Bronze I)
    lv1 = calculate_student_level(0)
    assert lv1["level"] == 1
    assert lv1["level_title"] == "Bronze I"
    assert lv1["points_to_next_level"] == 100
    assert lv1["level_progress_percent"] == 0
    assert not lv1["is_max_level"]

    # 100 pontos -> Nível 2 (Bronze II)
    lv2 = calculate_student_level(100)
    assert lv2["level"] == 2
    assert lv2["level_title"] == "Bronze II"
    assert lv2["current_level_min_points"] == 100
    assert lv2["next_level_min_points"] == 250
    assert lv2["points_to_next_level"] == 150
    assert lv2["level_progress_percent"] == 0

    # 175 pontos -> Nível 2 (Bronze II) com progresso parcial de 50%
    # (175 - 100) / (250 - 100) = 75 / 150 = 50%
    lv2_mid = calculate_student_level(175)
    assert lv2_mid["level"] == 2
    assert lv2_mid["points_to_next_level"] == 75
    assert lv2_mid["level_progress_percent"] == 50

    # 850 pontos -> Nível 5 (Prata I)
    lv5 = calculate_student_level(850)
    assert lv5["level"] == 5
    assert lv5["level_tier"] == "Prata"
    assert lv5["level_title"] == "Prata I"

    # 40000 pontos -> Nível 20 (Lenda Suprema)
    lv20 = calculate_student_level(40000)
    assert lv20["level"] == 20
    assert lv20["level_title"] == "Lenda Suprema"
    assert lv20["is_max_level"]
    assert lv20["level_progress_percent"] == 100
    assert lv20["points_to_next_level"] == 0
    assert lv20["next_level_min_points"] is None
