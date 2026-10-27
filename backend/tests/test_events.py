from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.event import Event
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def superadmin_token():
    db = SessionLocal()
    user = db.query(User).filter(User.role == "superadmin").first()
    db.close()
    if not user:
        pytest.skip("Superadmin não encontrado")
    return create_access_token(data={"sub": str(user.id), "role": user.role})


@pytest.fixture
def student_data():
    db = SessionLocal()
    user = db.query(User).filter(User.role == "aluno").first()
    if not user:
        user = User(
            name="Aluno Eventos Test",
            email="alunoeventos@teste.com",
            hashed_password="hashed_pwd",
            role="aluno",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    user_id = user.id
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    db.close()
    return {"id": user_id, "token": token}


def test_list_events_accessible_by_student(student_data):
    headers = {"Authorization": f"Bearer {student_data['token']}"}
    response = client.get("/api/v1/events", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_student_cannot_create_event(student_data):
    headers = {"Authorization": f"Bearer {student_data['token']}"}
    payload = {
        "title": "Tentativa Invasiva Aluno",
        "start_time": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "meeting_url": "https://zoom.us/j/12345",
    }
    response = client.post("/api/v1/events", json=payload, headers=headers)
    assert response.status_code == 403


def test_crud_event_lifecycle(superadmin_token):
    headers_admin = {"Authorization": f"Bearer {superadmin_token}"}
    start = datetime.now(timezone.utc) + timedelta(days=2)
    end = start + timedelta(hours=2)

    # 1. Cria evento aberto para todos
    payload = {
        "title": "Mentoria Inaugural de Tráfego",
        "description": "Tire suas dúvidas ao vivo com o expert.",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "meeting_url": "https://meet.google.com/abc-defg-hij",
        "recording_url": None,
        "thumbnail_url": "https://exemplo.com/thumb.jpg",
        "target_type": "all",
        "is_active": True,
    }
    res_create = client.post("/api/v1/events", json=payload, headers=headers_admin)
    assert res_create.status_code == 201
    created = res_create.json()
    event_id = created["id"]
    assert created["title"] == "Mentoria Inaugural de Tráfego"
    assert created["has_access"] is True
    assert created["meeting_url"] == "https://meet.google.com/abc-defg-hij"

    # 2. Atualiza evento
    update_payload = {
        "title": "Mentoria Inaugural de Tráfego - Atualizada",
        "recording_url": "https://youtube.com/watch?v=gravacao123",
    }
    res_update = client.put(f"/api/v1/events/{event_id}", json=update_payload, headers=headers_admin)
    assert res_update.status_code == 200
    updated = res_update.json()
    assert updated["title"] == "Mentoria Inaugural de Tráfego - Atualizada"
    assert updated["recording_url"] == "https://youtube.com/watch?v=gravacao123"

    # 3. Busca por ID
    res_get = client.get(f"/api/v1/events/{event_id}", headers=headers_admin)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == event_id

    # 4. Exclui evento
    res_delete = client.delete(f"/api/v1/events/{event_id}", headers=headers_admin)
    assert res_delete.status_code == 200

    # 5. Confirma exclusão
    res_get_deleted = client.get(f"/api/v1/events/{event_id}", headers=headers_admin)
    assert res_get_deleted.status_code == 404


def test_event_course_restriction_and_upsell(superadmin_token, student_data):
    headers_admin = {"Authorization": f"Bearer {superadmin_token}"}
    headers_student = {"Authorization": f"Bearer {student_data['token']}"}
    student_id = student_data["id"]

    db = SessionLocal()
    # Cria curso exclusivo para teste
    test_course = Course(
        title="Curso Mentoria VIP",
        description="Acesso exclusivo para mentorados",
        sales_page_url="https://exemplo.com/comprar-vip",
        order_index=99,
    )
    db.add(test_course)
    db.commit()
    db.refresh(test_course)
    course_id = test_course.id

    # Remove qualquer matrícula prévia desse aluno nesse curso
    db.query(UserCourse).filter(UserCourse.user_id == student_id, UserCourse.course_id == course_id).delete()
    db.commit()
    db.close()

    try:
        # 1. Admin cria evento restrito ao curso
        start = datetime.now(timezone.utc) + timedelta(days=3)
        event_payload = {
            "title": "Live Fechada Mentoria VIP",
            "description": "Análise individual de campanhas.",
            "start_time": start.isoformat(),
            "meeting_url": "https://zoom.us/j/secreto999",
            "recording_url": "https://exemplo.com/gravacao-secreta",
            "target_type": "course",
            "course_id": course_id,
            "is_active": True,
        }
        res_create = client.post("/api/v1/events", json=event_payload, headers=headers_admin)
        assert res_create.status_code == 201
        event_id = res_create.json()["id"]

        # 2. Aluno SEM matrícula lista o evento
        res_student_no_access = client.get(f"/api/v1/events/{event_id}", headers=headers_student)
        assert res_student_no_access.status_code == 200
        data_no_access = res_student_no_access.json()
        assert data_no_access["has_access"] is False
        # Links sensíveis protegidos!
        assert data_no_access["meeting_url"] is None
        assert data_no_access["recording_url"] is None
        # Dados do curso para upsell preenchidos
        assert data_no_access["course_title"] == "Curso Mentoria VIP"
        assert data_no_access["course_sales_page_url"] == "https://exemplo.com/comprar-vip"

        # 3. Aluno GANHA matrícula no curso
        db = SessionLocal()
        user_course = UserCourse(
            user_id=student_id,
            course_id=course_id,
            access_duration="lifetime",
            expires_at=None,
        )
        db.add(user_course)
        db.commit()
        db.close()

        # 4. Aluno COM matrícula lista o evento agora
        res_student_with_access = client.get(f"/api/v1/events/{event_id}", headers=headers_student)
        assert res_student_with_access.status_code == 200
        data_with_access = res_student_with_access.json()
        assert data_with_access["has_access"] is True
        assert data_with_access["meeting_url"] == "https://zoom.us/j/secreto999"
        assert data_with_access["recording_url"] == "https://exemplo.com/gravacao-secreta"

        # Limpeza do evento
        client.delete(f"/api/v1/events/{event_id}", headers=headers_admin)
    finally:
        db = SessionLocal()
        db.query(UserCourse).filter(UserCourse.course_id == course_id).delete()
        db.query(Event).filter(Event.course_id == course_id).delete()
        db.query(Course).filter(Course.id == course_id).delete()
        db.commit()
        db.close()
