import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModuleTimelineSidebar from './ModuleTimelineSidebar';

const mockModules = [
  {
    id: 1,
    title: 'Módulo 1: Fundamentos',
    lessons: [
      { id: 101, title: 'Introdução ao Curso', duration: 300 },
      { id: 102, title: 'Configuração Inicial', duration: 420 },
    ],
  },
  {
    id: 2,
    title: 'Módulo 2: Avançado',
    lessons: [
      { id: 201, title: 'Estratégia Prática', duration: 600 },
    ],
  },
];

describe('ModuleTimelineSidebar', () => {
  it('renderiza o indicador Meu Progresso e a lista de módulos na timeline', () => {
    render(
      <ModuleTimelineSidebar
        modules={mockModules}
        selectedModule={mockModules[0]}
        activeLesson={mockModules[0].lessons[1]}
        completedLessonIds={[101]}
        totalLessonsCount={3}
        onSelectModule={vi.fn()}
        onSelectLesson={vi.fn()}
      />
    );

    expect(screen.getByTestId('module-timeline-sidebar')).toBeInTheDocument();
    expect(screen.getByText(/Meu Progresso - 33\.3%/i)).toBeInTheDocument();
    expect(screen.getByText(/1 de 3 aulas/i)).toBeInTheDocument();
    expect(screen.getByText('Módulo 1: Fundamentos')).toBeInTheDocument();
    expect(screen.getByText('Módulo 2: Avançado')).toBeInTheDocument();
  });

  it('exibe as aulas numeradas do módulo selecionado e dispara callbacks ao clicar', () => {
    const onSelectModule = vi.fn();
    const onSelectLesson = vi.fn();

    render(
      <ModuleTimelineSidebar
        modules={mockModules}
        selectedModule={mockModules[0]}
        activeLesson={mockModules[0].lessons[0]}
        completedLessonIds={[101]}
        totalLessonsCount={2}
        onSelectModule={onSelectModule}
        onSelectLesson={onSelectLesson}
      />
    );

    // Aulas do módulo 1 estão visíveis
    expect(screen.getByText(/1\. Introdução ao Curso/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Configuração Inicial/i)).toBeInTheDocument();

    // Clicar na aula 102
    fireEvent.click(screen.getByTestId('lesson-item-102'));
    expect(onSelectLesson).toHaveBeenCalledWith(
      expect.objectContaining({ id: 102, title: 'Configuração Inicial' })
    );

    // Clicar no módulo 2
    fireEvent.click(screen.getByTestId('module-toggle-btn-2'));
    expect(onSelectModule).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, title: 'Módulo 2: Avançado' })
    );
  });

  it('permite apertar em cima do módulo para fechar e reabrir as aulas para melhorar a visualização', () => {
    const onSelectModule = vi.fn();

    render(
      <ModuleTimelineSidebar
        modules={mockModules}
        selectedModule={mockModules[0]}
        activeLesson={mockModules[0].lessons[0]}
        completedLessonIds={[]}
        totalLessonsCount={3}
        onSelectModule={onSelectModule}
        onSelectLesson={vi.fn()}
      />
    );

    const toggleBtnMod1 = screen.getByTestId('module-toggle-btn-1');

    // Inicialmente o módulo 1 está aberto
    expect(screen.getByText(/1\. Introdução ao Curso/i)).toBeInTheDocument();
    expect(toggleBtnMod1).toHaveAttribute('title', 'Clique para fechar o módulo');

    // 1º Clique: Fecha o módulo 1
    fireEvent.click(toggleBtnMod1);

    // As aulas do módulo 1 são ocultadas da visualização
    expect(screen.queryByText(/1\. Introdução ao Curso/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/2\. Configuração Inicial/i)).not.toBeInTheDocument();
    expect(toggleBtnMod1).toHaveAttribute('title', 'Clique para abrir o módulo');
    expect(toggleBtnMod1).toHaveTextContent(/Fechado \(clique para abrir\)/i);

    // 2º Clique: Reabre o módulo 1
    fireEvent.click(toggleBtnMod1);

    // As aulas reaparecem
    expect(screen.getByText(/1\. Introdução ao Curso/i)).toBeInTheDocument();
    expect(toggleBtnMod1).toHaveAttribute('title', 'Clique para fechar o módulo');
  });

  it('não fecha o módulo ao clicar nos botões administrativos de gestão', () => {
    const onOpenCreateLesson = vi.fn();
    const onOpenEditModule = vi.fn();
    const onPromptDeleteModule = vi.fn();

    render(
      <ModuleTimelineSidebar
        modules={mockModules}
        selectedModule={mockModules[0]}
        activeLesson={mockModules[0].lessons[0]}
        completedLessonIds={[]}
        totalLessonsCount={3}
        isManager={true}
        onSelectModule={vi.fn()}
        onSelectLesson={vi.fn()}
        onOpenCreateLesson={onOpenCreateLesson}
        onOpenEditModule={onOpenEditModule}
        onPromptDeleteModule={onPromptDeleteModule}
      />
    );

    // Clica no botão de adicionar aula
    const addBtn = screen.getByTestId('timeline-add-lesson-btn-1');
    fireEvent.click(addBtn);
    expect(onOpenCreateLesson).toHaveBeenCalled();

    // Módulo continua aberto mesmo após clicar no botão interno
    expect(screen.getByText(/1\. Introdução ao Curso/i)).toBeInTheDocument();
  });

  it('aplica line-clamp de 2 linhas e atributo title no título para evitar poluição visual com nomes longos', () => {
    const longTitleLesson = {
      id: 1,
      title: 'Módulo 1',
      lessons: [
        {
          id: 999,
          title: 'Aula 01 - Introdução à Bússola Astrológica: Como Funcionam os Trânsitos e o Guia de Previsões Detalhado',
        },
      ],
    };

    render(
      <ModuleTimelineSidebar
        modules={[longTitleLesson]}
        selectedModule={longTitleLesson}
        activeLesson={longTitleLesson.lessons[0]}
        completedLessonIds={[]}
        totalLessonsCount={1}
        onSelectModule={vi.fn()}
        onSelectLesson={vi.fn()}
      />
    );

    const titleEl = screen.getByTestId('lesson-title-999');
    expect(titleEl).toBeInTheDocument();
    // Atributo title garante o tooltip nativo com o nome completo ao passar o mouse
    expect(titleEl).toHaveAttribute(
      'title',
      '1. Aula 01 - Introdução à Bússola Astrológica: Como Funcionam os Trânsitos e o Guia de Previsões Detalhado'
    );
    // Estilos de line-clamp e reticências aplicados
    expect(titleEl.style.WebkitLineClamp || titleEl.style.webkitLineClamp).toBe('2');
    expect(titleEl.style.overflow).toBe('hidden');
    expect(titleEl.style.textOverflow).toBe('ellipsis');
  });

  it('renderiza o card de oferta de próximo nível quando sidebarUpsellOffer for informado', () => {
    const mockOffer = {
      id: 99,
      title: 'Próximo Passo: Mentoria VIP',
      description: 'Alcance novos horizontes.',
      media_type: 'image',
      media_url: 'https://exemplo.com/banner.png',
      button_text: 'Garantir Vaga',
      button_url: 'https://checkout.com/mentoria'
    };

    render(
      <ModuleTimelineSidebar
        modules={mockModules}
        selectedModule={mockModules[0]}
        sidebarUpsellOffer={mockOffer}
        completedLessonIds={[]}
        totalLessonsCount={2}
      />
    );

    expect(screen.getByTestId('sidebar-upsell-card')).toBeInTheDocument();
    expect(screen.getByText('Próximo Passo: Mentoria VIP')).toBeInTheDocument();
    expect(screen.getByText('Garantir Vaga')).toBeInTheDocument();
  });
  it('renderiza duração total do curso no bloco Meu Progresso e duração individual de cada módulo', () => {
    const modulesWithDurations = [
      {
        id: 10,
        title: 'Módulo 1',
        lessons: [
          { id: 101, title: 'Aula A', duration: '20 min' },
          { id: 102, title: 'Aula B', duration: '25 min' }
        ]
      },
      {
        id: 20,
        title: 'Módulo 2',
        lessons: [
          { id: 201, title: 'Aula C', duration: '35 min' }
        ]
      }
    ];

    render(
      <ModuleTimelineSidebar
        modules={modulesWithDurations}
        selectedModule={modulesWithDurations[0]}
        activeLesson={modulesWithDurations[0].lessons[0]}
        completedLessonIds={[]}
        totalLessonsCount={3}
      />
    );

    const courseDuration = screen.getByTestId('sidebar-course-duration');
    expect(courseDuration).toBeInTheDocument();
    expect(courseDuration).toHaveTextContent(/1h 20min total/i);

    const mod1Duration = screen.getByTestId('sidebar-module-duration-10');
    expect(mod1Duration).toHaveTextContent(/45 min/i);

    const mod2Duration = screen.getByTestId('sidebar-module-duration-20');
    expect(mod2Duration).toHaveTextContent(/35 min/i);
  });

  it('renderiza o botão de troca de capa em lote para gestores e dispara callback ao clicar', () => {
    const onOpenBatchThumbnail = vi.fn();
    render(
      <ModuleTimelineSidebar
        modules={mockModules}
        selectedModule={mockModules[0]}
        activeLesson={mockModules[0].lessons[0]}
        isManager={true}
        onOpenBatchThumbnail={onOpenBatchThumbnail}
      />
    );

    const batchBtn = screen.getByTestId('timeline-batch-thumbnail-btn-1');
    expect(batchBtn).toBeInTheDocument();
    fireEvent.click(batchBtn);
    expect(onOpenBatchThumbnail).toHaveBeenCalledWith(mockModules[0]);
  });

  it('renderiza o botão de reordenação em lote para gestores e dispara callback ao clicar', () => {
    const onOpenBatchOrder = vi.fn();
    render(
      <ModuleTimelineSidebar
        modules={mockModules}
        selectedModule={mockModules[0]}
        activeLesson={mockModules[0].lessons[0]}
        isManager={true}
        onOpenBatchOrder={onOpenBatchOrder}
      />
    );

    const orderBtn = screen.getByTestId('timeline-batch-order-btn-1');
    expect(orderBtn).toBeInTheDocument();
    fireEvent.click(orderBtn);
    expect(onOpenBatchOrder).toHaveBeenCalledWith(mockModules[0]);
  });
});
