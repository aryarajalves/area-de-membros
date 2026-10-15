import json
import pytest
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course
from app.models.chat import ChatMessage
from app.models.funnel import Funnel, FunnelExecution
from app.models.student_tag import StudentTag, StudentTagAssignment
from app.services.funnel_service import (
    resolve_spintax,
    execute_funnel_flow,
    dispatch_student_created_funnels,
    check_and_dispatch_delayed_student_funnels,
    dispatch_course_interest_funnels,
    normalize_flow_data_nodes,
)
from app.services.chat_encryption_service import decrypt_dm_message
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seed_funnel_data():
    db = TestingSessionLocal()
    db.query(FunnelExecution).delete()
    db.query(Funnel).delete()

    aluno = db.query(User).filter(User.email == "aluno_funil_test@test.com").first()
    if not aluno:
        aluno = User(
            email="aluno_funil_test@test.com",
            name="Aluno Funil Teste",
            hashed_password=get_password_hash("pass123"),
            role="aluno",
            is_active=True,
        )
        db.add(aluno)
        db.commit()

    aluno_id = aluno.id
    db.close()
    return {"aluno_id": aluno_id}


def test_spintax_resolution():
    """Valida a resolução de Spintax dinâmico."""
    text_pattern = "{Oi|Olá|Bom dia} {aluno}, como vai?"
    resolved = resolve_spintax(text_pattern)
    assert any(greeting in resolved for greeting in ["Oi", "Olá", "Bom dia"])
    assert "{aluno}, como vai?" in resolved


def test_funnel_crud_flow(seed_funnel_data):
    """Valida o ciclo completo de CRUD de funis."""
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    # 1. Criar funil
    flow_content = {
        "nodes": [
            {
                "id": "node_start",
                "type": "message",
                "position": {"x": 200, "y": 100},
                "data": {
                    "is_start": True,
                    "text": "Seja muito bem-vindo ao suporte VIP!",
                    "buttons": [{"text": "Conhecer Bônus", "url": "https://google.com", "action_type": "url"}],
                },
            }
        ],
        "edges": [],
    }

    create_payload = {
        "name": "Funil de Boas-Vindas VIP",
        "description": "Funil automatizado para novos membros",
        "trigger_type": "chat_button",
        "flow_data": json.dumps(flow_content),
        "is_active": True,
    }

    res_create = client.post("/api/v1/funnels", json=create_payload, headers=admin_headers)
    assert res_create.status_code == 201
    funnel = res_create.json()
    assert funnel["name"] == "Funil de Boas-Vindas VIP"
    funnel_id = funnel["id"]

    # 2. Listar funis
    res_list = client.get("/api/v1/funnels", headers=admin_headers)
    assert res_list.status_code == 200
    funnels = res_list.json()
    assert any(f["id"] == funnel_id for f in funnels)

    # 3. Obter detalhes
    res_get = client.get(f"/api/v1/funnels/{funnel_id}", headers=admin_headers)
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "Funil de Boas-Vindas VIP"

    # 4. Atualizar funil
    res_update = client.put(
        f"/api/v1/funnels/{funnel_id}",
        json={"name": "Funil de Boas-Vindas Editado", "is_active": True},
        headers=admin_headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Funil de Boas-Vindas Editado"

    # 5. Duplicar funil
    res_dup = client.post(f"/api/v1/funnels/{funnel_id}/duplicate", headers=admin_headers)
    assert res_dup.status_code == 200
    dup_funnel = res_dup.json()
    assert "Cópia" in dup_funnel["name"]

    # 6. Excluir cópia
    res_del = client.delete(f"/api/v1/funnels/{dup_funnel['id']}", headers=admin_headers)
    assert res_del.status_code == 200


@pytest.mark.asyncio
async def test_funnel_execution_flow(seed_funnel_data):
    """Valida a execução de nós de mensagem em sequência com delay."""
    db = TestingSessionLocal()
    admin_user = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()
    admin_id = admin_user.id
    aluno_id = seed_funnel_data["aluno_id"]

    # Cria funil com 2 nós de mensagem conectados
    flow = {
        "nodes": [
            {
                "id": "node_1",
                "type": "message",
                "data": {"is_start": True, "text": "Primeira mensagem do funil!"},
            },
            {
                "id": "node_2",
                "type": "message",
                "data": {"text": "Segunda mensagem após avanço!"},
            },
        ],
        "edges": [
            {"source": "node_1", "target": "node_2"},
        ],
    }

    funnel = Funnel(
        name="Fluxo Teste Sequência",
        flow_data=json.dumps(flow),
        is_active=True,
        created_by_user_id=admin_id,
    )
    db.add(funnel)
    db.commit()
    funnel_id = funnel.id
    db.close()

    # Executa o funil diretamente
    result = await execute_funnel_flow(
        funnel_id=funnel_id,
        student_id=aluno_id,
        sender_id=admin_id,
        db_session_factory=TestingSessionLocal,
    )

    assert result.success is True
    assert result.messages_dispatched == 2

    # Verifica mensagens gravadas no chat DM para o aluno
    db_check = TestingSessionLocal()
    msgs = (
        db_check.query(ChatMessage)
        .filter(ChatMessage.recipient_id == aluno_id, ChatMessage.channel_type == "dm")
        .all()
    )
    assert len(msgs) == 2
    assert any(m.message.startswith("enc:v1:") for m in msgs)
    decrypted_texts = [decrypt_dm_message(m.message) for m in msgs]
    assert "Primeira mensagem do funil!" in decrypted_texts
    assert "Segunda mensagem após avanço!" in decrypted_texts

    # Verifica histórico de execução
    exec_record = db_check.query(FunnelExecution).filter_by(funnel_id=funnel_id).first()
    assert exec_record is not None
    assert exec_record.status == "completed"
    db_check.close()


def test_upload_funnel_media_endpoints():
    """Valida o upload de mídias para nós de funil (imagem, vídeo, áudio e documento)."""
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    # 1. Upload de imagem válida
    image_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("banner.png", image_bytes, "image/png")}
    res_img = client.post("/api/v1/funnels/upload-media", files=files, data={"media_type": "image"}, headers=admin_headers)
    assert res_img.status_code == 200
    img_data = res_img.json()
    assert "media_url" in img_data
    assert img_data["media_type"] == "image"
    assert img_data["filename"] == "banner.png"

    # 2. Upload de vídeo válido
    video_bytes = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42"
    files_vid = {"file": ("video_aula.mp4", video_bytes, "video/mp4")}
    res_vid = client.post("/api/v1/funnels/upload-media", files=files_vid, data={"media_type": "video"}, headers=admin_headers)
    assert res_vid.status_code == 200
    vid_data = res_vid.json()
    assert vid_data["media_type"] == "video"

    # 3. Upload de documento válido
    doc_bytes = b"%PDF-1.4\n%teste pdf documento"
    files_doc = {"file": ("ebook_guia.pdf", doc_bytes, "application/pdf")}
    res_doc = client.post("/api/v1/funnels/upload-media", files=files_doc, data={"media_type": "file"}, headers=admin_headers)
    assert res_doc.status_code == 200
    doc_data = res_doc.json()
    assert doc_data["media_type"] == "file"

    # 4. Upload de áudio válido
    audio_bytes = b"ID3\x03\x00\x00\x00\x00\x00\x00fake audio content"
    files_audio = {"file": ("audio_voz.mp3", audio_bytes, "audio/mpeg")}
    res_audio = client.post("/api/v1/funnels/upload-media", files=files_audio, data={"media_type": "audio"}, headers=admin_headers)
    assert res_audio.status_code == 200
    audio_data = res_audio.json()
    assert audio_data["media_type"] == "audio"

    # 5. Tentativa com extensão inválida (deve falhar com 400)
    files_bad = {"file": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")}
    res_bad = client.post("/api/v1/funnels/upload-media", files=files_bad, headers=admin_headers)
    assert res_bad.status_code == 400
    assert "não suportada" in res_bad.json()["detail"]


@pytest.mark.asyncio
async def test_funnel_with_trigger_node_execution(seed_funnel_data):
    """Valida a execução de um funil iniciado por um nó do tipo 'trigger'."""
    aluno_id = seed_funnel_data["aluno_id"]
    db = TestingSessionLocal()
    admin = db.query(User).filter(User.role == "superadmin").first()
    admin_id = admin.id if admin else 1

    flow = {
        "nodes": [
            {
                "id": "trigger_node_1",
                "type": "trigger",
                "position": {"x": 100, "y": 100},
                "data": {
                    "is_start": True,
                    "label": "Aluno Criado",
                    "trigger_event": "student_created",
                    "days_after": 0,
                },
            },
            {
                "id": "msg_after_trigger",
                "type": "message",
                "position": {"x": 450, "y": 100},
                "data": {
                    "text": "Bem-vindo imediatamente após cadastro, {aluno}!",
                },
            },
        ],
        "edges": [
            {"id": "e_trigger_msg", "source": "trigger_node_1", "target": "msg_after_trigger"}
        ],
    }

    funnel = Funnel(
        name="Funil com Gatilho Aluno Criado",
        description="Disparo automático para novos alunos",
        trigger_type="trigger",
        flow_data=json.dumps(flow),
        is_active=True,
        created_by_user_id=admin_id,
    )
    db.add(funnel)
    db.commit()
    funnel_id = funnel.id
    db.close()

    result = await execute_funnel_flow(
        funnel_id=funnel_id,
        student_id=aluno_id,
        sender_id=admin_id,
        db_session_factory=TestingSessionLocal,
    )

    assert result.success is True
    assert result.messages_dispatched == 1

    db_check = TestingSessionLocal()
    exec_record = db_check.query(FunnelExecution).filter_by(funnel_id=funnel_id).first()
    assert exec_record is not None
    assert exec_record.status == "completed"
    assert "Gatilho 'student_created' iniciado (0 dias)" in (exec_record.logs or "")
    db_check.close()


def test_dispatch_student_created_funnels_immediate(seed_funnel_data):
    """Valida que dispatch_student_created_funnels dispara funis com days_after=0."""
    aluno_id = seed_funnel_data["aluno_id"]
    db = TestingSessionLocal()
    admin = db.query(User).filter(User.role == "superadmin").first()
    admin_id = admin.id if admin else 1

    flow = {
        "nodes": [
            {
                "id": "trig_0d",
                "type": "trigger",
                "position": {"x": 50, "y": 50},
                "data": {
                    "trigger_event": "student_created",
                    "days_after": 0,
                },
            },
            {
                "id": "msg_0d",
                "type": "message",
                "position": {"x": 300, "y": 50},
                "data": {"text": "Mensagem instantânea no cadastro"},
            },
        ],
        "edges": [{"id": "e_0d", "source": "trig_0d", "target": "msg_0d"}],
    }

    funnel = Funnel(
        name="Gatilho Imediato",
        trigger_type="trigger",
        flow_data=json.dumps(flow),
        is_active=True,
        created_by_user_id=admin_id,
    )
    db.add(funnel)
    db.commit()

    dispatched = dispatch_student_created_funnels(db, aluno_id)
    assert dispatched >= 1

    # Segunda chamada não deve duplicar disparo
    dispatched_again = dispatch_student_created_funnels(db, aluno_id)
    assert dispatched_again == 0
    db.close()


def test_check_and_dispatch_delayed_student_funnels():
    """Valida que funis com days_after > 0 são disparados apenas para alunos com cadastro antigo."""
    db = TestingSessionLocal()
    admin = db.query(User).filter(User.role == "superadmin").first()
    admin_id = admin.id if admin else 1

    # Cria aluno antigo (cadastrado há 8 dias)
    old_student = db.query(User).filter(User.email == "aluno_antigo_7d@test.com").first()
    if not old_student:
        old_student = User(
            email="aluno_antigo_7d@test.com",
            name="Aluno Antigo",
            hashed_password=get_password_hash("pass123"),
            role="aluno",
            is_active=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=8),
        )
        db.add(old_student)
        db.commit()
    else:
        old_student.created_at = datetime.now(timezone.utc) - timedelta(days=8)
        db.commit()

    # Cria funil com delay de 7 dias
    flow = {
        "nodes": [
            {
                "id": "trig_7d",
                "type": "trigger",
                "position": {"x": 50, "y": 50},
                "data": {
                    "trigger_event": "student_created",
                    "days_after": 7,
                },
            },
            {
                "id": "msg_7d",
                "type": "message",
                "position": {"x": 300, "y": 50},
                "data": {"text": "Mensagem disparada 7 dias depois"},
            },
        ],
        "edges": [{"id": "e_7d", "source": "trig_7d", "target": "msg_7d"}],
    }

    funnel = Funnel(
        name="Gatilho 7 Dias",
        trigger_type="trigger",
        flow_data=json.dumps(flow),
        is_active=True,
        created_by_user_id=admin_id,
    )
    db.add(funnel)
    db.commit()

    dispatched = check_and_dispatch_delayed_student_funnels(db)
    assert dispatched >= 1

    # Segunda verificação não deve duplicar
    dispatched_again = check_and_dispatch_delayed_student_funnels(db)
    assert dispatched_again == 0
    db.close()


def test_check_triggers_endpoint():
    """Valida o endpoint POST /api/v1/funnels/check-triggers."""
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.post("/api/v1/funnels/check-triggers", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "dispatched_count" in data


def test_trigger_node_automatically_becomes_start_node(seed_funnel_data):
    """
    Valida a regra de negócio: Se algum gatilho estiver no fluxo,
    ele é automaticamente o primeiro nó e recebe is_start=True,
    removendo is_start dos demais nós.
    """
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    flow_content = {
        "nodes": [
            {
                "id": "msg_node_init",
                "type": "message",
                "position": {"x": 100, "y": 100},
                "data": {"is_start": True, "text": "Mensagem que antes era start"},
            },
            {
                "id": "trigger_student",
                "type": "trigger",
                "position": {"x": 50, "y": 50},
                "data": {
                    "trigger_event": "student_created",
                    "delay_type": "immediate",
                    "days_after": 0,
                },
            },
        ],
        "edges": [{"id": "e_trig", "source": "trigger_student", "target": "msg_node_init"}],
    }

    create_payload = {
        "name": "Funil com Gatilho Automático Início",
        "description": "Validação de gatilho como primeiro nó",
        "trigger_type": "trigger",
        "flow_data": json.dumps(flow_content),
        "is_active": True,
    }

    res_create = client.post("/api/v1/funnels", json=create_payload, headers=admin_headers)
    assert res_create.status_code == 201
    created_funnel = res_create.json()

    saved_flow = json.loads(created_funnel["flow_data"])
    nodes_map = {n["id"]: n for n in saved_flow["nodes"]}

    # O gatilho deve ter recebido is_start = True
    assert nodes_map["trigger_student"]["data"]["is_start"] is True
    # O nó de mensagem que antes era start deve ter is_start = False
    assert nodes_map["msg_node_init"]["data"]["is_start"] is False

    # Executa o funil e verifica que iniciou pelo gatilho
    funnel_id = created_funnel["id"]
    res_trig = client.post(
        f"/api/v1/funnels/{funnel_id}/trigger",
        json={"student_id": seed_funnel_data["aluno_id"]},
        headers=admin_headers,
    )
    assert res_trig.status_code == 200
    assert res_trig.json()["success"] is True


def test_trigger_node_cannot_be_edge_target(seed_funnel_data):
    """
    Valida a regra de negócio: Um nó de gatilho/início NUNCA pode receber
    conexões de entrada (arestas onde target == trigger_id).
    O backend deve remover automaticamente essas arestas inválidas.
    """
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    flow_content = {
        "nodes": [
            {"id": "trig_main", "type": "trigger", "position": {"x": 50, "y": 50}, "data": {}},
            {"id": "msg_step1", "type": "message", "position": {"x": 200, "y": 50}, "data": {"text": "Olá!"}},
        ],
        "edges": [
            {"id": "e_valid", "source": "trig_main", "target": "msg_step1"},
            {"id": "e_invalid_to_trigger", "source": "msg_step1", "target": "trig_main"},
        ],
    }

    create_payload = {
        "name": "Funil Teste Aresta Invalida",
        "description": "Tentativa de conectar mensagem no gatilho",
        "trigger_type": "trigger",
        "flow_data": json.dumps(flow_content),
        "is_active": True,
    }

    res_create = client.post("/api/v1/funnels", json=create_payload, headers=admin_headers)
    assert res_create.status_code == 201
    created_funnel = res_create.json()

    saved_flow = json.loads(created_funnel["flow_data"])
    saved_edges = saved_flow.get("edges", [])

    # A aresta válida deve ser mantida
    assert any(e["id"] == "e_valid" for e in saved_edges)
    # A aresta apontando para o gatilho deve ter sido removida!
    assert not any(e.get("target") == "trig_main" for e in saved_edges)


def test_one_to_one_edge_connections_enforced(seed_funnel_data):
    """
    Valida a regra de negócio: Cada nó só pode se conectar com 1 outro nó (unicidade 1-para-1).
    Não pode haver mais de uma conexão saindo da mesma saída nem entrando na mesma entrada.
    O backend deve preservar a conexão mais recente e expurgar as antigas/duplicadas.
    """
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    flow_content = {
        "nodes": [
            {"id": "trig_1", "type": "trigger", "position": {"x": 50, "y": 50}, "data": {}},
            {"id": "msg_top", "type": "message", "position": {"x": 200, "y": 50}, "data": {"text": "Msg Cima"}},
            {"id": "msg_bottom", "type": "message", "position": {"x": 200, "y": 250}, "data": {"text": "Msg Baixo"}},
        ],
        "edges": [
            {"id": "e_old", "source": "trig_1", "target": "msg_top"},
            {"id": "e_new", "source": "trig_1", "target": "msg_bottom"},
        ],
    }

    create_payload = {
        "name": "Funil 1-to-1 Validation",
        "description": "Validação de conexão única por porta",
        "trigger_type": "trigger",
        "flow_data": json.dumps(flow_content),
        "is_active": True,
    }

    res_create = client.post("/api/v1/funnels", json=create_payload, headers=admin_headers)
    assert res_create.status_code == 201
    created_funnel = res_create.json()

    saved_flow = json.loads(created_funnel["flow_data"])
    saved_edges = saved_flow.get("edges", [])

    # Deve conter estritamente 1 aresta (a mais recente, trig_1 -> msg_bottom)
    assert len(saved_edges) == 1
    assert saved_edges[0]["id"] == "e_new"
    assert saved_edges[0]["target"] == "msg_bottom"


def test_get_funnel_senders():
    """Valida a listagem de administradores elegíveis como remetentes de DM."""
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.get("/api/v1/funnels/senders", headers=admin_headers)
    assert res.status_code == 200
    senders = res.json()
    assert isinstance(senders, list)
    assert len(senders) >= 1
    for s in senders:
        assert "id" in s
        assert "name" in s
        assert "email" in s
        assert s["role"] in ["admin", "superadmin"]


@pytest.mark.asyncio
async def test_funnel_node_custom_sender(seed_funnel_data):
    """Valida que cada nó pode definir um remetente customizado para envio de DM."""
    db = TestingSessionLocal()
    aluno_id = seed_funnel_data["aluno_id"]

    custom_admin = db.query(User).filter(User.email == "admin_custom_sender@test.com").first()
    if not custom_admin:
        custom_admin = User(
            email="admin_custom_sender@test.com",
            name="Suporte Técnico Especializado",
            hashed_password=get_password_hash("pass123"),
            role="admin",
            is_active=True,
        )
        db.add(custom_admin)
        db.commit()
    custom_admin_id = custom_admin.id

    superadmin = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()
    default_sender_id = superadmin.id

    flow = {
        "nodes": [
            {
                "id": "node_custom",
                "type": "message",
                "data": {
                    "is_start": True,
                    "text": "Mensagem enviada pelo Suporte Técnico!",
                    "sender_id": custom_admin_id,
                },
            },
            {
                "id": "node_default",
                "type": "message",
                "data": {
                    "text": "Mensagem enviada pelo Criador/Padrão!",
                    "sender_id": None,
                },
            },
        ],
        "edges": [
            {"source": "node_custom", "target": "node_default"},
        ],
    }

    funnel = Funnel(
        name="Funil Multi-Remetente",
        flow_data=json.dumps(flow),
        is_active=True,
        created_by_user_id=default_sender_id,
    )
    db.add(funnel)
    db.commit()
    funnel_id = funnel.id
    db.close()

    result = await execute_funnel_flow(
        funnel_id=funnel_id,
        student_id=aluno_id,
        sender_id=default_sender_id,
        db_session_factory=TestingSessionLocal,
    )

    assert result.success is True
    assert result.messages_dispatched == 2

    db_check = TestingSessionLocal()
    msgs = (
        db_check.query(ChatMessage)
        .filter(ChatMessage.recipient_id == aluno_id, ChatMessage.channel_type == "dm")
        .order_by(ChatMessage.id.desc())
        .limit(2)
        .all()
    )
    db_check.close()

    msgs_by_text = {decrypt_dm_message(m.message): m.user_id for m in msgs}
    assert all(m.message.startswith("enc:v1:") for m in msgs)
    assert msgs_by_text["Mensagem enviada pelo Suporte Técnico!"] == custom_admin_id
    assert msgs_by_text["Mensagem enviada pelo Criador/Padrão!"] == default_sender_id


@pytest.mark.asyncio
async def test_funnel_node_tag_assignment(seed_funnel_data):
    """Valida a execução de um nó do tipo 'tag' adicionando a etiqueta ao contato."""
    db = TestingSessionLocal()
    aluno_id = seed_funnel_data["aluno_id"]
    admin = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()

    # Cria tag para o teste
    tag = StudentTag(name="Tag Funil Teste", color="#8b5cf6")
    db.add(tag)
    db.commit()
    db.refresh(tag)
    tag_id = tag.id

    # Garante que o aluno não tem a tag antes
    db.query(StudentTagAssignment).filter_by(student_id=aluno_id, tag_id=tag_id).delete()
    db.commit()

    flow = {
        "nodes": [
            {
                "id": "node_tag",
                "type": "tag",
                "data": {"is_start": True, "tag_id": tag_id, "tag_name": "Tag Funil Teste"},
            },
            {
                "id": "node_msg",
                "type": "message",
                "data": {"text": "Mensagem pós-tag!"},
            },
        ],
        "edges": [
            {"source": "node_tag", "target": "node_msg"},
        ],
    }

    funnel = Funnel(
        name="Funil com Nó de Tag",
        flow_data=json.dumps(flow),
        is_active=True,
        created_by_user_id=admin.id,
    )
    db.add(funnel)
    db.commit()
    funnel_id = funnel.id
    admin_id = admin.id
    db.close()

    result = await execute_funnel_flow(
        funnel_id=funnel_id,
        student_id=aluno_id,
        sender_id=admin_id,
        db_session_factory=TestingSessionLocal,
    )

    assert result.success is True

    # Verifica se a tag foi vinculada ao aluno
    db_check = TestingSessionLocal()
    assignment = db_check.query(StudentTagAssignment).filter_by(student_id=aluno_id, tag_id=tag_id).first()
    assert assignment is not None

    exec_record = db_check.query(FunnelExecution).filter_by(funnel_id=funnel_id, user_id=aluno_id).first()
    assert "Tag 'Tag Funil Teste' adicionada ao contato" in (exec_record.logs or "")
    db_check.close()


def test_dispatch_course_interest_funnels_all_and_idempotency(seed_funnel_data):
    """Valida o gatilho de interesse em curso para 'Todos os Cursos' e sua idempotência de 1 única vez."""
    db = TestingSessionLocal()
    aluno_id = seed_funnel_data["aluno_id"]
    admin = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()

    # Cria curso de teste
    course = Course(title="Curso Astrologia Teste", is_published=True)
    db.add(course)
    db.commit()
    db.refresh(course)
    course_id = course.id

    flow = {
        "nodes": [
            {
                "id": "trigger_node",
                "type": "trigger",
                "data": {
                    "trigger_event": "course_interest",
                    "course_id": None,  # Todos os cursos
                    "is_start": True,
                },
            },
            {
                "id": "msg_node",
                "type": "message",
                "data": {"text": "Olá {aluno}, vi que você se interessou pelo curso!"},
            },
        ],
        "edges": [
            {"source": "trigger_node", "target": "msg_node"},
        ],
    }

    funnel = Funnel(
        name="Gatilho Interesse Todos os Cursos",
        flow_data=json.dumps(flow),
        is_active=True,
        created_by_user_id=admin.id,
    )
    db.add(funnel)
    db.commit()
    funnel_id = funnel.id

    # 1. Primeiro disparo: deve executar o funil com sucesso (retorna 1)
    dispatched = dispatch_course_interest_funnels(
        db=db,
        student_id=aluno_id,
        course_id=course_id,
        db_session_factory=TestingSessionLocal,
    )
    assert dispatched == 1

    # Verifica se a execução foi registrada
    exec_record = db.query(FunnelExecution).filter_by(funnel_id=funnel_id, user_id=aluno_id).first()
    assert exec_record is not None
    assert exec_record.triggered_by == f"trigger_course_interest_{course_id}"

    # 2. Segundo disparo (simulando 2º clique do mesmo aluno): NÃO pode disparar novamente (regra de 1 única vez)
    dispatched_second = dispatch_course_interest_funnels(
        db=db,
        student_id=aluno_id,
        course_id=course_id,
        db_session_factory=TestingSessionLocal,
    )
    assert dispatched_second == 0, "Gatilho de interesse em curso deve acontecer 1 única vez"

    total_executions = db.query(FunnelExecution).filter_by(funnel_id=funnel_id, user_id=aluno_id).count()
    assert total_executions == 1
    db.close()


def test_dispatch_course_interest_funnels_specific_course(seed_funnel_data):
    """Valida que o gatilho configurado para um curso específico só dispara quando o aluno clica nele."""
    db = TestingSessionLocal()
    aluno_id = seed_funnel_data["aluno_id"]
    admin = db.query(User).filter(User.email == settings.SUPERADMIN_EMAIL).first()

    course_alvo = Course(title="Curso Alvo Específico", is_published=True)
    course_outro = Course(title="Outro Curso Qualquer", is_published=True)
    db.add_all([course_alvo, course_outro])
    db.commit()
    db.refresh(course_alvo)
    db.refresh(course_outro)

    flow = {
        "nodes": [
            {
                "id": "trigger_node",
                "type": "trigger",
                "data": {
                    "trigger_event": "course_interest",
                    "course_id": course_alvo.id,  # Apenas este curso específico
                    "is_start": True,
                },
            },
            {
                "id": "msg_node",
                "type": "message",
                "data": {"text": "Mensagem exclusiva para o curso alvo!"},
            },
        ],
        "edges": [
            {"source": "trigger_node", "target": "msg_node"},
        ],
    }

    funnel = Funnel(
        name="Funil Curso Específico",
        flow_data=json.dumps(flow),
        is_active=True,
        created_by_user_id=admin.id,
    )
    db.add(funnel)
    db.commit()
    funnel_id = funnel.id

    # 1. Clique em outro curso: não deve disparar
    dispatched_other = dispatch_course_interest_funnels(
        db=db,
        student_id=aluno_id,
        course_id=course_outro.id,
        db_session_factory=TestingSessionLocal,
    )
    assert dispatched_other == 0

    # 2. Clique no curso alvo: deve disparar exatamente 1 vez
    dispatched_target = dispatch_course_interest_funnels(
        db=db,
        student_id=aluno_id,
        course_id=course_alvo.id,
        db_session_factory=TestingSessionLocal,
    )
    assert dispatched_target == 1

    exec_target = db.query(FunnelExecution).filter_by(funnel_id=funnel_id, user_id=aluno_id).first()
    assert exec_target is not None
    db.close()


def test_get_funnel_executions_and_active_funnels_endpoints(seed_funnel_data):
    """Valida a listagem do histórico de execuções de um funil e os funis ativos de um contato."""
    aluno_id = seed_funnel_data["aluno_id"]
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    db = TestingSessionLocal()
    funnel = Funnel(
        name="Funil de Teste Execuções",
        flow_data=json.dumps({
            "nodes": [
                {"id": "node_trig", "type": "trigger", "data": {}},
                {"id": "node_msg", "type": "message", "data": {"text": "Olá {aluno}!"}},
            ],
            "edges": [{"id": "e1", "source": "node_trig", "target": "node_msg"}],
        }),
        is_active=True,
    )
    db.add(funnel)
    db.commit()
    db.refresh(funnel)

    # Cria uma execução de teste
    execution = FunnelExecution(
        funnel_id=funnel.id,
        user_id=aluno_id,
        triggered_by="manual",
        status="running",
        current_node_id="node_msg",
        started_at=datetime.now(timezone.utc),
        logs="Gatilho iniciado\n(Nó node_trig)\nMensagem enviada (Nó node_msg)",
    )
    db.add(execution)
    db.commit()
    f_id = funnel.id
    db.close()

    # 1. Testar endpoint de execuções do funil
    res_exec = client.get(f"/api/v1/funnels/{f_id}/executions", headers=admin_headers)
    assert res_exec.status_code == 200
    data = res_exec.json()
    assert data["funnel_id"] == funnel.id
    assert data["total_executions"] >= 1
    assert data["running_count"] >= 1
    assert len(data["executions"]) >= 1
    first_exec = data["executions"][0]
    assert first_exec["user_id"] == aluno_id
    assert "node_trig" in first_exec["visited_nodes"]
    assert "node_msg" in first_exec["visited_nodes"]
    assert len(data["flow_nodes"]) == 2

    # 2. Testar endpoint de funis ativos do contato
    res_contact = client.get(f"/api/v1/funnels/contacts/{aluno_id}/active-funnels", headers=admin_headers)
    assert res_contact.status_code == 200
    contact_data = res_contact.json()
    assert isinstance(contact_data, list)
    assert len(contact_data) >= 1
    contact_funnel = next((item for item in contact_data if item["funnel_id"] == funnel.id), None)
    assert contact_funnel is not None
    assert contact_funnel["status"] == "running"
    assert contact_funnel["current_node_id"] == "node_msg"






