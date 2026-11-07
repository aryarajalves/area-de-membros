import { useCallback } from 'react';

/**
 * Hook para orquestrar o envio de mensagens e recepção de streaming Server-Sent Events (SSE).
 */
export function useTutorChatStream() {
  const streamMessage = useCallback(async ({
    courseId,
    lessonId,
    message,
    headers,
    onToken,
    onDone,
    onError
  }) => {
    try {
      const res = await fetch('/api/v1/tutor-ia/chat/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          course_id: courseId,
          lesson_id: lessonId,
          message
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const err = new Error(errJson.detail || 'Falha ao se comunicar com o Tutor IA.');
        err.status = res.status;
        throw err;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let receivedDone = false;
      let tokenCount = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.substring(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'token' && onToken) {
                tokenCount += 1;
                onToken(parsed.token);
              } else if (parsed.type === 'done' && onDone) {
                receivedDone = true;
                onDone(parsed);
              } else if (parsed.type === 'error') {
                const streamErr = new Error(parsed.detail || 'Erro durante a transmissão.');
                streamErr.status = parsed.status || 500;
                throw streamErr;
              }
            } catch (errParse) {
              if (errParse.status || errParse.message?.includes('Tutor IA') || errParse.message?.includes('erro')) {
                throw errParse;
              }
              console.error('Erro ao processar chunk de stream:', errParse);
            }
          }
        }
      }

      if (!receivedDone && tokenCount === 0) {
        throw new Error('Conexão encerrada sem resposta do Tutor IA. Tente novamente.');
      }
    } catch (err) {
      if (onError) onError(err);
      throw err;
    }
  }, []);

  return { streamMessage };
}
