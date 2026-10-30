"""
Script para inspecionar e otimizar mídias existentes no Backblaze B2 e no banco de dados.
Pode ser executado via CLI:
  python scripts/optimize_existing_media.py --inspect
  python scripts/optimize_existing_media.py --optimize-images
  python scripts/optimize_existing_media.py --optimize-videos
"""
import os
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.storage import get_s3_client
from app.services.image_optimizer import optimize_image
from app.services.video_optimizer import optimize_video_file


def list_all_b2_objects(prefix: str):
    s3 = get_s3_client()
    bucket = settings.B2_BUCKET_NAME
    if not s3 or not bucket:
        print("S3/B2 nao configurado.")
        return []

    items = []
    continuation_token = None
    while True:
        kwargs = {"Bucket": bucket, "Prefix": prefix}
        if continuation_token:
            kwargs["ContinuationToken"] = continuation_token
        resp = s3.list_objects_v2(**kwargs)
        items.extend(resp.get("Contents", []))
        if resp.get("IsTruncated"):
            continuation_token = resp.get("NextContinuationToken")
        else:
            break
    return items


def inspect_bucket():
    thumbs = list_all_b2_objects("AreaDeMembros/thumbnails/")
    vids = list_all_b2_objects("AreaDeMembros/videos/")
    total_thumb_mb = sum(o["Size"] for o in thumbs) / (1024 * 1024)
    total_vid_mb = sum(o["Size"] for o in vids) / (1024 * 1024)
    print(f"=== BACKBLAZE B2 ({settings.B2_BUCKET_NAME}) ===")
    print(f"Thumbnails encontrados: {len(thumbs)} (Total: {total_thumb_mb:.2f} MB)")
    for t in sorted(thumbs, key=lambda x: x["Size"], reverse=True)[:15]:
        print(f"  - {t['Key']} | {t['Size'] / (1024 * 1024):.2f} MB")
    print(f"\nVideos encontrados: {len(vids)} (Total: {total_vid_mb:.2f} MB)")
    for v in sorted(vids, key=lambda x: x["Size"], reverse=True)[:15]:
        print(f"  - {v['Key']} | {v['Size'] / (1024 * 1024):.2f} MB")


def _optimize_single_thumb(item):
    s3 = get_s3_client()
    bucket = settings.B2_BUCKET_NAME
    key = item["Key"]
    size_kb = item["Size"] / 1024
    try:
        head = s3.head_object(Bucket=bucket, Key=key)
        meta = head.get("Metadata", {}) or {}
        cache_ctrl = head.get("CacheControl", "")
        if meta.get("zv-optimized") == "1" and "max-age" in cache_ctrl and size_kb < 300:
            return ("skipped", key, size_kb, size_kb)

        obj = s3.get_object(Bucket=bucket, Key=key)
        raw_bytes = obj["Body"].read()
        opt_bytes, content_type, _ = optimize_image(raw_bytes, max_width=1280, quality=82)

        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=opt_bytes,
            ContentType=content_type,
            CacheControl="public, max-age=31536000, immutable",
            Metadata={"zv-optimized": "1"}
        )
        new_kb = len(opt_bytes) / 1024
        return ("ok", key, size_kb, new_kb)
    except Exception as exc:
        return ("error", key, size_kb, str(exc))


def optimize_all_b2_thumbnails_in_place():
    thumbs = list_all_b2_objects("AreaDeMembros/thumbnails/")
    print(f"Iniciando otimizacao paralela de {len(thumbs)} thumbnails no B2...")
    optimized_count = 0
    saved_kb = 0.0

    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = [pool.submit(_optimize_single_thumb, item) for item in thumbs]
        for idx, fut in enumerate(as_completed(futures), 1):
            status, key, old_kb, res = fut.result()
            if status == "ok":
                optimized_count += 1
                saved_kb += (old_kb - res)
                if optimized_count % 20 == 0 or optimized_count <= 5:
                    print(f"[{idx}/{len(thumbs)}] OK: {key} ({old_kb:.0f} KB -> {res:.0f} KB)")
            elif status == "error":
                print(f"[{idx}/{len(thumbs)}] ERRO em {key}: {res}")

    print(f"\nConcluido! Imagens otimizadas: {optimized_count}/{len(thumbs)} | Economia total: {saved_kb / 1024:.2f} MB")
    return optimized_count


def optimize_all_b2_videos_in_place(limit: int = None):
    """
    Otimiza os vídeos em AreaDeMembros/videos/ diretamente na mesma chave S3
    (converte .mov e .mp4 pesados para MP4 H.264 com +faststart e Cache-Control de 1 ano),
    garantindo compatibilidade imediata com qualquer banco de dados em produção.
    """
    s3 = get_s3_client()
    bucket = settings.B2_BUCKET_NAME
    vids = list_all_b2_objects("AreaDeMembros/videos/")
    # Prioriza arquivos .mov e os maiores primeiro
    vids.sort(key=lambda x: (1 if x["Key"].lower().endswith(".mov") else 0, x["Size"]), reverse=True)
    if limit:
        vids = vids[:limit]

    print(f"Verificando {len(vids)} videos no B2 para otimizacao FastStart + H.264...")
    optimized_count = 0

    for idx, item in enumerate(vids, 1):
        key = item["Key"]
        size_mb = item["Size"] / (1024 * 1024)
        if item["Size"] < 1024:
            continue

        try:
            head = s3.head_object(Bucket=bucket, Key=key)
            meta = head.get("Metadata", {}) or {}
            if meta.get("zv-optimized") == "1":
                continue

            ext = os.path.splitext(key)[1].lower() or ".mp4"
            print(f"[{idx}/{len(vids)}] Baixando e convertendo {key} ({size_mb:.2f} MB)...")
            with tempfile.TemporaryDirectory() as tmpdir:
                in_path = os.path.join(tmpdir, f"in{ext}")
                out_path = os.path.join(tmpdir, "out.mp4")
                s3.download_file(bucket, key, in_path)

                if optimize_video_file(in_path, out_path, crf=26, preset="veryfast"):
                    new_mb = os.path.getsize(out_path) / (1024 * 1024)
                    extra_args = {
                        "ContentType": "video/mp4",
                        "CacheControl": "public, max-age=31536000, immutable",
                        "Metadata": {"zv-optimized": "1"}
                    }
                    s3.upload_file(out_path, bucket, key, ExtraArgs=extra_args)
                    print(f"   -> [OK] {key}: {size_mb:.2f} MB -> {new_mb:.2f} MB (+faststart)")
                    optimized_count += 1
                else:
                    print(f"   -> [AVISO] FFmpeg nao conseguiu converter {key}")
        except Exception as exc:
            print(f"   -> [ERRO] {key}: {exc}")

    print(f"Videos otimizados nesta execucao: {optimized_count}")
    return optimized_count


if __name__ == "__main__":
    if "--inspect" in sys.argv:
        inspect_bucket()
    elif "--optimize-images" in sys.argv:
        optimize_all_b2_thumbnails_in_place()
    elif "--optimize-videos" in sys.argv:
        optimize_all_b2_videos_in_place()
    else:
        inspect_bucket()
