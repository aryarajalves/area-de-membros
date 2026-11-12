import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatDmConversationView from './ChatDmConversationView';
import { ToastProvider } from '../../context/ToastContext';

describe('ChatDmConversationView Component', () => {
  const mockContact = {
    id: 5,
    name: 'Carlos Aluno',
    email: 'carlos@test.com',
    role: 'aluno',
  };

  const mockUser = {
    id: 1,
    name: 'Super Admin',
    email: 'admin@test.com',
    role: 'superadmin',
  };

  it('renders messages and interactive CTA button in private DM', () => {
    const mockMessages = [
      {
        id: 101,
        message: 'Olá Carlos, tudo bem?',
        created_at: '2026-10-06T10:00:00Z',
        user: { id: 1 },
      },
      {
        id: 102,
        message: 'Acesse nossa aula ao vivo:',
        button_text: 'Assistir Aula Ao Vivo',
        button_url: 'https://youtube.com/live/exemplo',
        button_action_type: 'url',
        created_at: '2026-10-06T10:01:00Z',
        user: { id: 1 },
      },
    ];

    render(
      <ToastProvider>
        <ChatDmConversationView
          selectedContact={mockContact}
          currentUser={mockUser}
          messages={mockMessages}
          loading={false}
          onSendMessage={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Olá Carlos, tudo bem?')).toBeInTheDocument();
    expect(screen.getByText('Acesse nossa aula ao vivo:')).toBeInTheDocument();

    const ctaBtn = screen.getByTestId('dm-cta-button-102');
    expect(ctaBtn).toBeInTheDocument();
    expect(ctaBtn).toHaveTextContent('Assistir Aula Ao Vivo');
    expect(ctaBtn).toHaveAttribute('href', 'https://youtube.com/live/exemplo');
    expect(ctaBtn).toHaveAttribute('target', '_blank');

    // Valida o banner de criptografia de ponta a ponta
    expect(screen.getByTestId('dm-encryption-banner')).toBeInTheDocument();
    expect(screen.getByText('Mensagens e arquivos protegidos por criptografia de ponta a ponta')).toBeInTheDocument();
  });

  it('handles message submission and renders media input toolbar', async () => {
    const onSendMessage = vi.fn().mockResolvedValue(true);
    render(
      <ToastProvider>
        <ChatDmConversationView
          selectedContact={mockContact}
          currentUser={mockUser}
          messages={[]}
          loading={false}
          onSendMessage={onSendMessage}
        />
      </ToastProvider>
    );

    // Valida que a barra de ferramentas completa com todas as mídias está presente
    expect(screen.getByTestId('chat-input-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('chat-attach-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-image-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-gif-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-emoji-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-record-audio-btn')).toBeInTheDocument();
    expect(screen.getByTestId('chat-video-record-button')).toBeInTheDocument();

    const input = screen.getByTestId('chat-message-textarea');
    fireEvent.change(input, { target: { value: 'Nova mensagem teste' } });

    const sendBtn = screen.getByTestId('chat-send-button');
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledWith('Nova mensagem teste', null, null);
    });
  });

  it('navigates directly to lesson classroom and closes DM modal when lesson CTA button is clicked', () => {
    vi.useFakeTimers();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const mockMessages = [
      {
        id: 201,
        message: 'Seu relato foi resolvido!',
        button_text: 'Acessar Aula',
        button_url: 'internal://lesson/10/25',
        button_action_type: 'lesson',
        created_at: '2026-10-06T10:00:00Z',
        user: { id: 1 },
      },
    ];

    render(
      <ToastProvider>
        <ChatDmConversationView
          selectedContact={mockContact}
          currentUser={mockUser}
          messages={mockMessages}
          loading={false}
          onSendMessage={vi.fn()}
        />
      </ToastProvider>
    );

    const ctaBtn = screen.getByTestId('dm-cta-button-201');
    expect(ctaBtn).toHaveTextContent('Acessar Aula');

    fireEvent.click(ctaBtn);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'close_dm_modal',
      })
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'app:navigate_tab',
        detail: { tab: 'courses' },
      })
    );

    vi.advanceTimersByTime(100);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'open_course_lesson',
        detail: { courseId: 10, lessonId: 25 },
      })
    );

    dispatchSpy.mockRestore();
    vi.useRealTimers();
  });

  it('displays read and unread visual status ("Visto" / "Enviado") for outgoing direct messages', () => {
    const mockMessages = [
      {
        id: 301,
        message: 'Mensagem pendente de visualização',
        created_at: '2026-10-06T10:00:00Z',
        is_read: false,
        user: { id: 1 },
      },
      {
        id: 302,
        message: 'Mensagem já lida pelo contato',
        created_at: '2026-10-06T10:05:00Z',
        is_read: true,
        read_at: '2026-10-06T10:06:00Z',
        user: { id: 1 },
      },
      {
        id: 303,
        message: 'Mensagem recebida do contato',
        created_at: '2026-10-06T10:07:00Z',
        is_read: true,
        user: { id: 5 },
      },
    ];

    render(
      <ToastProvider>
        <ChatDmConversationView
          selectedContact={mockContact}
          currentUser={mockUser}
          messages={mockMessages}
          loading={false}
          onSendMessage={vi.fn()}
        />
      </ToastProvider>
    );

    // Mensagem enviada não lida
    const unreadStatus = screen.getByTestId('dm-read-status-301');
    expect(unreadStatus).toBeInTheDocument();
    expect(unreadStatus).toHaveTextContent('Enviado');
    expect(unreadStatus).toHaveAttribute('title', 'Enviado • Aguardando leitura');

    // Mensagem enviada lida
    const readStatus = screen.getByTestId('dm-read-status-302');
    expect(readStatus).toBeInTheDocument();
    expect(readStatus).toHaveTextContent('Visto');

    // Inicialmente o popover de detalhes não está visível
    expect(screen.queryByTestId('dm-read-info-popover-302')).toBeNull();

    // Ao clicar em 'Visto', abre o popover com data e horário exatos
    fireEvent.click(readStatus);
    const popover = screen.getByTestId('dm-read-info-popover-302');
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveTextContent('Mensagem Visualizada');
    expect(popover).toHaveTextContent('Visto em:');
    expect(screen.getByTestId('dm-seen-time-302')).toBeInTheDocument();

    // Ao clicar novamente em 'Visto', o popover se fecha (toggle)
    fireEvent.click(readStatus);
    expect(screen.queryByTestId('dm-read-info-popover-302')).toBeNull();

    // Mensagem recebida do outro usuário não possui indicador de envio do remetente
    expect(screen.queryByTestId('dm-read-status-303')).toBeNull();
  });
});
