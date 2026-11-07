import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TutorFloatingWidget from './TutorFloatingWidget';
import { ToastProvider } from '../../context/ToastContext';

describe('TutorFloatingWidget Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/tutor-ia/status')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              is_active: false,
              can_ask: true,
              remaining_free: 3,
              total_monthly_limit: 3,
              sales_checkout_url: null,
              monthly_price_brl: 10.0
            })
        });
      }
      if (url.includes('/api/v1/tutor-ia/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('toggles floating drawer when clicked and supports changing scope', async () => {
    render(
      <ToastProvider>
        <TutorFloatingWidget courseId={1} lessonId={10} currentUser={{ id: 1 }} />
      </ToastProvider>
    );

    // Botão flutuante visível
    const openBtn = screen.getByTestId('btn-open-tutor-floating-widget');
    expect(openBtn).toBeInTheDocument();

    // Clica para abrir
    fireEvent.click(openBtn);

    // Drawer aberto
    expect(screen.getByTestId('tutor-floating-drawer')).toBeInTheDocument();
    expect(screen.getByText('Tutor IA 24h')).toBeInTheDocument();

    // Alternar escopo para "Todas as Aulas"
    const allLessonsBtn = screen.getByText('Todas as Aulas');
    fireEvent.click(allLessonsBtn);

    // Fechar pelo botão X
    const closeBtn = screen.getByTestId('btn-close-tutor-drawer');
    fireEvent.click(closeBtn);

    // Deve voltar a exibir o botão flutuante
    expect(screen.getByTestId('btn-open-tutor-floating-widget')).toBeInTheDocument();
  });

  it('closes drawer when pressing Escape', () => {
    render(
      <ToastProvider>
        <TutorFloatingWidget courseId={1} lessonId={10} currentUser={{ id: 1 }} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('btn-open-tutor-floating-widget'));
    expect(screen.getByTestId('tutor-floating-drawer')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('tutor-floating-drawer')).not.toBeInTheDocument();
  });

  it('não exibe o botão flutuante quando a aula não possui transcrição concluída', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/transcription')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'not_started', full_transcript: '' })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <TutorFloatingWidget courseId={1} moduleId={4} lessonId={70} currentUser={{ id: 1 }} />
      </ToastProvider>
    );

    expect(screen.queryByTestId('btn-open-tutor-floating-widget')).not.toBeInTheDocument();
  });

  it('exibe o botão flutuante quando a transcrição da aula estiver concluída ou via evento em tempo real', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/transcription')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'not_started', full_transcript: '' })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await act(async () => {
      render(
        <ToastProvider>
          <TutorFloatingWidget courseId={1} moduleId={4} lessonId={70} currentUser={{ id: 1 }} />
        </ToastProvider>
      );
    });

    expect(screen.queryByTestId('btn-open-tutor-floating-widget')).not.toBeInTheDocument();

    // Dispara evento de conclusão da transcrição em tempo real
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('lesson-transcription-status-updated', {
          detail: { lessonId: 70, status: 'completed', isCompleted: true }
        })
      );
    });

    expect(screen.getByTestId('btn-open-tutor-floating-widget')).toBeInTheDocument();
  });
});
