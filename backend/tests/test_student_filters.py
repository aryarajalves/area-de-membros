from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.course import Course, Module, Lesson, UserCourse, LessonProgress
from app.core.security import get_password_hash
from app.core.config import settings
from tests.conftest import TestingSessionLocal

client = TestClient(app)

def get_superadmin_headers():
    res = client.post("/api/v1/auth/login", json={
        "email": settings.SUPERADMIN_EMAIL,
        "password": settings.SUPERADMIN_PASSWORD
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}

def test_student_filters_and_ordering():
    db = TestingSessionLocal()
    headers = get_superadmin_headers()

    # Cria 2 cursos
    c1 = Course(title="Curso Alpha de Astrologia", description="Desc Alpha")
    c2 = Course(title="Curso Beta de Finanças", description="Desc Beta")
    db.add_all([c1, c2])
    db.commit()
    db.refresh(c1)
    db.refresh(c2)

    # Cria módulo e lições para c1
    m1 = Module(course_id=c1.id, title="Módulo 1", order_index=1)
    db.add(m1)
    db.commit()
    db.refresh(m1)

    l1 = Lesson(module_id=m1.id, title="Aula 1", duration="10 min", order_index=1)
    l2 = Lesson(module_id=m1.id, title="Aula 2", duration="15 min", order_index=2)
    db.add_all([l1, l2])
    db.commit()
    db.refresh(l1)
    db.refresh(l2)

    # Cria 3 alunos com perfis diferentes:
    # Aluno A: Nome "Ziraldo", 100% de progresso, expira em 50 dias
    # Aluno B: Nome "Ana", 0% de progresso, expira em 3 dias (prestes a expirar)
    # Aluno C: Nome "Carlos", 50% de progresso, Vitalício (sem expiração), cadastrado no mês 2026-09
    now = datetime.now(timezone.utc)

    # Aluno A (Ziraldo) - Outubro de 2026
    u_a = User(
        name="Ziraldo Aluno",
        email="ziraldo@teste.com",
        role="aluno",
        hashed_password=get_password_hash("Senha@123456"),
        is_active=True,
        created_at=datetime(2026, 10, 1, 12, 0, 0, tzinfo=timezone.utc)
    )
    # Aluno B (Ana) - Outubro de 2026
    u_b = User(
        name="Ana Aluna",
        email="ana@teste.com",
        role="aluno",
        hashed_password=get_password_hash("Senha@123456"),
        is_active=True,
        created_at=datetime(2026, 10, 1, 10, 0, 0, tzinfo=timezone.utc)
    )
    # Aluno C (Carlos) - data retroativa em setembro/2026
    u_c = User(
        name="Carlos Aluno",
        email="carlos@teste.com",
        role="aluno",
        hashed_password=get_password_hash("Senha@123456"),
        is_active=True,
        created_at=datetime(2026, 9, 15, 14, 0, 0, tzinfo=timezone.utc)
    )
    db.add_all([u_a, u_b, u_c])
    db.commit()
    db.refresh(u_a)
    db.refresh(u_b)
    db.refresh(u_c)

    # Matrículas
    # Ziraldo no c1 (expira em 50 dias)
    uc_a = UserCourse(
        user_id=u_a.id,
        course_id=c1.id,
        access_duration="6_months",
        expires_at=now + timedelta(days=50)
    )
    # Ana no c1 (expira em 3 dias - renovação urgente!)
    uc_b = UserCourse(
        user_id=u_b.id,
        course_id=c1.id,
        access_duration="1_month",
        expires_at=now + timedelta(days=3)
    )
    # Carlos apenas no c2 (vitalício)
    uc_c = UserCourse(
        user_id=u_c.id,
        course_id=c2.id,
        access_duration="lifetime",
        expires_at=None
    )
    db.add_all([uc_a, uc_b, uc_c])
    db.commit()

    # Progresso das aulas:
    # Ziraldo concluiu Aula 1 e Aula 2 (100%)
    p1 = LessonProgress(user_id=u_a.id, lesson_id=l1.id, is_completed=True)
    p2 = LessonProgress(user_id=u_a.id, lesson_id=l2.id, is_completed=True)
    db.add_all([p1, p2])
    db.commit()
    c2_id = c2.id
    db.close()

    # 1. Teste Ordenação Alfabética (A-Z)
    res_name = client.get("/api/v1/students?order_by=name_asc", headers=headers)
    assert res_name.status_code == 200
    names = [st["name"] for st in res_name.json()["items"] if st["email"] in ["ziraldo@teste.com", "ana@teste.com", "carlos@teste.com"]]
    assert names == ["Ana Aluna", "Carlos Aluno", "Ziraldo Aluno"]

    # 2. Teste Ordenação por Mais Perto de Terminar o Curso (progress_desc)
    res_progress = client.get("/api/v1/students?order_by=progress_desc", headers=headers)
    assert res_progress.status_code == 200
    progress_items = [st for st in res_progress.json()["items"] if st["email"] in ["ziraldo@teste.com", "ana@teste.com", "carlos@teste.com"]]
    # Ziraldo tem 100% no topo
    assert progress_items[0]["name"] == "Ziraldo Aluno"
    assert progress_items[0]["overall_progress_percent"] == 100

    # 3. Teste Ordenação por Quase Precisando Renovar (renewal_asc)
    res_renewal = client.get("/api/v1/students?order_by=renewal_asc", headers=headers)
    assert res_renewal.status_code == 200
    renewal_items = [st for st in res_renewal.json()["items"] if st["email"] in ["ziraldo@teste.com", "ana@teste.com", "carlos@teste.com"]]
    # Ana expira em 3 dias, então deve vir antes de Ziraldo (50 dias) e Carlos (vitalício)
    assert renewal_items[0]["name"] == "Ana Aluna"
    assert renewal_items[1]["name"] == "Ziraldo Aluno"
    assert renewal_items[2]["name"] == "Carlos Aluno"

    # 4. Teste Filtro por Curso (somente c2)
    res_course = client.get(f"/api/v1/students?course_id={c2_id}", headers=headers)
    assert res_course.status_code == 200
    course_items = [st for st in res_course.json()["items"] if st["email"] in ["ziraldo@teste.com", "ana@teste.com", "carlos@teste.com"]]
    assert len(course_items) == 1
    assert course_items[0]["name"] == "Carlos Aluno"

    # 5. Teste Filtro por Mês (setembro/2026: 2026-09)
    res_month = client.get("/api/v1/students?registration_month=2026-09", headers=headers)
    assert res_month.status_code == 200
    month_items = [st for st in res_month.json()["items"] if st["email"] in ["ziraldo@teste.com", "ana@teste.com", "carlos@teste.com"]]
    assert len(month_items) == 1
    assert month_items[0]["name"] == "Carlos Aluno"

    # 6. Teste Filtro por Data Específica (2026-09-15)
    res_date = client.get("/api/v1/students?registration_date=2026-09-15", headers=headers)
    assert res_date.status_code == 200
    date_items = [st for st in res_date.json()["items"] if st["email"] in ["ziraldo@teste.com", "ana@teste.com", "carlos@teste.com"]]
    assert len(date_items) == 1
    assert date_items[0]["name"] == "Carlos Aluno"
