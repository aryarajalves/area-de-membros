"""
Testes unitários para Recompensas Pedagógicas por Elo (módulos exclusivos por nível RPG).
"""
import pytest
from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course, Module, Lesson
from app.models.gamification import GamificationPoint
from app.core.security import get_password_hash
from app.services.drip_content import (
    is_module_locked_for_user,
    apply_drip_content_to_course_modules,
    check_module_access,
)
from fastapi import HTTPException


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_student(db, email, points=0):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name="Aluno RPG Test",
            hashed_password=get_password_hash("senha123"),
            role="aluno",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if points > 0:
        p = GamificationPoint(
            user_id=user.id,
            action="lesson_completed",
            points=points,
            description="Pontos teste"
        )
        db.add(p)
        db.commit()

    return user


def test_module_without_elo_requirement():
    aluno = User(id=8801, role="aluno")
    admin = User(id=8802, role="admin")

    module = Module(title="Módulo Livre", required_tier=None)

    locked_aluno, _, reason_aluno = is_module_locked_for_user(module, aluno, student_tier="Bronze")
    locked_admin, _, reason_admin = is_module_locked_for_user(module, admin)

    assert locked_aluno is False
    assert reason_aluno is None
    assert locked_admin is False


def test_module_requires_gold_tier():
    admin = User(id=8803, role="admin")
    aluno_bronze = User(id=8804, role="aluno")
    aluno_prata = User(id=8805, role="aluno")
    aluno_ouro = User(id=8806, role="aluno")
    aluno_diamante = User(id=8807, role="aluno")

    mod_gold = Module(title="Masterclass Ouro", required_tier="Ouro")

    # Admin sempre tem acesso
    locked_admin, _, _ = is_module_locked_for_user(mod_gold, admin)
    assert locked_admin is False

    # Bronze: bloqueado por Elo
    locked_b, _, reason_b = is_module_locked_for_user(mod_gold, aluno_bronze, student_tier="Bronze")
    assert locked_b is True
    assert reason_b == "elo"

    # Prata: bloqueado por Elo
    locked_p, _, reason_p = is_module_locked_for_user(mod_gold, aluno_prata, student_tier="Prata")
    assert locked_p is True
    assert reason_p == "elo"

    # Ouro: liberado
    locked_g, _, reason_g = is_module_locked_for_user(mod_gold, aluno_ouro, student_tier="Ouro")
    assert locked_g is False
    assert reason_g is None

    # Diamante: liberado (nível superior)
    locked_d, _, reason_d = is_module_locked_for_user(mod_gold, aluno_diamante, student_tier="Diamante")
    assert locked_d is False
    assert reason_d is None


def test_apply_drip_content_sanitizes_elo_locked_module(db_session):
    # Cria aluno com 50 pontos (Elo Bronze)
    aluno = create_student(db_session, "aluno_bronze_mod@teste.com", points=50)

    mod_diamond = Module(
        id=7791,
        course_id=444,
        title="Módulo Diamante Secreto",
        required_tier="Diamante"
    )
    lesson = Lesson(
        id=8891,
        title="Aula Super Secreta",
        module_id=7791,
        video_url="https://secret.com/vip.mp4"
    )
    mod_diamond.lessons = [lesson]

    try:
        apply_drip_content_to_course_modules(db_session, aluno, 444, [mod_diamond])

        assert mod_diamond.is_locked is True
        assert mod_diamond.locked_reason == "elo"
        assert mod_diamond.required_tier_color == "#38bdf8"
        assert lesson.video_url is None
    finally:
        db_session.query(GamificationPoint).filter(GamificationPoint.user_id == aluno.id).delete()
        db_session.delete(aluno)
        db_session.commit()


def test_check_module_access_elo_raises_403(db_session):
    aluno = create_student(db_session, "aluno_block_elo@teste.com", points=10)
    mod_gold = Module(
        id=7792,
        course_id=445,
        title="Módulo Bloqueado Ouro",
        required_tier="Ouro"
    )

    try:
        with pytest.raises(HTTPException) as exc_info:
            check_module_access(db_session, aluno, mod_gold)

        assert exc_info.value.status_code == 403
        assert "exclusivo para alunos com Elo Ouro" in exc_info.value.detail
    finally:
        db_session.query(GamificationPoint).filter(GamificationPoint.user_id == aluno.id).delete()
        db_session.delete(aluno)
        db_session.commit()
