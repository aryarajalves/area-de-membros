import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateUserManualModal from './CreateUserManualModal';
import * as api from './userManagementApi';

describe('CreateUserManualModal Component', () => {
  const mockCourses = [
    { id: 101, title: 'Curso de Astrologia Básica', thumbnail_url: null },
    { id: 102, title: 'Curso Avançado', thumbnail_url: 'https://exemplo.com/thumb.png' },
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock-admin-token');
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CreateUserManualModal
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        courses={mockCourses}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all form fields, starts completely blank, and toggles password visibility', () => {
    render(
      <CreateUserManualModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        courses={mockCourses}
      />
    );

    expect(screen.getByText('Criar Novo Usuário')).toBeInTheDocument();
    
    // Todos os campos de texto iniciam estritamente em branco
    const nameInput = screen.getByTestId('create-user-name-input');
    const emailInput = screen.getByTestId('create-user-email-input');
    const pwdInput = screen.getByTestId('create-user-password-input');

    expect(nameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');
    expect(pwdInput).toHaveValue('');
    expect(pwdInput).toHaveAttribute('type', 'password');

    // Clica no toggle de ver senha
    const toggleBtn = screen.getByTestId('create-user-toggle-password-btn');
    fireEvent.click(toggleBtn);
    expect(pwdInput).toHaveAttribute('type', 'text');

    // Valida perfil
    expect(screen.getByTestId('create-user-role-select')).toHaveValue('aluno');

    // Valida cursos
    expect(screen.getByTestId('create-user-courses-section')).toBeInTheDocument();
    expect(screen.getByText('Curso de Astrologia Básica')).toBeInTheDocument();
  });

  it('submits form successfully and calls onSuccess with created user', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const handleToast = vi.fn();

    const mockCreatedUser = {
      id: 50,
      name: 'Novo Aluno',
      email: 'novoaluno@teste.com',
      role: 'aluno',
      is_active: true,
    };

    vi.spyOn(api, 'createUserManualApi').mockResolvedValueOnce(mockCreatedUser);

    render(
      <CreateUserManualModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        courses={mockCourses}
        addToast={handleToast}
        token="my-valid-token"
      />
    );

    fireEvent.change(screen.getByTestId('create-user-name-input'), { target: { value: 'Novo Aluno' } });
    fireEvent.change(screen.getByTestId('create-user-email-input'), { target: { value: 'novoaluno@teste.com' } });
    fireEvent.change(screen.getByTestId('create-user-password-input'), { target: { value: 'MinhaSenhaSegura123!' } });

    // Seleciona um curso
    const courseCheck = screen.getByTestId('create-user-course-check-101');
    fireEvent.click(courseCheck);

    const form = screen.getByTestId('create-user-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(api.createUserManualApi).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Novo Aluno',
          email: 'novoaluno@teste.com',
          password: 'MinhaSenhaSegura123!',
          role: 'aluno',
          course_ids: [101],
        }),
        'my-valid-token'
      );
    });

    expect(handleToast).toHaveBeenCalledWith('Usuário criado com sucesso!', 'success');
    expect(handleSuccess).toHaveBeenCalledWith(mockCreatedUser);
    expect(handleClose).toHaveBeenCalled();
  });

  it('displays error banner when API returns error (duplicate email)', async () => {
    const handleToast = vi.fn();

    vi.spyOn(api, 'createUserManualApi').mockRejectedValueOnce(
      new Error('Este e-mail já está cadastrado no sistema.')
    );

    render(
      <CreateUserManualModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        courses={mockCourses}
        addToast={handleToast}
      />
    );

    fireEvent.change(screen.getByTestId('create-user-name-input'), { target: { value: 'Aluno Repetido' } });
    fireEvent.change(screen.getByTestId('create-user-email-input'), { target: { value: 'duplicado@teste.com' } });
    fireEvent.change(screen.getByTestId('create-user-password-input'), { target: { value: 'MinhaSenhaSegura123!' } });

    const form = screen.getByTestId('create-user-form');
    fireEvent.submit(form);

    const errorBanner = await screen.findByTestId('create-user-error-banner');
    expect(errorBanner).toHaveTextContent('Este e-mail já está cadastrado no sistema.');
    expect(handleToast).toHaveBeenCalledWith('Este e-mail já está cadastrado no sistema.', 'error');
  });

  it('validates password requirements: length >= 12, uppercase, lowercase, number, special char', async () => {
    render(
      <CreateUserManualModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        courses={mockCourses}
      />
    );

    const nameInput = screen.getByTestId('create-user-name-input');
    const emailInput = screen.getByTestId('create-user-email-input');
    const pwdInput = screen.getByTestId('create-user-password-input');
    const form = screen.getByTestId('create-user-form');

    fireEvent.change(nameInput, { target: { value: 'Teste Senha' } });
    fireEvent.change(emailInput, { target: { value: 'senha@teste.com' } });

    // 1. Menos de 12 caracteres
    fireEvent.change(pwdInput, { target: { value: 'Curta123!' } });
    fireEvent.submit(form);
    expect(screen.getByTestId('create-user-error-banner')).toHaveTextContent(
      'A senha deve ter no mínimo 12 caracteres.'
    );

    // 2. Sem letra maiúscula
    fireEvent.change(pwdInput, { target: { value: 'semmaiuscula123!' } });
    fireEvent.submit(form);
    expect(screen.getByTestId('create-user-error-banner')).toHaveTextContent(
      'A senha deve conter ao menos 1 letra maiúscula.'
    );

    // 3. Sem letra minúscula
    fireEvent.change(pwdInput, { target: { value: 'SEMMINUSCULA123!' } });
    fireEvent.submit(form);
    expect(screen.getByTestId('create-user-error-banner')).toHaveTextContent(
      'A senha deve conter ao menos 1 letra minúscula.'
    );

    // 4. Sem número
    fireEvent.change(pwdInput, { target: { value: 'SenhaSemNumero!!' } });
    fireEvent.submit(form);
    expect(screen.getByTestId('create-user-error-banner')).toHaveTextContent(
      'A senha deve conter ao menos 1 número.'
    );

    // 5. Sem caractere especial
    fireEvent.change(pwdInput, { target: { value: 'SenhaSemEspecial123' } });
    fireEvent.submit(form);
    expect(screen.getByTestId('create-user-error-banner')).toHaveTextContent(
      'A senha deve conter ao menos 1 caractere especial.'
    );
  });

  it('closes modal when cancel or close button is clicked', () => {
    const handleClose = vi.fn();

    render(
      <CreateUserManualModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={vi.fn()}
        courses={mockCourses}
      />
    );

    const cancelBtn = screen.getByTestId('cancel-create-user-btn');
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const closeIconBtn = screen.getByTestId('close-create-user-modal-btn');
    fireEvent.click(closeIconBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
