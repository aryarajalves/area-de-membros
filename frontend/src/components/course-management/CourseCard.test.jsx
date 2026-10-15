import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseCard from './CourseCard';
import * as courseSalesApi from './courseSalesApi';

describe('CourseCard Component', () => {
  const mockCourseWithAccess = {
    id: 1,
    title: 'Curso Liberado',
    description: 'Acesso completo às aulas',
    thumbnail_url: 'https://b2.com/thumb1.jpg',
    sales_page_url: 'https://vendas.com/curso1',
    has_access: true
  };

  const mockCourseWithoutAccess = {
    id: 2,
    title: 'Curso Não Comprado',
    description: 'Curso disponível para aquisição',
    thumbnail_url: 'https://b2.com/thumb2.jpg',
    sales_page_url: 'https://vendas.com/curso2',
    has_access: false
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "Acessar Curso" button when user has access', () => {
    const onSelectCourse = vi.fn();

    render(
      <CourseCard
        course={mockCourseWithAccess}
        isManager={false}
        isLightBg={false}
        textColor="#fff"
        subTextColor="#aaa"
        cardBg="#111"
        cardBorder="1px solid #333"
        onSelectCourse={onSelectCourse}
        onOpenEditModal={vi.fn()}
        onPromptDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Curso Liberado')).toBeInTheDocument();
    expect(screen.queryByTestId('course-unpurchased-badge-1')).not.toBeInTheDocument();

    const accessBtn = screen.getByTestId('access-course-btn-1');
    expect(accessBtn).toBeInTheDocument();
    expect(accessBtn).toHaveTextContent('Acessar Curso');

    fireEvent.click(accessBtn);
    expect(onSelectCourse).toHaveBeenCalledWith(mockCourseWithAccess);
  });

  it('renders "Disponível para Compra" badge, chained lock overlay and "Ver Mais Informações" when student does not have access', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
    const recordClickSpy = vi.spyOn(courseSalesApi, 'recordCourseSalesClick').mockImplementation(() => {});

    render(
      <CourseCard
        course={mockCourseWithoutAccess}
        isManager={false}
        isLightBg={false}
        textColor="#fff"
        subTextColor="#aaa"
        cardBg="#111"
        cardBorder="1px solid #333"
        onSelectCourse={vi.fn()}
        onOpenEditModal={vi.fn()}
        onPromptDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Curso Não Comprado')).toBeInTheDocument();
    expect(screen.getByTestId('course-unpurchased-badge-2')).toBeInTheDocument();
    expect(screen.getByText('Disponível para Compra')).toBeInTheDocument();
    expect(screen.getByTestId('chained-lock-overlay')).toBeInTheDocument();
    expect(screen.getByText('Produto Fechado')).toBeInTheDocument();

    expect(screen.queryByTestId('access-course-btn-2')).not.toBeInTheDocument();
    const moreInfoBtn = screen.getByTestId('more-info-course-btn-2');
    expect(moreInfoBtn).toBeInTheDocument();
    expect(moreInfoBtn).toHaveTextContent('Ver Mais Informações');

    // Botão "Entrar em Contato" foi removido e não deve existir
    expect(screen.queryByTestId('contact-support-course-btn-2')).not.toBeInTheDocument();
    expect(screen.queryByText('Entrar em Contato')).not.toBeInTheDocument();

    // Ao clicar, deve registrar o clique e redirecionar para sales_page_url
    fireEvent.click(moreInfoBtn);
    expect(recordClickSpy).toHaveBeenCalledWith(2);
    expect(windowOpenSpy).toHaveBeenCalledWith('https://vendas.com/curso2', '_blank', 'noopener,noreferrer');
  });

  it('only renders "Ver Mais Informações" button and never "Entrar em Contato"', () => {
    render(
      <CourseCard
        course={mockCourseWithoutAccess}
        isManager={false}
        isLightBg={false}
        textColor="#fff"
        subTextColor="#aaa"
        cardBg="#111"
        cardBorder="1px solid #333"
        onSelectCourse={vi.fn()}
        onOpenEditModal={vi.fn()}
        onPromptDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId('more-info-course-btn-2')).toBeInTheDocument();
    expect(screen.queryByTestId('contact-support-course-btn-2')).not.toBeInTheDocument();
    expect(screen.queryByText('Entrar em Contato')).not.toBeInTheDocument();
  });

  it('shows friendly toast message when course has no sales_page_url and student clicks more info', () => {
    const onShowInfoToast = vi.fn();
    const courseNoUrl = {
      ...mockCourseWithoutAccess,
      sales_page_url: null
    };

    render(
      <CourseCard
        course={courseNoUrl}
        isManager={false}
        isLightBg={false}
        textColor="#fff"
        subTextColor="#aaa"
        cardBg="#111"
        cardBorder="1px solid #333"
        onSelectCourse={vi.fn()}
        onOpenEditModal={vi.fn()}
        onPromptDelete={vi.fn()}
        onShowInfoToast={onShowInfoToast}
      />
    );

    const moreInfoBtn = screen.getByTestId('more-info-course-btn-2');
    fireEvent.click(moreInfoBtn);
    expect(onShowInfoToast).toHaveBeenCalledWith('A página de informações deste curso estará disponível em breve.');
  });

  it('renders sales history, edit and delete buttons when isManager is true', () => {
    const onOpenEditModal = vi.fn();
    const onPromptDelete = vi.fn();
    const onOpenSalesHistoryModal = vi.fn();

    render(
      <CourseCard
        course={mockCourseWithAccess}
        isManager={true}
        isLightBg={false}
        textColor="#fff"
        subTextColor="#aaa"
        cardBg="#111"
        cardBorder="1px solid #333"
        onSelectCourse={vi.fn()}
        onOpenEditModal={onOpenEditModal}
        onPromptDelete={onPromptDelete}
        onOpenSalesHistoryModal={onOpenSalesHistoryModal}
      />
    );

    const historyBtn = screen.getByTestId('sales-history-btn-1');
    const editBtn = screen.getByTestId('edit-course-btn-1');
    const deleteBtn = screen.getByTestId('delete-course-btn-1');

    expect(historyBtn).toBeInTheDocument();
    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(historyBtn);
    expect(onOpenSalesHistoryModal).toHaveBeenCalledWith(mockCourseWithAccess);

    fireEvent.click(editBtn);
    expect(onOpenEditModal).toHaveBeenCalledWith(mockCourseWithAccess);

    fireEvent.click(deleteBtn);
    expect(onPromptDelete).toHaveBeenCalledWith(mockCourseWithAccess);
  });

  it('renders cover_image_url when thumbnail_url is not provided', () => {
    const courseWithBannerOnly = {
      id: 3,
      title: 'Bussola Astrologica',
      description: 'Curso com banner',
      thumbnail_url: null,
      cover_image_url: 'https://b2.com/banner-bussola.jpg',
      has_access: true
    };

    render(
      <CourseCard
        course={courseWithBannerOnly}
        isManager={false}
        isLightBg={false}
        textColor="#fff"
        subTextColor="#aaa"
        cardBg="#111"
        cardBorder="1px solid #333"
        onSelectCourse={vi.fn()}
      />
    );

    const img = screen.getByRole('img', { name: 'Bussola Astrologica' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://b2.com/banner-bussola.jpg');
  });

  it('renders "Acessar Ferramenta" button and tool badge when item_type is tool and opens tool_url on click', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
    const mockTool = {
      id: 4,
      title: 'ZapVoice Web App',
      description: 'Extensão de WhatsApp Web',
      item_type: 'tool',
      tool_url: 'https://app.zapvoice.com.br',
      has_access: true
    };

    render(
      <CourseCard
        course={mockTool}
        isManager={false}
        isLightBg={false}
        textColor="#fff"
        subTextColor="#aaa"
        cardBg="#111"
        cardBorder="1px solid #333"
        onSelectCourse={vi.fn()}
      />
    );

    expect(screen.getByTestId('course-tool-badge-4')).toBeInTheDocument();
    expect(screen.getByText('Ferramenta / App')).toBeInTheDocument();

    const toolBtn = screen.getByTestId('access-tool-btn-4');
    expect(toolBtn).toBeInTheDocument();
    expect(toolBtn).toHaveTextContent('Acessar Ferramenta');

    fireEvent.click(toolBtn);
    expect(windowOpenSpy).toHaveBeenCalledWith('https://app.zapvoice.com.br', '_blank', 'noopener,noreferrer');
  });

  it('renders combo package badge when bundled_items_count > 0', () => {
    const mockCombo = {
      id: 5,
      title: 'Combo Bússola Master',
      item_type: 'course',
      bundled_items_count: 2,
      has_access: true
    };

    render(
      <CourseCard
        course={mockCombo}
        isManager={false}
        isLightBg={false}
        textColor="#fff"
        subTextColor="#aaa"
        cardBg="#111"
        cardBorder="1px solid #333"
        onSelectCourse={vi.fn()}
      />
    );

    expect(screen.getByTestId('course-bundle-badge-5')).toBeInTheDocument();
    expect(screen.getByText('Combo (+2)')).toBeInTheDocument();
  });
});
