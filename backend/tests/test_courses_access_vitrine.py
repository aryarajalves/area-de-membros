import pytest
from unittest.mock import patch, AsyncMock
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, UserCourse
from tests.conftest import TestingSessionLocal, client

def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def setup_courses_and_users():
    db = TestingSessionLocal()
    
    # Cria aluno
    aluno = db.query(User).filter(User.email == "aluno_vitrine@test.com").first()
    if not aluno:
        aluno = User(
            email="aluno_vitrine@test.com",
            name="Aluno Vitrine",
            role="aluno",
            hashed_password=get_password_hash("AlunoPass123!"),
            is_active=True
        )
        db.add(aluno)
        db.commit()
        db.refresh(aluno)

    # Cria Curso 1 (adquirido)
    c1 = db.query(Course).filter(Course.title == "Curso Adquirido").first()
    if not c1:
        c1 = Course(
            title="Curso Adquirido",
            description="Curso que o aluno comprou",
            sales_page_url="https://vendas.com/curso1",
            is_published=True
        )
        db.add(c1)
        db.commit()
        db.refresh(c1)

    # Cria Curso 2 (não adquirido)
    c2 = db.query(Course).filter(Course.title == "Curso Não Adquirido").first()
    if not c2:
        c2 = Course(
            title="Curso Não Adquirido",
            description="Curso que o aluno ainda não comprou",
            sales_page_url="https://vendas.com/curso2",
            is_published=True
        )
        db.add(c2)
        db.commit()
        db.refresh(c2)

    # Vincula apenas c1 ao aluno
    uc = db.query(UserCourse).filter(UserCourse.user_id == aluno.id, UserCourse.course_id == c1.id).first()
    if not uc:
        uc = UserCourse(user_id=aluno.id, course_id=c1.id, access_duration="lifetime")
        db.add(uc)
        db.commit()

    aluno_id = aluno.id
    c1_id = c1.id
    c2_id = c2.id
    db.close()
    return {"aluno_id": aluno_id, "c1_id": c1_id, "c2_id": c2_id}

def test_course_sales_page_url_creation_and_update():
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    # Criar curso com sales_page_url
    res = client.post("/api/v1/courses", json={
        "title": "Curso Teste Vendas",
        "description": "Desc teste",
        "sales_page_url": "https://landingpage.com/curso-novo"
    }, headers=headers)
    assert res.status_code == 201
    course_data = res.json()
    assert course_data["sales_page_url"] == "https://landingpage.com/curso-novo"
    assert course_data["has_access"] is True
    course_id = course_data["id"]

    # Atualizar sales_page_url
    res_patch = client.patch(f"/api/v1/courses/{course_id}", json={
        "sales_page_url": "https://landingpage.com/curso-atualizado"
    }, headers=headers)
    assert res_patch.status_code == 200
    assert res_patch.json()["sales_page_url"] == "https://landingpage.com/curso-atualizado"
    assert res_patch.json()["has_access"] is True

def test_student_sees_all_courses_with_has_access_flag(setup_courses_and_users):
    headers = get_headers("aluno_vitrine@test.com", "AlunoPass123!")

    res = client.get("/api/v1/courses", headers=headers)
    assert res.status_code == 200
    courses = res.json()

    # O aluno deve ver os cursos na vitrine
    c1 = next((c for c in courses if c["id"] == setup_courses_and_users["c1_id"]), None)
    c2 = next((c for c in courses if c["id"] == setup_courses_and_users["c2_id"]), None)

    assert c1 is not None
    assert c1["has_access"] is True

    assert c2 is not None
    assert c2["has_access"] is False
    assert c2["sales_page_url"] == "https://vendas.com/curso2"

def test_student_cannot_access_unpurchased_course_detail(setup_courses_and_users):
    headers = get_headers("aluno_vitrine@test.com", "AlunoPass123!")
    c2_id = setup_courses_and_users["c2_id"]

    # Tentar abrir detalhes do curso não adquirido
    res = client.get(f"/api/v1/courses/{c2_id}", headers=headers)
    assert res.status_code == 403
    assert "Você não possui acesso liberado a este curso" in res.json()["detail"]

    # Curso adquirido pode ser acessado
    c1_id = setup_courses_and_users["c1_id"]
    res_c1 = client.get(f"/api/v1/courses/{c1_id}", headers=headers)
    assert res_c1.status_code == 200
    assert res_c1.json()["id"] == c1_id

def test_course_order_index_ordering():
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    # Criar cursos com ordem específica
    res_b = client.post("/api/v1/courses", json={
        "title": "Curso Ordem B",
        "description": "Ordem 20",
        "order_index": 20
    }, headers=headers)
    assert res_b.status_code == 201
    course_b_id = res_b.json()["id"]
    assert res_b.json()["order_index"] == 20

    res_a = client.post("/api/v1/courses", json={
        "title": "Curso Ordem A",
        "description": "Ordem 5",
        "order_index": 5
    }, headers=headers)
    assert res_a.status_code == 201
    course_a_id = res_a.json()["id"]
    assert res_a.json()["order_index"] == 5

    # Listar cursos e verificar ordem relativa entre eles (A deve vir antes de B)
    res_list = client.get("/api/v1/courses", headers=headers)
    assert res_list.status_code == 200
    courses = res_list.json()

    index_a = next(i for i, c in enumerate(courses) if c["id"] == course_a_id)
    index_b = next(i for i, c in enumerate(courses) if c["id"] == course_b_id)
    assert index_a < index_b, "Curso com menor order_index deve aparecer antes"

    # Atualizar order_index de B para 1 (menor que A)
    res_patch = client.patch(f"/api/v1/courses/{course_b_id}", json={
        "order_index": 1
    }, headers=headers)
    assert res_patch.status_code == 200
    assert res_patch.json()["order_index"] == 1

    # Nova listagem: B deve vir antes de A agora
    res_list2 = client.get("/api/v1/courses", headers=headers)
    assert res_list2.status_code == 200
    courses2 = res_list2.json()

    new_index_a = next(i for i, c in enumerate(courses2) if c["id"] == course_a_id)
    new_index_b = next(i for i, c in enumerate(courses2) if c["id"] == course_b_id)
    assert new_index_b < new_index_a, "Após atualizar order_index, curso B deve vir antes de A"


def test_update_module_patch_and_put(setup_courses_and_users):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    c1_id = setup_courses_and_users["c1_id"]

    # Cria módulo
    res_mod = client.post(f"/api/v1/courses/{c1_id}/modules", json={
        "title": "Módulo Teste Verbos",
        "order_index": 0
    }, headers=headers)
    assert res_mod.status_code == 201
    mod_id = res_mod.json()["id"]

    # Atualiza via PATCH
    res_patch = client.patch(f"/api/v1/courses/{c1_id}/modules/{mod_id}", json={
        "image_url": "https://storage.com/capa_patch.jpg"
    }, headers=headers)
    assert res_patch.status_code == 200
    assert res_patch.json()["image_url"] == "https://storage.com/capa_patch.jpg"

    # Atualiza via PUT (compatibilidade com batch import e clientes REST)
    res_put = client.put(f"/api/v1/courses/{c1_id}/modules/{mod_id}", json={
        "image_url": "https://storage.com/capa_put.jpg"
    }, headers=headers)
    assert res_put.status_code == 200
    assert res_put.json()["image_url"] == "https://storage.com/capa_put.jpg"


def test_lesson_import_identifier_create_and_update(setup_courses_and_users):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    c1_id = setup_courses_and_users["c1_id"]

    # Cria módulo
    res_mod = client.post(f"/api/v1/courses/{c1_id}/modules", json={
        "title": "Módulo Import Identifiers",
        "order_index": 10
    }, headers=headers)
    assert res_mod.status_code == 201
    mod_id = res_mod.json()["id"]

    # 1. Cria aula com import_identifier explícito
    res_lesson1 = client.post(f"/api/v1/courses/{c1_id}/modules/{mod_id}/lessons", json={
        "title": "Aula 01 - O Sol",
        "video_url": "https://storage.com/video1.mp4",
        "import_identifier": "01 - Introducao - Sol.mp4"
    }, headers=headers)
    assert res_lesson1.status_code == 201
    lesson1_data = res_lesson1.json()
    assert lesson1_data["import_identifier"] == "01 - Introducao - Sol.mp4"

    # 2. Cria aula sem import_identifier explícito (deve usar o título como fallback)
    res_lesson2 = client.post(f"/api/v1/courses/{c1_id}/modules/{mod_id}/lessons", json={
        "title": "Aula 02 - A Lua",
        "video_url": "https://storage.com/video2.mp4"
    }, headers=headers)
    assert res_lesson2.status_code == 201
    lesson2_data = res_lesson2.json()
    assert lesson2_data["import_identifier"] == "Aula 02 - A Lua"

    # 3. Atualiza aula 1 via PATCH com novo vídeo e novo import_identifier
    l1_id = lesson1_data["id"]
    res_patch = client.patch(f"/api/v1/courses/{c1_id}/modules/{mod_id}/lessons/{l1_id}", json={
        "video_url": "https://storage.com/video1_atualizado.mp4",
        "import_identifier": "01 - Introducao - Sol - HD.mp4"
    }, headers=headers)
    assert res_patch.status_code == 200
    patched_data = res_patch.json()
    assert patched_data["import_identifier"] == "01 - Introducao - Sol - HD.mp4"
    assert patched_data["video_url"] == "https://storage.com/video1_atualizado.mp4"


def test_generate_course_ai_description_not_found():
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res = client.post("/api/v1/courses/999999/generate-ai-description", headers=headers)
    assert res.status_code == 404


def test_generate_course_ai_description_no_modules(setup_courses_and_users):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    # Criar um curso sem módulos
    res_create = client.post("/api/v1/courses", json={
        "title": "Curso Sem Modulos Para IA",
        "description": "Vazio",
        "is_published": True
    }, headers=headers)
    assert res_create.status_code == 201
    course_id = res_create.json()["id"]

    res_ai = client.post(f"/api/v1/courses/{course_id}/generate-ai-description", headers=headers)
    assert res_ai.status_code == 400
    assert "pelo menos um módulo" in res_ai.json()["detail"]


@patch("app.services.ai_transcription_service.ai_transcription_service.generate_course_description", new_callable=AsyncMock)
def test_generate_course_ai_description_success(mock_generate, setup_courses_and_users):
    headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    c1_id = setup_courses_and_users["c1_id"]

    # Cria módulo no c1 se ainda não existir
    client.post(f"/api/v1/courses/{c1_id}/modules", json={
        "title": "Módulo de Exemplo para IA",
        "description": "Descrição do módulo",
        "order_index": 1
    }, headers=headers)

    mock_generate.return_value = "Descrição pedagógica completa gerada via IA mockada com sucesso."

    res = client.post(f"/api/v1/courses/{c1_id}/generate-ai-description", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["description"] == "Descrição pedagógica completa gerada via IA mockada com sucesso."
    mock_generate.assert_called_once()




