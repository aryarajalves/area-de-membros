import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LessonModal, ConfirmDeleteModal } from './ModuleLessonModals';
import ModuleModal from './ModuleModal';

// Mock dos subgerenciadores para isolar o teste do modal
vi.mock('./LessonThumbnailManager', () => ({
  default: () => <div data-testid="mock-thumbnail-manager" />
}));

vi.mock('./LessonVideoManager', () => ({
  default: () => <div data-testid="mock-video-manager" />
}));

vi.mock('./LessonAttachmentsManager', () => ({
  default: () => <div data-testid="mock-attachments-manager" />
}));

const mockAddToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast })
}));

describe('LessonModal & ConfirmDeleteModal Components', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    editingLesson: null,
    loading: false
  };

  it('renders duration label explicitly stating "(em minutos)" and helper hint', () => {
    render(<LessonModal {...defaultProps} />);

    expect(screen.getByText(/Duração Estimada/i)).toBeInTheDocument();
    expect(screen.getByText(/\(em minutos\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Tempo em minutos/i)).toBeInTheDocument();

    const durationInput = screen.getByTestId('lesson-duration-input');
    expect(durationInput).toHaveAttribute('placeholder', 'Ex: 20 min ou 15:30');
  });

  it('normalizes pure numbers (e.g. "20") to "20 min" on save', () => {
    const handleSave = vi.fn();
    render(<LessonModal {...defaultProps} onSave={handleSave} />);

    // Preenche título obrigatório
    const titleInput = screen.getByTestId('lesson-title-input');
    fireEvent.change(titleInput, { target: { value: 'Aula Teste Normalização' } });

    // Preenche duração apenas com "20"
    const durationInput = screen.getByTestId('lesson-duration-input');
    fireEvent.change(durationInput, { target: { value: '20' } });

    // Submete formulário
    fireEvent.submit(titleInput.closest('form'));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Aula Teste Normalização',
        duration: '20 min'
      })
    );
  });

  it('keeps formatted strings like "15:30" or "25 min" intact on save', () => {
    const handleSave = vi.fn();
    render(<LessonModal {...defaultProps} onSave={handleSave} />);

    const titleInput = screen.getByTestId('lesson-title-input');
    fireEvent.change(titleInput, { target: { value: 'Aula com Cronômetro' } });

    const durationInput = screen.getByTestId('lesson-duration-input');
    fireEvent.change(durationInput, { target: { value: '15:30' } });

    fireEvent.submit(titleInput.closest('form'));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: '15:30'
      })
    );
  });

  it('applies member area bgColor to ConfirmDeleteModal card and dark style to Cancelar button', () => {
    render(
      <ConfirmDeleteModal
        isOpen={true}
        title="Excluir Módulo: Modulo 02?"
        message="Ao excluir este módulo, todas as aulas serão apagadas."
        bgColor="#090d16"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const heading = screen.getByText('Excluir Módulo: Modulo 02?');
    expect(heading).toHaveStyle({ color: '#f8fafc' });
    const card = heading.closest('.table-card');
    expect(card).toHaveStyle({ backgroundColor: '#090d16' });
    expect(screen.getByTestId('cancel-delete-btn')).toHaveStyle({ color: '#f8fafc' });
  });

  it('renders default expanded description on LessonModal with Tela Cheia button', () => {
    render(<LessonModal {...defaultProps} />);

    // Não deve existir botão inline Restaurar ou Maximizar
    expect(screen.queryByText('Maximizar')).not.toBeInTheDocument();
    expect(screen.queryByText('Restaurar')).not.toBeInTheDocument();

    const descInput = screen.getByTestId('lesson-description-input');
    expect(descInput).toBeInTheDocument();
    expect(descInput).toHaveAttribute('rows', '8');
    expect(descInput.style.minHeight).toBe('220px');

    // Botão de tela cheia
    expect(screen.getByText('Tela Cheia')).toBeInTheDocument();
  });

  it('renders default expanded description on ModuleModal with Tela Cheia button', () => {
    render(
      <ModuleModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    // Não deve existir botão inline Restaurar ou Maximizar
    expect(screen.queryByText('Maximizar')).not.toBeInTheDocument();
    expect(screen.queryByText('Restaurar')).not.toBeInTheDocument();

    const descInput = screen.getByTestId('module-description-input');
    expect(descInput).toBeInTheDocument();
    expect(descInput).toHaveAttribute('rows', '8');
    expect(descInput.style.minHeight).toBe('220px');

    // Botão de tela cheia
    expect(screen.getByText('Tela Cheia')).toBeInTheDocument();
  });

  it('renders "Gerar com IA" button only when editingModule is provided', () => {
    const { rerender } = render(
      <ModuleModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        editingModule={null}
      />
    );
    expect(screen.queryByTestId('btn-generate-module-ai-overview')).not.toBeInTheDocument();

    rerender(
      <ModuleModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        editingModule={{ id: 2, title: 'Módulo 2', description: '' }}
      />
    );
    expect(screen.getByTestId('btn-generate-module-ai-overview')).toBeInTheDocument();
    expect(screen.getByText('Gerar com IA')).toBeInTheDocument();
  });

  it('opens confirmation modal and generates module title and description with AI when confirmed', async () => {
    const handleModuleUpdated = vi.fn();
    const mockModule = { id: 2, title: 'Módulo 2', description: 'Antiga descrição' };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 2,
        title: 'Módulo 2 - Fundamentos e Estruturas Astrológicas',
        description: 'Neste módulo completo, você dominará os conceitos fundamentais com base nas transcrições das aulas.'
      })
    });

    render(
      <ModuleModal
        isOpen={true}
        courseId={10}
        editingModule={mockModule}
        onModuleUpdated={handleModuleUpdated}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    // Clica no botão "Gerar com IA"
    const aiBtn = screen.getByTestId('btn-generate-module-ai-overview');
    fireEvent.click(aiBtn);

    // Modal de confirmação deve aparecer
    expect(screen.getByTestId('confirm-generate-ai-metadata-modal')).toBeInTheDocument();
    expect(screen.getByText('Gerar Título e Descrição do Módulo com IA?')).toBeInTheDocument();

    // Clica em "Sim, Gerar com IA"
    const confirmBtn = screen.getByTestId('confirm-generate-ai-metadata-btn');
    fireEvent.click(confirmBtn);

    // Valida chamada correta à API
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/courses/10/modules/2/generate-ai-overview',
      expect.objectContaining({ method: 'POST' })
    );

    // Aguarda atualização dos inputs do formulário
    const titleInput = screen.getByTestId('module-title-input');
    const descInput = screen.getByTestId('module-description-input');

    await vi.waitFor(() => {
      expect(titleInput).toHaveValue('Módulo 2 - Fundamentos e Estruturas Astrológicas');
      expect(descInput).toHaveValue('Neste módulo completo, você dominará os conceitos fundamentais com base nas transcrições das aulas.');
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('Título e descrição do módulo gerados com sucesso'),
      'success'
    );
    expect(handleModuleUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Módulo 2 - Fundamentos e Estruturas Astrológicas'
      })
    );
  });

  it('renders "Gerar com IA" button on LessonModal when editingLesson is provided and updates fields on confirm', async () => {
    const mockLessonToEdit = {
      id: 55,
      module_id: 3,
      title: 'Aula Original Antiga',
      description: 'Descrição antiga antes da IA',
      duration: '10:00',
      order_index: 1,
      content_type: 'video'
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 55,
        title: 'Trânsitos Lunares e Ciclos Emocionais',
        description: 'Nesta aula prática, você entenderá o impacto profundo dos trânsitos da Lua.',
        duration: '10:00',
        module_id: 3
      })
    });

    render(
      <LessonModal
        {...defaultProps}
        courseId={1}
        moduleId={3}
        editingLesson={mockLessonToEdit}
      />
    );

    // Botão deve estar presente
    const aiBtn = screen.getByTestId('btn-generate-lesson-ai-metadata');
    expect(aiBtn).toBeInTheDocument();
    expect(aiBtn).toHaveTextContent('Gerar com IA');

    // Clica no botão para abrir confirmação
    fireEvent.click(aiBtn);

    expect(screen.getByTestId('confirm-generate-ai-metadata-modal')).toBeInTheDocument();
    expect(screen.getByText('Gerar Título e Descrição com IA?')).toBeInTheDocument();

    // Confirma
    const confirmBtn = screen.getByTestId('confirm-generate-ai-metadata-btn');
    fireEvent.click(confirmBtn);

    // Valida chamada correta à API
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/courses/1/modules/3/lessons/55/generate-metadata',
      expect.objectContaining({ method: 'POST' })
    );

    // Aguarda atualização dos inputs de título e descrição do LessonModal
    await vi.waitFor(() => {
      expect(screen.getByTestId('lesson-title-input')).toHaveValue('Trânsitos Lunares e Ciclos Emocionais');
      expect(screen.getByTestId('lesson-description-input')).toHaveValue('Nesta aula prática, você entenderá o impacto profundo dos trânsitos da Lua.');
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('Título e descrição da aula gerados com sucesso'),
      'success'
    );
  });
});


