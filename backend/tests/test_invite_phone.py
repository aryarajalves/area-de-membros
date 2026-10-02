import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.models.user import User, Invite, RegistrationVerification
from app.models.course import Course, UserCourse
from app.core.config import settings
from tests.conftest import TestingSessionLocal, client

def get_superadmin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_create_indefinite_invite_and_register_with_phone():
    headers = get_superadmin_headers()

    # 1. Cria convite com duration_hours=0 (indefinido)
    res_invite = client.post("/api/v1/auth/invites", json={
        "role": "aluno",
        "duration_hours": 0
    }, headers=headers)
    assert res_invite.status_code == 201
    invite_data = res_invite.json()
    token = invite_data["token"]
    assert invite_data["expires_at"] is None
    assert invite_data["time_remaining"] == "Indefinido"
    assert invite_data["is_expired"] is False

    # 2. Lista convites e verifica se o convite aparece como Indefinido
    res_list = client.get("/api/v1/auth/invites", headers=headers)
    assert res_list.status_code == 200
    invites = res_list.json()
    found_invite = next((inv for inv in invites if inv["token"] == token), None)
    assert found_invite is not None
    assert found_invite["expires_at"] is None
    assert found_invite["time_remaining"] == "Indefinido"
    assert found_invite["is_expired"] is False

    # 3. Valida token
    res_val = client.get(f"/api/v1/auth/invites/validate?token={token}")
    assert res_val.status_code == 200
    assert res_val.json()["valid"] is True
    assert res_val.json()["role"] == "aluno"

    # 4. Registra usuário passando telefone/WhatsApp
    email_aluno = "aluno_whatsapp@teste.com"
    phone_aluno = "(11) 99887-6655"
    res_reg = client.post("/api/v1/auth/register", json={
        "token": token,
        "name": "Aluno Com Zap",
        "email": email_aluno,
        "phone": phone_aluno,
        "password": "Password123!@#",
        "password_confirm": "Password123!@#"
    })
    assert res_reg.status_code == 200
    assert res_reg.json()["requires_verification"] is True

    # 5. Obtém código OTP do banco de testes
    db = TestingSessionLocal()
    verification = db.query(RegistrationVerification).filter_by(email=email_aluno).first()
    assert verification is not None
    assert verification.phone == phone_aluno
    otp_code = verification.code
    db.close()

    # 6. Valida código OTP e conclui criação da conta
    res_verify = client.post("/api/v1/auth/register/verify", json={
        "email": email_aluno,
        "code": otp_code
    })
    assert res_verify.status_code == 201
    user_created = res_verify.json()
    assert user_created["email"] == email_aluno
    assert user_created["phone"] == phone_aluno
    student_id = user_created["id"]

    # 7. Verifica se o estudante aparece na listagem de alunos com o phone preenchido
    res_students = client.get(f"/api/v1/students?search={email_aluno}", headers=headers)
    assert res_students.status_code == 200
    students_data = res_students.json()["items"]
    assert len(students_data) >= 1
    target_student = next(s for s in students_data if s["id"] == student_id)
    assert target_student["phone"] == phone_aluno

    # 8. Testa atualização de telefone via PATCH /users/{id}
    new_phone = "(21) 98888-7777"
    res_update = client.patch(f"/api/v1/auth/users/{student_id}", json={
        "role": "aluno",
        "phone": new_phone
    }, headers=headers)
    assert res_update.status_code == 200
    assert res_update.json()["phone"] == new_phone

    # Limpeza
    client.delete(f"/api/v1/auth/users/{student_id}", headers=headers)

def test_register_without_phone_fails():
    headers = get_superadmin_headers()
    res_inv = client.post("/api/v1/auth/invites", json={"role": "aluno"}, headers=headers)
    token = res_inv.json()["token"]

    # Tentativa sem o campo phone
    res_no_phone = client.post("/api/v1/auth/register", json={
        "token": token,
        "name": "Aluno Sem Phone",
        "email": "aluno_sem_phone@teste.com",
        "password": "Password123!@#",
        "password_confirm": "Password123!@#"
    })
    assert res_no_phone.status_code == 422

    # Tentativa com phone vazio
    res_empty_phone = client.post("/api/v1/auth/register", json={
        "token": token,
        "name": "Aluno Sem Phone",
        "email": "aluno_sem_phone@teste.com",
        "phone": "   ",
        "password": "Password123!@#",
        "password_confirm": "Password123!@#"
    })
    assert res_empty_phone.status_code == 422
