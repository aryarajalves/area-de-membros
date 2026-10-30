/**
 * Serviço para persistência das preferências de reprodução do aluno (velocidade de reprodução, modo teatro).
 */

export async function savePlaybackRateApi(playbackRate, token) {
  const authToken = token || localStorage.getItem('auth_token') || localStorage.getItem('token');
  if (!authToken) return null;

  try {
    const res = await fetch('/api/v1/auth/playback-rate', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ playback_rate: parseFloat(playbackRate) })
    });

    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch {
    // Falha de rede silenciosa para não interromper a experiência do aluno
    return null;
  }
}
