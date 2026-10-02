from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.course import Course, Module, Lesson, UserCourse, LessonProgress
from app.models.webhook import Webhook, WebhookLog
from app.core.security import get_password_hash
from app.core.config import settings
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def get_superadmin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_trigger_student_webhook_manual_flow():
    db = TestingSessionLocal()
    headers = get_superadmin_headers()

    # Cria curso e aluno
    course = Course(title="Curso Astrologia Avançada", description="Desc")
    db.add(course)
    db.commit()
    db.refresh(course)

    student = User(
        name="Aluno Webhook",
        email="webhook_aluno@teste.com",
        role="aluno",
        hashed_password=get_password_hash("Senha@123456"),
        is_active=True,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    uc = UserCourse(
        user_id=student.id,
        course_id=course.id,
        access_duration="lifetime",
        expires_at=None,
    )
    db.add(uc)
    db.commit()

    # Cria um webhook ativo que escuta course.progress.100
    wh = Webhook(
        name="Webhook N8N Teste",
        url="https://webhook.site/mock-test-progress",
        events="course.progress.100,student.enrolled",
        course_id=course.id,
        is_active=True,
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)
    student_id = student.id
    course_id = course.id
    wh_id = wh.id
    db.close()

    # 1. Disparo manual bem sucedido com webhook_id especificado
    with patch("app.services.webhook_service.httpx.Client") as mock_client_cls:
        mock_instance = mock_client_cls.return_value.__enter__.return_value
        mock_instance.post.return_value.status_code = 200
        mock_instance.post.return_value.text = '{"received": true}'

        res = client.post(
            f"/api/v1/students/{student_id}/courses/{course_id}/trigger-webhook",
            json={
                "event": "course.progress.100",
                "webhook_id": wh_id
            },
            headers=headers
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["dispatched_count"] == 1
        assert data["event"] == "course.progress.100"

        # Verifica log gravado no banco
        db_check = TestingSessionLocal()
        logs = db_check.query(WebhookLog).filter(WebhookLog.webhook_id == wh_id).all()
        assert len(logs) >= 1
        assert logs[-1].event == "course.progress.100"
        assert logs[-1].success is True
        db_check.close()

    # 2. Disparo especificando webhook inexistente (400)
    res_not_found = client.post(
        f"/api/v1/students/{student_id}/courses/{course_id}/trigger-webhook",
        json={
            "event": "course.progress.100",
            "webhook_id": 999999
        },
        headers=headers
    )
    assert res_not_found.status_code == 400
    assert "não existe" in res_not_found.json()["detail"].lower()

    # 3. Disparo de evento sem nenhum webhook cadastrado quando não passa webhook_id (warning)
    res_warn = client.post(
        f"/api/v1/students/{student_id}/courses/{course_id}/trigger-webhook",
        json={"event": "course.progress.25"},
        headers=headers
    )
    assert res_warn.status_code == 200
    data_warn = res_warn.json()
    assert data_warn["status"] == "warning"
    assert data_warn["dispatched_count"] == 0

    # 4. Disparo com evento inválido (400)
    res_err = client.post(
        f"/api/v1/students/{student_id}/courses/{course_id}/trigger-webhook",
        json={"event": "evento.totalmente.invalido"},
        headers=headers
    )
    assert res_err.status_code == 400
    assert "inválido" in res_err.json()["detail"].lower()
