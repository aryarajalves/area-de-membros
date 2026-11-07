import pytest
import os
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import HTTPException

from app.services.audio_chunker import (
    get_audio_duration_seconds,
    split_audio_into_chunks,
    merge_transcription_chunks
)
from app.services.ai_transcription_service import ai_transcription_service


def test_get_audio_duration_seconds_nonexistent():
    """Retorna 0.0 para arquivo inexistente ou vazio."""
    assert get_audio_duration_seconds("/caminho/nao/existe/audio.mp3") == 0.0
    assert get_audio_duration_seconds("") == 0.0
    assert get_audio_duration_seconds(None) == 0.0


def test_get_audio_duration_seconds_ffprobe_success():
    """Retorna a duração em segundos extraída pelo ffprobe."""
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(returncode=0, stdout="1845.50\n", stderr="")
        with patch("os.path.exists", return_value=True):
            duration = get_audio_duration_seconds("/fake/audio.mp3")
            assert duration == 1845.50


def test_get_audio_duration_seconds_ffprobe_error():
    """Retorna 0.0 caso o ffprobe falhe ou retorne erro."""
    with patch("subprocess.run") as mock_run:
        mock_run.return_value = MagicMock(returncode=1, stdout="", stderr="Error")
        with patch("os.path.exists", return_value=True):
            duration = get_audio_duration_seconds("/fake/audio.mp3")
            assert duration == 0.0


def test_split_audio_nonexistent_raises_error():
    """Lança FileNotFoundError se o áudio original não existir."""
    with pytest.raises(FileNotFoundError):
        split_audio_into_chunks("/caminho/inexistente/test.mp3")


def test_split_audio_short_duration_single_chunk():
    """Áudio curto (ex: 15 minutos / 900s) deve retornar apenas 1 chunk único sem fatiar."""
    with patch("os.path.exists", return_value=True), \
         patch("os.path.getsize", return_value=5 * 1024 * 1024), \
         patch("app.services.audio_chunker.get_audio_duration_seconds", return_value=900.0):
        chunks = split_audio_into_chunks("/fake/audio.mp3", chunk_duration_sec=1200)
        assert len(chunks) == 1
        assert chunks[0]["is_single"] is True
        assert chunks[0]["offset_sec"] == 0.0
        assert chunks[0]["duration_sec"] == 900.0
        assert chunks[0]["path"] == "/fake/audio.mp3"


def test_split_audio_long_duration_multiple_chunks():
    """Áudio longo (ex: 1h40m / 6000s) deve ser fatiado em múltiplos blocos de 1200s."""
    with patch("os.path.exists", return_value=True), \
         patch("os.path.getsize", return_value=30 * 1024 * 1024), \
         patch("app.services.audio_chunker.get_audio_duration_seconds", return_value=6000.0), \
         patch("subprocess.run") as mock_run, \
         patch("os.makedirs"):
        mock_run.return_value = MagicMock(returncode=0)
        chunks = split_audio_into_chunks("/fake/audio.mp3", chunk_duration_sec=1200, output_dir="/fake/chunks")

        # 6000s / 1200s = 5 chunks (0..1200, 1200..2400, 2400..3600, 3600..4800, 4800..6000)
        assert len(chunks) == 5
        assert chunks[0]["offset_sec"] == 0.0
        assert chunks[0]["duration_sec"] == 1200.0
        assert chunks[1]["offset_sec"] == 1200.0
        assert chunks[4]["offset_sec"] == 4800.0
        assert chunks[4]["duration_sec"] == 1200.0
        assert all(c["is_single"] is False for c in chunks)


def test_merge_transcription_chunks_empty():
    """Combinação de lista vazia retorna estrutura neutra."""
    merged = merge_transcription_chunks([])
    assert merged["text"] == ""
    assert merged["segments"] == []


def test_merge_transcription_chunks_offsets_adjusted():
    """Garante que os textos são unidos e que os timestamps dos segmentos são ajustados pelo offset."""
    chunks_results = [
        {
            "chunk_index": 0,
            "offset_sec": 0.0,
            "result": {
                "text": "Primeira parte da aula sobre introdução aos trânsitos.",
                "segments": [
                    {"start": 0.0, "end": 10.0, "text": "Primeira parte da aula"},
                    {"start": 10.0, "end": 25.0, "text": "sobre introdução aos trânsitos."}
                ]
            }
        },
        {
            "chunk_index": 1,
            "offset_sec": 1200.0,
            "result": {
                "text": "Segunda parte com análise prática dos planetas.",
                "segments": [
                    {"start": 5.0, "end": 15.0, "text": "Segunda parte"},
                    {"start": 15.0, "end": 30.0, "text": "com análise prática dos planetas."}
                ]
            }
        }
    ]

    merged = merge_transcription_chunks(chunks_results)

    # Texto concatenado
    assert "Primeira parte da aula" in merged["text"]
    assert "Segunda parte com análise prática" in merged["text"]

    # Segmentos ajustados
    segments = merged["segments"]
    assert len(segments) == 4
    # Bloco 0 (offset 0)
    assert segments[0]["start"] == 0.0
    assert segments[0]["end"] == 10.0
    # Bloco 1 (offset 1200) -> 5.0 + 1200 = 1205.0; 15.0 + 1200 = 1215.0
    assert segments[2]["start"] == 1205.0
    assert segments[2]["end"] == 1215.0
    assert segments[3]["start"] == 1215.0
    assert segments[3]["end"] == 1230.0


@pytest.mark.asyncio
async def test_transcribe_audio_whisper_delegates_to_single():
    """Para áudios curtos, transcribe_audio_whisper chama _transcribe_single_file_whisper uma única vez."""
    with patch("app.services.ai_transcription_service.split_audio_into_chunks") as mock_split, \
         patch.object(ai_transcription_service, "_transcribe_single_file_whisper", new_callable=AsyncMock) as mock_single, \
         patch("app.services.ai_transcription_service.get_openai_api_key", return_value="fake-key"):

        mock_split.return_value = [{
            "chunk_index": 0,
            "path": "/fake/short.mp3",
            "offset_sec": 0.0,
            "duration_sec": 600.0,
            "is_single": True
        }]
        mock_single.return_value = {"text": "Aula curta transcrita", "segments": []}

        res = await ai_transcription_service.transcribe_audio_whisper("/fake/short.mp3", api_key="fake-key")

        assert res["text"] == "Aula curta transcrita"
        mock_single.assert_awaited_once_with("/fake/short.mp3", language="pt", api_key="fake-key")


@pytest.mark.asyncio
async def test_transcribe_audio_whisper_long_audio_chunks():
    """Para áudios longos, transcribe_audio_whisper transcreve cada chunk e faz o merge unificado."""
    with patch("app.services.ai_transcription_service.split_audio_into_chunks") as mock_split, \
         patch.object(ai_transcription_service, "_transcribe_single_file_whisper", new_callable=AsyncMock) as mock_single, \
         patch("app.services.ai_transcription_service.get_openai_api_key", return_value="fake-key"):

        mock_split.return_value = [
            {"chunk_index": 0, "path": "/fake/chunk0.mp3", "offset_sec": 0.0, "duration_sec": 1200.0, "is_single": False},
            {"chunk_index": 1, "path": "/fake/chunk1.mp3", "offset_sec": 1200.0, "duration_sec": 800.0, "is_single": False}
        ]
        mock_single.side_effect = [
            {"text": "Parte 1", "segments": [{"start": 0.0, "end": 10.0, "text": "P1"}]},
            {"text": "Parte 2", "segments": [{"start": 2.0, "end": 8.0, "text": "P2"}]}
        ]

        res = await ai_transcription_service.transcribe_audio_whisper("/fake/long.mp3", api_key="fake-key")

        assert res["text"] == "Parte 1 Parte 2"
        assert len(res["segments"]) == 2
        assert res["segments"][0]["start"] == 0.0
        assert res["segments"][1]["start"] == 1202.0  # 1200 + 2
        assert mock_single.await_count == 2
