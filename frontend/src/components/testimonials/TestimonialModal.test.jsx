import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TestimonialModal from './TestimonialModal';

describe('TestimonialModal Component', () => {
  const availableCourses = [
    { id: 1, title: 'Curso de React Avançado' },
    { id: 2, title: 'Curso de Node.js' },
    { id: 3, title: 'Curso de Python Pro' }
  ];

  it('renders form and auto-selects first unreviewed course when user has already reviewed course 1', () => {
    const userReviewedCourseIds = new Set([1]);
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(
      <TestimonialModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        availableCourses={availableCourses}
        userReviewedCourseIds={userReviewedCourseIds}
      />
    );

    expect(screen.getByText('Deixar Depoimento')).toBeInTheDocument();
    expect(screen.getByText('ℹ️ Regra da plataforma: É permitido apenas 1 depoimento por curso por pessoa.')).toBeInTheDocument();

    const select = screen.getByTestId('testimonial-course-select');
    // Como o curso 1 já foi avaliado, o modal deve selecionar automaticamente o curso 2
    expect(select.value).toBe('2');

    // Opção 1 deve estar desabilitada com aviso de já avaliado
    const option1 = screen.getByRole('option', { name: /Curso de React Avançado \(Já avaliado/i });
    expect(option1).toBeDisabled();

    // Opção 2 deve estar habilitada
    const option2 = screen.getByRole('option', { name: 'Curso de Node.js' });
    expect(option2).not.toBeDisabled();
  });

  it('renders warning alert and blocks form when all available courses are already reviewed', () => {
    const userReviewedCourseIds = new Set([1, 2, 3]);
    const onClose = vi.fn();

    render(
      <TestimonialModal
        isOpen={true}
        onClose={onClose}
        availableCourses={availableCourses}
        userReviewedCourseIds={userReviewedCourseIds}
      />
    );

    // Deve exibir card de alerta de que todos os cursos foram avaliados
    expect(screen.getByTestId('all-courses-reviewed-alert')).toBeInTheDocument();
    expect(screen.getByText('Você já avaliou todos os seus cursos!')).toBeInTheDocument();
    expect(screen.getByText(/apenas 1 depoimento por curso por pessoa/i)).toBeInTheDocument();

    // Não deve renderizar o formulário
    expect(screen.queryByTestId('testimonial-course-select')).not.toBeInTheDocument();
    expect(screen.queryByTestId('submit-testimonial-btn')).not.toBeInTheDocument();

    // Clicar em Entendido / Fechar chama onClose
    const closeBtn = screen.getByTestId('understood-all-reviewed-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('submits valid testimonial for unreviewed course', () => {
    const userReviewedCourseIds = new Set([1]);
    const onSubmit = vi.fn();

    render(
      <TestimonialModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        availableCourses={availableCourses}
        userReviewedCourseIds={userReviewedCourseIds}
      />
    );

    fireEvent.change(screen.getByTestId('testimonial-title-input'), {
      target: { value: 'Excelente curso!' }
    });
    fireEvent.change(screen.getByTestId('testimonial-content-textarea'), {
      target: { value: 'Aulas didáticas e com muito conteúdo prático.' }
    });

    fireEvent.click(screen.getByTestId('star-btn-5'));
    fireEvent.click(screen.getByTestId('submit-testimonial-btn'));

    expect(onSubmit).toHaveBeenCalledWith({
      course_id: 2,
      rating: 5,
      title: 'Excelente curso!',
      content: 'Aulas didáticas e com muito conteúdo prático.'
    });
  });

  it('renders edit mode with pre-filled content and locked course selector', () => {
    const editing = {
      id: 99,
      course_id: 1,
      rating: 4,
      title: 'Título Antigo',
      content: 'Conteúdo antigo do depoimento.'
    };
    const onSubmit = vi.fn();

    render(
      <TestimonialModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        editingTestimonial={editing}
        availableCourses={availableCourses}
      />
    );

    expect(screen.getByText('Editar Depoimento')).toBeInTheDocument();
    const select = screen.getByTestId('testimonial-course-select');
    expect(select).toBeDisabled();
    expect(select.value).toBe('1');
    expect(screen.getByTestId('testimonial-title-input').value).toBe('Título Antigo');
    expect(screen.getByTestId('testimonial-content-textarea').value).toBe('Conteúdo antigo do depoimento.');

    // Salvar alteração
    fireEvent.change(screen.getByTestId('testimonial-title-input'), {
      target: { value: 'Título Novo' }
    });
    fireEvent.click(screen.getByTestId('submit-testimonial-btn'));

    expect(onSubmit).toHaveBeenCalledWith({
      course_id: 1,
      rating: 4,
      title: 'Título Novo',
      content: 'Conteúdo antigo do depoimento.'
    });
  });
});
