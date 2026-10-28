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

def test_batch_update_lesson_thumbnails(admin_headers):
    # 1. Cria um curso para o teste
    res = client.post("/api/v1/courses", json={
        "title": "Curso Teste Batch Thumbnail",
        "description": "Curso para validar atualização em lote de thumbnail de aulas",
        "item_type": "course"
    }, headers=admin_headers)
    assert res.status_code in [200, 201], res.text
    course = res.json()
    course_id = course["id"]

    try:
        # 2. Cria um módulo no curso
        mod_res = client.post(f"/api/v1/courses/{course_id}/modules", json={
            "title": "Módulo Teste Batch",
            "order": 1
        }, headers=admin_headers)
        assert mod_res.status_code in [200, 201], mod_res.text
        module = mod_res.json()
        module_id = module["id"]

        # 3. Cria duas aulas no módulo
        l1_res = client.post(f"/api/v1/courses/{course_id}/modules/{module_id}/lessons", json={
            "title": "Aula 01 - Introdução",
            "description": "Desc Aula 1",
            "order": 1,
            "duration": "10:00"
        }, headers=admin_headers)
        assert l1_res.status_code in [200, 201], l1_res.text
        l1 = l1_res.json()

        l2_res = client.post(f"/api/v1/courses/{course_id}/modules/{module_id}/lessons", json={
            "title": "Aula 02 - Prática",
            "description": "Desc Aula 2",
            "order": 2,
            "duration": "15:00"
        }, headers=admin_headers)
        assert l2_res.status_code in [200, 201], l2_res.text
        l2 = l2_res.json()

        lesson_ids = [l1["id"], l2["id"]]
        new_cover = "https://minio.exemplo.com/bucket/capa-lote-nova.webp"

        # 4. Executa atualização em lote
        batch_payload = {
            "lesson_ids": lesson_ids,
            "thumbnail_url": new_cover
        }
        batch_res = client.patch(
            f"/api/v1/courses/{course_id}/modules/{module_id}/lessons/batch-thumbnail",
            json=batch_payload,
            headers=admin_headers
        )
        assert batch_res.status_code == 200, batch_res.text
        batch_data = batch_res.json()
        assert set(batch_data["updated_lesson_ids"]) == set(lesson_ids)
        assert batch_data["thumbnail_url"] == new_cover

        # 5. Verifica se as aulas foram de fato atualizadas
        course_check = client.get(f"/api/v1/courses/{course_id}", headers=admin_headers)
        assert course_check.status_code == 200
        course_data = course_check.json()
        mod_found = next(m for m in course_data["modules"] if m["id"] == module_id)
        for lesson in mod_found["lessons"]:
            if lesson["id"] in lesson_ids:
                assert lesson["thumbnail_url"] == new_cover

        # 6. Teste de erro: módulo inexistente
        err_res = client.patch(
            f"/api/v1/courses/{course_id}/modules/999999/lessons/batch-thumbnail",
            json=batch_payload,
            headers=admin_headers
        )
        assert err_res.status_code == 404

        # 7. Teste de erro: lista vazia de IDs (validação Pydantic min_items=1)
        err_res2 = client.patch(
            f"/api/v1/courses/{course_id}/modules/{module_id}/lessons/batch-thumbnail",
            json={"lesson_ids": [], "thumbnail_url": new_cover},
            headers=admin_headers
        )
        assert err_res2.status_code == 422

        # 8. Teste de erro: IDs que não pertencem ao módulo
        err_res3 = client.patch(
            f"/api/v1/courses/{course_id}/modules/{module_id}/lessons/batch-thumbnail",
            json={"lesson_ids": [999991, 999992], "thumbnail_url": new_cover},
            headers=admin_headers
        )
        assert err_res3.status_code == 404

    finally:
        # Limpeza
        client.delete(f"/api/v1/courses/{course_id}", headers=admin_headers)
