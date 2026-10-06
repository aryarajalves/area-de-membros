import pytest
from datetime import datetime, timezone
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.chat import ChatMessage
from app.models.student_tag import StudentTag, StudentTagAssignment
from app.models.chat_broadcast import ChatBroadcastCampaign, ChatBroadcastRecipient
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seed_broadcast_data():
    db = TestingSessionLocal()
    # Limpar campanhas e tags anteriores de teste
    db.query(ChatBroadcastRecipient).delete()
    db.query(ChatBroadcastCampaign).delete()
    db.query(StudentTagAssignment).delete()
    db.query(StudentTag).delete()

    aluno_a = db.query(User).filter(User.email == "broadcast_aluno_a@test.com").first()
    if not aluno_a:
        aluno_a = User(
            email="broadcast_aluno_a@test.com",
            name="Aluno Broadcast Alfa",
            hashed_password=get_password_hash("pass123"),
            role="aluno",
            is_active=True,
        )
        db.add(aluno_a)

    aluno_b = db.query(User).filter(User.email == "broadcast_aluno_b@test.com").first()
    if not aluno_b:
        aluno_b = User(
            email="broadcast_aluno_b@test.com",
            name="Aluno Broadcast Beta",
            hashed_password=get_password_hash("pass123"),
            role="aluno",
            is_active=True,
        )
        db.add(aluno_b)

    db.commit()

    curso_astro = db.query(Course).filter(Course.title == "Bússola Astrológica").first()
    if not curso_astro:
        curso_astro = Course(
            title="Bússola Astrológica",
            description="Curso de Astrologia Completo",
            is_published=True,
        )
        db.add(curso_astro)
        db.commit()

    # Matricular apenas aluno_a no curso
    uc = db.query(UserCourse).filter(UserCourse.user_id == aluno_a.id, UserCourse.course_id == curso_astro.id).first()
    if not uc:
        db.add(UserCourse(user_id=aluno_a.id, course_id=curso_astro.id))
        db.commit()

    # Criar tag de teste e vincular apenas ao aluno_b
    tag_vip = StudentTag(name="VIP Astro", color="#f59e0b", description="Alunos VIP")
    db.add(tag_vip)
    db.commit()

    db.add(StudentTagAssignment(student_id=aluno_b.id, tag_id=tag_vip.id))
    db.commit()

    tag_id = tag_vip.id
    curso_id = curso_astro.id
    aluno_a_id = aluno_a.id
    aluno_b_id = aluno_b.id
    db.close()

    return {
        "aluno_a_id": aluno_a_id,
        "aluno_b_id": aluno_b_id,
        "curso_id": curso_id,
        "tag_id": tag_id,
    }


def test_student_tags_crud(seed_broadcast_data):
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    # 1. Listar etiquetas
    res = client.get("/api/v1/students/tags", headers=admin_headers)
    assert res.status_code == 200
    tags = res.json()
    assert any(t["name"] == "VIP Astro" for t in tags)

    # 2. Criar nova etiqueta
    res_create = client.post(
        "/api/v1/students/tags",
        json={"name": "Turma 2026", "color": "#10b981", "description": "Matriculados em 2026"},
        headers=admin_headers,
    )
    assert res_create.status_code == 201
    new_tag = res_create.json()
    assert new_tag["name"] == "Turma 2026"
    assert new_tag["color"] == "#10b981"

    # 3. Atualizar etiqueta
    res_update = client.put(
        f"/api/v1/students/tags/{new_tag['id']}",
        json={"name": "Turma 2026 VIP", "color": "#8b5cf6"},
        headers=admin_headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Turma 2026 VIP"
    assert res_update.json()["color"] == "#8b5cf6"

    # 4. Atribuir etiquetas ao aluno A
    aluno_a_id = seed_broadcast_data["aluno_a_id"]
    res_sync = client.put(
        f"/api/v1/students/tags/student/{aluno_a_id}",
        json={"tag_ids": [new_tag["id"]]},
        headers=admin_headers,
    )
    assert res_sync.status_code == 200
    assigned = res_sync.json()
    assert len(assigned) == 1
    assert assigned[0]["name"] == "Turma 2026 VIP"

    # 5. Deletar etiqueta
    res_del = client.delete(f"/api/v1/students/tags/{new_tag['id']}", headers=admin_headers)
    assert res_del.status_code == 200


def test_broadcast_estimate(seed_broadcast_data):
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    # 1. Estimativa por Curso
    curso_id = seed_broadcast_data["curso_id"]
    res_course = client.post(
        "/api/v1/chat/broadcast/estimate",
        json={"filter_type": "course", "filter_course_id": curso_id, "filter_role": "aluno"},
        headers=admin_headers,
    )
    assert res_course.status_code == 200
    data_course = res_course.json()
    assert data_course["total_recipients"] >= 1
    assert data_course["delay_seconds"] == 1
    assert data_course["estimated_duration_seconds"] == data_course["total_recipients"]

    # 2. Estimativa por Etiqueta
    tag_id = seed_broadcast_data["tag_id"]
    res_tag = client.post(
        "/api/v1/chat/broadcast/estimate",
        json={"filter_type": "tag", "filter_tag_id": tag_id, "filter_role": "aluno"},
        headers=admin_headers,
    )
    assert res_tag.status_code == 200
    data_tag = res_tag.json()
    assert data_tag["total_recipients"] >= 1


def test_broadcast_send_and_history(seed_broadcast_data):
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    tag_id = seed_broadcast_data["tag_id"]

    # Disparar campanha direcionada pela tag
    payload = {
        "title": "Aviso Urgente de Mentoria",
        "message": "Olá! Teremos aula inaugural hoje às 20h no chat privado.",
        "filter_type": "tag",
        "filter_tag_id": tag_id,
        "filter_role": "aluno",
    }
    res_send = client.post("/api/v1/chat/broadcast/send", json=payload, headers=admin_headers)
    assert res_send.status_code == 201
    campaign = res_send.json()
    assert campaign["title"] == "Aviso Urgente de Mentoria"
    assert campaign["total_recipients"] >= 1
    assert campaign["delay_seconds"] == 1

    # Listar campanhas disparadas
    res_history = client.get("/api/v1/chat/broadcast/campaigns", headers=admin_headers)
    assert res_history.status_code == 200
    history_list = res_history.json()
    assert len(history_list) >= 1
    target_campaign = next((c for c in history_list if c["id"] == campaign["id"]), None)
    assert target_campaign is not None
    assert target_campaign["filter_type"] == "tag"


def test_broadcast_read_tracking(seed_broadcast_data):
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    db = TestingSessionLocal()
    admin_user = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()
    admin_id = admin_user.id
    aluno_b_id = seed_broadcast_data["aluno_b_id"]

    # Simular campanha diretamente no banco para testar rastreamento preciso
    camp = ChatBroadcastCampaign(
        created_by_user_id=admin_id,
        title="Campanha Rastreamento Teste",
        message="Verifique seu módulo 2!",
        filter_type="manual",
        total_recipients=1,
        sent_count=1,
        status="completed",
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        duration_seconds=1.0,
    )
    db.add(camp)
    db.commit()

    msg = ChatMessage(
        channel_type="dm",
        user_id=admin_id,
        recipient_id=aluno_b_id,
        message="Verifique seu módulo 2!",
        is_read=False,
    )
    db.add(msg)
    db.commit()

    rec = ChatBroadcastRecipient(
        campaign_id=camp.id,
        recipient_id=aluno_b_id,
        message_id=msg.id,
        status="sent",
        sent_at=datetime.now(timezone.utc),
    )
    db.add(rec)
    db.commit()
    camp_id = camp.id
    db.close()

    # 1. Antes de ler: is_read deve ser False
    res_details = client.get(f"/api/v1/chat/broadcast/campaigns/{camp_id}", headers=admin_headers)
    assert res_details.status_code == 200
    recipients = res_details.json()["recipients"]
    assert len(recipients) == 1
    assert recipients[0]["is_read"] is False

    # 2. Aluno abre o chat DM com o admin -> mensagens são lidas
    aluno_b_headers = get_headers("broadcast_aluno_b@test.com", "pass123")
    res_dm = client.get(f"/api/v1/chat/dm/messages/{admin_id}", headers=aluno_b_headers)
    assert res_dm.status_code == 200

    # 3. Após leitura: is_read deve ser True e read_at preenchido
    res_details_after = client.get(f"/api/v1/chat/broadcast/campaigns/{camp_id}", headers=admin_headers)
    assert res_details_after.status_code == 200
    recipients_after = res_details_after.json()["recipients"]
    assert recipients_after[0]["is_read"] is True
    assert recipients_after[0]["read_at"] is not None


def test_broadcast_permission_denied_for_aluno(seed_broadcast_data):
    aluno_headers = get_headers("broadcast_aluno_a@test.com", "pass123")

    res_send = client.post(
        "/api/v1/chat/broadcast/send",
        json={"title": "Hacker", "message": "Invadir", "filter_type": "all"},
        headers=aluno_headers,
    )
    assert res_send.status_code in (401, 403)

    res_list = client.get("/api/v1/chat/broadcast/campaigns", headers=aluno_headers)
    assert res_list.status_code in (401, 403)


def test_broadcast_audience_no_course(seed_broadcast_data):
    """Valida a segmentação e disparo exclusivo para alunos sem nenhum curso."""
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    aluno_b_id = seed_broadcast_data["aluno_b_id"]
    aluno_a_id = seed_broadcast_data["aluno_a_id"]

    # 1. Estimativa para alunos sem curso
    res_est = client.post(
        "/api/v1/chat/broadcast/estimate",
        json={"filter_type": "no_course", "filter_role": "aluno"},
        headers=admin_headers,
    )
    assert res_est.status_code == 200
    est_data = res_est.json()
    assert est_data["total_recipients"] >= 1
    sample_ids = [s["id"] for s in est_data["sample_students"]]
    # aluno_b (sem curso) deve estar na lista; aluno_a (com curso) NÃO deve estar
    assert aluno_b_id in sample_ids
    assert aluno_a_id not in sample_ids

    # 2. Envio de campanha com filter_type='no_course'
    res_send = client.post(
        "/api/v1/chat/broadcast/send",
        json={
            "title": "Aviso Especial para Alunos sem Curso",
            "message": "Conheça nossas novas turmas!",
            "filter_type": "no_course",
            "filter_role": "aluno",
        },
        headers=admin_headers,
    )
    assert res_send.status_code == 201
    camp_data = res_send.json()

    assert camp_data["filter_type"] == "no_course"
    assert camp_data["filter_target_name"] == "Sem Nenhum Curso"
    assert camp_data["total_recipients"] >= 1


def test_broadcast_recency_filter(seed_broadcast_data):
    """Valida a segmentação por recência de entrada (7, 14 e 30 dias)."""
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    from datetime import timedelta
    db = TestingSessionLocal()
    aluno_a = db.query(User).filter(User.id == seed_broadcast_data["aluno_a_id"]).first()
    aluno_b = db.query(User).filter(User.id == seed_broadcast_data["aluno_b_id"]).first()

    # Configura aluno_a com cadastro de 40 dias atrás e aluno_b com cadastro de 2 dias atrás
    now = datetime.now(timezone.utc)
    aluno_a.created_at = now - timedelta(days=40)
    aluno_b.created_at = now - timedelta(days=2)
    db.commit()
    aluno_a_id = aluno_a.id
    aluno_b_id = aluno_b.id
    db.close()

    # 1. Estimativa para últimos 7 dias: deve incluir apenas aluno_b
    res_7 = client.post(
        "/api/v1/chat/broadcast/estimate",
        json={"filter_type": "recent_days", "filter_days": 7, "filter_role": "aluno"},
        headers=admin_headers,
    )
    assert res_7.status_code == 200
    sample_7 = [s["id"] for s in res_7.json()["sample_students"]]
    assert aluno_b_id in sample_7
    assert aluno_a_id not in sample_7

    # 2. Estimativa para últimos 14 dias: deve incluir apenas aluno_b
    res_14 = client.post(
        "/api/v1/chat/broadcast/estimate",
        json={"filter_type": "recent_days", "filter_days": 14, "filter_role": "aluno"},
        headers=admin_headers,
    )
    assert res_14.status_code == 200
    sample_14 = [s["id"] for s in res_14.json()["sample_students"]]
    assert aluno_b_id in sample_14
    assert aluno_a_id not in sample_14

    # 3. Disparo com filtro de 7 dias
    res_send = client.post(
        "/api/v1/chat/broadcast/send",
        json={
            "title": "Boas-vindas Recentes",
            "message": "Você que chegou nesta semana!",
            "filter_type": "recent_days",
            "filter_days": 7,
            "filter_role": "aluno",
        },
        headers=admin_headers,
    )
    assert res_send.status_code == 201
    camp = res_send.json()
    assert camp["filter_type"] == "recent_days"
    assert camp["filter_days"] == 7
    assert "7 Dias" in camp["filter_target_name"]


def test_broadcast_with_cta_button(seed_broadcast_data):
    """Valida o envio e persistência de botão de ação interativo (CTA)."""
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    aluno_b_id = seed_broadcast_data["aluno_b_id"]

    payload = {
        "title": "Aviso com Botão de Ação",
        "message": "Clique no botão abaixo para garantir seu acesso ao grupo VIP!",
        "filter_type": "manual",
        "manual_student_ids": [aluno_b_id],
        "button_text": "Entrar no Grupo VIP",
        "button_url": "https://chat.whatsapp.com/exemplo-vip",
        "button_action_type": "url",
    }

    res = client.post("/api/v1/chat/broadcast/send", json=payload, headers=admin_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["button_text"] == "Entrar no Grupo VIP"
    assert data["button_url"] == "https://chat.whatsapp.com/exemplo-vip"
    assert data["button_action_type"] == "url"

    camp_id = data["id"]
    # Consultar histórico e detalhes
    res_detail = client.get(f"/api/v1/chat/broadcast/campaigns/{camp_id}", headers=admin_headers)
    assert res_detail.status_code == 200
    det = res_detail.json()
    assert det["button_text"] == "Entrar no Grupo VIP"
    assert det["button_url"] == "https://chat.whatsapp.com/exemplo-vip"
    assert det["button_action_type"] == "url"


@pytest.mark.asyncio
async def test_broadcast_idempotency_prevents_duplicate_messages(seed_broadcast_data):
    """
    Garante que reexecuções do worker (ou chamadas duplicadas) não reenviem mensagens
    para o mesmo aluno nem incrementem sent_count indevidamente.
    """
    from app.services.chat_broadcast_service import run_broadcast_worker

    db = TestingSessionLocal()
    admin_user = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()
    aluno_b_id = seed_broadcast_data["aluno_b_id"]

    # 1. Cria campanha de teste pendente com 1 destinatário
    camp = ChatBroadcastCampaign(
        created_by_user_id=admin_user.id,
        title="Campanha Teste Idempotência",
        message="Mensagem única sem repetição!",
        filter_type="manual",
        total_recipients=1,
        sent_count=0,
        failed_count=0,
        status="pending",
    )
    db.add(camp)
    db.commit()

    admin_id = admin_user.id
    rec = ChatBroadcastRecipient(
        campaign_id=camp.id,
        recipient_id=aluno_b_id,
        status="pending",
    )
    db.add(rec)
    db.commit()
    camp_id = camp.id
    db.close()

    # 2. Primeira execução do worker: deve enviar exatamente 1 mensagem
    await run_broadcast_worker(camp_id, admin_id, db_session_factory=TestingSessionLocal)

    db_check1 = TestingSessionLocal()
    c1 = db_check1.query(ChatBroadcastCampaign).filter_by(id=camp_id).first()
    assert c1.status == "completed"
    assert c1.sent_count == 1
    msgs1 = (
        db_check1.query(ChatMessage)
        .filter_by(user_id=admin_id, recipient_id=aluno_b_id, message="Mensagem única sem repetição!")
        .all()
    )
    assert len(msgs1) == 1
    first_msg_id = msgs1[0].id
    db_check1.close()

    # 3. Segunda execução do worker (simulando reexecução acidental / retry): NADA novo deve ser enviado
    await run_broadcast_worker(camp_id, admin_id, db_session_factory=TestingSessionLocal)

    db_check2 = TestingSessionLocal()
    c2 = db_check2.query(ChatBroadcastCampaign).filter_by(id=camp_id).first()
    assert c2.status == "completed"
    assert c2.sent_count == 1, "sent_count não pode ultrapassar o total de destinatários enviados"
    msgs2 = (
        db_check2.query(ChatMessage)
        .filter_by(user_id=admin_id, recipient_id=aluno_b_id, message="Mensagem única sem repetição!")
        .all()
    )
    assert len(msgs2) == 1, "Não pode haver mensagens duplicadas criadas no chat"
    assert msgs2[0].id == first_msg_id
    db_check2.close()


