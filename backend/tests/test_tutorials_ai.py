import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
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
def student_token():
    db = SessionLocal()
    user = db.query(User).filter(User.role == "aluno").first()
    if not user:
        user = User(
            name="Aluno Tutorial IA Test",
            email="alunotutorialia@teste.com",
            hashed_password="hashed_pwd",
            role="aluno",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    db.close()
    return token


def test_student_cannot_generate_ai_description(student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        "/api/v1/tutorials/generate-ai-description",
        data={"video_url": "https://exemplo.com/video.mp4"},
        headers=headers,
    )
    assert response.status_code == 403
    assert "Acesso restrito" in response.json()["detail"]


def test_generate_ai_description_missing_inputs(superadmin_token):
    headers = {"Authorization": f"Bearer {superadmin_token}"}
    response = client.post(
        "/api/v1/tutorials/generate-ai-description",
        data={},
        headers=headers,
    )
    assert response.status_code == 400
    assert "forneça um arquivo de vídeo ou a URL" in response.json()["detail"]


@patch("app.api.v1.endpoints.tutorials.get_openai_api_key", return_value="mock-key")
@patch("app.api.v1.endpoints.tutorials.ai_transcription_service.extract_audio_from_video", new_callable=AsyncMock)
@patch("app.api.v1.endpoints.tutorials._get_audio_duration_seconds", return_value=125.0)
@patch("app.api.v1.endpoints.tutorials.ai_transcription_service.transcribe_audio_whisper", new_callable=AsyncMock)
@patch("httpx.AsyncClient.post")
def test_generate_ai_description_success_with_file(
    mock_httpx_post,
    mock_transcribe,
    mock_duration,
    mock_extract,
    mock_key,
    superadmin_token
):
    # Mock do Whisper
    mock_transcribe.return_value = {
        "full_transcript": "Olá pessoal, neste tutorial vamos aprender como navegar na área de membros e acessar suas aulas.",
    }

    # Mock da resposta do GPT-4o-mini
    from unittest.mock import MagicMock
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": '{"generated_description": "Neste tutorial completo, você aprenderá:\\n- Como realizar login na plataforma;\\n- Como acessar seus cursos e progredir nas aulas;\\n- Dicas para tirar o máximo proveito da comunidade."}'
                }
            }
        ]
    }
    mock_httpx_post.return_value = mock_response

    headers = {"Authorization": f"Bearer {superadmin_token}"}
    dummy_file_bytes = b"FAKE_VIDEO_CONTENT"
    files = {"file": ("tutorial_teste.mp4", dummy_file_bytes, "video/mp4")}
    data = {"title": "Tutorial 01 - Boas Vindas"}

    response = client.post(
        "/api/v1/tutorials/generate-ai-description",
        files=files,
        data=data,
        headers=headers,
    )

    assert response.status_code == 200
    res_data = response.json()
    assert "description" in res_data
    assert "Neste tutorial completo" in res_data["description"]
    assert res_data["full_transcript"].startswith("Olá pessoal")
    assert res_data["duration"] == "02:05"
