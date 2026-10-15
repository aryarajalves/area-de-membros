import pytest
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, CourseSalesClick
from tests.conftest import TestingSessionLocal, client


def get_headers(email: str, password: str = "TestPass123!"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sales_clicks_setup():
    db = TestingSessionLocal()
    try:
        # 1. Aluno 1
        student = db.query(User).filter(User.email == "student_clicks@test.com").first()
        if not student:
            student = User(
                email="student_clicks@test.com",
                name="Aluno Clicador",
                role="aluno",
                hashed_password=get_password_hash("TestPass123!"),
                is_active=True,
            )
            db.add(student)
            db.commit()
            db.refresh(student)

        # 2. Aluno 2
        student2 = db.query(User).filter(User.email == "student2_clicks@test.com").first()
        if not student2:
            student2 = User(
                email="student2_clicks@test.com",
                name="Mariana Aluna",
                role="aluno",
                hashed_password=get_password_hash("TestPass123!"),
                is_active=True,
            )
            db.add(student2)
            db.commit()
            db.refresh(student2)

        # 3. Administrador
        admin = db.query(User).filter(User.email == "admin_clicks@test.com").first()
        if not admin:
            admin = User(
                email="admin_clicks@test.com",
                name="Admin Gestor",
                role="admin",
                hashed_password=get_password_hash("TestPass123!"),
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # 4. Curso de Teste
        course = db.query(Course).filter(Course.title == "Curso Astrologia Avançada").first()
        if not course:
            course = Course(
                title="Curso Astrologia Avançada",
                description="Aprenda astrologia avançada",
                sales_page_url="https://vendas.exemplo.com/astrologia",
                is_published=True,
            )
            db.add(course)
            db.commit()
            db.refresh(course)

        # Limpar cliques prévios desse curso
        db.query(CourseSalesClick).filter(CourseSalesClick.course_id == course.id).delete()
        db.commit()

        data = {
            "student_id": student.id,
            "student_email": student.email,
            "student2_id": student2.id,
            "student2_email": student2.email,
            "admin_id": admin.id,
            "admin_email": admin.email,
            "course_id": course.id,
            "course_title": course.title,
        }
        return data
    finally:
        db.close()


def test_record_sales_click_authenticated_student(sales_clicks_setup):
    course_id = sales_clicks_setup["course_id"]
    student_id = sales_clicks_setup["student_id"]
    headers = get_headers(sales_clicks_setup["student_email"])

    res = client.post(f"/api/v1/courses/{course_id}/sales-click", headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "success"
    assert data["course_id"] == course_id
    assert data["user_id"] == student_id
    assert "id" in data

    # Valida no banco de dados
    db = TestingSessionLocal()
    try:
        click = db.query(CourseSalesClick).filter(CourseSalesClick.id == data["id"]).first()
        assert click is not None
        assert click.course_id == course_id
        assert click.user_id == student_id
        assert click.created_at is not None
    finally:
        db.close()


def test_record_sales_click_unauthenticated(sales_clicks_setup):
    course_id = sales_clicks_setup["course_id"]
    res = client.post(f"/api/v1/courses/{course_id}/sales-click")
    assert res.status_code == 401


def test_record_sales_click_course_not_found(sales_clicks_setup):
    headers = get_headers(sales_clicks_setup["student_email"])
    res = client.post("/api/v1/courses/999999/sales-click", headers=headers)
    assert res.status_code == 404
    assert "Curso não encontrado" in res.json()["detail"]


def test_get_course_sales_clicks_as_admin(sales_clicks_setup):
    course_id = sales_clicks_setup["course_id"]
    course_title = sales_clicks_setup["course_title"]

    # Simular cliques dos alunos
    client.post(f"/api/v1/courses/{course_id}/sales-click", headers=get_headers(sales_clicks_setup["student_email"]))
    client.post(f"/api/v1/courses/{course_id}/sales-click", headers=get_headers(sales_clicks_setup["student2_email"]))

    # Consulta como admin
    admin_headers = get_headers(sales_clicks_setup["admin_email"])
    res = client.get(f"/api/v1/courses/{course_id}/sales-clicks", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["course_id"] == course_id
    assert data["course_title"] == course_title
    assert data["total_clicks"] >= 2
    assert len(data["clicks"]) >= 2

    # Verifica os campos do usuário no histórico
    first_click = data["clicks"][0]
    assert "id" in first_click
    assert "created_at" in first_click
    assert "user" in first_click
    assert first_click["user"]["name"] is not None
    assert first_click["user"]["email"] is not None
    assert first_click["user"]["role"] in ["aluno", "admin", "superadmin"]


def test_get_course_sales_clicks_forbidden_for_student(sales_clicks_setup):
    course_id = sales_clicks_setup["course_id"]
    student_headers = get_headers(sales_clicks_setup["student_email"])

    res = client.get(f"/api/v1/courses/{course_id}/sales-clicks", headers=student_headers)
    assert res.status_code == 403
