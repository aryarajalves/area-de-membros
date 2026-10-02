import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserManagement from './UserManagement';
import { ToastProvider } from '../context/ToastContext';

describe('UserManagement Component Tabs', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
  });

  it('renders the 2 tabs: "Usuários Criados" and "Convites Gerados"', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Aryaraj', email: 'aryaraj@gmail.com', role: 'superadmin', is_active: true, created_at: new Date().toISOString() },
          ],
        });
      }
      if (url.includes('/invites')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 1,
              token: 'token123',
              role: 'admin',
              is_used: false,
              is_expired: false,
              time_remaining: '23h 59m restantes',
              used_by_email: null,
              created_at: new Date().toISOString(),
            },
          ],
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <ToastProvider>
        <UserManagement currentUser={{ role: 'superadmin' }} />
      </ToastProvider>
    );

    // Verifica presença dos botões das abas
    const usersTabBtn = screen.getByTestId('tab-users-btn');
    const invitesTabBtn = screen.getByTestId('tab-invites-btn');
    expect(usersTabBtn).toBeInTheDocument();
    expect(invitesTabBtn).toBeInTheDocument();

    // Aba inicial é 'users'
    expect(screen.getByTestId('users-table-view')).toBeInTheDocument();

    // Clica na aba de convites
    fireEvent.click(invitesTabBtn);

    // Agora deve exibir a tabela de convites com informações de status e tempo restante
    await waitFor(() => {
      expect(screen.getByTestId('invites-table-view')).toBeInTheDocument();
      expect(screen.getByText('Status do Convite')).toBeInTheDocument();
      expect(screen.getByText('Tempo Restante')).toBeInTheDocument();
      expect(screen.getByText('Usado Por')).toBeInTheDocument();
      expect(screen.getByText('23h 59m restantes')).toBeInTheDocument();
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });
  });

  it('filters users by role and supports pagination with 20 items per page', async () => {
    // Cria 25 usuários fictícios (15 admin e 10 aluno)
    const mockUsers = Array.from({ length: 25 }, (_, i) => ({
      id: i + 2,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: i < 15 ? 'admin' : 'aluno',
      is_active: true,
      created_at: new Date().toISOString(),
    }));

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockUsers,
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <ToastProvider>
        <UserManagement currentUser={{ id: 1, role: 'superadmin' }} />
      </ToastProvider>
    );

    // Página 1 deve ter 20 itens exibidos
    expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 1 a 20 de 25 usuários/i)).toBeInTheDocument();

    // Verifica que o tipo "Usuário comum" não existe no filtro
    const roleSelect = screen.getByTestId('filter-user-role-select');
    expect(screen.queryByRole('option', { name: /Usuário comum/i })).not.toBeInTheDocument();

    // Filtra apenas por 'aluno'
    fireEvent.change(roleSelect, { target: { value: 'aluno' } });

    // Agora há apenas 10 usuários, cabem na Página 1 de 1
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 1 a 10 de 10 usuários/i)).toBeInTheDocument();

    // Seleciona todos os usuários visíveis
    const selectAllCheckbox = screen.getByTestId('select-all-users-checkbox');
    fireEvent.click(selectAllCheckbox);

    // O botão de exclusão em massa deve aparecer com contagem
    expect(screen.getByTestId('selected-users-count')).toHaveTextContent('10 selecionado(s)');
    expect(screen.getByTestId('bulk-delete-users-btn')).toBeInTheDocument();
  });

  it('filters invites by status and supports bulk selection', async () => {
    const mockInvites = [
      { id: 1, token: 'tok1', role: 'admin', is_used: false, is_expired: false, time_remaining: '20h', created_at: new Date().toISOString() },
      { id: 2, token: 'tok2', role: 'aluno', is_used: true, is_expired: false, used_by_email: 'a@a.com', created_at: new Date().toISOString() },
      { id: 3, token: 'tok3', role: 'aluno', is_used: false, is_expired: true, time_remaining: 'Expirado', created_at: new Date().toISOString() },
    ];

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/invites')) {
        return Promise.resolve({ ok: true, json: async () => mockInvites });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <ToastProvider>
        <UserManagement currentUser={{ id: 1, role: 'superadmin' }} />
      </ToastProvider>
    );

    // Vai para a aba de convites
    fireEvent.click(screen.getByTestId('tab-invites-btn'));

    expect(await screen.findByTestId('invites-pagination')).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 1 a 3 de 3 convites/i)).toBeInTheDocument();

    // Filtra por convites pendentes
    const statusSelect = screen.getByTestId('filter-invite-status-select');
    fireEvent.change(statusSelect, { target: { value: 'pending' } });

    expect(screen.getByText(/Mostrando 1 a 1 de 1 convites/i)).toBeInTheDocument();

    // Seleciona o convite
    const selectAll = screen.getByTestId('select-all-invites-checkbox');
    fireEvent.click(selectAll);

    expect(screen.getByTestId('selected-invites-count')).toHaveTextContent('1 convite(s) selecionado(s)');
    expect(screen.getByTestId('bulk-delete-invites-btn')).toBeInTheDocument();
  });

  it('restores last active sub-tab from localStorage upon reload', async () => {
    localStorage.setItem('active_subtab_usermanagement', 'invites');
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/invites')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 99,
              token: 'token_saved',
              role: 'aluno',
              is_used: false,
              is_expired: false,
              time_remaining: '10h restantes',
              created_at: new Date().toISOString(),
            },
          ],
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <ToastProvider>
        <UserManagement currentUser={{ id: 1, role: 'superadmin' }} />
      </ToastProvider>
    );

    // Deve abrir diretamente na tabela de convites
    expect(await screen.findByTestId('invites-table-view')).toBeInTheDocument();
    expect(screen.queryByTestId('users-table-view')).not.toBeInTheDocument();
  });

  it('opens confirmation popup when deleting user and prevents closing on backdrop click', async () => {
    let deletedUserId = null;
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/users') && options?.method === 'DELETE') {
        deletedUserId = 2;
        return Promise.resolve({ ok: true, json: async () => ({ message: 'Usuário excluído' }) });
      }
      if (url.includes('/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Super Admin', email: 'admin@test.com', role: 'superadmin', is_active: true, created_at: new Date().toISOString() },
            { id: 2, name: 'Aryaraj Test', email: 'test@test.com', role: 'admin', is_active: true, created_at: new Date().toISOString() },
          ],
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <ToastProvider>
        <UserManagement currentUser={{ id: 1, role: 'superadmin' }} />
      </ToastProvider>
    );

    const deleteBtn = await screen.findByTestId('delete-user-btn-2');
    fireEvent.click(deleteBtn);

    // O modal deve aparecer centralizado
    const modalContent = screen.getByTestId('confirm-delete-modal-content');
    expect(modalContent).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-title')).toHaveTextContent('Excluir Usuário');
    expect(screen.getByTestId('confirm-delete-message')).toHaveTextContent('Aryaraj Test');

    // Clicar fora (no backdrop) NÃO deve fechar o popup
    const overlay = screen.getByTestId('confirm-delete-modal-overlay');
    fireEvent.click(overlay);
    expect(screen.getByTestId('confirm-delete-modal-content')).toBeInTheDocument();

    // Clicar no botão 'Sim, Excluir'
    const confirmBtn = screen.getByTestId('confirm-delete-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deletedUserId).toBe(2);
    });
  });

  it('allows assigning courses and specific access duration when inviting an aluno, without "Usuário comum" option', async () => {
    let invitePayload = null;
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/invites') && options?.method === 'POST') {
        invitePayload = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          text: async () => JSON.stringify({ token: 'aluno-token-999', role: 'aluno' }),
        });
      }
      if (url.includes('/courses')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 10, title: 'Curso Especial de Vendas' },
            { id: 20, title: 'Mentoria Avançada' },
          ],
        });
      }
      if (url.includes('/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Super Admin', email: 'admin@test.com', role: 'superadmin', is_active: true, created_at: new Date().toISOString() },
          ],
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <ToastProvider>
        <UserManagement currentUser={{ id: 1, role: 'superadmin' }} />
      </ToastProvider>
    );

    const openInviteBtn = await screen.findByTestId('open-invite-modal-btn');
    fireEvent.click(openInviteBtn);

    const roleSelect = screen.getByTestId('invite-role-select');
    // Verifica que "Usuário comum" foi removido do seletor
    expect(Array.from(roleSelect.options).map((o) => o.value)).toEqual(['aluno', 'admin']);
    fireEvent.change(roleSelect, { target: { value: 'aluno' } });

    await waitFor(() => {
      expect(screen.getByTestId('invite-courses-section')).toBeInTheDocument();
      expect(screen.getByText('Curso Especial de Vendas')).toBeInTheDocument();
      expect(screen.getByTestId('invite-course-check-10')).toBeInTheDocument();
    });

    // Marca os dois cursos
    fireEvent.click(screen.getByTestId('invite-course-check-10'));
    fireEvent.click(screen.getByTestId('invite-course-check-20'));

    // Altera o tempo de acesso do curso 10 para 6 meses e deixa o curso 20 como 1 ano
    const durationSelect10 = screen.getByTestId('invite-course-duration-10');
    expect(durationSelect10.value).toBe('lifetime');
    fireEvent.change(durationSelect10, { target: { value: '6_months' } });

    const durationSelect20 = screen.getByTestId('invite-course-duration-20');
    fireEvent.change(durationSelect20, { target: { value: '1_year' } });

    // Submete o convite
    const generateBtn = screen.getByTestId('generate-invite-submit-btn');
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(invitePayload).not.toBeNull();
      expect(invitePayload.role).toBe('aluno');
      expect(invitePayload.course_ids).toEqual([10, 20]);
      expect(invitePayload.course_access).toEqual([
        { course_id: 10, access_duration: '6_months' },
        { course_id: 20, access_duration: '1_year' },
      ]);
    });
  });

  it('allows editing an aluno course access and setting access duration per product', async () => {
    let patchPayload = null;
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/users/2') && options?.method === 'PATCH') {
        patchPayload = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 2,
            name: 'Aluno Teste',
            email: 'aluno@test.com',
            role: 'aluno',
            course_ids: [10],
            course_access: [{ course_id: 10, access_duration: '2_years' }],
          }),
        });
      }
      if (url.includes('/courses')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 10, title: 'Curso Especial de Vendas' }],
        });
      }
      if (url.includes('/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Super Admin', email: 'admin@test.com', role: 'superadmin', is_active: true, created_at: new Date().toISOString() },
            {
              id: 2,
              name: 'Aluno Teste',
              email: 'aluno@test.com',
              role: 'aluno',
              is_active: true,
              created_at: new Date().toISOString(),
              course_ids: [10],
              course_access: [{ course_id: 10, access_duration: '6_months' }],
            },
          ],
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <ToastProvider>
        <UserManagement currentUser={{ id: 1, role: 'superadmin' }} />
      </ToastProvider>
    );

    const editBtn = await screen.findByTestId('edit-user-btn-2');
    fireEvent.click(editBtn);

    const editRoleSelect = screen.getByTestId('edit-role-select');
    expect(Array.from(editRoleSelect.options).map((o) => o.value)).toEqual(['aluno', 'admin']);

    // Verifica que o seletor de duração carregou com '6_months' e muda para '2_years'
    const durationSelect = screen.getByTestId('edit-course-duration-10');
    expect(durationSelect.value).toBe('6_months');
    fireEvent.change(durationSelect, { target: { value: '2_years' } });

    fireEvent.click(screen.getByTestId('save-role-btn'));

    await waitFor(() => {
      expect(patchPayload).not.toBeNull();
      expect(patchPayload.role).toBe('aluno');
      expect(patchPayload.course_access).toEqual([
        { course_id: 10, access_duration: '2_years' },
      ]);
    });
  });

  it('allows creating an invite with indefinite duration (never expires)', async () => {
    let invitePayload = null;
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/invites') && options?.method === 'POST') {
        invitePayload = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 99,
            token: 'indefinite_token_123',
            role: 'aluno',
            duration_hours: 0,
            expires_at: null,
            time_remaining: 'Indefinido',
            is_used: false,
            created_at: new Date().toISOString(),
          }),
        });
      }
      if (url.includes('/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Super Admin', email: 'admin@test.com', role: 'superadmin', is_active: true, created_at: new Date().toISOString() },
          ],
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <ToastProvider>
        <UserManagement currentUser={{ id: 1, role: 'superadmin' }} />
      </ToastProvider>
    );

    // Abre modal de convite
    const createBtn = await screen.findByTestId('open-invite-modal-btn');
    fireEvent.click(createBtn);

    const expireSelect = screen.getByTestId('expire-hours-select');
    expect(expireSelect).toBeInTheDocument();
    expect(screen.getByText('Indefinido (não expira)')).toBeInTheDocument();

    // Seleciona a opção indefinida
    fireEvent.change(expireSelect, { target: { value: '0' } });
    expect(expireSelect.value).toBe('0');

    // Submete o convite
    fireEvent.click(screen.getByTestId('generate-invite-submit-btn'));

    await waitFor(() => {
      expect(invitePayload).not.toBeNull();
      expect(invitePayload.duration_hours).toBe(0);
      expect(screen.getByText(/Indefinido \(não expira\)/i)).toBeInTheDocument();
    });
  });
});



