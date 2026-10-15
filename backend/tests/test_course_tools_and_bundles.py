import pytest
from app.core.config import settings
from app.models.course import Course, CourseBundle, UserCourse
from app.models.user import User
from app.services.course_bundle_service import (
    sync_course_bundles,
    get_bundled_course_ids,
    grant_bundle_access_for_user
)
from tests.conftest import TestingSessionLocal, client


def get_admin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_course_bundle_service_sync_and_access():
    """Testa sincronização de pacotes e propagação de acesso automático aos alunos."""
    db = TestingSessionLocal()
    try:
        # 1. Cria dois cursos e uma ferramenta
        curso_master = Course(title="Curso Master Bundle", item_type="course", is_published=True)
        curso_bonus = Course(title="Curso Bônus Bundle", item_type="course", is_published=True)
        ferramenta_app = Course(title="ZapVoice Pro App", item_type="tool", tool_url="https://app.zapvoice.com", is_published=True)
        
        db.add_all([curso_master, curso_bonus, ferramenta_app])
        db.commit()
        db.refresh(curso_master)
        db.refresh(curso_bonus)
        db.refresh(ferramenta_app)

        # 2. Vincula curso_bonus e ferramenta_app ao curso_master
        sync_course_bundles(db, curso_master.id, [curso_bonus.id, ferramenta_app.id, curso_master.id])

        bundled_ids = get_bundled_course_ids(db, curso_master.id)
        assert curso_bonus.id in bundled_ids
        assert ferramenta_app.id in bundled_ids
        assert curso_master.id not in bundled_ids # auto-associação deve ser prevenida

        # 3. Cria um aluno
        aluno = User(email="aluno_bundle_test@test.com", name="Aluno Bundle", role="aluno", is_active=True, hashed_password="fake")
        db.add(aluno)
        db.commit()
        db.refresh(aluno)

        # 4. Concede acesso ao curso_master e propaga pacotes
        uc_master = UserCourse(user_id=aluno.id, course_id=curso_master.id, access_duration="lifetime")
        db.add(uc_master)
        db.commit()

        granted = grant_bundle_access_for_user(db, aluno.id, [curso_master.id])
        assert set(granted) == {curso_bonus.id, ferramenta_app.id}

        # 5. Verifica se os registros UserCourse foram criados para os itens do pacote
        user_courses = db.query(UserCourse).filter(UserCourse.user_id == aluno.id).all()
        user_course_ids = {uc.course_id for uc in user_courses}
        assert curso_master.id in user_course_ids
        assert curso_bonus.id in user_course_ids
        assert ferramenta_app.id in user_course_ids
    finally:
        db.close()


def test_api_create_tool_and_bundle():
    """Testa criação de ferramenta e curso com pacote via endpoints da API."""
    headers = get_admin_headers()

    # 1. Cria a ferramenta
    tool_payload = {
        "title": "Bússola Web App Test",
        "description": "Aplicativo web para métricas de funil",
        "item_type": "tool",
        "tool_url": "https://bussola.app.com",
        "is_published": True
    }
    res_tool = client.post("/api/v1/courses", json=tool_payload, headers=headers)
    assert res_tool.status_code == 201
    tool_data = res_tool.json()
    assert tool_data["item_type"] == "tool"
    assert tool_data["tool_url"] == "https://bussola.app.com"
    tool_id = tool_data["id"]

    # 2. Cria o curso principal vinculado à ferramenta
    course_payload = {
        "title": "Curso Bússola Bundle Test",
        "description": "Treinamento completo + Bússola Web App inclusa",
        "item_type": "course",
        "is_published": True,
        "bundled_course_ids": [tool_id]
    }
    res_course = client.post("/api/v1/courses", json=course_payload, headers=headers)
    assert res_course.status_code == 201
    course_data = res_course.json()
    assert course_data["item_type"] == "course"
    assert course_data["bundled_items_count"] == 1
    assert tool_id in course_data["bundled_course_ids"]

    # 3. Lista cursos e verifica campos retornados
    res_list = client.get("/api/v1/courses", headers=headers)
    assert res_list.status_code == 200
    courses_list = res_list.json()
    found_course = next((c for c in courses_list if c["id"] == course_data["id"]), None)
    assert found_course is not None
    assert found_course["bundled_items_count"] == 1
    assert len(found_course["bundled_courses"]) == 1
    assert found_course["bundled_courses"][0]["id"] == tool_id
    assert found_course["bundled_courses"][0]["item_type"] == "tool"


def test_api_update_course_bundle():
    """Testa atualização de pacote vinculando e desvinculando itens."""
    headers = get_admin_headers()

    # Cria dois cursos e uma ferramenta
    c1 = client.post("/api/v1/courses", json={"title": "Pacote A Test", "item_type": "course"}, headers=headers).json()
    c2 = client.post("/api/v1/courses", json={"title": "Item B Test", "item_type": "course"}, headers=headers).json()
    c3 = client.post("/api/v1/courses", json={"title": "Ferramenta C Test", "item_type": "tool", "tool_url": "https://c.test.com"}, headers=headers).json()

    # Atualiza c1 incluindo c2 e c3
    patch_res = client.patch(
        f"/api/v1/courses/{c1['id']}",
        json={"bundled_course_ids": [c2["id"], c3["id"]]},
        headers=headers
    )
    assert patch_res.status_code == 200
    updated_c1 = patch_res.json()
    assert updated_c1["bundled_items_count"] == 2
    assert set(updated_c1["bundled_course_ids"]) == {c2["id"], c3["id"]}

    # Remove c2 do pacote
    patch_res2 = client.patch(
        f"/api/v1/courses/{c1['id']}",
        json={"bundled_course_ids": [c3["id"]]},
        headers=headers
    )
    assert patch_res2.status_code == 200
    assert patch_res2.json()["bundled_items_count"] == 1
    assert patch_res2.json()["bundled_course_ids"] == [c3["id"]]


def test_student_lists_and_accesses_bundled_course_and_tool():
    """Valida que aluno com acesso ao curso pai tem has_access=True e acesso total à ferramenta/curso do combo."""
    db = TestingSessionLocal()
    from app.core.security import get_password_hash
    try:
        # 1. Cria Curso Pai e Ferramenta Filha
        parent_course = Course(title="Curso Pai Astrologia", item_type="course", is_published=True)
        bundled_tool = Course(title="Ferramenta Astrológica Web", item_type="tool", tool_url="https://tool.astro.com", is_published=True)
        db.add_all([parent_course, bundled_tool])
        db.commit()
        db.refresh(parent_course)
        db.refresh(bundled_tool)

        # 2. Vincula a ferramenta ao curso pai
        sync_course_bundles(db, parent_course.id, [bundled_tool.id])

        # 3. Cria aluno
        student = db.query(User).filter(User.email == "aluno_combo_heritage@test.com").first()
        if not student:
            student = User(
                email="aluno_combo_heritage@test.com",
                name="Aluno Combo Heritage",
                role="aluno",
                is_active=True,
                hashed_password=get_password_hash("StudentPass123!"),
            )
            db.add(student)
            db.commit()
            db.refresh(student)

        # 4. Concede acesso APENAS ao curso pai (como no caso real da compra)
        db.query(UserCourse).filter(UserCourse.user_id == student.id).delete()
        db.add(UserCourse(user_id=student.id, course_id=parent_course.id, access_duration="lifetime"))
        db.commit()

        # 5. Aluno lista os cursos via API
        login_res = client.post("/api/v1/auth/login", json={"email": "aluno_combo_heritage@test.com", "password": "StudentPass123!"})
        assert login_res.status_code == 200
        student_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

        res = client.get("/api/v1/courses", headers=student_headers)
        assert res.status_code == 200
        courses = res.json()

        parent_found = next(c for c in courses if c["id"] == parent_course.id)
        tool_found = next(c for c in courses if c["id"] == bundled_tool.id)

        assert parent_found["has_access"] is True
        # A ferramenta DEVE ter acesso liberado pois faz parte do pacote adquirido!
        assert tool_found["has_access"] is True

        # 6. Aluno acessa diretamente os detalhes da ferramenta/curso filho
        get_res = client.get(f"/api/v1/courses/{bundled_tool.id}", headers=student_headers)
        assert get_res.status_code == 200
    finally:
        db.close()

