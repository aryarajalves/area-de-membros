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


def test_multiple_reactions_linkedin_style(student_user):
    headers = {"Authorization": f"Bearer {student_user['token']}"}
    create_res = client.post(
        "/api/v1/introductions",
        json={"title": "Post Reações LinkedIn", "content": "Testando reações de amor, parabéns e foguete."},
        headers=headers
    )
    assert create_res.status_code == 201
    post_id = create_res.json()["id"]

    # 1. Reage com 'love'
    res1 = client.post(f"/api/v1/introductions/{post_id}/like", json={"reaction_type": "love"}, headers=headers)
    assert res1.status_code == 200
    assert res1.json()["liked"] is True
    assert res1.json()["reaction_type"] == "love"
    assert res1.json()["likes_count"] == 1

    # 2. Troca de reação para 'celebrate' (mantém likes_count = 1)
    res2 = client.post(f"/api/v1/introductions/{post_id}/like", json={"reaction_type": "celebrate"}, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["liked"] is True
    assert res2.json()["reaction_type"] == "celebrate"
    assert res2.json()["likes_count"] == 1

    # 3. Consulta post e verifica my_reaction e reactions_summary
    detail = client.get(f"/api/v1/introductions/{post_id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["is_liked_by_me"] is True
    assert detail.json()["my_reaction"] == "celebrate"
    assert "celebrate" in detail.json()["reactions_summary"]

    # 4. Remove a reação clicando no mesmo 'celebrate'
    res3 = client.post(f"/api/v1/introductions/{post_id}/like", json={"reaction_type": "celebrate"}, headers=headers)
    assert res3.status_code == 200
    assert res3.json()["liked"] is False
    assert res3.json()["reaction_type"] is None
    assert res3.json()["likes_count"] == 0


def test_update_introduction_post_and_permissions(student_user):
    db = SessionLocal()
    other_user = db.query(User).filter(User.email == "outro_user_edit@teste.com").first()
    if not other_user:
        other_user = User(
            email="outro_user_edit@teste.com",
            name="Outro Usuário",
            hashed_password="hashed_password",
            role="aluno",
            is_active=True
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)
    other_token = create_access_token(data={"sub": str(other_user.id), "role": other_user.role})
    db.close()

    author_headers = {"Authorization": f"Bearer {student_user['token']}"}
    other_headers = {"Authorization": f"Bearer {other_token}"}

    create_res = client.post(
        "/api/v1/introductions",
        json={
            "title": "Título Original",
            "content": "Conteúdo original da apresentação.",
            "niche": "Design",
            "location": "São Paulo - SP",
        },
        headers=author_headers,
    )
    assert create_res.status_code == 201
    post_id = create_res.json()["id"]

    # Outro aluno não pode editar
    forbidden_res = client.put(
        f"/api/v1/introductions/{post_id}",
        json={"title": "Tentativa Inválida"},
        headers=other_headers,
    )
    assert forbidden_res.status_code == 403

    # Autor edita com sucesso
    update_res = client.put(
        f"/api/v1/introductions/{post_id}",
        json={
            "title": "Título Atualizado",
            "content": "Novo texto atualizado com sucesso.",
            "niche": "Psicologia Clínica",
            "location": "Curitiba - PR",
            "instagram": "@autor.editado",
        },
        headers=author_headers,
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["title"] == "Título Atualizado"
    assert updated["content"] == "Novo texto atualizado com sucesso."
    assert updated["niche"] == "Psicologia Clínica"
    assert updated["location"] == "Curitiba - PR"
    assert updated["instagram"] == "@autor.editado"

    # Limpa o post de teste
    client.delete(f"/api/v1/introductions/{post_id}", headers=author_headers)


def test_toggle_example_introduction_and_permissions(superadmin_token, student_user):
    student_headers = {"Authorization": f"Bearer {student_user['token']}"}
    admin_headers = {"Authorization": f"Bearer {superadmin_token}"}

    create_res = client.post(
        "/api/v1/introductions",
        json={
            "title": "Apresentação da Luana",
            "content": "Texto exemplo para os alunos seguirem.",
            "niche": "Astrologia",
        },
        headers=student_headers,
    )
    assert create_res.status_code == 201
    post_id = create_res.json()["id"]
    assert create_res.json()["is_example"] is False

    # Aluno normal não pode marcar como exemplo
    forbidden = client.post(f"/api/v1/introductions/{post_id}/example", headers=student_headers)
    assert forbidden.status_code == 403

    # Superadmin marca como exemplo e fixa automaticamente no topo
    res_on = client.post(f"/api/v1/introductions/{post_id}/example", headers=admin_headers)
    assert res_on.status_code == 200
    assert res_on.json()["is_example"] is True
    assert res_on.json()["is_pinned"] is True

    # Superadmin desmarca exemplo
    res_off = client.post(f"/api/v1/introductions/{post_id}/example", headers=admin_headers)
    assert res_off.status_code == 200
    assert res_off.json()["is_example"] is False

    client.delete(f"/api/v1/introductions/{post_id}", headers=admin_headers)
