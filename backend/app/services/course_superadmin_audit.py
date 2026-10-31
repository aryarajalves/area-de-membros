"""
Serviço de Auditoria Rápida de Aulas do Curso para o Super Admin.
Identifica vídeos não otimizados, aulas sem descrição IA, sem capítulos IA, sem thumbnail ou com títulos brutos.
"""
import os
import re
import json
from typing import Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.orm import joinedload

from app.core.config import settings
from app.services.storage import get_s3_client


def is_bad_or_raw_lesson_title(
    title: Optional[str],
    import_identifier: Optional[str] = None,
    has_description: bool = False
) -> bool:
    """
    Identifica se o título da aula ainda é um nome bruto de arquivo, UUID/hash ou genérico
    que não foi aprimorado pela IA.
    """
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


def check_video_unoptimized_fast(
    video_url: Optional[str],
    extract_s3_key_fn,
    active_optimizations: set,
    optimization_progress: dict,
    video_head_cache: dict,
    lock
) -> Tuple[bool, float, str]:
    """
    Retorna (unoptimized_video, size_mb, format_str) com cache em memória para auditoria rápida do curso.
    """
    if not video_url:
        return False, 0.0, ""

    clean_url = video_url.split("?")[0]
    ext = (os.path.splitext(clean_url)[1].lower().lstrip(".") or "mp4").upper()

    # Formatos brutos (.MOV, .MKV, .WEBM, .AVI) nunca estão em MP4 FastStart otimizado
    if ext in ("MOV", "MKV", "AVI", "WEBM"):
        s3_key = extract_s3_key_fn(video_url)
        cached = video_head_cache.get(s3_key) if s3_key else None
        if cached and cached.get("is_optimized"):
            return False, cached.get("size_mb", 0.0), "MP4"
        return True, (cached.get("size_mb", 0.0) if cached else 0.0), ext

    s3_key = extract_s3_key_fn(video_url)
    if not s3_key:
        return False, 0.0, ext

    with lock:
        if s3_key in active_optimizations:
            return True, 0.0, ext
        prog = optimization_progress.get(s3_key)
        if prog and prog.get("stage") == "completed":
            return False, prog.get("optimized_size_mb", 0.0), "MP4"

    cached = video_head_cache.get(s3_key)
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
            video_head_cache[s3_key] = {
                "is_optimized": is_opt,
                "size_mb": size_mb,
                "format": fmt
            }
            return not is_opt, size_mb, fmt
        except Exception:
            pass

    return False, 0.0, ext


def run_course_superadmin_audit(course_id: int, db, check_video_fn) -> dict:
    """
    Audita todas as aulas de um curso exclusivamente para o Super Admin.
    """
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
                executor.submit(check_video_fn, url): lid
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
