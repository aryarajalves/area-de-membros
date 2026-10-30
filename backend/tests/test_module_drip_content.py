"""
Testes unitários para o Sistema de Liberação Programada de Módulos (Drip Content).
"""
import pytest
from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course, Module, Lesson, UserCourse
from app.core.security import get_password_hash
from app.services.drip_content import (
    is_module_locked_for_user,
    apply_drip_content_to_course_modules,
    check_module_access,
    utc_now
)
from fastapi import HTTPException


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_user(db, email, role="aluno"):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name="Teste Drip",
            hashed_password=get_password_hash("senha123"),
            role=role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def test_immediate_release():
    aluno = User(id=991, role="aluno")
    admin = User(id=992, role="admin")

    module = Module(title="Mod Imediato", release_type="immediate")

    locked_aluno, *_ = is_module_locked_for_user(module, aluno)
    locked_admin, *_ = is_module_locked_for_user(module, admin)

    assert locked_aluno is False
    assert locked_admin is False


def test_days_after_release():
    aluno = User(id=993, role="aluno")
    admin = User(id=994, role="admin")

    now = utc_now()
    enrollment_recent = now - timedelta(days=2)
    enrollment_old = now - timedelta(days=10)

    module_7d = Module(
        title="Mod 7 Dias",
        release_type="days_after",
        release_days=7
    )

    # Aluno matriculado há 2 dias com módulo de 7 dias -> bloqueado
    locked, avail_at, *_ = is_module_locked_for_user(module_7d, aluno, enrollment_recent)
    assert locked is True
    assert avail_at is not None

    # Aluno matriculado há 10 dias com módulo de 7 dias -> liberado
    locked_old, avail_at_old, *_ = is_module_locked_for_user(module_7d, aluno, enrollment_old)
    assert locked_old is False
    assert avail_at_old is not None

    # Admin sempre tem acesso liberado
    locked_admin, *__ = is_module_locked_for_user(module_7d, admin, enrollment_recent)
    assert locked_admin is False


def test_specific_date_release():
    aluno = User(id=995, role="aluno")
    admin = User(id=996, role="admin")

    now = utc_now()
    future_date = now + timedelta(days=5)
    past_date = now - timedelta(days=2)

    mod_future = Module(title="Futuro", release_type="specific_date", release_date=future_date)
    mod_past = Module(title="Passado", release_type="specific_date", release_date=past_date)

    # Futuro: aluno bloqueado, admin liberado
    locked_fut, *_ = is_module_locked_for_user(mod_future, aluno)
    assert locked_fut is True

    locked_fut_admin, *_ = is_module_locked_for_user(mod_future, admin)
    assert locked_fut_admin is False

    # Passado: ambos liberados
    locked_past, *_ = is_module_locked_for_user(mod_past, aluno)
    assert locked_past is False


def test_apply_drip_content_sanitizes_lessons(db_session):
    aluno = create_user(db_session, "aluno_drip_test@teste.com", role="aluno")
    now = utc_now()

    # Módulo bloqueado (futuro)
    future_date = now + timedelta(days=10)
    mod_blocked = Module(
        id=8881,
        course_id=555,
        title="Mod Bloqueado",
        release_type="specific_date",
        release_date=future_date
    )
    lesson = Lesson(
        id=9991,
        title="Aula Secreta",
        module_id=8881,
        video_url="https://secret.com/video.mp4"
    )
    mod_blocked.lessons = [lesson]

    # Aplica drip content
    apply_drip_content_to_course_modules(db_session, aluno, 555, [mod_blocked])

    assert mod_blocked.is_locked is True
    # Vídeo foi sanitizado para None
    assert lesson.video_url is None


def test_check_module_access_raises_403(db_session):
    aluno = create_user(db_session, "aluno_drip_block@teste.com", role="aluno")
    future_date = utc_now() + timedelta(days=10)
    mod_blocked = Module(
        id=8882,
        course_id=556,
        title="Mod Bloqueado 403",
        release_type="specific_date",
        release_date=future_date
    )

    with pytest.raises(HTTPException) as exc_info:
        check_module_access(db_session, aluno, mod_blocked)

    assert exc_info.value.status_code == 403
    assert "Este módulo estará disponível apenas em" in exc_info.value.detail
