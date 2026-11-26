import * as Sentry from '@sentry/react';

let _isInitialized = false;

export function isSentryInitialized() {
  return _isInitialized;
}

export function _resetSentryForTests() {
  _isInitialized = false;
}

/**
 * Associa ou limpa o usuário autenticado no contexto do Sentry
 * para identificar exatamente qual aluno enfrentou o erro ou travamento.
 */
export function setSentryUser(user) {
  if (!_isInitialized) return;
  try {
    if (user && (user.id || user.email)) {
      Sentry.setUser({
        id: user.id ? String(user.id) : undefined,
        email: user.email || undefined,
        username: user.name || undefined,
        role: user.role || undefined,
      });
    } else {
      Sentry.setUser(null);
    }
  } catch {
    // Nunca interrompe a UI por falha de telemetria
  }
}

/**
 * Inicializa o Sentry no frontend buscando a configuração dinâmica do backend
 * com túnel anti-firewall (/api/v1/logs/sentry-tunnel) e Session Replay em erros.
 */
export async function initFrontendSentry() {
  if (_isInitialized || typeof window === 'undefined') return false;

  let config = null;
  try {
    if (typeof fetch === 'function') {
      const res = await fetch('/api/v1/logs/sentry-config');
      if (res?.ok) {
        config = await res.json();
      }
    }
  } catch {
    // Fallback para variável de build caso backend esteja indisponível no boot
  }

  const fallbackDsn = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SENTRY_DSN : '';
  const dsn = (config?.enabled && config?.dsn) ? config.dsn : fallbackDsn;
  if (!dsn) return false;

  try {
    Sentry.init({
      dsn,
      environment: config?.environment || 'production',
      tunnel: config?.tunnel || '/api/v1/logs/sentry-tunnel',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          maskAllInputs: true,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: config?.traces_sample_rate ?? 0.2,
      replaysSessionSampleRate: config?.replays_session_sample_rate ?? 0.05,
      replaysOnErrorSampleRate: config?.replays_on_error_sample_rate ?? 1.0,
    });
    _isInitialized = true;

    try {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        setSentryUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Envia ao Sentry eventos críticos do player de vídeo (buffering travado 8s, erro de rede/codec)
 * permitindo visualizar o Session Replay e o contexto técnico da aula afetada.
 */
export function captureVideoIssueInSentry({
  eventType,
  title,
  src,
  currentTime = 0,
  readyState = null,
  networkState = null,
  errorCode = null,
  errorMessage = null,
  retryAttempt = 0,
}) {
  if (!_isInitialized) return;
  try {
    Sentry.withScope((scope) => {
      scope.setLevel(eventType === 'VIDEO_STREAM_ERROR' ? 'error' : 'warning');
      scope.setTag('feature', 'video-player');
      scope.setTag('video_event', eventType || 'UNKNOWN');
      scope.setTag('video_error_code', errorCode != null ? String(errorCode) : 'none');
      scope.setExtras({
        lesson_title: title || 'N/A',
        video_url: src || 'N/A',
        current_time: currentTime,
        ready_state: readyState,
        network_state: networkState,
        error_message: errorMessage,
        retry_attempt: retryAttempt,
      });
      Sentry.captureMessage(`[VIDEO PLAYER] ${eventType}: ${title || 'Aula sem título'}`);
    });
  } catch {
    // Nunca interrompe a reprodução do vídeo
  }
}
