import pytest
from datetime import datetime, timezone
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
def seed_support_data():
    db = TestingSessionLocal()
    aluno1 = User(
        email="aluno1@test.com",
        name="Aluno Um",
        hashed_password=get_password_hash("pass123"),
        role="aluno",
        is_active=True,
    )
    aluno2 = User(
        email="aluno2@test.com",
        name="Aluno Dois",
        hashed_password=get_password_hash("pass123"),
        role="aluno",
        is_active=True,
    )
    db.add_all([aluno1, aluno2])

    curso_liberado = Course(title="Curso React", description="Aprenda React", is_published=True)
    curso_bloqueado = Course(title="Curso Python", description="Aprenda Python", is_published=True)
    db.add_all([curso_liberado, curso_bloqueado])
    db.commit()

    uc = UserCourse(user_id=aluno1.id, course_id=curso_liberado.id)
    db.add(uc)
    db.commit()
    db.close()

def test_my_courses_filters_by_enrollment(seed_support_data):
    aluno_headers = get_headers("aluno1@test.com", "pass123")
    res = client.get("/api/v1/support/my-courses", headers=aluno_headers)
    assert res.status_code == 200
    courses = res.json()
    assert len(courses) == 1
    assert courses[0]["title"] == "Curso React"

    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)
    res_admin = client.get("/api/v1/support/my-courses", headers=admin_headers)
    assert res_admin.status_code == 200
    assert len(res_admin.json()) == 2

def test_student_cannot_post_topic_for_unauthorized_course(seed_support_data):
    aluno_headers = get_headers("aluno1@test.com", "pass123")
    db = TestingSessionLocal()
    curso_bloqueado = db.query(Course).filter(Course.title == "Curso Python").first()
    db.close()

    payload = {
        "title": "Dúvida sobre Python",
        "content": "Como fazer um for loop em Python?",
        "course_id": curso_bloqueado.id,
    }
    res = client.post("/api/v1/support/topics", headers=aluno_headers, json=payload)
    assert res.status_code == 403
    assert "Você não possui acesso liberado a este curso" in res.json()["detail"]

def test_student_can_post_topic_for_authorized_course(seed_support_data):
    aluno_headers = get_headers("aluno1@test.com", "pass123")
    db = TestingSessionLocal()
    curso_liberado = db.query(Course).filter(Course.title == "Curso React").first()
    db.close()

    payload = {
        "title": "Dúvida de Hooks",
        "content": "Quando devo usar useEffect vs useLayoutEffect?",
        "course_id": curso_liberado.id,
        "image_url": "https://fake.url/img.png",
    }
    res = client.post("/api/v1/support/topics", headers=aluno_headers, json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Dúvida de Hooks"
    assert data["course"]["title"] == "Curso React"
    assert data["author"]["name"] == "Aluno Um"
    assert data["image_url"] == "https://fake.url/img.png"

def test_list_and_search_topics(seed_support_data):
    aluno_headers = get_headers("aluno1@test.com", "pass123")
    db = TestingSessionLocal()
    curso_liberado = db.query(Course).filter(Course.title == "Curso React").first()
    db.close()

    client.post("/api/v1/support/topics", headers=aluno_headers, json={
        "title": "Configuração do Vite",
        "content": "Erro ao subir porta 3000 no Vite",
        "course_id": curso_liberado.id,
    })
    client.post("/api/v1/support/topics", headers=aluno_headers, json={
        "title": "Dúvida sobre Redux Toolkit",
        "content": "Qual a diferença entre Redux e Context API?",
        "course_id": curso_liberado.id,
    })

    # Busca textual
    res = client.get("/api/v1/support/topics?search=Vite", headers=aluno_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Configuração do Vite"

    # Filtro por curso
    res_course = client.get(f"/api/v1/support/topics?course_id={curso_liberado.id}", headers=aluno_headers)
    assert res_course.status_code == 200
    assert len(res_course.json()["items"]) == 2

def test_replies_and_instructor_badge(seed_support_data):
    aluno1_headers = get_headers("aluno1@test.com", "pass123")
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    db = TestingSessionLocal()
    curso = db.query(Course).filter(Course.title == "Curso React").first()
    db.close()

    # Cria tópico
    top_res = client.post("/api/v1/support/topics", headers=aluno1_headers, json={
        "title": "Erro no deploy",
        "content": "Como fazer o build correto?",
        "course_id": curso.id,
    })
    topic_id = top_res.json()["id"]

    # Aluno responde
    res_aluno = client.post(f"/api/v1/support/topics/{topic_id}/replies", headers=aluno1_headers, json={
        "content": "Eu tive isso também e resolvi rodando npm run build.",
    })
    assert res_aluno.status_code == 201
    assert res_aluno.json()["is_instructor_reply"] is False

    # Superadmin responde -> is_instructor_reply = True
    res_admin = client.post(f"/api/v1/support/topics/{topic_id}/replies", headers=admin_headers, json={
        "content": "Exato! E lembre-se de configurar o Nginx para redirecionar para index.html.",
    })
    assert res_admin.status_code == 201
    assert res_admin.json()["is_instructor_reply"] is True

    # Detalhe do tópico
    detail_res = client.get(f"/api/v1/support/topics/{topic_id}", headers=aluno1_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["replies"]) == 2
    assert detail["last_reply_user_name"] == settings.SUPERADMIN_NAME

def test_toggle_like(seed_support_data):
    aluno1_headers = get_headers("aluno1@test.com", "pass123")
    db = TestingSessionLocal()
    curso = db.query(Course).filter(Course.title == "Curso React").first()
    db.close()

    top_res = client.post("/api/v1/support/topics", headers=aluno1_headers, json={
        "title": "Dúvida de performance",
        "content": "useMemo vale a pena em tudo?",
        "course_id": curso.id,
    })
    topic_id = top_res.json()["id"]

    # Primeiro like (curtir)
    res_like = client.post(f"/api/v1/support/topics/{topic_id}/like", headers=aluno1_headers)
    assert res_like.status_code == 200
    assert res_like.json()["liked"] is True
    assert res_like.json()["likes_count"] == 1

    # Segundo like (descurtir)
    res_unlike = client.post(f"/api/v1/support/topics/{topic_id}/like", headers=aluno1_headers)
    assert res_unlike.status_code == 200
    assert res_unlike.json()["liked"] is False
    assert res_unlike.json()["likes_count"] == 0

def test_delete_permissions(seed_support_data):
    aluno1_headers = get_headers("aluno1@test.com", "pass123")
    aluno2_headers = get_headers("aluno2@test.com", "pass123")
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    db = TestingSessionLocal()
    curso = db.query(Course).filter(Course.title == "Curso React").first()
    db.close()

    top_res = client.post("/api/v1/support/topics", headers=aluno1_headers, json={
        "title": "Tópico a ser excluído",
        "content": "Conteúdo...",
        "course_id": curso.id,
    })
    topic_id = top_res.json()["id"]

    # Aluno 2 tenta excluir -> 403
    res_del_aluno2 = client.delete(f"/api/v1/support/topics/{topic_id}", headers=aluno2_headers)
    assert res_del_aluno2.status_code == 403

    # Admin exclui -> 200
    res_del_admin = client.delete(f"/api/v1/support/topics/{topic_id}", headers=admin_headers)
    assert res_del_admin.status_code == 200

def test_support_stats_and_solution(seed_support_data):
    aluno1_headers = get_headers("aluno1@test.com", "pass123")
    admin_headers = get_headers(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    db = TestingSessionLocal()
    curso = db.query(Course).filter(Course.title == "Curso React").first()
    db.close()

    # Cria dúvida
    top_res = client.post("/api/v1/support/topics", headers=aluno1_headers, json={
        "title": "Dúvida sobre Solução",
        "content": "Como marcar resposta como solução?",
        "course_id": curso.id,
    })
    topic_id = top_res.json()["id"]

    # Cria resposta pelo admin
    reply_res = client.post(f"/api/v1/support/topics/{topic_id}/replies", headers=admin_headers, json={
        "content": "Basta clicar em marcar como solução oficial!"
    })
    reply_id = reply_res.json()["id"]

    # Aluno marca a resposta como Solução Oficial
    sol_res = client.patch(f"/api/v1/support/replies/{reply_id}/solution", headers=aluno1_headers)
    assert sol_res.status_code == 200
    assert sol_res.json()["is_solution"] is True
    assert sol_res.json()["topic_status"] == "resolved"

    # Altera status manualmente
    st_res = client.patch(f"/api/v1/support/topics/{topic_id}/status", headers=aluno1_headers, json={"status": "open"})
    assert st_res.status_code == 200
    assert st_res.json()["status"] == "open"

    # Testa /api/v1/support/stats
    stats_res = client.get("/api/v1/support/stats", headers=aluno1_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_topics" in stats
    assert "unanswered_count" in stats
    assert "resolved_count" in stats
    assert "resolution_rate_pct" in stats

