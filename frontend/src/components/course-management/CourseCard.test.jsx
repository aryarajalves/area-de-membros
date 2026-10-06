import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseCard from './CourseCard';

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

    // Ao clicar, deve redirecionar para sales_page_url
    fireEvent.click(moreInfoBtn);
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

  it('renders edit and delete buttons when isManager is true', () => {
    const onOpenEditModal = vi.fn();
    const onPromptDelete = vi.fn();

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
      />
    );

    const editBtn = screen.getByTestId('edit-course-btn-1');
    const deleteBtn = screen.getByTestId('delete-course-btn-1');

    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(editBtn);
    expect(onOpenEditModal).toHaveBeenCalledWith(mockCourseWithAccess);

    fireEvent.click(deleteBtn);
    expect(onPromptDelete).toHaveBeenCalledWith(mockCourseWithAccess);
  });
});
