import pytest
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, UserCourse
from app.models.testimonial import Testimonial
from tests.conftest import TestingSessionLocal, client


def get_headers(email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def setup_testimonial_data():
    db = TestingSessionLocal()

    # Cria aluno 1
    aluno1 = db.query(User).filter(User.email == "aluno_depo1@test.com").first()
    if not aluno1:
        aluno1 = User(
            email="aluno_depo1@test.com",
            name="Aluno Depoimento 1",
            role="aluno",
            hashed_password=get_password_hash("Pass123!"),
            is_active=True
        )
        db.add(aluno1)
        db.commit()
        db.refresh(aluno1)

    # Cria aluno 2 (sem acesso ao curso 1)
    aluno2 = db.query(User).filter(User.email == "aluno_depo2@test.com").first()
    if not aluno2:
        aluno2 = User(
            email="aluno_depo2@test.com",
            name="Aluno Depoimento 2",
            role="aluno",
            hashed_password=get_password_hash("Pass123!"),
            is_active=True
        )
        db.add(aluno2)
        db.commit()
        db.refresh(aluno2)

    # Cria Curso A
    c_a = db.query(Course).filter(Course.title == "Curso Depoimento Teste").first()
    if not c_a:
        c_a = Course(
            title="Curso Depoimento Teste",
            description="Curso para testar depoimentos",
            is_published=True
        )
        db.add(c_a)
        db.commit()
        db.refresh(c_a)

    # Vincula apenas aluno1 ao curso A
    uc = db.query(UserCourse).filter(UserCourse.user_id == aluno1.id, UserCourse.course_id == c_a.id).first()
    if not uc:
        uc = UserCourse(user_id=aluno1.id, course_id=c_a.id, access_duration="lifetime")
        db.add(uc)
        db.commit()

    c_id = c_a.id
    a1_id = aluno1.id
    a2_id = aluno2.id
    db.close()
    return {"course_id": c_id, "aluno1_id": a1_id, "aluno2_id": a2_id}


def test_student_cannot_submit_without_course_access(setup_testimonial_data):
    headers_aluno2 = get_headers("aluno_depo2@test.com", "Pass123!")
    c_id = setup_testimonial_data["course_id"]

    res = client.post("/api/v1/testimonials", json={
        "course_id": c_id,
        "rating": 5,
        "title": "Excelente",
        "content": "Gostei muito do conteúdo!"
    }, headers=headers_aluno2)

    assert res.status_code == 403
    assert "acesso liberado" in res.json()["detail"]


def test_student_submits_testimonial_and_admin_moderates(setup_testimonial_data):
    headers_aluno1 = get_headers("aluno_depo1@test.com", "Pass123!")
    headers_admin = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    c_id = setup_testimonial_data["course_id"]

    # 1. Aluno 1 envia depoimento
    res = client.post("/api/v1/testimonials", json={
        "course_id": c_id,
        "rating": 5,
        "title": "Curso Transformador",
        "content": "Mudou minha trajetória profissional completamente!"
    }, headers=headers_aluno1)

    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "pending"
    assert data["rating"] == 5
    assert data["title"] == "Curso Transformador"
    testimonial_id = data["id"]

    # 2. Aluno não pode enviar duplicado para o mesmo curso
    res_dup = client.post("/api/v1/testimonials", json={
        "course_id": c_id,
        "rating": 4,
        "title": "Outro título",
        "content": "Outro texto repetido"
    }, headers=headers_aluno1)
    assert res_dup.status_code == 400
    assert "já enviou um depoimento" in res_dup.json()["detail"]
    assert "1 depoimento por curso" in res_dup.json()["detail"]

    # 3. Aluno 2 listando depoimentos não deve ver o pendente do Aluno 1
    headers_aluno2 = get_headers("aluno_depo2@test.com", "Pass123!")
    res_list_aluno2 = client.get(f"/api/v1/testimonials?course_id={c_id}", headers=headers_aluno2)
    assert res_list_aluno2.status_code == 200
    assert not any(t["id"] == testimonial_id for t in res_list_aluno2.json())

    # 4. Aluno 1 listando depoimentos deve ver o seu próprio depoimento pendente
    res_list_aluno1 = client.get(f"/api/v1/testimonials?course_id={c_id}", headers=headers_aluno1)
    assert res_list_aluno1.status_code == 200
    assert any(t["id"] == testimonial_id for t in res_list_aluno1.json())

    # 5. Admin modera: aprova e destaca o depoimento
    res_approve = client.patch(f"/api/v1/testimonials/{testimonial_id}", json={
        "status": "approved",
        "is_featured": True
    }, headers=headers_admin)
    assert res_approve.status_code == 200
    assert res_approve.json()["status"] == "approved"
    assert res_approve.json()["is_featured"] is True

    # 6. Agora Aluno 2 consegue ver o depoimento aprovado
    res_list_aluno2_after = client.get(f"/api/v1/testimonials?course_id={c_id}", headers=headers_aluno2)
    assert res_list_aluno2_after.status_code == 200
    assert any(t["id"] == testimonial_id for t in res_list_aluno2_after.json())

    # 7. Obter estatísticas
    res_stats = client.get(f"/api/v1/testimonials/stats?course_id={c_id}", headers=headers_admin)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["approved"] >= 1
    assert stats["average_rating"] >= 4.0

    # 8. Aluno pode excluir seu próprio depoimento
    res_del = client.delete(f"/api/v1/testimonials/{testimonial_id}", headers=headers_aluno1)
    assert res_del.status_code == 204
