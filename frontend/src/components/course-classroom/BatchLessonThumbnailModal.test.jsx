import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BatchLessonThumbnailModal from './BatchLessonThumbnailModal';
import { ToastProvider } from '../../context/ToastContext';

const mockModule = {
  id: 10,
  title: 'Módulo 01 - Fundamentos de Astrologia',
  lessons: [
    { id: 101, title: 'Introdução aos Signos', thumbnail_url: 'https://exemplo.com/thumb1.jpg', duration: '12 min' },
    { id: 102, title: 'Casas Astrológicas', thumbnail_url: '', duration: '25 min' },
    { id: 103, title: 'Planetas e Trânsitos', thumbnail_url: null, duration: '40 min' },
  ],
};

function renderWithToast(ui) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('BatchLessonThumbnailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('não renderiza quando isOpen for false', () => {
    renderWithToast(
      <BatchLessonThumbnailModal
        isOpen={false}
        onClose={vi.fn()}
        courseId={1}
        module={mockModule}
      />
    );

    expect(screen.queryByTestId('batch-lesson-thumbnail-modal')).not.toBeInTheDocument();
  });

  it('renderiza corretamente quando aberto com todas as aulas pré-selecionadas', () => {
    renderWithToast(
      <BatchLessonThumbnailModal
        isOpen={true}
        onClose={vi.fn()}
        courseId={1}
        module={mockModule}
      />
    );

    expect(screen.getByTestId('batch-lesson-thumbnail-modal')).toBeInTheDocument();
    expect(screen.getByText('Trocar Capa das Aulas em Lote')).toBeInTheDocument();
    expect(screen.getByText('Módulo 01 - Fundamentos de Astrologia')).toBeInTheDocument();
    expect(screen.getByText(/3 de 3 selecionadas/i)).toBeInTheDocument();
    expect(screen.getByText(/Selecionar todas as aulas deste módulo/i)).toBeInTheDocument();
    expect(screen.getByText(/Desmarcar todas/i)).toBeInTheDocument();

    // Verifica que as aulas aparecem na lista
    expect(screen.getByText(/Aula 1: Introdução aos Signos/i)).toBeInTheDocument();
    expect(screen.getByText(/Aula 2: Casas Astrológicas/i)).toBeInTheDocument();
    expect(screen.getByText(/Aula 3: Planetas e Trânsitos/i)).toBeInTheDocument();
  });

  it('permite alternar entre desmarcar todas e marcar todas as aulas', () => {
    renderWithToast(
      <BatchLessonThumbnailModal
        isOpen={true}
        onClose={vi.fn()}
        courseId={1}
        module={mockModule}
      />
    );

    const toggleAllBtn = screen.getByTestId('batch-select-all-btn');

    // Desmarca todas
    fireEvent.click(toggleAllBtn);
    expect(screen.getByText(/0 de 3 selecionadas/i)).toBeInTheDocument();
    expect(screen.getByText(/Marcar todas/i)).toBeInTheDocument();

    // Marca todas novamente
    fireEvent.click(toggleAllBtn);
    expect(screen.getByText(/3 de 3 selecionadas/i)).toBeInTheDocument();
    expect(screen.getByText(/Desmarcar todas/i)).toBeInTheDocument();
  });

  it('permite desmarcar e marcar uma aula individualmente', () => {
    renderWithToast(
      <BatchLessonThumbnailModal
        isOpen={true}
        onClose={vi.fn()}
        courseId={1}
        module={mockModule}
      />
    );

    // Inicial: 3 selecionadas
    expect(screen.getByText(/3 de 3 selecionadas/i)).toBeInTheDocument();

    // Clica na linha da aula 101 para desmarcá-la
    const row1 = screen.getByTestId('batch-lesson-row-101');
    fireEvent.click(row1);

    expect(screen.getByText(/2 de 3 selecionadas/i)).toBeInTheDocument();

    // Clica novamente para remarcar
    fireEvent.click(row1);
    expect(screen.getByText(/3 de 3 selecionadas/i)).toBeInTheDocument();
  });

  it('chama onClose ao clicar em Cancelar ou no botão de fechar', () => {
    const onClose = vi.fn();
    renderWithToast(
      <BatchLessonThumbnailModal
        isOpen={true}
        onClose={onClose}
        courseId={1}
        module={mockModule}
      />
    );

    fireEvent.click(screen.getByTestId('batch-cancel-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('batch-modal-close-btn'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('aplica a nova capa com sucesso via PATCH e dispara onSuccess e onClose', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Capa atualizada com sucesso para 3 aula(s).',
        updated_lesson_ids: [101, 102, 103],
        thumbnail_url: 'https://exemplo.com/nova-capa-lote.webp'
      })
    });
    global.fetch = mockFetch;

    renderWithToast(
      <BatchLessonThumbnailModal
        isOpen={true}
        onClose={onClose}
        courseId={1}
        module={mockModule}
        onSuccess={onSuccess}
      />
    );

    // Insere a URL da nova imagem de capa no campo de texto direto
    const urlInput = screen.getByTestId('batch-thumbnail-url-input');
    fireEvent.change(urlInput, { target: { value: 'https://exemplo.com/nova-capa-lote.webp' } });

    const applyBtn = screen.getByTestId('batch-apply-btn');
    expect(applyBtn).toBeEnabled();

    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/modules/10/lessons/batch-thumbnail',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token'
          }),
          body: JSON.stringify({
            lesson_ids: [101, 102, 103],
            thumbnail_url: 'https://exemplo.com/nova-capa-lote.webp'
          })
        })
      );
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        [101, 102, 103],
        'https://exemplo.com/nova-capa-lote.webp'
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('permite carregar imagem via upload de arquivo no LessonThumbnailManager', async () => {
    const onUploadThumbnail = vi.fn().mockResolvedValue('https://exemplo.com/uploaded-banner.webp');

    renderWithToast(
      <BatchLessonThumbnailModal
        isOpen={true}
        onClose={vi.fn()}
        courseId={1}
        module={mockModule}
        onUploadThumbnail={onUploadThumbnail}
      />
    );

    const fileInput = screen.getByTestId('lesson-thumbnail-file-input');
    const file = new File(['dummy content'], 'capa.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onUploadThumbnail).toHaveBeenCalledWith(file);
    });

    await waitFor(() => {
      const urlInput = screen.getByTestId('batch-thumbnail-url-input');
      expect(urlInput.value).toBe('https://exemplo.com/uploaded-banner.webp');
    });
  });
});
