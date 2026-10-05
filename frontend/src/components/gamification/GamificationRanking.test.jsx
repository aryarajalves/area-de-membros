import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../../context/ToastContext';
import GamificationRanking from './GamificationRanking';

describe('GamificationRanking Component', () => {
  const mockRankingResponse = {
    period: 'monthly',
    month_name: 'Outubro/2026',
    ranking: [
      {
        rank: 1,
        user_id: 10,
        name: 'Aluno Campeão',
        email: 'campeao@test.com',
        avatar_url: null,
        points: 450,
        solutions_count: 5,
        lessons_completed_count: 20,
        badge: '🥇 Mestre da Comunidade',
        is_current_user: true
      },
      {
        rank: 2,
        user_id: 20,
        name: 'Aluno Vice',
        email: 'vice@test.com',
        avatar_url: null,
        points: 320,
        solutions_count: 3,
        lessons_completed_count: 15,
        badge: '🥈 Mentor Destaque',
        is_current_user: false
      },
      {
        rank: 3,
        user_id: 30,
        name: 'Aluno Bronze',
        email: 'bronze@test.com',
        avatar_url: null,
        points: 210,
        solutions_count: 1,
        lessons_completed_count: 12,
        badge: '🥉 Aluno Notável',
        is_current_user: false
      },
      {
        rank: 4,
        user_id: 40,
        name: 'Aluno Quarto',
        email: 'quarto@test.com',
        avatar_url: null,
        points: 110,
        solutions_count: 0,
        lessons_completed_count: 8,
        badge: '⭐ Top Estudante',
        is_current_user: false
      }
    ],
    my_position: {
      rank: 1,
      user_id: 10,
      name: 'Aluno Campeão',
      email: 'campeao@test.com',
      avatar_url: null,
      points: 450,
      solutions_count: 5,
      lessons_completed_count: 20,
      badge: '🥇 Mestre da Comunidade',
      is_current_user: true
    },
    total_participants: 4
  };

  const mockRules = [
    {
      action: 'support_solution',
      name: 'Melhor Solução no Suporte',
      points: 50,
      description: 'Quando uma resposta sua for marcada como Solução Oficial.',
      daily_limit: 'Sem limite diário'
    },
    {
      action: 'chat_message',
      name: 'Mensagem no Chat da Comunidade',
      points: 2,
      description: 'Participação no chat.',
      daily_limit: 'Limite diário: até 10 mensagens pontuadas por dia (20 pts/dia)'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'mock_token');

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/v1/gamification/ranking')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRankingResponse)
        });
      }
      if (urlStr.includes('/api/v1/gamification/rules')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRules)
        });
      }
      return Promise.reject(new Error('URL desconhecida: ' + urlStr));
    });
  });

  it('renders ranking header, podium cards, student banner and leaderboard table', async () => {
    const userAluno = { id: 10, name: 'Aluno Campeão', role: 'aluno' };

    render(
      <ToastProvider>
        <GamificationRanking user={userAluno} />
      </ToastProvider>
    );

    // Header
    expect(screen.getByText('Ranking da Comunidade')).toBeInTheDocument();

    // Aguardar carregar ranking e banner "Sua Posição"
    await waitFor(() => {
      expect(screen.getByText('Outubro/2026')).toBeInTheDocument();
      expect(screen.getByTestId('my-position-card')).toBeInTheDocument();
    });
    expect(screen.getByTestId('my-points-val')).toHaveTextContent('450');

    // Pódio dos Top 3
    expect(screen.getByTestId('podium-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('podium-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('podium-card-3')).toBeInTheDocument();
    expect(screen.getByTestId('podium-points-1')).toHaveTextContent('450');
    expect(screen.getByTestId('podium-points-2')).toHaveTextContent('320');
    expect(screen.getByTestId('podium-points-3')).toHaveTextContent('210');

    // Tabela completa
    expect(screen.getByTestId('ranking-table-container')).toBeInTheDocument();
    expect(screen.getByTestId('student-points-40')).toHaveTextContent('110 pts');
  });

  it('switches between monthly and all-time ranking period tabs', async () => {
    const userAluno = { id: 10, name: 'Aluno Campeão', role: 'aluno' };

    render(
      <ToastProvider>
        <GamificationRanking user={userAluno} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('tab-period-alltime')).toBeInTheDocument();
    });

    // Clicar em Histórico Geral
    fireEvent.click(screen.getByTestId('tab-period-alltime'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/gamification/ranking?period=all_time',
        expect.anything()
      );
    });
  });

  it('opens and closes the gamification rules modal', async () => {
    const userAluno = { id: 10, name: 'Aluno Campeão', role: 'aluno' };

    render(
      <ToastProvider>
        <GamificationRanking user={userAluno} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('open-rules-modal-btn')).toBeInTheDocument();
    });

    // Abrir modal de regras
    fireEvent.click(screen.getByTestId('open-rules-modal-btn'));

    expect(screen.getByTestId('gamification-rules-modal')).toBeInTheDocument();
    expect(screen.getByText('Regras de Pontuação & Gamificação')).toBeInTheDocument();
    expect(screen.getByText('Melhor Solução no Suporte')).toBeInTheDocument();
    expect(screen.getByText('+50 pts')).toBeInTheDocument();
    expect(screen.getByText(/Limite diário: até 10 mensagens/i)).toBeInTheDocument();

    // Fechar modal
    fireEvent.click(screen.getByTestId('close-rules-modal-btn'));
    expect(screen.queryByTestId('gamification-rules-modal')).not.toBeInTheDocument();
  });
});
