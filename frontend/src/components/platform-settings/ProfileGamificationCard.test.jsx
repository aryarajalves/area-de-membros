import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileGamificationCard from './ProfileGamificationCard';

const mockAluno = {
  id: 10,
  role: 'aluno',
  name: 'Fernanda Estudante',
};

const mockAdmin = {
  id: 1,
  role: 'admin',
  name: 'Admin Gestor',
};

describe('ProfileGamificationCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'token_teste');
  });

  it('renders student at level 1 with 0 points when no position exists yet', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          period: 'monthly',
          month_name: 'Outubro/2026',
          ranking: [],
          my_position: null,
          total_participants: 0,
        }),
    });

    render(<ProfileGamificationCard currentUser={mockAluno} />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-gamification-card')).toBeInTheDocument();
      expect(screen.getByTestId('profile-level-title')).toHaveTextContent(/Nível 1 • Bronze I/i);
    });

    expect(screen.getByTestId('stat-my-rank')).toHaveTextContent('#-');
    expect(screen.getByTestId('stat-my-points')).toHaveTextContent('0 pts');
  });

  it('renders max level student correctly with 100% mastery indicator', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          period: 'monthly',
          month_name: 'Outubro/2026',
          ranking: [],
          my_position: {
            rank: 1,
            user_id: 10,
            name: 'Fernanda Estudante',
            points: 5200,
            solutions_count: 10,
            lessons_completed_count: 80,
            badge: '🥇 Mestre da Comunidade',
            level: 20,
            level_title: 'Lenda Suprema',
            level_badge: '🌟 Lenda Suprema',
            level_tier: 'Lenda',
            level_color: '#fbbf24',
            level_progress_percent: 100,
            points_to_next_level: 0,
            is_max_level: true,
          },
          total_participants: 25,
        }),
    });

    render(<ProfileGamificationCard currentUser={mockAluno} />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-level-title')).toHaveTextContent(/Nível 20 • Lenda Suprema/i);
      expect(screen.getByText(/Nível Máximo Atingido/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('stat-my-points')).toHaveTextContent('5.200 pts');
  });

  it('renders admin card with community supervision metrics', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          period: 'monthly',
          month_name: 'Outubro/2026',
          ranking: [
            {
              rank: 1,
              name: 'Aluno Campeão',
              points: 950,
            },
          ],
          my_position: null,
          total_participants: 34,
        }),
    });

    render(<ProfileGamificationCard currentUser={mockAdmin} />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-admin-gamification-info')).toBeInTheDocument();
      expect(screen.getByText(/Supervisor da Comunidade/i)).toBeInTheDocument();
      expect(screen.getByText(/34 alunos disputando posições/i)).toBeInTheDocument();
      expect(screen.getByText(/1º Lugar atual: Aluno Campeão/i)).toBeInTheDocument();
    });
  });
});
