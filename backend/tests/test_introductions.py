import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.introduction import IntroductionPost, IntroductionComment, IntroductionLike
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def superadmin_token():
    db = SessionLocal()
    user = db.query(User).filter(User.role == "superadmin").first()
    db.close()
    if not user:
        pytest.skip("Superadmin não encontrado")
    return create_access_token(data={"sub": str(user.id), "role": user.role})


@pytest.fixture
def student_user():
    db = SessionLocal()
    user = db.query(User).filter(User.role == "aluno").first()
    if not user:
        user = User(
            name="Aluno Apresentação Teste",
            email="alunoapresentacao@teste.com",
            hashed_password="hashed_pwd",
            role="aluno",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    user_id = user.id
    user_role = user.role
    token = create_access_token(data={"sub": str(user_id), "role": user_role})
    db.close()
    return {"id": user_id, "token": token}


def test_list_introductions_requires_auth():
    res = client.get("/api/v1/introductions")
    assert res.status_code == 401


def test_create_and_get_introduction(student_user):
    headers = {"Authorization": f"Bearer {student_user['token']}"}
    payload = {
        "title": "Apresentação de Boas-Vindas",
        "content": "Olá a todos! Sou novo na comunidade e trabalho com automação e IA."
    }
    res = client.post("/api/v1/introductions", json=payload, headers=headers)
    assert res.status_code == 201
    post_data = res.json()
    assert post_data["title"] == "Apresentação de Boas-Vindas"
    assert post_data["user_id"] == student_user["id"]
    assert post_data["likes_count"] == 0
    assert post_data["comments_count"] == 0

    post_id = post_data["id"]

    # Busca detalhes do post
    get_res = client.get(f"/api/v1/introductions/{post_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == post_id
    assert get_res.json()["title"] == "Apresentação de Boas-Vindas"


def test_toggle_like_introduction(student_user):
    headers = {"Authorization": f"Bearer {student_user['token']}"}
    create_res = client.post(
        "/api/v1/introductions",
        json={"title": "Meu Post de Like", "content": "Testando curtidas na apresentação."},
        headers=headers
    )
    assert create_res.status_code == 201
    post_id = create_res.json()["id"]

    # 1. Dá like
    like_res = client.post(f"/api/v1/introductions/{post_id}/like", headers=headers)
    assert like_res.status_code == 200
    assert like_res.json()["liked"] is True
    assert like_res.json()["likes_count"] == 1

    # 2. Descurte (toggle)
    unlike_res = client.post(f"/api/v1/introductions/{post_id}/like", headers=headers)
    assert unlike_res.status_code == 200
    assert unlike_res.json()["liked"] is False
    assert unlike_res.json()["likes_count"] == 0


def test_add_and_delete_comment(student_user, superadmin_token):
    student_headers = {"Authorization": f"Bearer {student_user['token']}"}
    admin_headers = {"Authorization": f"Bearer {superadmin_token}"}

    create_res = client.post(
        "/api/v1/introductions",
        json={"title": "Post para Comentário", "content": "Apresentação para receber comentários."},
        headers=student_headers
    )
    post_id = create_res.json()["id"]

    # Admin comenta no post do aluno
    comment_res = client.post(
        f"/api/v1/introductions/{post_id}/comments",
        json={"content": "Seja muito bem-vindo à comunidade!"},
        headers=admin_headers
    )
    assert comment_res.status_code == 201
    comment_data = comment_res.json()
    assert comment_data["content"] == "Seja muito bem-vindo à comunidade!"
    comment_id = comment_data["id"]

    # Detalhe do post agora deve listar o comentário
    detail_res = client.get(f"/api/v1/introductions/{post_id}", headers=student_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["comments_count"] == 1
    assert len(detail_res.json()["comments"]) == 1

    # Deleta comentário
    del_res = client.delete(f"/api/v1/introductions/comments/{comment_id}", headers=admin_headers)
    assert del_res.status_code == 200

    # Verifica que comments_count foi decrementado
    detail_res2 = client.get(f"/api/v1/introductions/{post_id}", headers=student_headers)
    assert detail_res2.json()["comments_count"] == 0


def test_delete_introduction_authorization(student_user, superadmin_token):
    student_headers = {"Authorization": f"Bearer {student_user['token']}"}
    admin_headers = {"Authorization": f"Bearer {superadmin_token}"}

    create_res = client.post(
        "/api/v1/introductions",
        json={"title": "Post para Excluir", "content": "Conteúdo teste de deleção."},
        headers=student_headers
    )
    post_id = create_res.json()["id"]

    # Admin tem permissão para excluir qualquer post
    del_res = client.delete(f"/api/v1/introductions/{post_id}", headers=admin_headers)
    assert del_res.status_code == 200

    # Não existe mais
    get_res = client.get(f"/api/v1/introductions/{post_id}", headers=student_headers)
    assert get_res.status_code == 404
