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

  const mockCompletedPeriods = {
    completed_months: [
      { key: '2026-09', label: 'Setembro/2026', year: 2026, month: 9 },
      { key: '2026-08', label: 'Agosto/2026', year: 2026, month: 8 }
    ],
    completed_years: [
      { key: '2025', label: 'Ano de 2025', year: 2025, month: null },
      { key: '2024', label: 'Ano de 2024', year: 2024, month: null }
    ]
  };

  const mockClosedRankingMonth = {
    period_type: 'month',
    period_key: '2026-09',
    period_label: 'Setembro/2026',
    is_closed: true,
    top_students: [
      {
        rank: 1,
        user_id: 99,
        name: 'Campeão de Setembro',
        email: 'setembro@test.com',
        avatar_url: null,
        points: 520,
        solutions_count: 7,
        lessons_completed_count: 30,
        badge: '🥇 Campeão do Mês',
        is_current_user: false
      },
      {
        rank: 2,
        user_id: 10,
        name: 'Aluno Campeão',
        email: 'campeao@test.com',
        avatar_url: null,
        points: 410,
        solutions_count: 4,
        lessons_completed_count: 20,
        badge: '🥈 Vice do Mês',
        is_current_user: true
      }
    ],
    my_position: {
      rank: 2,
      user_id: 10,
      name: 'Aluno Campeão',
      email: 'campeao@test.com',
      avatar_url: null,
      points: 410,
      solutions_count: 4,
      lessons_completed_count: 20,
      badge: '🥈 Vice do Mês',
      is_current_user: true
    },
    total_participants: 2
  };

  const mockClosedRankingYear = {
    period_type: 'year',
    period_key: '2025',
    period_label: 'Ano de 2025',
    is_closed: true,
    top_students: [
      {
        rank: 1,
        user_id: 77,
        name: 'Lenda do Ano 2025',
        email: 'lenda2025@test.com',
        avatar_url: null,
        points: 1800,
        solutions_count: 25,
        lessons_completed_count: 80,
        badge: '👑 Campeão do Ano',
        is_current_user: false
      }
    ],
    my_position: null,
    total_participants: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'mock_token');

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/v1/gamification/completed-periods')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCompletedPeriods)
        });
      }
      if (urlStr.includes('/api/v1/gamification/closed-ranking')) {
        if (urlStr.includes('period_type=year')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockClosedRankingYear)
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockClosedRankingMonth)
        });
      }
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

  it('switches to closed months tab and renders completed period ranking and podium', async () => {
    const userAluno = { id: 10, name: 'Aluno Campeão', role: 'aluno' };

    render(
      <ToastProvider>
        <GamificationRanking user={userAluno} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('tab-period-closed-months')).toBeInTheDocument();
    });

    // Clicar na aba Meses Anteriores (Top 10)
    fireEvent.click(screen.getByTestId('tab-period-closed-months'));

    // Aguardar carregar períodos e ranking fechado
    await waitFor(() => {
      expect(screen.getByTestId('closed-period-selector-banner')).toBeInTheDocument();
      expect(screen.getByTestId('closed-period-select')).toBeInTheDocument();
      expect(screen.getByText('Classificação Final (Top 10 Campeões)')).toBeInTheDocument();
    });

    // Verificar se o campeão histórico aparece (no pódio e/ou na tabela)
    expect(screen.getAllByText('Campeão de Setembro').length).toBeGreaterThan(0);
    expect(screen.getByTestId('podium-points-1')).toHaveTextContent('520');
    expect(screen.getAllByText('🥇 Campeão do Mês').length).toBeGreaterThan(0);

    // Trocar o mês selecionado no dropdown
    fireEvent.change(screen.getByTestId('closed-period-select'), {
      target: { value: '2026-08' }
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/gamification/closed-ranking?period_type=month&period_key=2026-08'),
        expect.anything()
      );
    });
  });

  it('switches to closed years tab and displays completed annual top 10 champions', async () => {
    const userAluno = { id: 10, name: 'Aluno Campeão', role: 'aluno' };

    render(
      <ToastProvider>
        <GamificationRanking user={userAluno} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('tab-period-closed-years')).toBeInTheDocument();
    });

    // Clicar na aba Anos Anteriores (Top 10)
    fireEvent.click(screen.getByTestId('tab-period-closed-years'));

    await waitFor(() => {
      expect(screen.getByTestId('closed-period-selector-banner')).toBeInTheDocument();
      expect(screen.getAllByText('Ano de 2025').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Lenda do Ano 2025').length).toBeGreaterThan(0);
    });

    expect(screen.getByTestId('podium-points-1')).toHaveTextContent('1.800');
    expect(screen.getAllByText('👑 Campeão do Ano').length).toBeGreaterThan(0);
  });
});
