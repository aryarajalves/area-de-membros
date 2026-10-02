/**
 * Utilitários para formatação e normalização de dados de aulas e controle de tempo de vídeos.
 */

/**
 * Normaliza e formata a duração da aula para exibição na interface.
 * Se o valor for apenas numérico (ex: "20"), retorna "20 min".
 * Se já contiver unidade ou formato de relógio (ex: "20 min" ou "15:30"), mantém o valor.
 *
 * @param {string|number|null} duration
 * @returns {string}
 */
export function formatLessonDuration(duration) {
  if (duration === null || duration === undefined) return '';
  const trimmed = String(duration).trim();
  if (!trimmed) return '';

  if (/^\d+$/.test(trimmed)) {
    return `${trimmed} min`;
  }

  return trimmed;
}

/**
 * Normaliza a duração para persistência antes de enviar à API.
 * Se o usuário preencher apenas "20", converte para "20 min".
 *
 * @param {string|number|null} duration
 * @returns {string|null}
 */
export function normalizeLessonDuration(duration) {
  if (duration === null || duration === undefined) return null;
  const trimmed = String(duration).trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    return `${trimmed} min`;
  }

  return trimmed;
}

/**
 * Converte uma string de duração (ex: "20 min", "20", "15:30", "01:20:00") para segundos totais.
 * Útil para calcular porcentagem de progresso e tempo restante mesmo quando o vídeo está em streaming.
 *
 * @param {string|number|null} durationStr
 * @returns {number} Segundos totais (ou 0 se inválido)
 */
export function parseDurationToSeconds(durationStr) {
  if (durationStr === null || durationStr === undefined) return 0;
  if (typeof durationStr === 'number') return Math.max(0, durationStr);

  const trimmed = String(durationStr).trim().toLowerCase();
  if (!trimmed) return 0;

  // Formato relógio "HH:MM:SS" ou "MM:SS"
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
  }

  // Formato "20 min", "20min", "20 m"
  const minMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:min|m|minutos)?$/);
  if (minMatch) {
    return Math.round(parseFloat(minMatch[1]) * 60);
  }

  // Formato "1h 20min"
  const hourMinMatch = trimmed.match(/^(?:(\d+)\s*h(?:oras?)?)?\s*(?:(\d+)\s*m(?:in(?:utos?)?)?)?$/);
  if (hourMinMatch && (hourMinMatch[1] || hourMinMatch[2])) {
    const hours = parseInt(hourMinMatch[1], 10) || 0;
    const mins = parseInt(hourMinMatch[2], 10) || 0;
    return hours * 3600 + mins * 60;
  }

  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? 0 : Math.round(parsed * 60);
}

/**
 * Formata um total de segundos em formato de timer (MM:SS ou HH:MM:SS).
 *
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatSecondsToTimer(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return '00:00';

  const secs = Math.floor(totalSeconds);
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSeconds = secs % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
  }
  return `${pad(minutes)}:${pad(remainingSeconds)}`;
}

/**
 * Verifica de forma híbrida se uma aula deve ser tratada como "Em Breve":
 * 1. Se foi explicitamente marcada com availability_status === 'coming_soon'
 * 2. Ou se a aula ainda não possui nenhum vídeo enviado/vinculado
 *
 * @param {object|null} lesson
 * @returns {boolean}
 */
export function isLessonComingSoon(lesson) {
  if (!lesson) return false;
  if (lesson.availability_status === 'coming_soon') return true;
  
  // Aulas de texto ou quiz não dependem de vídeo para estarem disponíveis
  if (lesson.content_type === 'text' || lesson.content_type === 'quiz') {
    return false;
  }

  const hasVideosArray = Array.isArray(lesson.videos) && lesson.videos.some((v) => v?.video_url && String(v.video_url).trim());
  const hasMainVideoUrl = Boolean(lesson.video_url && String(lesson.video_url).trim());
  return !hasVideosArray && !hasMainVideoUrl;
}
