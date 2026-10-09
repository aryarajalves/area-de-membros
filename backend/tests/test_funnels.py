import json
import pytest
from datetime import datetime, timezone
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.chat import ChatMessage
from app.models.funnel import Funnel, FunnelExecution
from app.services.funnel_service import resolve_spintax, execute_funnel_flow
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
    assert any(m.message == "Primeira mensagem do funil!" for m in msgs)
    assert any(m.message == "Segunda mensagem após avanço!" for m in msgs)

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

