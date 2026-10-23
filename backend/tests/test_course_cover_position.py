import pytest
from app.core.config import settings
from app.models.course import Course
from tests.conftest import TestingSessionLocal, client


def get_admin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_update_course_cover_image_position():
    headers = get_admin_headers()

    # 1. Cria um curso definindo cover_image_position = 30
    create_payload = {
        "title": "Curso Teste Posicionamento Banner",
        "description": "Curso para validar enquadramento vertical",
        "cover_image_url": "https://meubucket.com/hero_banner.jpg",
        "cover_image_position": 30,
        "is_published": True
    }

    res = client.post("/api/v1/courses", json=create_payload, headers=headers)
    assert res.status_code == 201, res.text
    course_data = res.json()
    course_id = course_data["id"]
    assert course_data["cover_image_position"] == 30
    assert course_data["cover_image_url"] == "https://meubucket.com/hero_banner.jpg"

    # 2. Atualiza via PATCH para cover_image_position = 85
    patch_payload = {
        "cover_image_position": 85
    }
    patch_res = client.patch(f"/api/v1/courses/{course_id}", json=patch_payload, headers=headers)
    assert patch_res.status_code == 200, patch_res.text
    updated_data = patch_res.json()
    assert updated_data["cover_image_position"] == 85

    # 3. Consulta detalhes do curso
    get_res = client.get(f"/api/v1/courses/{course_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["cover_image_position"] == 85
