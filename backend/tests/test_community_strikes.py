import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.community_feed import CommunityPost, CommunityStrike
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def strikes_setup():
    db = SessionLocal()
    # Admin moderator
    admin = db.query(User).filter(User.email == "mod_strikes_admin@teste.com").first()
    if not admin:
        admin = User(
            name="Admin Mod",
            email="mod_strikes_admin@teste.com",
            hashed_password="hashed_pwd",
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # Usuário do feed para teste de strikes
    student = db.query(User).filter(User.email == "student_strikes_test@teste.com").first()
    if not student:
        student = User(
            name="Aluno Infrator",
            email="student_strikes_test@teste.com",
            hashed_password="hashed_pwd",
            role="admin",
            is_active=True,
            community_strikes_count=0,
            is_community_banned=False,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    else:
        db.query(CommunityStrike).filter(CommunityStrike.user_id == student.id).delete()
        student.role = "admin"
        student.community_strikes_count = 0
        student.is_community_banned = False
        db.commit()

    admin_id = admin.id
    student_id = student.id
    admin_token = create_access_token(data={"sub": str(admin_id), "role": "admin"})
    student_token = create_access_token(data={"sub": str(student_id), "role": "admin"})
    db.close()

    return {
        "admin_id": admin_id,
        "admin_token": admin_token,
        "student_id": student_id,
        "student_token": student_token,
    }


def test_three_strikes_auto_ban_and_appeal_flow(strikes_setup):
    admin_headers = {"Authorization": f"Bearer {strikes_setup['admin_token']}"}
    student_headers = {"Authorization": f"Bearer {strikes_setup['student_token']}"}
    student_id = strikes_setup["student_id"]

    # 1. Inicialmente o aluno tem 0 strikes e não está banido
    status_res = client.get("/api/v1/community/strikes/my-status", headers=student_headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["strikes_count"] == 0
    assert status_data["is_banned"] is False

    # 2. Admin aplica o 1º Strike
    strike1_res = client.post(
        "/api/v1/community/admin/strikes",
        json={
            "user_id": student_id,
            "reason": "linguagem_ofensiva",
            "description": "Comentário desrespeitoso no post de boas-vindas.",
        },
        headers=admin_headers,
    )
    assert strike1_res.status_code == 200
    s1 = strike1_res.json()
    assert s1["strike_number"] == 1
    assert s1["appeal_status"] == "none"

    # Aluno ainda pode postar com 1 strike
    post_res = client.post(
        "/api/v1/community/feed",
        json={"content": "Postagem após 1 strike"},
        headers=student_headers,
    )
    assert post_res.status_code in (200, 201)

    # 3. Admin aplica o 2º Strike
    strike2_res = client.post(
        "/api/v1/community/admin/strikes",
        json={
            "user_id": student_id,
            "reason": "politica_religiao",
            "description": "Discussão partidária proibida nas diretrizes.",
        },
        headers=admin_headers,
    )
    assert strike2_res.status_code == 200
    assert strike2_res.json()["strike_number"] == 2

    # Verifica status: 2 strikes, ainda não banido
    status2 = client.get("/api/v1/community/strikes/my-status", headers=student_headers).json()
    assert status2["strikes_count"] == 2
    assert status2["is_banned"] is False

    # 4. Admin aplica o 3º Strike -> Banimento Automático
    strike3_res = client.post(
        "/api/v1/community/admin/strikes",
        json={
            "user_id": student_id,
            "reason": "spam_autopromocao",
            "description": "Envio repetido de links externos de vendas.",
        },
        headers=admin_headers,
    )
    assert strike3_res.status_code == 200
    s3 = strike3_res.json()
    assert s3["strike_number"] == 3
    strike3_id = s3["id"]

    # Verifica status: 3 strikes e BANIDO automaticamente
    status3 = client.get("/api/v1/community/strikes/my-status", headers=student_headers).json()
    assert status3["strikes_count"] == 3
    assert status3["is_banned"] is True
    assert len(status3["strikes"]) == 3

    # 5. Aluno banido tenta criar publicação no feed -> Bloqueado com 403 Forbidden
    blocked_post = client.post(
        "/api/v1/community/feed",
        json={"content": "Tentando publicar estando banido"},
        headers=student_headers,
    )
    assert blocked_post.status_code == 403
    assert "banido" in blocked_post.json()["detail"].lower() or "strikes" in blocked_post.json()["detail"].lower()

    # 6. Aluno recorre do 3º Strike (Appeal)
    appeal_res = client.post(
        f"/api/v1/community/strikes/{strike3_id}/appeal",
        json={"reason": "Peço desculpas, compartilhei o link achando que era material complementar da aula."},
        headers=student_headers,
    )
    assert appeal_res.status_code == 200
    assert appeal_res.json()["appeal_status"] == "pending"

    # 7. Admin lista recursos pendentes
    pending_res = client.get("/api/v1/community/admin/strikes/appeals", headers=admin_headers)
    assert pending_res.status_code == 200
    appeals_list = pending_res.json()
    assert any(a["id"] == strike3_id for a in appeals_list)

    # 8. Admin APROVA o recurso -> Strike 3 é revogado e o aluno é DESBANIDO automaticamente (volta para 2/3)
    review_res = client.put(
        f"/api/v1/community/admin/strikes/{strike3_id}/appeal",
        json={"action": "approve"},
        headers=admin_headers,
    )
    assert review_res.status_code == 200
    assert review_res.json()["appeal_status"] == "approved"

    # Verifica que o aluno agora tem 2 strikes e não está mais banido
    final_status = client.get("/api/v1/community/strikes/my-status", headers=student_headers).json()
    assert final_status["strikes_count"] == 2
    assert final_status["is_banned"] is False

    # Aluno consegue publicar novamente!
    unbanned_post = client.post(
        "/api/v1/community/feed",
        json={"content": "Voltei a publicar após recurso aprovado!"},
        headers=student_headers,
    )
    assert unbanned_post.status_code in (200, 201)
