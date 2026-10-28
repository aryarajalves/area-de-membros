import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BatchLessonOrderModal from './BatchLessonOrderModal';
import { ToastProvider } from '../../context/ToastContext';

const mockModule = {
  id: 20,
  title: 'Módulo 02 - Trânsitos Planetários',
  lessons: [
    { id: 201, title: 'Aula 1: Aspectos de Marte', order_index: 10, duration: '15 min' },
    { id: 202, title: 'Aula 2: Aspectos de Vênus', order_index: 20, duration: '20 min' },
    { id: 203, title: 'Aula 3: Conjunção Júpiter', order_index: 30, duration: '35 min' },
  ],
};

function renderWithToast(ui) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('BatchLessonOrderModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('não renderiza quando isOpen for false', () => {
    renderWithToast(
      <BatchLessonOrderModal
        isOpen={false}
        onClose={vi.fn()}
        courseId={1}
        module={mockModule}
      />
    );

    expect(screen.queryByTestId('batch-lesson-order-modal')).not.toBeInTheDocument();
  });

  it('renderiza corretamente quando aberto com a lista de aulas ordenada', () => {
    renderWithToast(
      <BatchLessonOrderModal
        isOpen={true}
        onClose={vi.fn()}
        courseId={1}
        module={mockModule}
      />
    );

    expect(screen.getByTestId('batch-lesson-order-modal')).toBeInTheDocument();
    expect(screen.getByText('Reordenar Aulas em Lote')).toBeInTheDocument();
    expect(screen.getByText(/Módulo 02 - Trânsitos Planetários • 3 aula\(s\)/i)).toBeInTheDocument();

    expect(screen.getByText('Aula 1: Aspectos de Marte')).toBeInTheDocument();
    expect(screen.getByText('Aula 2: Aspectos de Vênus')).toBeInTheDocument();
    expect(screen.getByText('Aula 3: Conjunção Júpiter')).toBeInTheDocument();

    expect(screen.getByTestId('order-input-201')).toHaveValue(10);
    expect(screen.getByTestId('order-input-202')).toHaveValue(20);
    expect(screen.getByTestId('order-input-203')).toHaveValue(30);
  });

  it('permite mover aula para cima e para baixo na lista', () => {
    renderWithToast(
      <BatchLessonOrderModal
        isOpen={true}
        onClose={vi.fn()}
        courseId={1}
        module={mockModule}
      />
    );

    // Na primeira aula (index 0), o botão de subir deve estar desabilitado
    const upBtnFirst = screen.getByTestId('move-up-btn-201');
    expect(upBtnFirst).toBeDisabled();

    // Na aula 2 (index 1), sobe para a primeira posição
    const upBtnSecond = screen.getByTestId('move-up-btn-202');
    fireEvent.click(upBtnSecond);

    // Agora o botão de subir da aula 202 deve estar desabilitado pois ela virou o primeiro item
    expect(screen.getByTestId('move-up-btn-202')).toBeDisabled();

    // Desce a aula 202 de volta para a segunda posição
    const downBtnSecond = screen.getByTestId('move-down-btn-202');
    fireEvent.click(downBtnSecond);
    expect(screen.getByTestId('move-up-btn-201')).toBeDisabled();
  });

  it('permite alterar o valor numérico de ordem diretamente pelo input', () => {
    renderWithToast(
      <BatchLessonOrderModal
        isOpen={true}
        onClose={vi.fn()}
        courseId={1}
        module={mockModule}
      />
    );

    const input201 = screen.getByTestId('order-input-201');
    fireEvent.change(input201, { target: { value: '5' } });
    expect(input201).toHaveValue(5);
  });

  it('permite auto-numerar sequencialmente 1, 2, 3...', () => {
    renderWithToast(
      <BatchLessonOrderModal
        isOpen={true}
        onClose={vi.fn()}
        courseId={1}
        module={mockModule}
      />
    );

    const autoBtn = screen.getByTestId('batch-auto-number-btn');
    fireEvent.click(autoBtn);

    expect(screen.getByTestId('order-input-201')).toHaveValue(1);
    expect(screen.getByTestId('order-input-202')).toHaveValue(2);
    expect(screen.getByTestId('order-input-203')).toHaveValue(3);
  });

  it('permite inverter a ordem das aulas', () => {
    renderWithToast(
      <BatchLessonOrderModal
        isOpen={true}
        onClose={vi.fn()}
        courseId={1}
        module={mockModule}
      />
    );

    const invertBtn = screen.getByTestId('batch-invert-order-btn');
    fireEvent.click(invertBtn);

    // Após inverter, a aula 203 vira o primeiro item e tem o botão de subir desabilitado
    expect(screen.getByTestId('move-up-btn-203')).toBeDisabled();
    // A aula 201 virou o último item e tem o botão de descer desabilitado
    expect(screen.getByTestId('move-down-btn-201')).toBeDisabled();
  });

  it('salva a nova ordem com sucesso via PATCH e dispara onSuccess e onClose', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Ordem atualizada com sucesso para 3 aula(s).',
        updated_lessons: [
          { lesson_id: 201, order_index: 1 },
          { lesson_id: 202, order_index: 2 },
          { lesson_id: 203, order_index: 3 },
        ]
      })
    });
    global.fetch = mockFetch;

    renderWithToast(
      <BatchLessonOrderModal
        isOpen={true}
        onClose={onClose}
        courseId={1}
        module={mockModule}
        onSuccess={onSuccess}
      />
    );

    // Clica em auto-numerar
    fireEvent.click(screen.getByTestId('batch-auto-number-btn'));

    // Clica em salvar
    const saveBtn = screen.getByTestId('batch-order-save-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/modules/20/lessons/batch-order',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token'
          }),
          body: JSON.stringify({
            items: [
              { lesson_id: 201, order_index: 1 },
              { lesson_id: 202, order_index: 2 },
              { lesson_id: 203, order_index: 3 }
            ]
          })
        })
      );
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('chama onClose ao clicar em Cancelar ou no botão Fechar', () => {
    const onClose = vi.fn();
    renderWithToast(
      <BatchLessonOrderModal
        isOpen={true}
        onClose={onClose}
        courseId={1}
        module={mockModule}
      />
    );

    fireEvent.click(screen.getByTestId('batch-order-cancel-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('batch-order-close-btn'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
