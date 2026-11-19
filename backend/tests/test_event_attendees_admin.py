from datetime import datetime, timedelta, timezone
from app.core.security import create_access_token, get_password_hash
from app.models.event import Event, EventAttendee
from app.models.user import User
from tests.conftest import TestingSessionLocal, client


def test_list_event_attendees_for_admin_and_forbidden_for_student():
    db = TestingSessionLocal()
    try:
        admin = User(
            email="admin_ev_att@example.com",
            name="Admin Evento",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="admin",
            is_active=True,
        )
        student1 = User(
            email="s1_ev_att@example.com",
            name="João Participante",
            phone="11988887777",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="aluno",
            is_active=True,
        )
        student2 = User(
            email="s2_ev_att@example.com",
            name="Maria Confirmada",
            hashed_password=get_password_hash("SenhaForte123!"),
            role="aluno",
            is_active=True,
        )
        event = Event(
            title="O fim de 2026",
            description="Previsões",
            start_time=datetime.now(timezone.utc) + timedelta(days=2),
            target_type="all",
            is_active=True,
        )
        db.add_all([admin, student1, student2, event])
        db.commit()
        db.refresh(admin)
        db.refresh(student1)
        db.refresh(student2)
        db.refresh(event)

        db.add_all([
            EventAttendee(event_id=event.id, user_id=student1.id),
            EventAttendee(event_id=event.id, user_id=student2.id),
        ])
        db.commit()

        event_id = event.id
        h_admin = {"Authorization": f"Bearer {create_access_token({'sub': str(admin.id), 'role': 'admin'})}"}
        h_student = {"Authorization": f"Bearer {create_access_token({'sub': str(student1.id), 'role': 'aluno'})}"}
    finally:
        db.close()

    # Aluno comum não pode listar participantes -> 403
    res_forbidden = client.get(f"/api/v1/events/{event_id}/attendees", headers=h_student)
    assert res_forbidden.status_code == 403

    # Admin / Super Admin visualiza todos os nomes confirmados -> 200
    res_ok = client.get(f"/api/v1/events/{event_id}/attendees", headers=h_admin)
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert len(data) == 2
    names = {item["name"] for item in data}
    assert names == {"João Participante", "Maria Confirmada"}
