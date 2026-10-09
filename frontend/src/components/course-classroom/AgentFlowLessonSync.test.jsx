import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgentFlowLessonSync from './AgentFlowLessonSync';

const mockAddToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast
  })
}));

describe('AgentFlowLessonSync Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('renders pending status when not synced', () => {
    render(
      <AgentFlowLessonSync
        lessonId={50}
        isManager={true}
        initialSyncedAt={null}
        initialKbId={null}
        lessonTitle="Sol na Casa 5"
      />
    );

    expect(screen.getByTestId('agentflow-sync-badge')).toHaveTextContent('AgentFlow: Pendente');
    expect(screen.getByTestId('btn-sync-agentflow')).toHaveTextContent('Sincronizar com AgentFlow');
  });

  it('renders synced status when synced initially', () => {
    render(
      <AgentFlowLessonSync
        lessonId={51}
        isManager={true}
        initialSyncedAt="2026-10-08T14:30:00Z"
        initialKbId={37}
        lessonTitle="Sol na Casa 6"
      />
    );

    expect(screen.getByTestId('agentflow-sync-badge')).toHaveTextContent('AgentFlow (Base #37)');
    expect(screen.getByTestId('btn-sync-agentflow')).toHaveTextContent('Re-sincronizar');
  });

  it('reactively updates badge when props change from pending to synced', async () => {
    const { rerender } = render(
      <AgentFlowLessonSync
        lessonId={50}
        isManager={true}
        initialSyncedAt={null}
        initialKbId={null}
        lessonTitle="Sol na Casa 5"
      />
    );

    expect(screen.getByTestId('agentflow-sync-badge')).toHaveTextContent('AgentFlow: Pendente');

    // Simula a chegada dos dados assíncronos do backend
    rerender(
      <AgentFlowLessonSync
        lessonId={50}
        isManager={true}
        initialSyncedAt="2026-10-08T15:00:00Z"
        initialKbId={37}
        lessonTitle="Sol na Casa 5"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('agentflow-sync-badge')).toHaveTextContent('AgentFlow (Base #37)');
      expect(screen.getByTestId('btn-sync-agentflow')).toHaveTextContent('Re-sincronizar');
    });
  });

  it('opens confirmation modal on resync button click and cancels correctly', () => {
    render(
      <AgentFlowLessonSync
        lessonId={51}
        isManager={true}
        initialSyncedAt="2026-10-08T14:30:00Z"
        initialKbId={37}
        lessonTitle="Sol na Casa 6"
      />
    );

    // Clica em Re-sincronizar
    fireEvent.click(screen.getByTestId('btn-sync-agentflow'));

    expect(screen.getByTestId('confirm-resync-modal')).toBeInTheDocument();
    expect(screen.getByText('Re-sincronizar Aula')).toBeInTheDocument();

    // Clica em Cancelar
    fireEvent.click(screen.getByTestId('confirm-resync-modal-cancel-btn'));
    expect(screen.queryByTestId('confirm-resync-modal')).not.toBeInTheDocument();
  });

  it('executes sync and invokes onSyncSuccess callback', async () => {
    const onSyncSuccess = vi.fn();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        synced_at: '2026-10-08T16:00:00Z',
        kb_id: 37,
        qa_count: 5,
        chunks_count: 8
      })
    });

    render(
      <AgentFlowLessonSync
        lessonId={50}
        isManager={true}
        initialSyncedAt={null}
        initialKbId={null}
        lessonTitle="Sol na Casa 5"
        onSyncSuccess={onSyncSuccess}
      />
    );

    fireEvent.click(screen.getByTestId('btn-sync-agentflow'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/agentflow/lessons/50/sync',
        expect.objectContaining({ method: 'POST' })
      );
    });

    await waitFor(() => {
      expect(onSyncSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ kb_id: 37, synced_at: '2026-10-08T16:00:00Z' })
      );
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Aula sincronizada com sucesso no AgentFlow!'),
        'success'
      );
      expect(screen.getByTestId('agentflow-sync-badge')).toHaveTextContent('AgentFlow (Base #37)');
    });
  });

  it('hides sync buttons for regular students while preserving status badge', () => {
    render(
      <AgentFlowLessonSync
        lessonId={51}
        isManager={false}
        initialSyncedAt="2026-10-08T14:30:00Z"
        initialKbId={37}
        lessonTitle="Sol na Casa 6"
      />
    );

    expect(screen.getByTestId('agentflow-sync-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-sync-agentflow')).not.toBeInTheDocument();
  });
});
