import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LessonAiTranscriptionProcessing from './LessonAiTranscriptionProcessing';

describe('LessonAiTranscriptionProcessing Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza o cronômetro, porcentagem de progresso e estimativa restante', () => {
    render(
      <LessonAiTranscriptionProcessing
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        borderColor="rgba(255, 255, 255, 0.1)"
        isManager={true}
        onReset={vi.fn()}
        lesson={{ id: 70, title: 'Aula Testes', duration: 30 }}
      />
    );

    // Cronômetro inicial
    const timerBadge = screen.getByTestId('ai-timer-badge');
    expect(timerBadge).toBeDefined();
    expect(timerBadge.textContent).toContain('00:00');

    // Badge de porcentagem
    const progressBadge = screen.getByTestId('ai-progress-badge');
    expect(progressBadge).toBeDefined();
    expect(progressBadge.textContent).toContain('% concluído');
    expect(progressBadge.textContent).toContain('Faltam');

    // Badge de tempo restante
    const remainingBadge = screen.getByTestId('ai-remaining-badge');
    expect(remainingBadge).toBeDefined();
    expect(remainingBadge.textContent).toContain('restantes');

    // Barra de progresso preenchida
    const progressBar = screen.getByTestId('ai-progress-bar-fill');
    expect(progressBar).toBeDefined();
    expect(progressBar.style.width).toMatch(/%$/);
  });

  it('avança o cronômetro segundo a segundo e atualiza a porcentagem', () => {
    render(
      <LessonAiTranscriptionProcessing
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        borderColor="rgba(255, 255, 255, 0.1)"
        isManager={true}
        onReset={vi.fn()}
        lesson={{ id: 70, duration: 10 }}
      />
    );

    // Avança 5 segundos
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const timerBadge = screen.getByTestId('ai-timer-badge');
    expect(timerBadge.textContent).toContain('00:05');

    // Avança mais 65 segundos (total 70s = 01:10)
    act(() => {
      vi.advanceTimersByTime(65000);
    });
    expect(timerBadge.textContent).toContain('01:10');
  });

  it('chama onReset ao clicar no botão de Cancelar / Reiniciar', () => {
    const handleReset = vi.fn();
    render(
      <LessonAiTranscriptionProcessing
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        borderColor="rgba(255, 255, 255, 0.1)"
        isManager={true}
        onReset={handleReset}
        lesson={{ id: 70 }}
      />
    );

    const cancelBtn = screen.getByTestId('btn-cancel-transcription');
    fireEvent.click(cancelBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('não exibe botão de cancelar se o usuário não for gestor', () => {
    render(
      <LessonAiTranscriptionProcessing
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        borderColor="rgba(255, 255, 255, 0.1)"
        isManager={false}
        onReset={vi.fn()}
        lesson={{ id: 70 }}
      />
    );

    expect(screen.queryByTestId('btn-cancel-transcription')).toBeNull();
  });

  it('utiliza o progresso real enviado pelo backend (progress_percent e progress_step)', () => {
    render(
      <LessonAiTranscriptionProcessing
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        borderColor="rgba(255, 255, 255, 0.1)"
        isManager={true}
        onReset={vi.fn()}
        lesson={{ id: 70, duration: '01:48:56' }}
        progressData={{
          progress_percent: 48,
          progress_step: 'Transcrevendo bloco 3 de 6 com OpenAI Whisper...',
          estimated_remaining_seconds: 120
        }}
      />
    );

    expect(screen.getByText('Transcrevendo bloco 3 de 6 com OpenAI Whisper...')).toBeDefined();
    expect(screen.getByTestId('ai-progress-badge').textContent).toContain('48% concluído');
    expect(screen.getByTestId('ai-progress-badge').textContent).toContain('Faltam 52%');
    expect(screen.getByTestId('ai-remaining-badge').textContent).toContain('02:00');
  });
});
