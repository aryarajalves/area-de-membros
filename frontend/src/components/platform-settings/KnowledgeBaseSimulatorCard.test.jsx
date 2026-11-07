import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KnowledgeBaseSimulatorCard from './KnowledgeBaseSimulatorCard';
import { ToastProvider } from '../../context/ToastContext';

describe('KnowledgeBaseSimulatorCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('allows user to type a query and view semantic search results', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/v1/tutor-ia/knowledge-base/simulate-search') && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              query: body.query,
              total_results: 1,
              results: [
                {
                  chunk_id: 101,
                  similarity: 0.885,
                  course_title: 'Curso de Astrologia',
                  lesson_title: 'Trânsitos de Marte',
                  start_time_str: '02:15',
                  end_time_str: '03:45',
                  content: 'Marte simboliza a força propulsora e iniciativa.'
                }
              ]
            })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <KnowledgeBaseSimulatorCard
          cardBg="rgba(255,255,255,0.05)"
          cardBorder="1px solid #333"
          textColor="#fff"
          subTextColor="#aaa"
          isLightBg={false}
        />
      </ToastProvider>
    );

    expect(screen.getByText(/Simulador de Busca Semântica/i)).toBeInTheDocument();

    const input = screen.getByTestId('input-simulate-query');
    fireEvent.change(input, { target: { value: 'O que Marte significa?' } });

    const searchBtn = screen.getByTestId('btn-simulate-search');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByTestId('sim-result-0')).toBeInTheDocument();
      expect(screen.getByText(/89% de similaridade/i)).toBeInTheDocument();
      expect(screen.getByText(/Marte simboliza a força propulsora/i)).toBeInTheDocument();
    });
  });
});
