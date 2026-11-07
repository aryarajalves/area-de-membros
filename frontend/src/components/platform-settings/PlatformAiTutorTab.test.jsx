import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlatformAiTutorTab from './PlatformAiTutorTab';
import { ToastProvider } from '../../context/ToastContext';

describe('PlatformAiTutorTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings and allows editing tutor name and saving', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/v1/tutor-ia/settings') && (!opts || opts.method === 'GET' || !opts.method)) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tutor_name: 'Sofia - Tutora IA',
              default_monthly_free_questions: 5,
              system_prompt: 'Você é o Tutor oficial da plataforma.',
              temperature: 0.4,
              model_name: 'gpt-4o-mini',
              is_enabled: true,
              sales_checkout_url: 'https://pay.hotmart.com/TESTE',
              monthly_price_brl: 12.0,
              rag_top_k: 4,
              rag_min_similarity: 0.35
            })
        });
      }
      if (url.includes('/api/v1/tutor-ia/settings') && opts?.method === 'PUT') {
        const body = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(body)
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <PlatformAiTutorTab />
      </ToastProvider>
    );

    // Aguarda carregar dados
    expect(await screen.findByDisplayValue('Sofia - Tutora IA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Você é o Tutor oficial da plataforma.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument(); // rag_top_k
    expect(screen.getByDisplayValue('0.35')).toBeInTheDocument(); // rag_min_similarity

    // Altera nome do tutor e parâmetros do RAG
    const nameInput = screen.getByTestId('input-tutor-name');
    fireEvent.change(nameInput, { target: { value: 'Atena IA' } });

    const topKInput = screen.getByTestId('input-rag-top-k');
    fireEvent.change(topKInput, { target: { value: '6' } });

    const minSimInput = screen.getByTestId('input-rag-min-similarity');
    fireEvent.change(minSimInput, { target: { value: '0.45' } });

    // Insere tag dinâmica
    const tagBtn = screen.getByText('{nome_aluno}');
    fireEvent.click(tagBtn);

    // Salva configurações
    const saveBtn = screen.getByTestId('btn-save-tutor-settings');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/tutor-ia/settings',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"rag_top_k":6')
        })
      );
    });
  });

  it('allows clearing numeric fields completely and typing new values without restoring old values', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/v1/tutor-ia/settings') && (!opts || opts.method === 'GET' || !opts.method)) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tutor_name: 'Tutor IA',
              default_monthly_free_questions: 3,
              system_prompt: '',
              temperature: 0.3,
              model_name: 'gpt-4o-mini',
              is_enabled: true,
              sales_checkout_url: '',
              monthly_price_brl: 10.0,
              rag_top_k: 4,
              rag_min_similarity: 0.35
            })
        });
      }
      if (url.includes('/api/v1/tutor-ia/settings') && opts?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(JSON.parse(opts.body))
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <PlatformAiTutorTab />
      </ToastProvider>
    );

    const topKInput = await screen.findByTestId('input-rag-top-k');
    const minSimInput = screen.getByTestId('input-rag-min-similarity');

    // Usuário apaga completamente o campo (backspace/delete)
    fireEvent.change(topKInput, { target: { value: '' } });
    expect(topKInput.value).toBe('');

    // Usuário digita o novo valor limpo sem concatenar
    fireEvent.change(topKInput, { target: { value: '8' } });
    expect(topKInput.value).toBe('8');

    // Usuário apaga a similaridade e digita com vírgula ou ponto
    fireEvent.change(minSimInput, { target: { value: '' } });
    expect(minSimInput.value).toBe('');
    fireEvent.change(minSimInput, { target: { value: '0,50' } });
    expect(minSimInput.value).toBe('0,50');

    // Salva e valida conversão correta
    const saveBtn = screen.getByTestId('btn-save-tutor-settings');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/tutor-ia/settings',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"rag_top_k":8')
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/tutor-ia/settings',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"rag_min_similarity":0.5')
        })
      );
    });
  });

  it('switches between settings and insights sub-tabs', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/tutor-ia/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tutor_name: 'Tutor IA' })
        });
      }
      if (url.includes('/api/v1/tutor-ia/analytics/insights')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              total_questions: 10,
              total_likes: 9,
              total_dislikes: 1,
              satisfaction_rate: 90.0,
              top_questioned_lessons: [],
              recent_negative_feedbacks: []
            })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <PlatformAiTutorTab />
      </ToastProvider>
    );

    expect(await screen.findByTestId('tab-tutor-settings')).toBeInTheDocument();
    const insightsTabBtn = screen.getByTestId('tab-tutor-insights');
    expect(insightsTabBtn).toBeInTheDocument();

    fireEvent.click(insightsTabBtn);
    expect(await screen.findByTestId('tutor-insights-analytics-card')).toBeInTheDocument();

    const suggestionsTabBtn = screen.getByTestId('tab-tutor-suggestions');
    expect(suggestionsTabBtn).toBeInTheDocument();
    fireEvent.click(suggestionsTabBtn);
    expect(await screen.findByTestId('tutor-suggestions-list')).toBeInTheDocument();
  });
});
