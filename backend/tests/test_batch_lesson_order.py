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

def test_batch_update_lesson_order(admin_headers):
    # 1. Cria curso de teste
    res = client.post("/api/v1/courses", json={
        "title": "Curso Teste Batch Order",
        "description": "Curso para validar reordenação em lote de aulas",
        "item_type": "course"
    }, headers=admin_headers)
    assert res.status_code in [200, 201], res.text
    course = res.json()
    course_id = course["id"]

    try:
        # 2. Cria módulo no curso
        mod_res = client.post(f"/api/v1/courses/{course_id}/modules", json={
            "title": "Módulo Teste Ordem",
            "order": 1
        }, headers=admin_headers)
        assert mod_res.status_code in [200, 201], mod_res.text
        module = mod_res.json()
        module_id = module["id"]

        # 3. Cria três aulas com ordens quaisquer
        l1 = client.post(f"/api/v1/courses/{course_id}/modules/{module_id}/lessons", json={
            "title": "Aula A",
            "description": "Desc A",
            "order_index": 0,
            "duration": "10:00"
        }, headers=admin_headers).json()

        l2 = client.post(f"/api/v1/courses/{course_id}/modules/{module_id}/lessons", json={
            "title": "Aula B",
            "description": "Desc B",
            "order_index": 0,
            "duration": "15:00"
        }, headers=admin_headers).json()

        l3 = client.post(f"/api/v1/courses/{course_id}/modules/{module_id}/lessons", json={
            "title": "Aula C",
            "description": "Desc C",
            "order_index": 0,
            "duration": "20:00"
        }, headers=admin_headers).json()

        # 4. Atualiza ordem em lote: Aula C vira 1, Aula A vira 2, Aula B vira 3
        batch_payload = {
            "items": [
                {"lesson_id": l3["id"], "order_index": 1},
                {"lesson_id": l1["id"], "order_index": 2},
                {"lesson_id": l2["id"], "order_index": 3}
            ]
        }
        batch_res = client.patch(
            f"/api/v1/courses/{course_id}/modules/{module_id}/lessons/batch-order",
            json=batch_payload,
            headers=admin_headers
        )
        assert batch_res.status_code == 200, batch_res.text
        data = batch_res.json()
        assert len(data["updated_lessons"]) == 3

        # 5. Consulta o curso e verifica se a ordem retornada respeita a nova ordenação
        course_check = client.get(f"/api/v1/courses/{course_id}", headers=admin_headers)
        assert course_check.status_code == 200
        course_data = course_check.json()
        mod_found = next(m for m in course_data["modules"] if m["id"] == module_id)
        lessons = mod_found["lessons"]

        # A relação module.lessons é ordenada por Lesson.order_index
        assert lessons[0]["id"] == l3["id"]
        assert lessons[0]["order_index"] == 1
        assert lessons[1]["id"] == l1["id"]
        assert lessons[1]["order_index"] == 2
        assert lessons[2]["id"] == l2["id"]
        assert lessons[2]["order_index"] == 3

        # 6. Teste de erro: módulo inexistente
        err_res = client.patch(
            f"/api/v1/courses/{course_id}/modules/999999/lessons/batch-order",
            json=batch_payload,
            headers=admin_headers
        )
        assert err_res.status_code == 404

        # 7. Teste de erro: payload com lista vazia
        err_res2 = client.patch(
            f"/api/v1/courses/{course_id}/modules/{module_id}/lessons/batch-order",
            json={"items": []},
            headers=admin_headers
        )
        assert err_res2.status_code == 422

        # 8. Teste de erro: IDs que não pertencem ao módulo
        err_res3 = client.patch(
            f"/api/v1/courses/{course_id}/modules/{module_id}/lessons/batch-order",
            json={"items": [{"lesson_id": 999991, "order_index": 1}]},
            headers=admin_headers
        )
        assert err_res3.status_code == 404

    finally:
        client.delete(f"/api/v1/courses/{course_id}", headers=admin_headers)
