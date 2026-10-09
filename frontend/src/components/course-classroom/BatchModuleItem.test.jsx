import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BatchModuleItem from './BatchModuleItem';

describe('BatchModuleItem Component', () => {
  const mockModWithError = {
    id: 'mod_1',
    title: 'Módulo 03 - Trânsitos',
    lessons: [
      {
        id: 'les_7',
        title: 'Lua na 7',
        formattedSize: '256.7 MB',
        selected: true,
        status: 'error',
        errorMessage: 'Falha na conexão com o storage',
        coverPreviewUrl: null
      },
      {
        id: 'les_8',
        title: 'Lua na 8',
        formattedSize: '246.1 MB',
        selected: true,
        status: 'completed',
        coverPreviewUrl: null
      }
    ]
  };

  it('exibe badge de falha e botões de reimportar para aula e módulo com erro', () => {
    const onRetryLesson = vi.fn();
    const onRetryModule = vi.fn();

    render(
      <BatchModuleItem
        mod={mockModWithError}
        isExpanded={true}
        isImporting={false}
        onToggleAccordion={vi.fn()}
        onToggleModule={vi.fn()}
        onToggleLesson={vi.fn()}
        onRetryLesson={onRetryLesson}
        onRetryModule={onRetryModule}
      />
    );

    // Badge de erro e botão individual de reimportar
    expect(screen.getByTestId('lesson-error-badge-les_7')).toBeInTheDocument();
    expect(screen.getByText('Falha')).toBeInTheDocument();

    const retryLessonBtn = screen.getByTestId('retry-lesson-btn-les_7');
    expect(retryLessonBtn).toBeInTheDocument();
    fireEvent.click(retryLessonBtn);
    expect(onRetryLesson).toHaveBeenCalledWith('mod_1', 'les_7');

    // Botão de reimportar falhas do módulo no cabeçalho
    const retryModuleBtn = screen.getByTestId('retry-module-btn-mod_1');
    expect(retryModuleBtn).toBeInTheDocument();
    fireEvent.click(retryModuleBtn);
    expect(onRetryModule).toHaveBeenCalledWith('mod_1');
  });

  it('oculta botões de reimportar enquanto a importação estiver ativa', () => {
    render(
      <BatchModuleItem
        mod={mockModWithError}
        isExpanded={true}
        isImporting={true}
        onToggleAccordion={vi.fn()}
        onToggleModule={vi.fn()}
        onToggleLesson={vi.fn()}
      />
    );

    expect(screen.queryByTestId('retry-lesson-btn-les_7')).not.toBeInTheDocument();
    expect(screen.queryByTestId('retry-module-btn-mod_1')).not.toBeInTheDocument();
  });

  it('permite definir manualmente o número de exibição do módulo e dispara onUpdateModuleOrder', () => {
    const onUpdateModuleOrder = vi.fn();
    const modWithOrder = {
      ...mockModWithError,
      orderIndex: 2
    };

    render(
      <BatchModuleItem
        mod={modWithOrder}
        isExpanded={true}
        isImporting={false}
        onToggleAccordion={vi.fn()}
        onToggleModule={vi.fn()}
        onToggleLesson={vi.fn()}
        onUpdateModuleOrder={onUpdateModuleOrder}
      />
    );

    const orderInput = screen.getByTestId('module-order-input-mod_1');
    expect(orderInput).toBeInTheDocument();
    expect(orderInput).toHaveValue(2);

    fireEvent.change(orderInput, { target: { value: '5' } });
    expect(onUpdateModuleOrder).toHaveBeenCalledWith('mod_1', 5);
  });

  it('renderiza lista de aulas com expansão completa para permitir ver todas as 13 aulas', () => {
    const mockModWith13Lessons = {
      id: 'mod_13',
      title: 'Módulo 2',
      lessons: Array.from({ length: 13 }, (_, i) => ({
        id: `les_${i + 1}`,
        title: i === 0 ? 'Introdução - Sol' : `Sol na ${i}`,
        formattedSize: '250.0 MB',
        selected: true,
        status: 'pending',
        coverPreviewUrl: null
      }))
    };

    render(
      <BatchModuleItem
        mod={mockModWith13Lessons}
        isExpanded={true}
        isImporting={false}
        onToggleAccordion={vi.fn()}
        onToggleModule={vi.fn()}
        onToggleLesson={vi.fn()}
      />
    );

    const lessonsList = screen.getByTestId('module-lessons-list-mod_13');
    expect(lessonsList).toBeInTheDocument();
    expect(lessonsList.style.maxHeight).toBeFalsy();
    expect(lessonsList.style.overflowY).toBeFalsy();

    // Confirma que o container do módulo possui flexShrink 0 para não ser espremido pelo container flex pai
    const moduleAccordion = screen.getByTestId('module-accordion-mod_13');
    expect(moduleAccordion.style.flexShrink).toBe('0');

    // Confirma que todas as 13 aulas foram renderizadas no DOM para visualização completa
    expect(screen.getByText('Introdução - Sol')).toBeInTheDocument();
    expect(screen.getByText('Sol na 1')).toBeInTheDocument();
    expect(screen.getByText('Sol na 5')).toBeInTheDocument();
    expect(screen.getByText('Sol na 12')).toBeInTheDocument();
    expect(screen.getAllByTestId(/lesson-row-/)).toHaveLength(13);
  });

  it('permite selecionar manualmente se o módulo vincula a um módulo existente ou cria um novo', () => {
    const onLinkExistingModule = vi.fn();
    const existingModules = [
      { id: 4, title: 'Módulo 01 - Trânsitos Astrológicos' },
      { id: 5, title: 'Módulo 02 - O Impacto do Sol' }
    ];

    render(
      <BatchModuleItem
        mod={mockModWithError}
        isExpanded={true}
        isImporting={false}
        existingModules={existingModules}
        onToggleAccordion={vi.fn()}
        onToggleModule={vi.fn()}
        onToggleLesson={vi.fn()}
        onLinkExistingModule={onLinkExistingModule}
      />
    );

    const targetSelect = screen.getByTestId('module-target-select-mod_1');
    expect(targetSelect).toBeInTheDocument();

    // Opção para criar novo módulo
    expect(screen.getByText('+ Criar Novo Módulo')).toBeInTheDocument();
    expect(screen.getByText('Módulo 01 - Trânsitos Astrológicos')).toBeInTheDocument();

    // Selecionar módulo existente 4
    fireEvent.change(targetSelect, { target: { value: '4' } });
    expect(onLinkExistingModule).toHaveBeenCalledWith('mod_1', 4);

    // Selecionar novo módulo
    fireEvent.change(targetSelect, { target: { value: '' } });
    expect(onLinkExistingModule).toHaveBeenCalledWith('mod_1', null);
  });

  it('exibe porcentagem e detalhes de megabytes transferidos durante o upload da aula', () => {
    const modUploading = {
      id: 'mod_up',
      title: 'Módulo 01',
      lessons: [
        {
          id: 'les_uploading',
          title: 'Aula de Astrologia 01',
          formattedSize: '259.2 MB',
          selected: true,
          status: 'uploading',
          progress: 5,
          progressDetail: '13.0 MB / 259.2 MB',
          coverPreviewUrl: null
        }
      ]
    };

    render(
      <BatchModuleItem
        mod={modUploading}
        isExpanded={true}
        isImporting={true}
        onToggleAccordion={vi.fn()}
        onToggleModule={vi.fn()}
        onToggleLesson={vi.fn()}
      />
    );

    expect(screen.getByText(/5%/)).toBeInTheDocument();
    const detailEl = screen.getByTestId('lesson-progress-detail-les_uploading');
    expect(detailEl).toBeInTheDocument();
    expect(detailEl).toHaveTextContent('(13.0 MB / 259.2 MB)');
  });
});
