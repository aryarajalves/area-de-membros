import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.core.database import SessionLocal
from app.models.user import User

client = TestClient(app)

@pytest.fixture
def admin_headers():
    db = SessionLocal()
    admin = db.query(User).filter(User.role.in_(["admin", "superadmin"])).first()
    db.close()
    assert admin is not None, "Nenhum admin encontrado no banco"
    token = create_access_token(data={"sub": str(admin.id), "role": admin.role})
    return {"Authorization": f"Bearer {token}"}

def test_funnel_folders_lifecycle_and_safety(admin_headers):
    # 1. Cria nova pasta
    folder_payload = {
        "name": "Pasta Teste Automação",
        "color": "#10b981",
        "order_index": 1,
    }
    res = client.post("/api/v1/funnels/folders", json=folder_payload, headers=admin_headers)
    assert res.status_code == 201, res.text
    folder = res.json()
    folder_id = folder["id"]
    assert folder["name"] == "Pasta Teste Automação"
    assert folder["color"] == "#10b981"
    assert folder["funnels_count"] == 0

    # 2. Lista pastas e confirma presença
    list_folders_res = client.get("/api/v1/funnels/folders", headers=admin_headers)
    assert list_folders_res.status_code == 200
    folders = list_folders_res.json()
    assert any(f["id"] == folder_id for f in folders)

    # 3. Atualiza pasta (renomear e cor)
    update_res = client.put(
        f"/api/v1/funnels/folders/{folder_id}",
        json={"name": "Pasta Teste VIP", "color": "#8b5cf6"},
        headers=admin_headers,
    )
    assert update_res.status_code == 200
    updated_folder = update_res.json()
    assert updated_folder["name"] == "Pasta Teste VIP"
    assert updated_folder["color"] == "#8b5cf6"

    # 4. Cria funil atribuído a esta pasta
    funnel_payload = {
        "name": "Funil de Boas-vindas na Pasta",
        "folder_id": folder_id,
        "trigger_type": "chat_button",
    }
    create_funnel_res = client.post("/api/v1/funnels", json=funnel_payload, headers=admin_headers)
    assert create_funnel_res.status_code in [200, 201], create_funnel_res.text
    funnel = create_funnel_res.json()
    funnel_id = funnel["id"]
    assert funnel["folder_id"] == folder_id
    assert funnel["folder_name"] == "Pasta Teste VIP"

    # 5. Lista funis e confirma contagem na pasta
    list_folders_after = client.get("/api/v1/funnels/folders", headers=admin_headers).json()
    matched_folder = next(f for f in list_folders_after if f["id"] == folder_id)
    assert matched_folder["funnels_count"] == 1

    # 6. Duplica o funil e confirma que a cópia herda a pasta
    dup_res = client.post(f"/api/v1/funnels/{funnel_id}/duplicate", headers=admin_headers)
    assert dup_res.status_code == 200
    dup_funnel = dup_res.json()
    dup_id = dup_funnel["id"]
    assert dup_funnel["folder_id"] == folder_id

    # 7. Move o funil duplicado para 'Sem Pasta' (folder_id: None)
    move_res = client.patch(
        f"/api/v1/funnels/{dup_id}/folder",
        json={"folder_id": None},
        headers=admin_headers,
    )
    assert move_res.status_code == 200
    assert move_res.json()["folder_id"] is None
    assert move_res.json()["folder_name"] is None

    # 8. Exclui a pasta e verifica a regra de segurança:
    # O funil original NÃO deve ser excluído, mas sim movido automaticamente para 'Sem Pasta'
    del_folder_res = client.delete(f"/api/v1/funnels/folders/{folder_id}", headers=admin_headers)
    assert del_folder_res.status_code == 200

    # Verifica se a pasta realmente não existe mais
    remaining_folders = client.get("/api/v1/funnels/folders", headers=admin_headers).json()
    assert not any(f["id"] == folder_id for f in remaining_folders)

    # O funil original ainda existe, mas com folder_id = None
    funnel_check_res = client.get(f"/api/v1/funnels/{funnel_id}", headers=admin_headers)
    assert funnel_check_res.status_code == 200
    assert funnel_check_res.json()["folder_id"] is None
    assert funnel_check_res.json()["folder_name"] is None

    # Limpeza dos funis de teste
    client.delete(f"/api/v1/funnels/{funnel_id}", headers=admin_headers)
    client.delete(f"/api/v1/funnels/{dup_id}", headers=admin_headers)
