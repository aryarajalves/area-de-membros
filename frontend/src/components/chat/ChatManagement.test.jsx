import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../../context/ToastContext';
import ChatManagement from './ChatManagement';

describe('ChatManagement Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'test-token');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  it('renderiza ChatManagement sem ReferenceError e exibe botão Marcar tudo como lido', () => {
    render(
      <ToastProvider>
        <ChatManagement currentUser={{ id: 1, name: 'Admin', role: 'superadmin' }} />
      </ToastProvider>
    );

    expect(screen.getByTestId('chat-channels-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('chat-mark-all-read-btn')).toBeInTheDocument();
  });
});
