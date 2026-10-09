import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BatchCourseImportModal from './BatchCourseImportModal';
import { ToastProvider } from '../../context/ToastContext';
import * as batchImportService from '../../services/batchImportService';

// Mock do ToastContext
vi.mock('../../context/ToastContext', () => ({
  ToastProvider: ({ children }) => <div>{children}</div>,
  useToast: () => ({
    addToast: vi.fn()
  })
}));

describe('BatchCourseImportModal', () => {
  const mockOnClose = vi.fn();
  const mockOnImportCompleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test_token_123');
  });

  const renderModal = (props = {}) => {
    return render(
      <BatchCourseImportModal
        isOpen={true}
        onClose={mockOnClose}
        courseId={1}
        existingModules={[]}
        onImportCompleted={mockOnImportCompleted}
        {...props}
      />
    );
  };

  it('não renderiza nada quando isOpen é false', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('renderiza cabeçalho, instruções e botões iniciais quando aberto', () => {
    renderModal();

    expect(screen.getByTestId('batch-import-modal')).toBeInTheDocument();
    expect(screen.getByText('Importação em Lote de Aulas')).toBeInTheDocument();
    expect(screen.getByText(/Arraste a pasta do seu curso aqui/i)).toBeInTheDocument();
    expect(screen.getByTestId('select-folder-btn')).toBeInTheDocument();
  });

  it('não fecha ao clicar no backdrop escuro (regra de popups de segurança)', () => {
    renderModal();

    const backdrop = screen.getByTestId('batch-import-modal-backdrop');
    fireEvent.click(backdrop);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('chama onClose ao clicar no botão Fechar ou X', () => {
    renderModal();

    const closeBtn = screen.getByTestId('close-batch-modal-btn');
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('permite selecionar pasta, exibe módulos e aulas e permite desmarcar individualmente', async () => {
    const mockFiles = [
      new File(['dummy video 1'], '01 - Introdução.mp4', { type: 'video/mp4' }),
      new File(['dummy video 2'], '02 - Teoria.mp4', { type: 'video/mp4' })
    ];
    Object.defineProperty(mockFiles[0], 'webkitRelativePath', {
      value: 'Curso Astrologia/01 - Fundamentos/01 - Introdução.mp4'
    });
    Object.defineProperty(mockFiles[1], 'webkitRelativePath', {
      value: 'Curso Astrologia/01 - Fundamentos/02 - Teoria.mp4'
    });

    renderModal();

    const fileInput = screen.getByTestId('folder-file-input');
    fireEvent.change(fileInput, { target: { files: mockFiles } });

    await waitFor(() => {
      expect(screen.getByText('01 - Fundamentos')).toBeInTheDocument();
      expect(screen.getByText('01 - Introdução')).toBeInTheDocument();
      expect(screen.getByText('02 - Teoria')).toBeInTheDocument();
    });

    // Testar desmarcação de aula individual (solicitação específica do usuário)
    const lessonCheckbox = screen.getAllByTestId(/lesson-checkbox-/)[0];
    fireEvent.click(lessonCheckbox);

    // O contador de aulas selecionadas deve diminuir de 2 para 1
    expect(screen.getByText(/1\/2 selecionada\(s\)/i)).toBeInTheDocument();
  });

  it('permite desmarcar e remarcar todas as aulas pelos botões utilitários', async () => {
    const mockFiles = [
      new File(['vid1'], '01.mp4', { type: 'video/mp4' }),
      new File(['vid2'], '02.mp4', { type: 'video/mp4' })
    ];
    Object.defineProperty(mockFiles[0], 'webkitRelativePath', { value: 'Curso/Módulo 1/01.mp4' });
    Object.defineProperty(mockFiles[1], 'webkitRelativePath', { value: 'Curso/Módulo 1/02.mp4' });

    renderModal();

    const fileInput = screen.getByTestId('folder-file-input');
    fireEvent.change(fileInput, { target: { files: mockFiles } });

    await waitFor(() => {
      expect(screen.getByTestId('deselect-all-btn')).toBeInTheDocument();
    });

    // Desmarcar todas
    fireEvent.click(screen.getByTestId('deselect-all-btn'));
    expect(screen.getByText(/0\/2 selecionada\(s\)/i)).toBeInTheDocument();

    // Marcar todas
    fireEvent.click(screen.getByTestId('select-all-btn'));
    expect(screen.getByText(/2\/2 selecionada\(s\)/i)).toBeInTheDocument();
  });

  it('executa o fluxo de importação em lote com upload e IA automática ao clicar em Iniciar', async () => {
    const mockFiles = [
      new File(['video content'], '01 - Aula Teste.mp4', { type: 'video/mp4' })
    ];
    Object.defineProperty(mockFiles[0], 'webkitRelativePath', { value: 'Curso/Módulo Único/01 - Aula Teste.mp4' });

    // Spy nos métodos do batchImportService
    vi.spyOn(batchImportService, 'uploadVideoWithProgress').mockResolvedValue('https://storage.test/video.mp4');
    vi.spyOn(batchImportService, 'createModuleIfNotExists').mockResolvedValue({ id: 101, isNew: true });
    vi.spyOn(batchImportService, 'createLessonInModule').mockResolvedValue({ id: 202, title: '01 - Aula Teste' });
    vi.spyOn(batchImportService, 'triggerLessonAiTranscription').mockResolvedValue(true);
    vi.spyOn(batchImportService, 'generateModuleAiOverview').mockResolvedValue({
      title: 'Módulo Único - Visão Geral com IA',
      description: 'Descrição completa pedagógica gerada pela IA.'
    });

    renderModal();

    const fileInput = screen.getByTestId('folder-file-input');
    fireEvent.change(fileInput, { target: { files: mockFiles } });

    await waitFor(() => {
      expect(screen.getByTestId('start-batch-import-btn')).toBeInTheDocument();
    });

    const startBtn = screen.getByTestId('start-batch-import-btn');
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(batchImportService.uploadVideoWithProgress).toHaveBeenCalled();
      expect(batchImportService.createModuleIfNotExists).toHaveBeenCalled();
      expect(batchImportService.createLessonInModule).toHaveBeenCalled();
      expect(batchImportService.triggerLessonAiTranscription).toHaveBeenCalled();
      expect(batchImportService.generateModuleAiOverview).toHaveBeenCalled();
      expect(mockOnImportCompleted).toHaveBeenCalled();
    });
  });

  it('exibe badges de bandeiras de múltiplos idiomas para aulas multilíngues (Opção A)', async () => {
    const mockFiles = [
      new File(['vid pt'], '01 - Introducao.mp4', { type: 'video/mp4' }),
      new File(['vid en'], '01 - Introduction.mp4', { type: 'video/mp4' }),
      new File(['vid es'], '01 - Introduccion.mp4', { type: 'video/mp4' })
    ];
    Object.defineProperty(mockFiles[0], 'webkitRelativePath', { value: 'Curso/Modulo 01/PT/01 - Introducao.mp4' });
    Object.defineProperty(mockFiles[1], 'webkitRelativePath', { value: 'Curso/Modulo 01/EN/01 - Introduction.mp4' });
    Object.defineProperty(mockFiles[2], 'webkitRelativePath', { value: 'Curso/Modulo 01/ES/01 - Introduccion.mp4' });

    renderModal();

    const fileInput = screen.getByTestId('folder-file-input');
    fireEvent.change(fileInput, { target: { files: mockFiles } });

    await waitFor(() => {
      expect(screen.getByText('01 - Introducao')).toBeInTheDocument();
      // O container de bandeiras multilíngues deve estar presente
      expect(screen.getByTestId(/lesson-multi-lang-/)).toBeInTheDocument();
      expect(screen.getByText('🇧🇷')).toBeInTheDocument();
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('🇪🇸')).toBeInTheDocument();
    });
  });

  it('permite expandir e recolher todos os módulos e exibe o container com scroll', async () => {
    const mockFiles = [
      new File(['vid1'], '01.mp4', { type: 'video/mp4' }),
      new File(['vid2'], '02.mp4', { type: 'video/mp4' })
    ];
    Object.defineProperty(mockFiles[0], 'webkitRelativePath', { value: 'Curso/Módulo A/01.mp4' });
    Object.defineProperty(mockFiles[1], 'webkitRelativePath', { value: 'Curso/Módulo B/02.mp4' });

    renderModal();

    const fileInput = screen.getByTestId('folder-file-input');
    fireEvent.change(fileInput, { target: { files: mockFiles } });

    await waitFor(() => {
      expect(screen.getByTestId('batch-modules-scroll-container')).toBeInTheDocument();
      expect(screen.getByTestId('collapse-all-btn')).toBeInTheDocument();
      expect(screen.getByTestId('expand-all-btn')).toBeInTheDocument();
    });

    // Recolher todos os módulos
    fireEvent.click(screen.getByTestId('collapse-all-btn'));
    expect(screen.queryByText('01')).not.toBeInTheDocument();

    // Expandir todos os módulos
    fireEvent.click(screen.getByTestId('expand-all-btn'));
    expect(screen.getByText('01')).toBeInTheDocument();
  });

  it('permite anexar e remover capa de módulo e capa de aula manualmente', async () => {
    // Mock do URL.createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-cover-preview');

    const mockFiles = [
      new File(['vid1'], '01.mp4', { type: 'video/mp4' })
    ];
    Object.defineProperty(mockFiles[0], 'webkitRelativePath', { value: 'Curso/Módulo 1/01.mp4' });

    renderModal();

    const fileInput = screen.getByTestId('folder-file-input');
    fireEvent.change(fileInput, { target: { files: mockFiles } });

    await waitFor(() => {
      expect(screen.getByText('01')).toBeInTheDocument();
    });

    // 1. Anexa capa ao Módulo
    const modCoverInput = screen.getByTestId(/module-cover-input-/);
    const mockImageFile = new File(['image data'], 'capa_modulo.jpg', { type: 'image/jpeg' });
    fireEvent.change(modCoverInput, { target: { files: [mockImageFile] } });

    await waitFor(() => {
      expect(screen.getByText('Capa definida')).toBeInTheDocument();
      expect(screen.getByTestId(/remove-module-cover-/)).toBeInTheDocument();
    });

    // 2. Anexa capa à Aula
    const lessonCoverInput = screen.getByTestId(/lesson-cover-input-/);
    const mockLessonImageFile = new File(['image data lesson'], 'capa_aula.jpg', { type: 'image/jpeg' });
    fireEvent.change(lessonCoverInput, { target: { files: [mockLessonImageFile] } });

    await waitFor(() => {
      expect(screen.getByTestId(/remove-lesson-cover-/)).toBeInTheDocument();
    });

    // 3. Remove capa do módulo
    const removeModBtn = screen.getByTestId(/remove-module-cover-/);
    fireEvent.click(removeModBtn);

    await waitFor(() => {
      expect(screen.queryByText('Capa definida')).not.toBeInTheDocument();
      expect(screen.getByTestId(/add-module-cover-btn-/)).toBeInTheDocument();
    });
  });

  it('permite replicar a capa de uma aula para todas as outras aulas pelo botão Replicar p/ todas', async () => {
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-shared-cover');

    const mockFiles = [
      new File(['vid1'], '01.mp4', { type: 'video/mp4' }),
      new File(['vid2'], '02.mp4', { type: 'video/mp4' }),
      new File(['vid3'], '03.mp4', { type: 'video/mp4' })
    ];
    Object.defineProperty(mockFiles[0], 'webkitRelativePath', { value: 'Curso/Módulo 1/01.mp4' });
    Object.defineProperty(mockFiles[1], 'webkitRelativePath', { value: 'Curso/Módulo 1/02.mp4' });
    Object.defineProperty(mockFiles[2], 'webkitRelativePath', { value: 'Curso/Módulo 1/03.mp4' });

    renderModal();

    const fileInput = screen.getByTestId('folder-file-input');
    fireEvent.change(fileInput, { target: { files: mockFiles } });

    await waitFor(() => {
      expect(screen.getByText('01')).toBeInTheDocument();
    });

    // Anexa capa apenas na aula 01
    const firstLessonCoverInput = screen.getAllByTestId(/lesson-cover-input-/)[0];
    const imageFile = new File(['shared img'], 'capa_compartilhada.jpg', { type: 'image/jpeg' });
    fireEvent.change(firstLessonCoverInput, { target: { files: [imageFile] } });

    await waitFor(() => {
      expect(screen.getAllByTestId(/replicate-cover-btn-/)[0]).toBeInTheDocument();
    });

    // Clica em "Replicar p/ todas"
    const replicateBtn = screen.getAllByTestId(/replicate-cover-btn-/)[0];
    fireEvent.click(replicateBtn);

    // Agora todas as 3 aulas devem possuir capa definida com botão de remoção
    await waitFor(() => {
      const removeButtons = screen.getAllByTestId(/remove-lesson-cover-/);
      expect(removeButtons).toHaveLength(3);
    });
  });

  it('permite aplicar uma capa a todas as aulas do módulo pelo cabeçalho do módulo', async () => {
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-module-shared-cover');

    const mockFiles = [
      new File(['vid1'], '01.mp4', { type: 'video/mp4' }),
      new File(['vid2'], '02.mp4', { type: 'video/mp4' })
    ];
    Object.defineProperty(mockFiles[0], 'webkitRelativePath', { value: 'Curso/Módulo 1/01.mp4' });
    Object.defineProperty(mockFiles[1], 'webkitRelativePath', { value: 'Curso/Módulo 1/02.mp4' });

    renderModal();

    const fileInput = screen.getByTestId('folder-file-input');
    fireEvent.change(fileInput, { target: { files: mockFiles } });

    await waitFor(() => {
      expect(screen.getByTestId(/module-all-lessons-cover-input-/)).toBeInTheDocument();
    });

    const modAllCoverInput = screen.getByTestId(/module-all-lessons-cover-input-/);
    const imageFile = new File(['mod all img'], 'capa_modulo_aulas.jpg', { type: 'image/jpeg' });
    fireEvent.change(modAllCoverInput, { target: { files: [imageFile] } });

    // Todas as aulas do módulo recebem a capa
    await waitFor(() => {
      const removeButtons = screen.getAllByTestId(/remove-lesson-cover-/);
      expect(removeButtons).toHaveLength(2);
    });
  });

  it('permite aplicar uma capa a todas as aulas de todos os módulos pela barra superior', async () => {
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-global-shared-cover');

    const mockFiles = [
      new File(['vid1'], '01.mp4', { type: 'video/mp4' }),
      new File(['vid2'], '02.mp4', { type: 'video/mp4' })
    ];
    Object.defineProperty(mockFiles[0], 'webkitRelativePath', { value: 'Curso/Módulo A/01.mp4' });
    Object.defineProperty(mockFiles[1], 'webkitRelativePath', { value: 'Curso/Módulo B/02.mp4' });

    renderModal();

    const fileInput = screen.getByTestId('folder-file-input');
    fireEvent.change(fileInput, { target: { files: mockFiles } });

    await waitFor(() => {
      expect(screen.getByTestId('global-all-lessons-cover-input')).toBeInTheDocument();
    });

    const globalCoverInput = screen.getByTestId('global-all-lessons-cover-input');
    const imageFile = new File(['global img'], 'capa_global.jpg', { type: 'image/jpeg' });
    fireEvent.change(globalCoverInput, { target: { files: [imageFile] } });

    // Ambas as aulas (de módulos diferentes) recebem a capa
    await waitFor(() => {
      const removeButtons = screen.getAllByTestId(/remove-lesson-cover-/);
      expect(removeButtons).toHaveLength(2);
    });
  });

  it('reseta e abre vazio quando o modal é fechado e reaberto', async () => {
    const mockFiles = [
      new File(['vid1'], '01.mp4', { type: 'video/mp4' }),
      new File(['vid2'], '02.mp4', { type: 'video/mp4' })
    ];
    Object.defineProperty(mockFiles[0], 'webkitRelativePath', { value: 'Curso/Módulo 1/01.mp4' });
    Object.defineProperty(mockFiles[1], 'webkitRelativePath', { value: 'Curso/Módulo 1/02.mp4' });

    const { rerender } = renderModal({ isOpen: true });

    const fileInput = screen.getByTestId('folder-file-input');
    fireEvent.change(fileInput, { target: { files: mockFiles } });

    await waitFor(() => {
      expect(screen.getByText('Módulo 1')).toBeInTheDocument();
      expect(screen.getByText('01')).toBeInTheDocument();
    });

    // Clica no botão fechar (X)
    const closeBtn = screen.getByTestId('close-batch-modal-btn');
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();

    // Simula fechamento do modal no estado do componente pai (isOpen = false)
    rerender(
      <BatchCourseImportModal
        isOpen={false}
        onClose={mockOnClose}
        courseId={1}
        existingModules={[]}
        onImportCompleted={mockOnImportCompleted}
      />
    );

    // Simula reabertura do modal (isOpen = true)
    rerender(
      <BatchCourseImportModal
        isOpen={true}
        onClose={mockOnClose}
        courseId={1}
        existingModules={[]}
        onImportCompleted={mockOnImportCompleted}
      />
    );

    // Verifica que reabriu vazio, mostrando o dropzone inicial e sem as aulas anteriores
    expect(screen.getByText(/Arraste a pasta do seu curso aqui/i)).toBeInTheDocument();
    expect(screen.queryByText('Módulo 1')).not.toBeInTheDocument();
  });

  it('container central de módulos possui propriedades de rolagem fluida e scrollbar customizada', () => {
    renderModal();

    const scrollContainer = screen.getByTestId('batch-modules-scroll-container');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveClass('custom-scrollbar');
    expect(scrollContainer.style.overflowY).toBe('auto');
    expect(scrollContainer.style.minHeight).toBe('0px');
  });

  it('permite maximizar e restaurar o tamanho do modal pelo botão de tela cheia', () => {
    renderModal();

    const maximizeBtn = screen.getByTestId('toggle-maximize-batch-modal-btn');
    const modalEl = screen.getByTestId('batch-import-modal');

    expect(maximizeBtn).toBeInTheDocument();
    expect(modalEl.style.maxWidth).toBe('960px');

    // Clica para maximizar
    fireEvent.click(maximizeBtn);
    expect(modalEl.style.maxWidth).toBe('97vw');

    // Clica para restaurar
    fireEvent.click(maximizeBtn);
    expect(modalEl.style.maxWidth).toBe('960px');
  });
});


