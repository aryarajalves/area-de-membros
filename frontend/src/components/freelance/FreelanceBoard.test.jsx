import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FreelanceBoard from './FreelanceBoard';

vi.mock('../chat/ChatDmModal', () => ({
  default: ({ isOpen, targetContact }) =>
    isOpen ? <div data-testid="mock-chat-dm-modal">DM com {targetContact?.name}</div> : null,
}));

describe('FreelanceBoard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  const sampleJobs = [
    {
      id: 1,
      user_id: 2,
      title: 'Designer para Criativos',
      description: 'Preciso de 10 criativos para anúncios.',
      category: 'Design',
      budget_type: 'fixed',
      budget_value: 'R$ 500,00',
      deadline: '5 dias',
      contact_whatsapp: '5585999999999',
      status: 'open',
      created_at: '2026-11-23T10:00:00Z',
      updated_at: '2026-11-23T10:00:00Z',
      author: { id: 2, name: 'Maria Contratante', role: 'aluno' },
      can_manage: false,
    },
    {
      id: 2,
      user_id: 1,
      title: 'Editor de Vídeo',
      description: 'Edição semanal de vídeos para YouTube.',
      category: 'Edição de Vídeo',
      budget_type: 'negotiable',
      budget_value: null,
      deadline: 'Semanal',
      contact_whatsapp: null,
      status: 'open',
      created_at: '2026-11-23T09:00:00Z',
      updated_at: '2026-11-23T09:00:00Z',
      author: { id: 1, name: 'Admin', role: 'superadmin' },
      can_manage: true,
    },
  ];

  it('renders jobs, hides publish button when can_publish is false, and opens DM on click', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: sampleJobs, can_publish: false, total: 2 }),
    });

    render(<FreelanceBoard currentUser={{ id: 1, role: 'aluno' }} addToast={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Designer para Criativos')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('open-create-freelance-btn')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('freelance-dm-btn-1'));
    expect(screen.getByTestId('mock-chat-dm-modal')).toHaveTextContent('DM com Maria Contratante');
  });

  it('creates a new job via modal and deletes own job via confirm modal', async () => {
    const addToast = vi.fn();
    global.fetch = vi.fn((url, options = {}) => {
      if (!options.method || options.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: sampleJobs, can_publish: true, total: 2 }),
        });
      }
      if (options.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...sampleJobs[1], id: 3, title: 'Copywriter Sênior' }),
        });
      }
      if (options.method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<FreelanceBoard currentUser={{ id: 1, role: 'superadmin' }} addToast={addToast} />);

    await waitFor(() => {
      expect(screen.getByTestId('open-create-freelance-btn')).toBeInTheDocument();
    });

    // Abre modal de criação e valida que clicar no backdrop não fecha
    fireEvent.click(screen.getByTestId('open-create-freelance-btn'));
    expect(screen.getByTestId('freelance-job-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('freelance-job-modal-backdrop'));
    expect(screen.getByTestId('freelance-job-modal')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('freelance-title-input'), {
      target: { value: 'Copywriter Sênior' },
    });
    fireEvent.change(screen.getByTestId('freelance-description-input'), {
      target: { value: 'Escrever página de vendas completa para lançamento.' },
    });
    fireEvent.click(screen.getByTestId('submit-freelance-modal-btn'));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Vaga publicada no mural de freelancers!', 'success');
    });

    // Abre modal de exclusão e confirma
    fireEvent.click(screen.getByTestId('freelance-delete-btn-2'));
    expect(screen.getByTestId('freelance-delete-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('freelance-delete-modal-backdrop'));
    expect(screen.getByTestId('freelance-delete-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-delete-freelance-btn'));
    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Vaga excluída com sucesso!', 'success');
    });
  });
});
