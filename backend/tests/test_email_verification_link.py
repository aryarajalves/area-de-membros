import asyncio
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models.user import Invite, RegistrationVerification, User
from app.services.email import send_verification_email
from app.core.config import settings


def test_invite_register_via_verification_link_logs_in_automatically():
    client = TestClient(app)
    db = SessionLocal()
    email = "convidado_link_auto@teste.com"
    invite_token = "invite-token-link-test-123"
    try:
        db.query(RegistrationVerification).filter(RegistrationVerification.email == email).delete()
        db.query(User).filter(User.email == email).delete()
        db.query(Invite).filter(Invite.token == invite_token).delete()
        db.commit()

        invite = Invite(token=invite_token, role="aluno", is_used=False)
        db.add(invite)
        db.commit()

        res_reg = client.post(
            "/api/v1/auth/register",
            json={
                "token": invite_token,
                "name": "Convidado Link",
                "email": email,
                "phone": "+55 11 99999-0000",
                "password": "SenhaForte123!@",
                "password_confirm": "SenhaForte123!@",
            },
        )
        assert res_reg.status_code == 200
        assert res_reg.json()["requires_verification"] is True

        verif = (
            db.query(RegistrationVerification)
            .filter(RegistrationVerification.email == email, RegistrationVerification.is_used == False)
            .first()
        )
        assert verif is not None
        assert verif.verification_token is not None

        res_confirm = client.post(
            "/api/v1/auth/register/verify-link",
            json={"token": verif.verification_token},
        )
        assert res_confirm.status_code == 200
        data = res_confirm.json()
        assert "access_token" in data
        assert data["user"]["email"] == email

        db.refresh(invite)
        assert invite.is_used is True
        assert invite.used_by_email == email
    finally:
        db.query(RegistrationVerification).filter(RegistrationVerification.email == email).delete()
        db.query(User).filter(User.email == email).delete()
        db.query(Invite).filter(Invite.token == invite_token).delete()
        db.commit()
        db.close()


def test_send_verification_email_dark_gold_button_template():
    captured_payload = {}

    class FakeResponse:
        status_code = 201
        text = "ok"

    async def fake_post(url, headers=None, json=None):
        captured_payload.update(json)
        return FakeResponse()

    with patch.object(settings, "BREVO_API_KEY", "fake-key"), \
         patch.object(settings, "BREVO_SENDER_EMAIL", "no-reply@teste.com"), \
         patch("app.services.email.httpx.AsyncClient.post", side_effect=fake_post):
        ok = asyncio.run(
            send_verification_email(
                to_email="membro@teste.com",
                to_name="Aryaraj",
                verification_url="https://comunidade.teste.com/verify-email?token=abc123",
                platform_name="Bússola Astrológica",
            )
        )

    assert ok is True
    html_body = captured_payload["htmlContent"]
    assert "Confirmar minha conta" in html_body
    assert "https://comunidade.teste.com/verify-email?token=abc123" in html_body
    assert "30 minutos" in html_body
    assert "#eab308" in html_body
    assert "#11141d" in html_body
