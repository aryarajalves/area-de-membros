from tests.conftest import client, TestingSessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.course import Course, UserCourse


def _get_token(email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def _create_user_and_course():
    db = TestingSessionLocal()
    try:
        aluno_com_curso = User(
            email="aluno_curso@teste.com",
            name="Aluno Com Curso",
            hashed_password=get_password_hash("Senha123!"),
            role="aluno",
            is_active=True,
        )
        aluno_sem_curso = User(
            email="aluno_sem_curso@teste.com",
            name="Aluno Sem Curso",
            hashed_password=get_password_hash("Senha123!"),
            role="aluno",
            is_active=True,
        )
        course = Course(title="Curso Teste", description="Desc", is_published=True)
        db.add_all([aluno_com_curso, aluno_sem_curso, course])
        db.commit()
        db.refresh(aluno_com_curso)
        db.refresh(course)

        enrollment = UserCourse(user_id=aluno_com_curso.id, course_id=course.id)
        db.add(enrollment)
        db.commit()
    finally:
        db.close()


def test_freelance_permissions_and_crud():
    _create_user_and_course()

    token_sem_curso = _get_token("aluno_sem_curso@teste.com", "Senha123!")
    token_com_curso = _get_token("aluno_curso@teste.com", "Senha123!")
    token_superadmin = _get_token(settings.SUPERADMIN_EMAIL, settings.SUPERADMIN_PASSWORD)

    # 1. Aluno sem curso tem has_access=False e recebe 403 ao listar ou publicar
    access_sem = client.get(
        "/api/v1/freelance/access",
        headers={"Authorization": f"Bearer {token_sem_curso}"},
    )
    assert access_sem.status_code == 200
    assert access_sem.json()["has_access"] is False

    list_res = client.get(
        "/api/v1/freelance/jobs",
        headers={"Authorization": f"Bearer {token_sem_curso}"},
    )
    assert list_res.status_code == 403

    forbidden_res = client.post(
        "/api/v1/freelance/jobs",
        headers={"Authorization": f"Bearer {token_sem_curso}"},
        json={
            "title": "Preciso de Designer",
            "description": "Criar 10 criativos para campanha de tráfego pago.",
            "category": "Design",
            "budget_type": "fixed",
            "budget_value": "R$ 400,00",
        },
    )
    assert forbidden_res.status_code == 403

    # 2. Aluno com curso tem has_access=True, can_publish=True e consegue listar/publicar vaga
    access_com = client.get(
        "/api/v1/freelance/access",
        headers={"Authorization": f"Bearer {token_com_curso}"},
    )
    assert access_com.status_code == 200
    assert access_com.json()["has_access"] is True

    list_ok = client.get(
        "/api/v1/freelance/jobs",
        headers={"Authorization": f"Bearer {token_com_curso}"},
    )
    assert list_ok.status_code == 200
    assert list_ok.json()["can_publish"] is True

    create_res = client.post(
        "/api/v1/freelance/jobs",
        headers={"Authorization": f"Bearer {token_com_curso}"},
        json={
            "title": "Editor de Vídeo para Reels",
            "description": "Edição dinâmica de 15 vídeos curtos com legenda.",
            "category": "Edição de Vídeo",
            "budget_type": "fixed",
            "budget_value": "R$ 600,00",
            "deadline": "7 dias",
            "contact_whatsapp": "5585999999999",
        },
    )
    assert create_res.status_code == 201, create_res.text
    job = create_res.json()
    assert job["title"] == "Editor de Vídeo para Reels"
    assert job["status"] == "open"
    assert job["can_manage"] is True

    # 3. Outro aluno não pode editar nem excluir a vaga
    patch_forbidden = client.patch(
        f"/api/v1/freelance/jobs/{job['id']}",
        headers={"Authorization": f"Bearer {token_sem_curso}"},
        json={"status": "closed"},
    )
    assert patch_forbidden.status_code == 403

    del_forbidden = client.delete(
        f"/api/v1/freelance/jobs/{job['id']}",
        headers={"Authorization": f"Bearer {token_sem_curso}"},
    )
    assert del_forbidden.status_code == 403

    # 4. Autor pode encerrar e filtrar por status/categoria/busca
    patch_ok = client.patch(
        f"/api/v1/freelance/jobs/{job['id']}",
        headers={"Authorization": f"Bearer {token_com_curso}"},
        json={"status": "closed"},
    )
    assert patch_ok.status_code == 200
    assert patch_ok.json()["status"] == "closed"

    filtered = client.get(
        "/api/v1/freelance/jobs?status=closed&category=Edi%C3%A7%C3%A3o+de+V%C3%ADdeo&search=Reels",
        headers={"Authorization": f"Bearer {token_com_curso}"},
    )
    assert filtered.status_code == 200
    assert filtered.json()["total"] == 1

    # 5. Superadmin pode publicar e excluir vaga de qualquer aluno
    admin_create = client.post(
        "/api/v1/freelance/jobs",
        headers={"Authorization": f"Bearer {token_superadmin}"},
        json={
            "title": "Dev Fullstack React/Python",
            "description": "Ajuda pontual em integração de webhook e painel.",
            "category": "Programação",
            "budget_type": "negotiable",
        },
    )
    assert admin_create.status_code == 201

    del_ok = client.delete(
        f"/api/v1/freelance/jobs/{job['id']}",
        headers={"Authorization": f"Bearer {token_superadmin}"},
    )
    assert del_ok.status_code == 204

    # 6. WhiteLabel: desativar módulo de Vagas & Serviços bloqueia acesso até para quem tem curso
    disable_res = client.patch(
        "/api/v1/whitelabel",
        headers={"Authorization": f"Bearer {token_superadmin}"},
        json={"freelance_enabled": False},
    )
    assert disable_res.status_code == 200
    assert disable_res.json()["freelance_enabled"] is False

    access_disabled = client.get(
        "/api/v1/freelance/access",
        headers={"Authorization": f"Bearer {token_com_curso}"},
    )
    assert access_disabled.status_code == 200
    assert access_disabled.json()["has_access"] is False

    jobs_disabled = client.get(
        "/api/v1/freelance/jobs",
        headers={"Authorization": f"Bearer {token_com_curso}"},
    )
    assert jobs_disabled.status_code == 403

    # Reativar para não afetar outros testes
    enable_res = client.patch(
        "/api/v1/whitelabel",
        headers={"Authorization": f"Bearer {token_superadmin}"},
        json={"freelance_enabled": True},
    )
    assert enable_res.status_code == 200
    assert enable_res.json()["freelance_enabled"] is True
