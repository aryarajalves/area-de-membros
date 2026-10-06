import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlatformSettings from '../PlatformSettings';
import { ToastProvider } from '../../context/ToastContext';

describe('PlatformApiTokensTab and PlatformSettings Tabs Integration', () => {
  const mockTokens = [
    {
      id: 1,
      name: 'Automação n8n',
      masked_token: 'sk_live_••••••••1a2b',
      is_active: true,
      last_used_at: new Date().toISOString(),
      expires_at: null,
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
  });

  it('switches between Appearance and API Tokens tabs', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/api-tokens')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTokens,
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <PlatformSettings bgColor="#090d16" />
      </ToastProvider>
    );

    // Inicialmente na aba de Aparência
    expect(screen.getByTestId('platform-appearance-tab')).toBeInTheDocument();
    expect(screen.getByText('Cor de Fundo da Área de Membros (Estilo Netflix)')).toBeInTheDocument();

    // Clica na aba de Tokens de API
    const apiTokensTabBtn = screen.getByTestId('tab-api-tokens-btn');
    fireEvent.click(apiTokensTabBtn);

    // Agora exibe a aba de Tokens de API
    expect(await screen.findByTestId('platform-api-tokens-tab')).toBeInTheDocument();
    expect(screen.getByText('Chaves de Acesso à API (API Keys)')).toBeInTheDocument();
    expect(await screen.findByText('Automação n8n')).toBeInTheDocument();
    expect(screen.getByText('sk_live_••••••••1a2b')).toBeInTheDocument();
  });

  it('allows opening modal, creating a new API token and displaying raw token modal', async () => {
    const createdTokenMock = {
      id: 2,
      name: 'Webhook Kiwify',
      masked_token: 'sk_live_••••••••9z8y',
      raw_token: 'sk_live_test_secret_key_1234567890abcdef',
      is_active: true,
      last_used_at: null,
      expires_at: null,
      created_at: new Date().toISOString(),
    };

    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/api/v1/api-tokens') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => createdTokenMock,
        });
      }
      if (url.includes('/api/v1/api-tokens')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTokens,
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <PlatformSettings bgColor="#090d16" />
      </ToastProvider>
    );

    // Navega para aba de Tokens
    fireEvent.click(screen.getByTestId('tab-api-tokens-btn'));
    expect(await screen.findByText('Automação n8n')).toBeInTheDocument();

    // Clica em Gerar Novo Token
    fireEvent.click(screen.getByTestId('open-new-token-modal-btn'));
    expect(screen.getByTestId('new-api-token-modal')).toBeInTheDocument();

    // Preenche nome
    const nameInput = screen.getByTestId('api-token-name-input');
    fireEvent.change(nameInput, { target: { value: 'Webhook Kiwify' } });

    // Clica em Gerar Chave
    fireEvent.click(screen.getByTestId('confirm-create-token-btn'));

    // Modal com token completo gerado é exibido
    expect(await screen.findByTestId('token-created-modal')).toBeInTheDocument();
    expect(screen.getByText('sk_live_test_secret_key_1234567890abcdef')).toBeInTheDocument();
    expect(screen.getByTestId('copy-raw-token-btn')).toBeInTheDocument();

    // Fecha modal pós-criação
    fireEvent.click(screen.getByTestId('close-token-created-modal-btn'));
    expect(screen.queryByTestId('token-created-modal')).not.toBeInTheDocument();

    // O novo token agora aparece na listagem
    expect(screen.getByText('Webhook Kiwify')).toBeInTheDocument();
  });

  it('allows revoking and deleting an API token with confirmation modal', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/api/v1/api-tokens/1') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ detail: 'Token revogado.' }),
        });
      }
      if (url.includes('/api/v1/api-tokens')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTokens,
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <PlatformSettings bgColor="#090d16" />
      </ToastProvider>
    );

    // Navega para aba de Tokens
    fireEvent.click(screen.getByTestId('tab-api-tokens-btn'));
    expect(await screen.findByText('Automação n8n')).toBeInTheDocument();

    // Clica no botão de excluir chave
    const deleteBtn = screen.getByTestId('delete-token-btn-1');
    fireEvent.click(deleteBtn);

    // Modal de confirmação é exibido
    expect(screen.getByTestId('delete-token-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza de que deseja revogar e excluir a chave/i)).toBeInTheDocument();

    // Confirma exclusão
    fireEvent.click(screen.getByTestId('confirm-delete-token-btn'));

    // O token é removido da listagem
    await waitFor(() => {
      expect(screen.queryByText('Automação n8n')).not.toBeInTheDocument();
    });
  });
});
