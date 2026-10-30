"""
Serviço de Otimização e Transcodificação Automática de Vídeos e Mídias (FFmpeg + FastStart).
Garante que vídeos enviados (inclusive .MOV pesados) sejam convertidos para MP4 (H.264/AAC)
com o átomo MOOV no início (+faststart) e bitrates otimizados para streaming instantâneo.
"""
import os
import subprocess
import tempfile
import threading
from typing import Tuple, Optional

from app.core.config import settings
from app.core.logger import logger
from app.services.storage import get_s3_client, build_b2_public_url
from app.services.image_optimizer import optimize_image

# Conjunto e dicionário em memória para rastrear o progresso em tempo real e evitar duplicatas
_active_optimizations = set()
_cancelled_optimizations = set()
_optimization_progress = {}
_lock = threading.Lock()


def cancel_video_optimization(video_url: Optional[str] = None) -> dict:
    """Sinaliza o cancelamento imediato de uma otimização em andamento."""
    cancelled_keys = []
    with _lock:
        if video_url:
            s3_key = extract_s3_key_from_url(video_url)
            if s3_key:
                _cancelled_optimizations.add(s3_key)
                _active_optimizations.discard(s3_key)
                cancelled_keys.append(s3_key)
        else:
            for k in list(_active_optimizations):
                _cancelled_optimizations.add(k)
                cancelled_keys.append(k)
            _active_optimizations.clear()

    for k in cancelled_keys:
        _set_optimization_stage(
            k,
            stage="cancelled",
            progress_pct=0,
            stage_label="Otimização interrompida pelo Super Admin."
        )
    return {"status": "cancelled", "cancelled_keys": cancelled_keys}


def _set_optimization_stage(
    s3_key: str,
    stage: str,
    progress_pct: int,
    stage_label: str,
    original_size_mb: Optional[float] = None,
    optimized_size_mb: Optional[float] = None
):
    """Atualiza o estágio de otimização em memória para exibição no popup do Super Admin."""
    if not s3_key:
        return
    with _lock:
        prev = _optimization_progress.get(s3_key, {})
        orig_mb = original_size_mb if original_size_mb is not None else prev.get("original_size_mb", 0.0)
        opt_mb = optimized_size_mb if optimized_size_mb is not None else prev.get("optimized_size_mb", 0.0)
        entry = {
            "stage": stage,
            "progress_pct": progress_pct,
            "stage_label": stage_label,
            "original_size_mb": round(float(orig_mb or 0.0), 2),
            "optimized_size_mb": round(float(opt_mb or 0.0), 2),
        }
        _optimization_progress[s3_key] = entry
        base_no_ext = os.path.splitext(s3_key)[0]
        _optimization_progress[f"{base_no_ext}.mp4"] = entry


def extract_s3_key_from_url(media_url: str) -> Optional[str]:
    """Extrai a chave do objeto S3/B2 a partir da URL pública."""
    if not media_url or "AreaDeMembros/" not in media_url:
        return None
    idx = media_url.find("AreaDeMembros/")
    key = media_url[idx:].split("?")[0]
    return key if key else None


def optimize_video_file(
    input_path: str,
    output_path: str,
    crf: int = 26,
    preset: str = "veryfast",
    max_height: int = 1080
) -> bool:
    """
    Transcodifica um arquivo de vídeo local para MP4 Web (H.264 + AAC) com flag +faststart.
    Move o índice (moov atom) para o início do arquivo e reduz o tamanho em até 85-90%.
    """
    if not os.path.exists(input_path) or os.path.getsize(input_path) < 512:
        return False

    cmd = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-vf", f"scale=-2:'min({max_height},ih)'",
        "-c:v", "libx264",
        "-preset", preset,
        "-crf", str(crf),
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        output_path
    ]

    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=1800,
            check=False
        )
        if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            return True
        stderr_preview = result.stderr.decode("utf-8", errors="ignore")[-400:]
        logger.warning(f"[VideoOptimizer] FFmpeg retornou código {result.returncode}: {stderr_preview}")
        return False
    except Exception as exc:
        logger.error(f"[VideoOptimizer] Falha ao executar FFmpeg: {exc}")
        return False


def optimize_video_bytes(
    video_bytes: bytes,
    original_ext: str = ".mp4",
    crf: int = 26,
    preset: str = "veryfast"
) -> Tuple[bytes, str, str]:
    """
    Otimiza bytes de vídeo em memória usando arquivos temporários e FFmpeg.
    Se os bytes não forem um vídeo válido completo (ex: mocks de testes), retorna o original com segurança.
    """
    ext = original_ext if original_ext.startswith(".") else f".{original_ext}"
    if not video_bytes or len(video_bytes) < 1024:
        return video_bytes, "video/mp4", ext

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            in_path = os.path.join(tmpdir, f"input{ext}")
            out_path = os.path.join(tmpdir, "output.mp4")
            with open(in_path, "wb") as f:
                f.write(video_bytes)

            success = optimize_video_file(in_path, out_path, crf=crf, preset=preset)
            if success:
                with open(out_path, "rb") as f:
                    opt_bytes = f.read()
                orig_mb = len(video_bytes) / (1024 * 1024)
                opt_mb = len(opt_bytes) / (1024 * 1024)
                logger.info(
                    f"[VideoOptimizer] Vídeo otimizado com sucesso: {orig_mb:.2f} MB -> {opt_mb:.2f} MB (+faststart)"
                )
                return opt_bytes, "video/mp4", ".mp4"
    except Exception as exc:
        logger.warning(f"[VideoOptimizer] Fallback para vídeo original devido a erro: {exc}")

    content_type = "video/mp4" if ext == ".mp4" else "video/quicktime" if ext == ".mov" else "video/mp4"
    return video_bytes, content_type, ext


def optimize_b2_video_by_url(video_url: str, db_session=None) -> Optional[str]:
    """
    Baixa um vídeo armazenado no Backblaze B2, aplica transcodificação H.264 +faststart,
    sobe a versão otimizada com Cache-Control de 1 ano e atualiza as referências no banco.
    """
    s3_key = extract_s3_key_from_url(video_url)
    if not s3_key:
        return None

    with _lock:
        if s3_key in _active_optimizations:
            logger.info(f"[VideoOptimizer] Otimização já em andamento para {s3_key}, ignorando duplicata.")
            return video_url
        _cancelled_optimizations.discard(s3_key)
        _active_optimizations.add(s3_key)

    try:
        s3 = get_s3_client()
        bucket = settings.B2_BUCKET_NAME
        if not s3 or not bucket:
            return None

        # Verifica se já está otimizado via metadados do S3
        try:
            head = s3.head_object(Bucket=bucket, Key=s3_key)
            metadata = head.get("Metadata", {}) or {}
            if metadata.get("zv-optimized") == "1" and s3_key.lower().endswith(".mp4"):
                logger.info(f"[VideoOptimizer] Vídeo {s3_key} já consta como otimizado no B2.")
                return video_url
            orig_size_mb = int(head.get("ContentLength", 0)) / (1024 * 1024)
        except Exception as head_err:
            logger.warning(f"[VideoOptimizer] Não foi possível ler head_object de {s3_key}: {head_err}")
            return None

        ext = os.path.splitext(s3_key)[1].lower() or ".mp4"
        base_key_no_ext = os.path.splitext(s3_key)[0]
        new_s3_key = f"{base_key_no_ext}.mp4"
        orig_size_bytes = max(1, int(orig_size_mb * 1024 * 1024))

        _set_optimization_stage(
            s3_key,
            stage="downloading",
            progress_pct=2,
            stage_label=f"Iniciando download ({orig_size_mb:.2f} MB) do Backblaze B2...",
            original_size_mb=orig_size_mb
        )
        logger.info(f"[VideoOptimizer] Baixando {s3_key} ({orig_size_mb:.2f} MB) do B2 para otimização...")

        with tempfile.TemporaryDirectory() as tmpdir:
            in_path = os.path.join(tmpdir, f"raw{ext}")
            out_path = os.path.join(tmpdir, "optimized.mp4")

            dl_state = {"bytes": 0, "last_pct": 2}

            def _on_dl_chunk(chunk_bytes: int):
                with _lock:
                    if s3_key in _cancelled_optimizations:
                        raise RuntimeError("Otimização cancelada pelo Super Admin durante download.")
                dl_state["bytes"] += int(chunk_bytes or 0)
                ratio = min(1.0, dl_state["bytes"] / orig_size_bytes)
                pct = max(2, min(35, int(2 + ratio * 33)))
                if pct != dl_state["last_pct"] or ratio >= 1.0:
                    dl_state["last_pct"] = pct
                    mb_done = dl_state["bytes"] / (1024 * 1024)
                    _set_optimization_stage(
                        s3_key,
                        stage="downloading",
                        progress_pct=pct,
                        stage_label=f"Baixando do B2: {mb_done:.1f} MB / {orig_size_mb:.1f} MB ({int(ratio * 100)}%)...",
                        original_size_mb=orig_size_mb
                    )

            try:
                s3.download_file(bucket, s3_key, in_path, Callback=_on_dl_chunk)
            except TypeError:
                s3.download_file(bucket, s3_key, in_path)

            with _lock:
                if s3_key in _cancelled_optimizations:
                    logger.info(f"[VideoOptimizer] Otimização cancelada após download de {s3_key}.")
                    return None

            _set_optimization_stage(
                s3_key,
                stage="converting",
                progress_pct=36,
                stage_label="Convertendo com FFmpeg (H.264 + FastStart)... 0%",
                original_size_mb=orig_size_mb
            )

            stop_monitor = threading.Event()

            def _ffmpeg_progress_monitor():
                import time
                start_ts = time.time()
                est_total_sec = max(6.0, orig_size_mb / 3.8)
                while not stop_monitor.wait(0.8):
                    with _lock:
                        if s3_key in _cancelled_optimizations:
                            break
                    elapsed = time.time() - start_ts
                    out_mb = (os.path.getsize(out_path) / (1024 * 1024)) if os.path.exists(out_path) else 0.0
                    ratio = min(0.96, elapsed / est_total_sec)
                    pct = max(36, min(85, int(36 + ratio * 49)))
                    _set_optimization_stage(
                        s3_key,
                        stage="converting",
                        progress_pct=pct,
                        stage_label=(
                            f"Convertendo FFmpeg (FastStart): {int(ratio * 100)}% • "
                            f"{out_mb:.1f} MB gerados ({int(elapsed)}s)..."
                        ),
                        original_size_mb=orig_size_mb
                    )

            mon_thread = threading.Thread(target=_ffmpeg_progress_monitor, daemon=True)
            mon_thread.start()
            try:
                conv_ok = optimize_video_file(in_path, out_path)
            finally:
                stop_monitor.set()

            if not conv_ok:
                logger.error(f"[VideoOptimizer] Falha ao transcodificar {s3_key}.")
                _set_optimization_stage(
                    s3_key,
                    stage="failed",
                    progress_pct=0,
                    stage_label="Falha na conversão FFmpeg."
                )
                return None

            with _lock:
                if s3_key in _cancelled_optimizations:
                    logger.info(f"[VideoOptimizer] Otimização cancelada antes do upload de {s3_key}.")
                    return None

            opt_size_bytes = max(1, os.path.getsize(out_path))
            opt_size_mb = opt_size_bytes / (1024 * 1024)
            _set_optimization_stage(
                s3_key,
                stage="uploading",
                progress_pct=86,
                stage_label=f"Enviando MP4 otimizado (0.0 MB / {opt_size_mb:.1f} MB) para o B2...",
                original_size_mb=orig_size_mb,
                optimized_size_mb=opt_size_mb
            )
            logger.info(
                f"[VideoOptimizer] Conversão concluída ({orig_size_mb:.2f} MB -> {opt_size_mb:.2f} MB). "
                f"Enviando para B2 em {new_s3_key}..."
            )

            extra_args = {
                "ContentType": "video/mp4",
                "CacheControl": "public, max-age=31536000, immutable",
                "Metadata": {"zv-optimized": "1"}
            }
            ul_state = {"bytes": 0, "last_pct": 86}

            def _on_ul_chunk(chunk_bytes: int):
                ul_state["bytes"] += int(chunk_bytes or 0)
                ratio = min(1.0, ul_state["bytes"] / opt_size_bytes)
                pct = max(86, min(99, int(86 + ratio * 13)))
                if pct != ul_state["last_pct"] or ratio >= 1.0:
                    ul_state["last_pct"] = pct
                    mb_sent = ul_state["bytes"] / (1024 * 1024)
                    _set_optimization_stage(
                        s3_key,
                        stage="uploading",
                        progress_pct=pct,
                        stage_label=f"Enviando MP4 otimizado: {mb_sent:.1f} MB / {opt_size_mb:.1f} MB ({int(ratio * 100)}%)...",
                        original_size_mb=orig_size_mb,
                        optimized_size_mb=opt_size_mb
                    )

            try:
                s3.upload_file(out_path, bucket, new_s3_key, ExtraArgs=extra_args, Callback=_on_ul_chunk)
            except TypeError:
                s3.upload_file(out_path, bucket, new_s3_key, ExtraArgs=extra_args)

            new_video_url = build_b2_public_url(new_s3_key)

            # Atualiza banco de dados caso o vídeo pertença a aulas já salvas
            _update_video_url_in_db(video_url, new_video_url, s3_key, db_session)

            if new_s3_key != s3_key:
                # Cópia server-side instantânea dentro do B2 para manter compatibilidade com a key antiga sem novo upload
                try:
                    s3.copy_object(
                        Bucket=bucket,
                        CopySource={"Bucket": bucket, "Key": new_s3_key},
                        Key=s3_key,
                        ContentType="video/mp4",
                        CacheControl="public, max-age=31536000, immutable",
                        Metadata={"zv-optimized": "1"},
                        MetadataDirective="REPLACE"
                    )
                except Exception:
                    pass

            _video_head_cache[s3_key] = {
                "is_optimized": True,
                "size_mb": round(opt_size_mb, 2),
                "format": "MP4"
            }
            _video_head_cache[new_s3_key] = {
                "is_optimized": True,
                "size_mb": round(opt_size_mb, 2),
                "format": "MP4"
            }

            _set_optimization_stage(
                s3_key,
                stage="completed",
                progress_pct=100,
                stage_label=f"Otimização concluída! ({orig_size_mb:.2f} MB -> {opt_size_mb:.2f} MB)",
                original_size_mb=orig_size_mb,
                optimized_size_mb=opt_size_mb
            )
            return new_video_url
    except Exception as exc:
        logger.error(f"[VideoOptimizer] Erro durante otimização de {video_url}: {exc}")
        return None
    finally:
        with _lock:
            _active_optimizations.discard(s3_key)


def _update_video_url_in_db(old_url: str, new_url: str, old_s3_key: str, db_session=None) -> int:
    """Atualiza URLs de vídeos nas tabelas Lesson e LessonVideo."""
    from app.core.database import SessionLocal
    from app.models.course import Lesson, LessonVideo

    own_session = False
    db = db_session
    if db is None:
        db = SessionLocal()
        own_session = True

    updated_count = 0
    try:
        filename_only = os.path.basename(old_s3_key)
        lessons = db.query(Lesson).filter(Lesson.video_url.ilike(f"%{filename_only}%")).all()
        for lesson in lessons:
            lesson.video_url = new_url
            updated_count += 1

        lesson_videos = db.query(LessonVideo).filter(LessonVideo.video_url.ilike(f"%{filename_only}%")).all()
        for lv in lesson_videos:
            lv.video_url = new_url
            updated_count += 1

        if updated_count > 0:
            db.commit()
            logger.info(f"[VideoOptimizer] {updated_count} registro(s) atualizados no banco para {new_url}")
        return updated_count
    except Exception as exc:
        if own_session:
            db.rollback()
        logger.error(f"[VideoOptimizer] Erro ao atualizar URL no banco: {exc}")
        return 0
    finally:
        if own_session:
            db.close()


def get_video_optimization_info(video_url: str) -> dict:
    """
    Retorna o tamanho real (em MB e bytes), formato e status de otimização de um vídeo
    armazenado no Backblaze B2 ou localmente (exclusivo para diagnóstico do Super Admin).
    """
    if not video_url:
        return {
            "video_url": "",
            "size_bytes": 0,
            "size_mb": 0.0,
            "format": "N/A",
            "is_optimized": False,
            "is_optimizing": False
        }

    s3_key = extract_s3_key_from_url(video_url)
    if s3_key:
        with _lock:
            base_no_ext = os.path.splitext(s3_key)[0]
            is_optimizing = (
                s3_key in _active_optimizations
                or f"{base_no_ext}.mov" in _active_optimizations
                or f"{base_no_ext}.mp4" in _active_optimizations
            )
            prog = _optimization_progress.get(s3_key) or _optimization_progress.get(f"{base_no_ext}.mp4") or {}

        ext = (os.path.splitext(s3_key)[1].lower().lstrip(".") or "mp4").upper()

        # Retorno instantâneo (< 1ms) em memória durante otimização ativa ou logo após conclusão
        if is_optimizing and prog:
            orig_mb = round(float(prog.get("original_size_mb") or 0.0), 2)
            return {
                "video_url": video_url,
                "size_bytes": int(orig_mb * 1024 * 1024),
                "size_mb": orig_mb,
                "original_size_mb": orig_mb,
                "format": ext,
                "is_optimized": False,
                "is_optimizing": True,
                "stage": prog.get("stage", "converting"),
                "progress_pct": prog.get("progress_pct", 50),
                "stage_label": prog.get("stage_label", "Processando vídeo com FFmpeg...")
            }

        if not is_optimizing and prog.get("stage") == "completed":
            opt_mb = round(float(prog.get("optimized_size_mb") or prog.get("original_size_mb") or 0.0), 2)
            orig_mb = round(float(prog.get("original_size_mb") or opt_mb), 2)
            return {
                "video_url": video_url,
                "size_bytes": int(opt_mb * 1024 * 1024),
                "size_mb": opt_mb,
                "original_size_mb": orig_mb,
                "format": "MP4",
                "is_optimized": True,
                "is_optimizing": False,
                "stage": "completed",
                "progress_pct": 100,
                "stage_label": prog.get("stage_label", "Otimização concluída!")
            }

        s3 = get_s3_client()
        bucket = settings.B2_BUCKET_NAME
        if s3 and bucket:
            try:
                head = s3.head_object(Bucket=bucket, Key=s3_key)
                size_bytes = int(head.get("ContentLength", 0))
                size_mb = round(size_bytes / (1024 * 1024), 2)
                metadata = head.get("Metadata", {}) or {}
                is_optimized = metadata.get("zv-optimized") == "1"
                ctype = head.get("ContentType", "")
                if is_optimized or ctype == "video/mp4":
                    display_fmt = "MP4" if is_optimized else ext
                else:
                    display_fmt = ext

                stage = prog.get("stage", "completed" if is_optimized else ("converting" if is_optimizing else "idle"))
                progress_pct = prog.get("progress_pct", 100 if is_optimized else (50 if is_optimizing else 0))
                stage_label = prog.get(
                    "stage_label",
                    "Otimização concluída!" if is_optimized else (
                        "Processando vídeo com FFmpeg..." if is_optimizing else "Aguardando otimização"
                    )
                )
                return {
                    "video_url": video_url,
                    "size_bytes": size_bytes,
                    "size_mb": size_mb,
                    "original_size_mb": prog.get("original_size_mb") or size_mb,
                    "format": display_fmt,
                    "is_optimized": is_optimized,
                    "is_optimizing": is_optimizing,
                    "stage": stage,
                    "progress_pct": progress_pct,
                    "stage_label": stage_label
                }
            except Exception as exc:
                logger.warning(f"[VideoOptimizer] Falha ao consultar head_object de {s3_key}: {exc}")

        return {
            "video_url": video_url,
            "size_bytes": 0,
            "size_mb": 0.0,
            "original_size_mb": prog.get("original_size_mb", 0.0),
            "format": ext,
            "is_optimized": False,
            "is_optimizing": is_optimizing,
            "stage": prog.get("stage", "converting" if is_optimizing else "idle"),
            "progress_pct": prog.get("progress_pct", 50 if is_optimizing else 0),
            "stage_label": prog.get("stage_label", "Processando vídeo com FFmpeg..." if is_optimizing else "")
        }

    # Vídeo local (/api/v1/courses/videos/...)
    if "/courses/videos/" in video_url:
        filename = os.path.basename(video_url.split("?")[0])
        base_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "uploads",
            "videos"
        )
        filepath = os.path.join(base_dir, filename)
        ext = (os.path.splitext(filename)[1].lower().lstrip(".") or "mp4").upper()
        if os.path.exists(filepath):
            size_bytes = os.path.getsize(filepath)
            return {
                "video_url": video_url,
                "size_bytes": size_bytes,
                "size_mb": round(size_bytes / (1024 * 1024), 2),
                "format": ext,
                "is_optimized": ext == "MP4",
                "is_optimizing": False
            }

    return {
        "video_url": video_url,
        "size_bytes": 0,
        "size_mb": 0.0,
        "format": "EXTERNO",
        "is_optimized": True,
        "is_optimizing": False
    }


def trigger_background_video_optimization(video_url: str):
    """Dispara a otimização de um vídeo do B2 em uma thread em background sem bloquear a requisição HTTP."""
    if not video_url or "AreaDeMembros/videos/" not in video_url:
        return
    t = threading.Thread(target=optimize_b2_video_by_url, args=(video_url,), daemon=True)
    t.start()


def optimize_b2_image_by_url(image_url: str) -> Optional[str]:
    """
    Verifica uma imagem no Backblaze B2; se for PNG/JPG pesado ou sem Cache-Control,
    converte para WebP otimizado e sobe para o B2.
    """
    s3_key = extract_s3_key_from_url(image_url)
    if not s3_key:
        return None

    s3 = get_s3_client()
    bucket = settings.B2_BUCKET_NAME
    if not s3 or not bucket:
        return None

    try:
        head = s3.head_object(Bucket=bucket, Key=s3_key)
        metadata = head.get("Metadata", {}) or {}
        cache_ctrl = head.get("CacheControl", "")
        if metadata.get("zv-optimized") == "1" and s3_key.lower().endswith(".webp") and "max-age" in cache_ctrl:
            return image_url

        obj = s3.get_object(Bucket=bucket, Key=s3_key)
        raw_bytes = obj["Body"].read()
        opt_bytes, content_type, ext = optimize_image(raw_bytes, max_width=1280, quality=82)

        base_key = os.path.splitext(s3_key)[0]
        new_s3_key = f"{base_key}{ext}"

        s3.put_object(
            Bucket=bucket,
            Key=new_s3_key,
            Body=opt_bytes,
            ContentType=content_type,
            CacheControl="public, max-age=31536000, immutable",
            Metadata={"zv-optimized": "1"}
        )
        new_url = build_b2_public_url(new_s3_key)
        logger.info(
            f"[ImageOptimizer] Imagem B2 otimizada: {s3_key} ({len(raw_bytes)//1024} KB) -> "
            f"{new_s3_key} ({len(opt_bytes)//1024} KB)"
        )
        return new_url
    except Exception as exc:
        logger.warning(f"[ImageOptimizer] Não foi possível otimizar imagem {image_url}: {exc}")
        return None


def run_pending_media_optimizations() -> dict:
    """
    Varre o banco de dados em busca de thumbnails (PNG/JPG) e vídeos (.MOV / MP4 não otimizados)
    e aplica a otimização completa no Backblaze B2.
    """
    from app.core.database import SessionLocal
    from app.models.course import Course, Module, Lesson, LessonVideo

    db = SessionLocal()
    stats = {"images_optimized": 0, "videos_optimized": 0}
    try:
        # 1. Otimizar imagens de Cursos, Módulos e Aulas
        for course in db.query(Course).all():
            for attr in ("thumbnail_url", "cover_image_url"):
                url = getattr(course, attr, None)
                if url and "AreaDeMembros/" in url and not url.lower().endswith(".webp"):
                    new_url = optimize_b2_image_by_url(url)
                    if new_url and new_url != url:
                        setattr(course, attr, new_url)
                        stats["images_optimized"] += 1

        for module in db.query(Module).all():
            if module.image_url and "AreaDeMembros/" in module.image_url and not module.image_url.lower().endswith(".webp"):
                new_url = optimize_b2_image_by_url(module.image_url)
                if new_url and new_url != module.image_url:
                    module.image_url = new_url
                    stats["images_optimized"] += 1

        for lesson in db.query(Lesson).all():
            if lesson.thumbnail_url and "AreaDeMembros/" in lesson.thumbnail_url and not lesson.thumbnail_url.lower().endswith(".webp"):
                new_url = optimize_b2_image_by_url(lesson.thumbnail_url)
                if new_url and new_url != lesson.thumbnail_url:
                    lesson.thumbnail_url = new_url
                    stats["images_optimized"] += 1

        db.commit()

        # 2. Coletar URLs únicas de vídeos no B2 para otimização
        video_urls = set()
        for lesson in db.query(Lesson).all():
            if lesson.video_url and "AreaDeMembros/videos/" in lesson.video_url:
                video_urls.add(lesson.video_url)
        for lv in db.query(LessonVideo).all():
            if lv.video_url and "AreaDeMembros/videos/" in lv.video_url:
                video_urls.add(lv.video_url)

        for v_url in video_urls:
            new_v_url = optimize_b2_video_by_url(v_url, db_session=db)
            if new_v_url:
                stats["videos_optimized"] += 1

        return stats
    except Exception as exc:
        logger.error(f"[MediaOptimizer] Erro ao processar lote de mídias: {exc}")
        return stats
    finally:
        db.close()


_video_head_cache = {}


def is_bad_or_raw_lesson_title(
    title: Optional[str],
    import_identifier: Optional[str] = None,
    has_description: bool = False
) -> bool:
    """
    Identifica se o título da aula ainda é um nome bruto de arquivo, UUID/hash ou genérico
    que não foi aprimorado pela IA.
    """
    import re

    t = (title or "").strip()
    if len(t) < 8:
        return True

    # 1. UUID ou Hash hexadecimal longo (ex: 2a8bcc96-3336-462f-a0a0-cacde04f86b9)
    if re.match(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", t):
        return True
    if re.match(r"^[0-9a-fA-F_-]{16,}$", t):
        return True

    # 2. Contém extensão de arquivo de vídeo ou prefixos brutos de câmera/upload
    if re.search(r"\.(mp4|mov|mkv|webm|avi)$", t, re.IGNORECASE):
        return True
    if re.search(r"(^vid_|^img_|^mvi_|whatsapp video|screen recording|_1080p|_720p)", t, re.IGNORECASE):
        return True
    if "_" in t and " " not in t:
        return True

    # 3. Título genérico demais (ex: "Aula 1", "Aula 02", "Vídeo 1", "Sem título")
    if re.match(r"^(aula|video|vídeo|lesson|parte|modulo|módulo|sem t[íi]tulo)\s*[-#:]?\s*\d*$", t, re.IGNORECASE):
        return True

    # 4. Igual ao nome bruto de importação e ainda sem descrição pedagógica
    if import_identifier and not has_description:
        raw_base = os.path.splitext(os.path.basename(import_identifier))[0].strip().lower()
        raw_clean = re.sub(r"^[\d\s._-]+", "", raw_base).strip()
        t_clean = re.sub(r"^[\d\s._-]+", "", t.lower()).strip()
        if raw_clean and t_clean == raw_clean and ":" not in t and len(t) < 28:
            return True

    return False


def _check_video_unoptimized_fast(video_url: Optional[str]) -> Tuple[bool, float, str]:
    """
    Retorna (unoptimized_video, size_mb, format_str) com cache em memória para auditoria rápida do curso.
    """
    if not video_url:
        return False, 0.0, ""

    clean_url = video_url.split("?")[0]
    ext = (os.path.splitext(clean_url)[1].lower().lstrip(".") or "mp4").upper()

    # Formatos brutos (.MOV, .MKV, .WEBM, .AVI) nunca estão em MP4 FastStart otimizado
    if ext in ("MOV", "MKV", "AVI", "WEBM"):
        s3_key = extract_s3_key_from_url(video_url)
        cached = _video_head_cache.get(s3_key) if s3_key else None
        if cached and cached.get("is_optimized"):
            return False, cached.get("size_mb", 0.0), "MP4"
        return True, (cached.get("size_mb", 0.0) if cached else 0.0), ext

    s3_key = extract_s3_key_from_url(video_url)
    if not s3_key:
        return False, 0.0, ext

    with _lock:
        if s3_key in _active_optimizations:
            return True, 0.0, ext
        prog = _optimization_progress.get(s3_key)
        if prog and prog.get("stage") == "completed":
            return False, prog.get("optimized_size_mb", 0.0), "MP4"

    cached = _video_head_cache.get(s3_key)
    if cached is not None:
        return not cached["is_optimized"], cached["size_mb"], cached["format"]

    s3 = get_s3_client()
    bucket = settings.B2_BUCKET_NAME
    if s3 and bucket:
        try:
            head = s3.head_object(Bucket=bucket, Key=s3_key)
            size_mb = round(int(head.get("ContentLength", 0)) / (1024 * 1024), 2)
            metadata = head.get("Metadata", {}) or {}
            is_opt = metadata.get("zv-optimized") == "1"
            fmt = "MP4" if is_opt else ext
            _video_head_cache[s3_key] = {
                "is_optimized": is_opt,
                "size_mb": size_mb,
                "format": fmt
            }
            return not is_opt, size_mb, fmt
        except Exception:
            pass

    return False, 0.0, ext


def audit_course_lessons_for_superadmin(course_id: int, db) -> dict:
    """
    Audita todas as aulas de um curso exclusivamente para o Super Admin, identificando:
    - unoptimized_video: Vídeo em .MOV ou sem otimização FastStart no B2
    - missing_description: Sem descrição criada com IA (< 25 caracteres)
    - missing_chapters: Sem capítulos/minutagem gerados por IA na transcrição
    - missing_thumbnail: Sem capa (thumbnail_url)
    - bad_title: Nome bruto (UUID, arquivo cru, genérico ou sem título decente por IA)
    """
    import json
    from concurrent.futures import ThreadPoolExecutor
    from sqlalchemy.orm import joinedload
    from app.models.course import Module, Lesson

    modules = (
        db.query(Module)
        .filter(Module.course_id == course_id)
        .options(
            joinedload(Module.lessons).joinedload(Lesson.transcription),
            joinedload(Module.lessons).joinedload(Lesson.videos)
        )
        .order_by(Module.order_index.asc(), Module.id.asc())
        .all()
    )

    all_lessons = []
    for mod in modules:
        for lesson in (mod.lessons or []):
            all_lessons.append((mod.id, lesson))

    # Pré-carregar metadados de vídeo do B2 em paralelo (máximo 8 threads)
    video_urls_to_check = {}
    for _, lesson in all_lessons:
        v_url = lesson.video_url
        if not v_url and lesson.videos:
            v_url = lesson.videos[0].video_url
        if v_url and (lesson.content_type or "video") == "video":
            video_urls_to_check[lesson.id] = v_url

    video_results = {}
    if video_urls_to_check:
        with ThreadPoolExecutor(max_workers=8) as executor:
            future_map = {
                executor.submit(_check_video_unoptimized_fast, url): lid
                for lid, url in video_urls_to_check.items()
            }
            for fut, lid in future_map.items():
                try:
                    video_results[lid] = fut.result()
                except Exception:
                    video_results[lid] = (False, 0.0, "")

    lessons_audit = {}
    counts = {
        "total_lessons": len(all_lessons),
        "any_issue": 0,
        "unoptimized_video": 0,
        "missing_description": 0,
        "missing_chapters": 0,
        "missing_thumbnail": 0,
        "bad_title": 0,
    }

    for mod_id, lesson in all_lessons:
        is_video_lesson = (lesson.content_type or "video") == "video"
        unopt_video, size_mb, fmt = video_results.get(lesson.id, (False, 0.0, ""))

        desc_text = (lesson.description or "").strip()
        missing_description = len(desc_text) < 25

        missing_thumbnail = not bool((lesson.thumbnail_url or "").strip())

        # Verifica capítulos e transcrição IA
        tr = lesson.transcription
        has_valid_chapters = False
        if tr and tr.status in ("ready", "completed") and tr.chapters:
            try:
                parsed_ch = json.loads(tr.chapters) if isinstance(tr.chapters, str) else tr.chapters
                if isinstance(parsed_ch, list) and len(parsed_ch) > 0:
                    has_valid_chapters = True
            except Exception:
                has_valid_chapters = False
        missing_chapters = is_video_lesson and not has_valid_chapters

        bad_title = is_bad_or_raw_lesson_title(
            title=lesson.title,
            import_identifier=lesson.import_identifier,
            has_description=not missing_description
        )

        any_issue = any([
            unopt_video,
            missing_description,
            missing_chapters,
            missing_thumbnail,
            bad_title
        ])

        if any_issue:
            counts["any_issue"] += 1
        if unopt_video:
            counts["unoptimized_video"] += 1
        if missing_description:
            counts["missing_description"] += 1
        if missing_chapters:
            counts["missing_chapters"] += 1
        if missing_thumbnail:
            counts["missing_thumbnail"] += 1
        if bad_title:
            counts["bad_title"] += 1

        lessons_audit[str(lesson.id)] = {
            "lesson_id": lesson.id,
            "module_id": mod_id,
            "unoptimized_video": unopt_video,
            "missing_description": missing_description,
            "missing_chapters": missing_chapters,
            "missing_thumbnail": missing_thumbnail,
            "bad_title": bad_title,
            "any_issue": any_issue,
            "size_mb": size_mb,
            "format": fmt
        }

    return {
        "course_id": course_id,
        "counts": counts,
        "lessons": lessons_audit
    }
