import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentTriggerWebhookModal from './StudentTriggerWebhookModal';
import { ToastProvider } from '../../context/ToastContext';

describe('StudentTriggerWebhookModal Component', () => {
  const dummyStudent = {
    id: 10,
    name: 'Alves Silva',
    email: 'alves@teste.com',
  };

  const dummyCourse = {
    course_id: 101,
    course_title: 'Bússola Astrológica',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
  });

  it('blocks trigger button and displays alert when no webhooks are configured', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/integrations')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <StudentTriggerWebhookModal
          isOpen={true}
          onClose={vi.fn()}
          student={dummyStudent}
          course={dummyCourse}
          isLightBg={false}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Disparar Evento de Integração')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('no-webhooks-configured-alert')).toBeInTheDocument();
      expect(screen.getByText(/Nenhuma integração configurada/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByTestId('submit-trigger-webhook-btn');
    expect(submitBtn).toBeDisabled();
  });

  it('loads configured webhooks, allows selecting one, and submits trigger with webhook_id', async () => {
    const handleClose = vi.fn();
    const mockIntegrations = [
      {
        id: 77,
        name: 'Webhook N8N Automação',
        url: 'https://n8n.webhook.site/test',
        course_id: 101,
        is_active: true,
      },
      {
        id: 88,
        name: 'Webhook Make Alunos',
        url: 'https://make.webhook.site/hook',
        course_id: null,
        is_active: true,
      },
    ];

    global.fetch = vi.fn().mockImplementation((url, options) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/api/v1/integrations')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockIntegrations,
        });
      }
      if (urlStr.includes('/api/v1/students/10/courses/101/trigger-webhook')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'success',
            dispatched_count: 1,
            event: 'course.progress.100',
            message: "Evento disparado com sucesso!",
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <StudentTriggerWebhookModal
          isOpen={true}
          onClose={handleClose}
          student={dummyStudent}
          course={dummyCourse}
          isLightBg={false}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('trigger-integration-select')).toBeInTheDocument();
      expect(screen.getByText(/Webhook N8N Automação/i)).toBeInTheDocument();
      expect(screen.getByText(/Webhook Make Alunos/i)).toBeInTheDocument();
    });

    // Seleciona o webhook Make Alunos (id 88)
    const selectWh = screen.getByTestId('trigger-integration-select');
    fireEvent.change(selectWh, { target: { value: '88' } });

    const submitBtn = screen.getByTestId('submit-trigger-webhook-btn');
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/students/10/courses/101/trigger-webhook',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            event: 'course.progress.100',
            webhook_id: 88,
          }),
        })
      );
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
