"""
Testes estendidos para as novas funcionalidades da aba Apresente-se:
- Mídias (imagens, vídeos e embeds de YouTube/Loom)
- Redes sociais e links de contato
- Matchmaking de parcerias (seeking / offering)
- Filtros e busca por nicho/cidade
- Fixação no topo (pin/unpin) por administradores
- Upload de arquivos de mídia
"""
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.core.database import SessionLocal
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture
def test_users():
    """Cria ou recupera usuário aluno e usuário admin/superadmin para testes."""
    db = SessionLocal()
    admin = db.query(User).filter(User.role.in_(["superadmin", "admin"])).first()
    if not admin:
        admin = User(
            email="admin_intro_test@test.com",
            name="Admin Apresentações",
            hashed_password="fakehashedpwd",
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    student = db.query(User).filter(User.role == "aluno").first()
    if not student:
        student = User(
            email="student_intro_test@test.com",
            name="Aluno Apresentações",
            hashed_password="fakehashedpwd",
            role="aluno",
            is_active=True,
        )
        db.add(student)
        db.commit()
        db.refresh(student)

    admin_token = create_access_token(data={"sub": str(admin.id), "email": admin.email, "role": admin.role})
    student_token = create_access_token(data={"sub": str(student.id), "email": student.email, "role": student.role})

    user_info = {
        "admin_id": admin.id,
        "student_id": student.id,
        "admin_headers": {"Authorization": f"Bearer {admin_token}"},
        "student_headers": {"Authorization": f"Bearer {student_token}"},
    }
    db.close()
    return user_info


def test_create_introduction_with_media_and_social(test_users):
    headers = test_users["student_headers"]
    payload = {
        "title": "Apresentação com Mídia e Redes",
        "content": "Olá a todos! Sou especialista em Marketing Digital e estou animado para somar.",
        "media_type": "youtube",
        "video_embed_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "instagram": "@aluno.marketing",
        "linkedin": "https://linkedin.com/in/alunomarketing",
        "whatsapp": "+55 11 99999-8888",
        "website": "https://meuportforlio.com",
        "niche": "Marketing Digital",
        "location": "São Paulo - SP",
        "seeking": "Busco desenvolvedores para lançamentos conjuntos.",
        "offering": "Posso ajudar com estratégias de tráfego pago e copy.",
    }

    res = client.post("/api/v1/introductions", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == payload["title"]
    assert data["media_type"] == "youtube"
    assert "https://www.youtube.com/embed/dQw4w9WgXcQ" in data["video_embed_url"]
    assert data["instagram"] == "@aluno.marketing"
    assert data["whatsapp"] == "+55 11 99999-8888"
    assert data["niche"] == "Marketing Digital"
    assert data["location"] == "São Paulo - SP"
    assert data["seeking"] == payload["seeking"]
    assert data["offering"] == payload["offering"]
    assert data["is_pinned"] is False


def test_pin_and_unpin_introduction_by_admin(test_users):
    student_headers = test_users["student_headers"]
    admin_headers = test_users["admin_headers"]

    # Cria post
    create_res = client.post(
        "/api/v1/introductions",
        json={"title": "Post para Teste de Pin", "content": "Conteúdo de teste para fixação no topo."},
        headers=student_headers
    )
    assert create_res.status_code == 201
    post_id = create_res.json()["id"]

    # Aluno comum tenta fixar (deve ser negado 403)
    pin_fail = client.post(f"/api/v1/introductions/{post_id}/pin", headers=student_headers)
    assert pin_fail.status_code == 403

    # Admin fixa o post (200 OK)
    pin_ok = client.post(f"/api/v1/introductions/{post_id}/pin", headers=admin_headers)
    assert pin_ok.status_code == 200
    assert pin_ok.json()["is_pinned"] is True

    # Verifica se na listagem geral o post aparece com is_pinned=True
    list_res = client.get("/api/v1/introductions", headers=student_headers)
    posts = list_res.json()
    matched = [p for p in posts if p["id"] == post_id]
    assert len(matched) == 1
    assert matched[0]["is_pinned"] is True

    # Admin desafixa o post
    unpin_ok = client.post(f"/api/v1/introductions/{post_id}/pin", headers=admin_headers)
    assert unpin_ok.status_code == 200
    assert unpin_ok.json()["is_pinned"] is False


def test_filter_and_search_introductions(test_users):
    headers = test_users["student_headers"]

    # Cria post com nicho e cidade específicos
    client.post(
        "/api/v1/introductions",
        json={
            "title": "Apresentação Dev Python",
            "content": "Trabalho com backend FastAPI e Machine Learning.",
            "niche": "Desenvolvimento de Software",
            "location": "Curitiba - PR",
        },
        headers=headers
    )

    # Busca por nicho
    res_niche = client.get("/api/v1/introductions?niche=Software", headers=headers)
    assert res_niche.status_code == 200
    assert any("Dev Python" in p["title"] for p in res_niche.json())

    # Busca textual search
    res_search = client.get("/api/v1/introductions?search=Curitiba", headers=headers)
    assert res_search.status_code == 200
    assert any("Curitiba - PR" in (p["location"] or "") for p in res_search.json())


def test_upload_introduction_media(test_users):
    headers = test_users["student_headers"]
    fake_image_bytes = b"fake_jpeg_content_header_12345"
    files = {"file": ("minha_foto.jpg", io.BytesIO(fake_image_bytes), "image/jpeg")}

    res = client.post("/api/v1/introductions/upload-media", files=files, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "url" in data
    assert data["media_type"] == "image"
    assert data["filename"] == "minha_foto.jpg"
