import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useTutorChatStream } from './useTutorChatStream';

describe('useTutorChatStream Hook', () => {
  it('streams tokens and calls onDone upon completion', async () => {
    const encoder = new TextEncoder();
    const chunks = [
      encoder.encode('data: {"type": "token", "token": "Olá"}\n\n'),
      encoder.encode('data: {"type": "token", "token": " Mundo!"}\n\n'),
      encoder.encode('data: {"type": "done", "reply": "Olá Mundo!", "message_id": 123}\n\n')
    ];

    let chunkIdx = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (chunkIdx < chunks.length) {
          return Promise.resolve({ value: chunks[chunkIdx++], done: false });
        }
        return Promise.resolve({ value: undefined, done: true });
      })
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader }
    });

    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useTutorChatStream());

    await result.current.streamMessage({
      courseId: 1,
      lessonId: 2,
      message: 'Oi',
      headers: {},
      onToken,
      onDone,
      onError
    });

    expect(onToken).toHaveBeenCalledWith('Olá');
    expect(onToken).toHaveBeenCalledWith(' Mundo!');
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({
      type: 'done',
      message_id: 123
    }));
    expect(onError).not.toHaveBeenCalled();
  });

  it('triggers onError when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: () => Promise.resolve({ detail: 'Cota esgotada.' })
    });

    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useTutorChatStream());

    await expect(
      result.current.streamMessage({
        courseId: 1,
        lessonId: 2,
        message: 'Oi',
        headers: {},
        onToken,
        onDone,
        onError
      })
    ).rejects.toThrow('Cota esgotada.');

    expect(onError).toHaveBeenCalled();
  });
});
