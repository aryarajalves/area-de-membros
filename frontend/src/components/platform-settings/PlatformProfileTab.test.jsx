import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlatformProfileTab from './PlatformProfileTab';
import { ToastProvider } from '../../context/ToastContext';

const mockSuperAdmin = {
  id: 1,
  name: 'Aryaraj Alves',
  email: 'aryarajmarketing@gmail.com',
  phone: '11999999999',
  role: 'superadmin',
  avatar_url: 'https://cdn.test.com/sa_avatar.png',
};

const mockAdmin = {
  id: 2,
  name: 'Carlos Admin',
  email: 'carlos@admin.com',
  phone: '11988887777',
  role: 'admin',
  avatar_url: '',
};

const mockAluno = {
  id: 3,
  name: 'Mariana Aluna',
  email: 'mariana@aluno.com',
  phone: '11977776666',
  role: 'aluno',
  avatar_url: '',
};

const mockRankingResponseAluno = {
  period: 'monthly',
  month_name: 'Outubro/2026',
  ranking: [
    {
      rank: 1,
      user_id: 3,
      name: 'Mariana Aluna',
      points: 275,
      solutions_count: 3,
      lessons_completed_count: 12,
      badge: '🥇 Mestre da Comunidade',
      level: 6,
      level_title: 'Prata II',
      level_badge: '⚔️ Prata II',
      level_tier: 'Prata',
      level_color: '#94a3b8',
      level_progress_percent: 5,
      points_to_next_level: 105,
      is_max_level: false,
      is_current_user: true,
    },
  ],
  my_position: {
    rank: 1,
    user_id: 3,
    name: 'Mariana Aluna',
    points: 275,
    solutions_count: 3,
    lessons_completed_count: 12,
    badge: '🥇 Mestre da Comunidade',
    level: 6,
    level_title: 'Prata II',
    level_badge: '⚔️ Prata II',
    level_tier: 'Prata',
    level_color: '#94a3b8',
    level_progress_percent: 5,
    points_to_next_level: 105,
    is_max_level: false,
    is_current_user: true,
  },
  total_participants: 18,
};

const mockRankingResponseAdmin = {
  period: 'monthly',
  month_name: 'Outubro/2026',
  ranking: [
    {
      rank: 1,
      user_id: 3,
      name: 'Mariana Aluna',
      points: 275,
    },
  ],
  my_position: null,
  total_participants: 18,
};

function renderProfileTab(currentUser, onUserUpdated = vi.fn(), onNavigateTab = vi.fn()) {
  return render(
    <ToastProvider>
      <PlatformProfileTab
        currentUser={currentUser}
        onUserUpdated={onUserUpdated}
        onNavigateTab={onNavigateTab}
        cardBg="#1e293b"
        cardBorder="1px solid rgba(255,255,255,0.1)"
        textColor="#ffffff"
        subTextColor="#94a3b8"
        isLightBg={false}
      />
    </ToastProvider>
  );
}

describe('PlatformProfileTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'mock_profile_token');

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/v1/gamification/ranking')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRankingResponseAdmin),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('renders Super Admin profile with locked name/email/password and enabled avatar upload', async () => {
    renderProfileTab(mockSuperAdmin);

    // Banner de Super Admin exibido
    expect(screen.getByTestId('superadmin-notice-banner')).toBeInTheDocument();
    expect(screen.getByText(/Conta Super Administrador Protegida/i)).toBeInTheDocument();

    // Inputs de nome e email desabilitados
    const nameInput = screen.getByTestId('profile-input-name');
    const emailInput = screen.getByTestId('profile-input-email');
    expect(nameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(nameInput.value).toBe('Aryaraj Alves');
    expect(emailInput.value).toBe('aryarajmarketing@gmail.com');

    // Troca de senha bloqueada para superadmin
    expect(screen.getByTestId('superadmin-password-blocked-box')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-input-new-password')).not.toBeInTheDocument();

    // Avatar exibido e botão de troca de foto habilitado
    expect(screen.getByTestId('profile-avatar-img')).toHaveAttribute('src', 'https://cdn.test.com/sa_avatar.png');
    expect(screen.getByTestId('btn-upload-avatar')).toBeEnabled();
    expect(screen.getByTestId('btn-remove-avatar')).toBeInTheDocument();

    // Card de gamificação renderizado em modo administrativo
    await waitFor(() => {
      expect(screen.getByTestId('profile-gamification-card')).toBeInTheDocument();
      expect(screen.getByTestId('profile-admin-gamification-info')).toBeInTheDocument();
      expect(screen.getByText(/Supervisor da Comunidade/i)).toBeInTheDocument();
    });
  });

  it('renders regular Admin profile with editable fields and password inputs', async () => {
    const onUserUpdated = vi.fn();

    global.fetch = vi.fn().mockImplementation((url, options = {}) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/v1/auth/me') && options.method === 'PATCH') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockAdmin,
              name: body.name,
              phone: body.phone,
            }),
        });
      }
      if (urlStr.includes('/api/v1/gamification/ranking')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRankingResponseAdmin),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderProfileTab(mockAdmin, onUserUpdated);

    // Sem banner de superadmin
    expect(screen.queryByTestId('superadmin-notice-banner')).not.toBeInTheDocument();

    // Campos habilitados
    const nameInput = screen.getByTestId('profile-input-name');
    const emailInput = screen.getByTestId('profile-input-email');
    const phoneInput = screen.getByTestId('profile-input-phone');
    expect(nameInput).toBeEnabled();
    expect(emailInput).toBeEnabled();
    expect(phoneInput).toBeEnabled();

    // Campos de senha disponíveis
    expect(screen.getByTestId('profile-input-new-password')).toBeInTheDocument();
    expect(screen.getByTestId('profile-input-confirm-password')).toBeInTheDocument();

    // Altera nome e telefone
    fireEvent.change(nameInput, { target: { value: 'Carlos Admin Silva' } });
    fireEvent.change(phoneInput, { target: { value: '11977776666' } });

    // Salva perfil
    fireEvent.click(screen.getByTestId('btn-save-profile'));

    await waitFor(() => {
      expect(onUserUpdated).toHaveBeenCalled();
    });
  });

  it('allows removing avatar and notifies user', async () => {
    const onUserUpdated = vi.fn();

    global.fetch = vi.fn().mockImplementation((url, options = {}) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/v1/auth/me') && options.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockSuperAdmin,
              avatar_url: '',
            }),
        });
      }
      if (urlStr.includes('/api/v1/gamification/ranking')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRankingResponseAdmin),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderProfileTab(mockSuperAdmin, onUserUpdated);

    const removeBtn = screen.getByTestId('btn-remove-avatar');
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(onUserUpdated).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: '' }));
    });
  });

  it('renders student profile with real-time level, ranking and points', async () => {
    const onNavigateTab = vi.fn();

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/v1/gamification/ranking')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRankingResponseAluno),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderProfileTab(mockAluno, vi.fn(), onNavigateTab);

    // Espera os dados do ranking carregarem
    await waitFor(() => {
      expect(screen.getByTestId('profile-gamification-card')).toBeInTheDocument();
      expect(screen.getByTestId('profile-level-title')).toHaveTextContent(/Nível 6 • Prata II/i);
    });

    // Posição no ranking e pontuação exibidas
    expect(screen.getByTestId('stat-my-rank')).toHaveTextContent('#1');
    expect(screen.getByTestId('stat-my-points')).toHaveTextContent('275 pts');
    expect(screen.getByTestId('stat-my-activities')).toHaveTextContent(/12 aulas • 3 soluções/i);

    // Barra de progresso visível
    expect(screen.getByTestId('profile-xp-progress-track')).toBeInTheDocument();

    // Botão de ver ranking aciona a navegação
    const viewRankingBtn = screen.getByTestId('btn-view-full-ranking');
    fireEvent.click(viewRankingBtn);
    expect(onNavigateTab).toHaveBeenCalledWith('ranking');

    // Botão de ver escada abre o modal dos 20 níveis
    const viewLadderBtn = screen.getByTestId('btn-view-rpg-ladder');
    fireEvent.click(viewLadderBtn);
    expect(screen.getByTestId('rpg-ladder-modal')).toBeInTheDocument();
  });
});
