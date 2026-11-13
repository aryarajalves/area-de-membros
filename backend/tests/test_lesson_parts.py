import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.models.course import Course, Module, Lesson, LessonVideo, LessonTranscription
from app.services.ai_multipart_transcription_service import (
    process_multipart_lesson_transcription,
    translate_lesson_transcription,
)
from tests.conftest import TestingSessionLocal


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_lesson_multiple_parts_model(db):
    course = Course(title="Curso de Teste Partes", description="Desc")
    db.add(course)
    db.commit()
    db.refresh(course)

    module = Module(course_id=course.id, title="Módulo 1", order_index=1)
    db.add(module)
    db.commit()
    db.refresh(module)

    lesson = Lesson(
        module_id=module.id,
        title="Aula do Sol",
        description="Aula completa dividida em 3 partes",
        video_url="https://b2.com/parte1.mp4",
        video_type="upload",
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    part1 = LessonVideo(
        lesson_id=lesson.id, order_index=0, duration="15:30",
        language="pt", language_label="Português", title="Parte 1 - Visão Geral",
        video_url="https://b2.com/parte1.mp4", video_type="upload",
    )
    part2 = LessonVideo(
        lesson_id=lesson.id, order_index=1, duration="22:15",
        language="pt", language_label="Português", title="Parte 2 - Prática",
        video_url="https://b2.com/parte2.mp4", video_type="upload",
    )
    part3 = LessonVideo(
        lesson_id=lesson.id, order_index=2, duration="18:45",
        language="pt", language_label="Português", title="Parte 3 - Conclusão",
        video_url="https://b2.com/parte3.mp4", video_type="upload",
    )
    db.add_all([part1, part2, part3])
    db.commit()

    queried_lesson = db.query(Lesson).filter(Lesson.id == lesson.id).first()
    assert queried_lesson is not None
    assert len(queried_lesson.videos) == 3
    assert queried_lesson.videos[0].order_index == 0
    assert queried_lesson.videos[1].order_index == 1
    assert queried_lesson.videos[2].order_index == 2


@pytest.mark.asyncio
async def test_incremental_transcription_skips_already_transcribed_part(db):
    course = Course(title="Curso Cache Transcrição", description="Desc")
    db.add(course)
    db.commit()
    db.refresh(course)

    module = Module(course_id=course.id, title="Módulo Cache", order_index=1)
    db.add(module)
    db.commit()
    db.refresh(module)

    lesson = Lesson(module_id=module.id, title="Aula Sol Cache", video_url="https://b2.com/p1.mp4")
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    # Parte 1 JÁ TRANSCRITA com cache válido
    p1 = LessonVideo(
        lesson_id=lesson.id, order_index=0, language="pt", language_label="Português",
        title="Parte 1", video_url="https://b2.com/p1.mp4",
        transcript_text="Texto da Parte 1 ja salvo em cache.",
        transcribed_video_url="https://b2.com/p1.mp4",
    )
    # Parte 2 NOVA (sem cache)
    p2 = LessonVideo(
        lesson_id=lesson.id, order_index=1, language="pt", language_label="Português",
        title="Parte 2", video_url="https://b2.com/p2.mp4",
    )
    db.add_all([p1, p2])
    db.commit()

    mock_single = AsyncMock(return_value={
        "text": "Texto recem transcrito da Parte 2.",
        "segments": [],
        "duration_seconds": 120.0,
    })
    mock_summary = AsyncMock(return_value={
        "summary_html": "<p>Resumo Completo</p>",
        "summary_markdown": "Resumo Completo",
        "key_takeaways": ["Ponto 1"],
        "chapters": [],
        "prompt_tokens": 100,
        "completion_tokens": 50,
    })

    with patch("app.services.ai_multipart_transcription_service.transcribe_single_video_part", mock_single), \
         patch("app.services.ai_multipart_transcription_service.ai_transcription_service.generate_summary_and_html", mock_summary):
        trans = await process_multipart_lesson_transcription(db=db, lesson_id=lesson.id)

    # Deve ter chamado o Whisper APENAS 1 vez (para a Parte 2)!
    assert mock_single.call_count == 1
    assert mock_single.call_args[0][0] == "https://b2.com/p2.mp4"

    # A transcrição consolidada deve conter as 2 partes
    assert "Texto da Parte 1 ja salvo em cache." in trans.full_transcript
    assert "Texto recem transcrito da Parte 2." in trans.full_transcript

    # O cache da Parte 2 deve ter sido gravado no banco
    db.refresh(p2)
    assert p2.transcript_text == "Texto recem transcrito da Parte 2."
    assert p2.transcribed_video_url == "https://b2.com/p2.mp4"


@pytest.mark.asyncio
async def test_translation_caches_result_per_language(db):
    course = Course(title="Curso Traducao", description="Desc")
    db.add(course)
    db.commit()
    db.refresh(course)

    module = Module(course_id=course.id, title="Módulo Trad", order_index=1)
    db.add(module)
    db.commit()
    db.refresh(module)

    lesson = Lesson(module_id=module.id, title="Aula Trad", video_url="https://b2.com/p1.mp4")
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    trans = LessonTranscription(
        lesson_id=lesson.id,
        full_transcript="Texto em portugues",
        summary_html="<p>Resumo PT</p>",
        summary_markdown="Resumo PT",
        key_takeaways=json.dumps(["Ponto PT"]),
        chapters=json.dumps([{"time": "00:00", "seconds": 0, "title": "Inicio", "part_index": 0}]),
        status="completed",
    )
    db.add(trans)
    db.commit()

    fake_openai_response = MagicMock()
    fake_openai_response.status_code = 200
    fake_openai_response.json.return_value = {
        "choices": [{
            "message": {
                "content": json.dumps({
                    "summary_html": "<p>English Summary</p>",
                    "summary_markdown": "English Summary",
                    "key_takeaways": ["Point EN"],
                    "chapters": [{"time": "00:00", "seconds": 0, "title": "Intro", "part_index": 0}],
                })
            }
        }]
    }

    with patch("app.services.ai_multipart_transcription_service.get_openai_api_key", return_value="sk-test"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=fake_openai_response) as mock_post:
        # 1ª chamada: traduz e salva em cache
        res1 = await translate_lesson_transcription(db=db, lesson_id=lesson.id, target_language="en")
        assert res1["summary_html"] == "<p>English Summary</p>"
        assert mock_post.call_count == 1

        # 2ª chamada: deve ler do cache e NÃO chamar a OpenAI
        res2 = await translate_lesson_transcription(db=db, lesson_id=lesson.id, target_language="en")
        assert res2["summary_html"] == "<p>English Summary</p>"
        assert mock_post.call_count == 1


def test_lesson_video_is_transcribed_property():
    v_done = LessonVideo(
        lesson_id=1,
        video_url="https://b2.com/p1.mp4",
        transcript_text="Texto transcrito",
        transcribed_video_url="https://b2.com/p1.mp4",
    )
    v_new = LessonVideo(
        lesson_id=1,
        video_url="https://b2.com/p2.mp4",
        transcript_text=None,
        transcribed_video_url=None,
    )
    v_changed = LessonVideo(
        lesson_id=1,
        video_url="https://b2.com/p1-v2.mp4",
        transcript_text="Texto antigo",
        transcribed_video_url="https://b2.com/p1.mp4",
    )
    assert v_done.is_transcribed is True
    assert v_new.is_transcribed is False
    assert v_changed.is_transcribed is False
