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

def test_course_bundle_title_crud(admin_headers):
    # 1. Cria curso com bundle_title
    create_payload = {
        "title": "Curso Principal do Combo",
        "description": "Curso com pacote",
        "bundle_title": "Combo Super Especial 2 em 1",
        "item_type": "course"
    }
    res = client.post("/api/v1/courses", json=create_payload, headers=admin_headers)
    assert res.status_code in [200, 201], res.text
    created = res.json()
    course_id = created["id"]
    assert created["bundle_title"] == "Combo Super Especial 2 em 1"

    # 2. Atualiza bundle_title
    update_payload = {
        "bundle_title": "Combo Renomeado Master"
    }
    patch_res = client.patch(f"/api/v1/courses/{course_id}", json=update_payload, headers=admin_headers)
    assert patch_res.status_code == 200, patch_res.text
    updated = patch_res.json()
    assert updated["bundle_title"] == "Combo Renomeado Master"

    # 3. Consulta lista de cursos e confirma bundle_title
    list_res = client.get("/api/v1/courses", headers=admin_headers)
    assert list_res.status_code == 200
    courses = list_res.json()
    matched = next((c for c in courses if c["id"] == course_id), None)
    assert matched is not None
    assert matched["bundle_title"] == "Combo Renomeado Master"

    # Limpeza
    del_res = client.delete(f"/api/v1/courses/{course_id}", headers=admin_headers)
    assert del_res.status_code == 200


def test_course_watermark_enabled_toggle(admin_headers):
    # 1. Cria curso com padrão (watermark_enabled = True)
    create_payload = {
        "title": "Curso Teste Marca Dagua",
        "description": "Testando ativacao e desativacao de marca dagua",
        "item_type": "course"
    }
    res = client.post("/api/v1/courses", json=create_payload, headers=admin_headers)
    assert res.status_code in [200, 201], res.text
    created = res.json()
    course_id = created["id"]
    assert created["watermark_enabled"] is True

    # 2. Desativa a marca d'água na edição do curso
    patch_res = client.patch(
        f"/api/v1/courses/{course_id}",
        json={"watermark_enabled": False},
        headers=admin_headers
    )
    assert patch_res.status_code == 200, patch_res.text
    assert patch_res.json()["watermark_enabled"] is False

    # 3. Confirma em GET /courses/{course_id}
    detail_res = client.get(f"/api/v1/courses/{course_id}", headers=admin_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["watermark_enabled"] is False

    # 4. Reativa a marca d'água
    patch_res2 = client.patch(
        f"/api/v1/courses/{course_id}",
        json={"watermark_enabled": True},
        headers=admin_headers
    )
    assert patch_res2.status_code == 200
    assert patch_res2.json()["watermark_enabled"] is True

    # Limpeza
    del_res = client.delete(f"/api/v1/courses/{course_id}", headers=admin_headers)
    assert del_res.status_code == 200
