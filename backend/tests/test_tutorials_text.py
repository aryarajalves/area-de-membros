import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.tutorial import Tutorial
from app.core.security import get_password_hash, create_access_token
from tests.conftest import TestingSessionLocal
from app.services.gamification_level_service import calculate_student_level

client = TestClient(app)

def test_tutorial_text_support():
    db = TestingSessionLocal()
    try:
        admin = User(
            email="admin_tutorial@teste.com",
            name="Admin Tutorial",
            hashed_password=get_password_hash("AdminPass123!"),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        token = create_access_token(data={"sub": str(admin.id)})

        # 1. Cria tutorial em texto válido
        res_text = client.post(
            "/api/v1/tutorials",
            json={
                "title": "Guia de Boas-Vindas em Texto",
                "description": "Artigo completo de onboarding",
                "content_type": "text",
                "text_content": "# Bem-vindo!\n\nEste é um tutorial em **Markdown** com listas:\n- Item 1\n- Item 2",
                "duration": "3 min de leitura"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res_text.status_code == 201
        data_text = res_text.json()
        assert data_text["title"] == "Guia de Boas-Vindas em Texto"
        assert data_text["content_type"] == "text"
        assert "Markdown" in data_text["text_content"]
        assert data_text["video_url"] is None

        # 2. Cria tutorial em texto sem text_content -> 400
        res_empty_text = client.post(
            "/api/v1/tutorials",
            json={
                "title": "Tutorial Inválido",
                "content_type": "text",
                "text_content": "   "
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res_empty_text.status_code == 400
        assert "não pode ser vazio" in res_empty_text.json()["detail"]

        # 3. Cria tutorial em vídeo sem video_url -> 400
        res_empty_video = client.post(
            "/api/v1/tutorials",
            json={
                "title": "Vídeo sem link",
                "content_type": "video"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res_empty_video.status_code == 400
        assert "URL do vídeo é obrigatória" in res_empty_video.json()["detail"]

        # 4. Atualiza tutorial
        tut_id = data_text["id"]
        res_update = client.put(
            f"/api/v1/tutorials/{tut_id}",
            json={
                "title": "Guia Atualizado",
                "text_content": "## Novo conteúdo atualizado"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res_update.status_code == 200
        assert res_update.json()["title"] == "Guia Atualizado"
        assert res_update.json()["text_content"] == "## Novo conteúdo atualizado"
    finally:
        db.close()


def test_rebalanced_rpg_curve():
    # 0 pts -> Nível 1 (Bronze I)
    lvl0 = calculate_student_level(0)
    assert lvl0["level"] == 1
    assert lvl0["level_title"] == "Bronze I"

    # 120 pts (Mireille com 4 aulas) -> Agora é Nível 2 (Bronze II) em vez de Nível 4!
    lvl120 = calculate_student_level(120)
    assert lvl120["level"] == 2
    assert lvl120["level_title"] == "Bronze II"
    assert lvl120["level_tier"] == "Bronze"

    # 250 pts -> Nível 3 (Bronze III)
    lvl250 = calculate_student_level(250)
    assert lvl250["level"] == 3
    assert lvl250["level_title"] == "Bronze III"

    # 500 pts -> Nível 4 (Bronze IV)
    lvl500 = calculate_student_level(500)
    assert lvl500["level"] == 4
    assert lvl500["level_title"] == "Bronze IV"

    # 850 pts -> Nível 5 (Prata I)
    lvl850 = calculate_student_level(850)
    assert lvl850["level"] == 5
    assert lvl850["level_title"] == "Prata I"
    assert lvl850["level_tier"] == "Prata"
