"""
Utilitário de Fatiamento (Chunking) de Áudio para Transcrição com OpenAI Whisper.
Permite transcrever vídeos e áudios longos (1h, 2h, 4h+) dividindo-os em pedaços cronológicos menores
para evitar timeouts de rede e ultrapassar o limite rígido de 25 MB do Whisper.
"""
import os
import subprocess
from typing import List, Dict, Any, Optional
from app.core.logger import logger


def get_audio_duration_seconds(audio_path: str) -> float:
    """Extrai a duração exata do áudio em segundos via ffprobe com tratamento seguro."""
    if not audio_path or not os.path.exists(audio_path):
        return 0.0
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0 and res.stdout.strip():
            return float(res.stdout.strip())
    except Exception as e:
        logger.warning(f"[AudioChunker] Falha ao ler duração com ffprobe: {e}")
    return 0.0


def split_audio_into_chunks(
    audio_path: str,
    chunk_duration_sec: int = 1200,
    output_dir: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Divide um áudio em partes (chunks) menores usando FFmpeg rápido sem perda de fidelidade.
    
    Args:
        audio_path: Caminho do arquivo de áudio mono original (MP3).
        chunk_duration_sec: Tamanho de cada fatia em segundos (padrão 1200s = 20 minutos).
        output_dir: Diretório onde salvar os chunks (padrão mesmo diretório do arquivo).
        
    Returns:
        Lista de dicionários contendo os metadados e caminhos de cada chunk:
        [
            {"chunk_index": 0, "path": ".../chunk_0.mp3", "offset_sec": 0.0, "duration_sec": 1200.0},
            ...
        ]
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Arquivo de áudio não encontrado: {audio_path}")

    duration = get_audio_duration_seconds(audio_path)
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)

    # Se o áudio tiver 25 minutos ou menos E menos de 24 MB, não precisa de chunking
    if duration <= (chunk_duration_sec + 300) and file_size_mb <= 24.0:
        return [{
            "chunk_index": 0,
            "path": audio_path,
            "offset_sec": 0.0,
            "duration_sec": duration,
            "is_single": True
        }]

    target_dir = output_dir or os.path.dirname(audio_path)
    os.makedirs(target_dir, exist_ok=True)

    chunks = []
    chunk_index = 0
    current_start = 0.0

    logger.info(
        f"[AudioChunker] Áudio longo detectado ({duration:.1f}s / {file_size_mb:.2f} MB). "
        f"Iniciando fatiamento em chunks de {chunk_duration_sec}s..."
    )

    while current_start < duration:
        current_dur = min(float(chunk_duration_sec), duration - current_start)
        chunk_filename = f"chunk_{chunk_index:03d}.mp3"
        chunk_path = os.path.join(target_dir, chunk_filename)

        # Extração de fatia rápida usando FFmpeg
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(current_start),
            "-t", str(current_dur),
            "-i", audio_path,
            "-acodec", "copy",
            chunk_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Fallback de re-encode caso o codec copy encontre incompatibilidade de headers
        if res.returncode != 0 or not os.path.exists(chunk_path) or os.path.getsize(chunk_path) == 0:
            logger.warning(f"[AudioChunker] Codec copy falhou no chunk {chunk_index}, usando re-encode...")
            fallback_cmd = [
                "ffmpeg", "-y",
                "-ss", str(current_start),
                "-t", str(current_dur),
                "-i", audio_path,
                "-vn", "-ar", "16000", "-ac", "1", "-b:a", "32k",
                chunk_path
            ]
            subprocess.run(fallback_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        chunks.append({
            "chunk_index": chunk_index,
            "path": chunk_path,
            "offset_sec": current_start,
            "duration_sec": current_dur,
            "is_single": False
        })

        chunk_index += 1
        current_start += chunk_duration_sec

    logger.info(f"[AudioChunker] Fatiamento concluído com sucesso: {len(chunks)} chunks gerados.")
    return chunks


def merge_transcription_chunks(chunks_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Combina os resultados de transcrição de múltiplos chunks em uma estrutura unificada,
    recalculando e ajustando com precisão os timestamps (start e end) de cada segmento.
    """
    if not chunks_results:
        return {
            "text": "",
            "full_transcript": "",
            "segments": []
        }

    combined_texts = []
    combined_segments = []

    for item in sorted(chunks_results, key=lambda x: x.get("chunk_index", 0)):
        offset_sec = float(item.get("offset_sec", 0.0))
        chunk_data = item.get("result", {})

        chunk_text = (chunk_data.get("text") or chunk_data.get("full_transcript") or "").strip()
        if chunk_text:
            combined_texts.append(chunk_text)

        raw_segments = chunk_data.get("segments") or []
        for seg in raw_segments:
            seg_copy = dict(seg)
            if "start" in seg_copy and isinstance(seg_copy["start"], (int, float)):
                seg_copy["start"] = round(float(seg_copy["start"]) + offset_sec, 2)
            if "end" in seg_copy and isinstance(seg_copy["end"], (int, float)):
                seg_copy["end"] = round(float(seg_copy["end"]) + offset_sec, 2)
            combined_segments.append(seg_copy)

    full_transcript = " ".join(combined_texts).strip()

    return {
        "text": full_transcript,
        "full_transcript": full_transcript,
        "segments": combined_segments
    }


# Registro em memória em tempo real do progresso de transcrição por aula (lesson_id)
_TRANSCRIPTION_PROGRESS: Dict[int, Dict[str, Any]] = {}


def set_transcription_progress(
    lesson_id: int,
    percent: int,
    step_text: str,
    estimated_remaining_seconds: Optional[int] = None,
    audio_duration_seconds: Optional[float] = None
) -> None:
    """Atualiza o progresso real em tempo real de uma aula em processamento."""
    if not lesson_id:
        return
    prev = _TRANSCRIPTION_PROGRESS.get(lesson_id, {})
    _TRANSCRIPTION_PROGRESS[lesson_id] = {
        "progress_percent": max(1, min(99, int(percent))),
        "progress_step": step_text,
        "estimated_remaining_seconds": estimated_remaining_seconds if estimated_remaining_seconds is not None else prev.get("estimated_remaining_seconds"),
        "audio_duration_seconds": audio_duration_seconds if audio_duration_seconds is not None else prev.get("audio_duration_seconds")
    }


def get_transcription_progress(lesson_id: int) -> Dict[str, Any]:
    """Recupera o estado de progresso atual de uma aula em processamento."""
    return _TRANSCRIPTION_PROGRESS.get(lesson_id, {})


def clear_transcription_progress(lesson_id: int) -> None:
    """Remove o estado temporário de progresso após conclusão ou falha."""
    if lesson_id in _TRANSCRIPTION_PROGRESS:
        _TRANSCRIPTION_PROGRESS.pop(lesson_id, None)

