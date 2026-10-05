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

function renderProfileTab(currentUser, onUserUpdated = vi.fn()) {
  return render(
    <ToastProvider>
      <PlatformProfileTab
        currentUser={currentUser}
        onUserUpdated={onUserUpdated}
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
  });

  it('renders Super Admin profile with locked name/email/password and enabled avatar upload', () => {
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
  });

  it('renders regular Admin profile with editable fields and password inputs', async () => {
    const onUserUpdated = vi.fn();

    global.fetch = vi.fn().mockImplementation((url, options = {}) => {
      if (url.includes('/api/v1/auth/me') && options.method === 'PATCH') {
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
      if (url.includes('/api/v1/auth/me') && options.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockSuperAdmin,
              avatar_url: '',
            }),
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
});
