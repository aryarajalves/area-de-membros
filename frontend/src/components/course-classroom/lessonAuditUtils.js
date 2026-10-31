// Utilidades de auditoria pedagógica e técnica de aulas (Super Admin)
export function isClientBadLessonTitle(title, importIdentifier = '', hasDescription = false) {
  const t = (title || '').trim();
  if (t.length < 8) return true;

  // UUID ou hash longo (ex: 2a8bcc96-3336-462f-a0a0-cacde04f86b9)
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(t)) {
    return true;
  }
  if (/^[0-9a-fA-F_-]{16,}$/.test(t)) {
    return true;
  }

  // Extensão de arquivo ou prefixo bruto de gravação
  if (/\.(mp4|mov|mkv|webm|avi)$/i.test(t)) return true;
  if (/(^vid_|^img_|^mvi_|whatsapp video|screen recording|_1080p|_720p)/i.test(t)) return true;
  if (t.includes('_') && !t.includes(' ')) return true;

  // Genérico demais ("Aula 1", "Vídeo 02", "Sem título")
  if (/^(aula|video|vídeo|lesson|parte|modulo|módulo|sem t[íi]tulo)\s*[-#:]?\s*\d*$/i.test(t)) {
    return true;
  }

  if (importIdentifier && !hasDescription) {
    const rawBase = importIdentifier.replace(/\.[^/.]+$/, '').trim().toLowerCase();
    const rawClean = rawBase.replace(/^[\d\s._-]+/, '').trim();
    const tClean = t.toLowerCase().replace(/^[\d\s._-]+/, '').trim();
    if (rawClean && tClean === rawClean && !t.includes(':') && t.length < 28) {
      return true;
    }
  }

  return false;
}

export function buildClientLessonAudit(lesson, serverEntry = null) {
  const isVideo = (lesson?.content_type || 'video') === 'video';
  const vUrl = lesson?.video_url || lesson?.videos?.[0]?.video_url || '';
  const cleanUrl = vUrl.split('?')[0].toLowerCase();
  const isRawExt = /\.(mov|mkv|avi|webm)$/i.test(cleanUrl);

  const descText = (lesson?.description || '').trim();
  const missingDescription = serverEntry?.missing_description ?? descText.length < 25;
  const missingThumbnail = serverEntry?.missing_thumbnail ?? !Boolean((lesson?.thumbnail_url || '').trim());

  const unoptimizedVideo =
    serverEntry?.unoptimized_video ??
    (isVideo && Boolean(vUrl) && (isRawExt || lesson?.is_optimized === false));

  const hasLocalChapters =
    Array.isArray(lesson?.chapters) && lesson.chapters.length > 0
      ? true
      : Boolean(lesson?.transcription?.chapters && lesson.transcription.chapters !== '[]');

  const missingChapters =
    serverEntry?.missing_chapters ??
    (isVideo ? !hasLocalChapters && lesson?.has_chapters !== true : false);

  const badTitle =
    serverEntry?.bad_title ??
    isClientBadLessonTitle(lesson?.title, lesson?.import_identifier, !missingDescription);

  const anyIssue = Boolean(
    unoptimizedVideo ||
      missingDescription ||
      missingChapters ||
      missingThumbnail ||
      badTitle
  );

  return {
    lesson_id: lesson?.id,
    unoptimized_video: Boolean(unoptimizedVideo),
    missing_description: Boolean(missingDescription),
    missing_chapters: Boolean(missingChapters),
    missing_thumbnail: Boolean(missingThumbnail),
    bad_title: Boolean(badTitle),
    any_issue: anyIssue,
    size_mb: serverEntry?.size_mb || 0,
    format: serverEntry?.format || (isRawExt ? cleanUrl.split('.').pop().toUpperCase() : '')
  };
}
