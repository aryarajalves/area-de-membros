import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TestimonialCard from './TestimonialCard';

const baseTestimonial = {
  id: 42,
  user_id: 7,
  user_name: 'Maria Clara',
  course_id: 1,
  course_title: 'Curso Completo',
  rating: 5,
  title: 'Excelente didática',
  content: 'Aprendi muito com as aulas práticas.',
  status: 'approved',
  is_featured: false,
  is_example: false,
  created_at: '2026-11-10T10:00:00Z'
};

describe('TestimonialCard', () => {
  it('renders example badge when is_example is true and hides it when false', () => {
    const { rerender } = render(
      <TestimonialCard
        testimonial={baseTestimonial}
        currentUser={{ id: 99, role: 'aluno' }}
      />
    );

    expect(screen.queryByTestId('testimonial-example-badge')).not.toBeInTheDocument();

    rerender(
      <TestimonialCard
        testimonial={{ ...baseTestimonial, is_example: true }}
        currentUser={{ id: 99, role: 'aluno' }}
      />
    );

    expect(screen.getByTestId('testimonial-example-badge')).toBeInTheDocument();
    expect(screen.getByText('Depoimento Exemplo')).toBeInTheDocument();
  });

  it('shows Fixar/Remover Exemplo button only for managers and calls onToggleExample', () => {
    const onToggleExample = vi.fn();

    const { rerender } = render(
      <TestimonialCard
        testimonial={baseTestimonial}
        currentUser={{ id: 7, role: 'aluno' }}
        onToggleExample={onToggleExample}
      />
    );

    expect(screen.queryByTestId('example-btn-42')).not.toBeInTheDocument();

    rerender(
      <TestimonialCard
        testimonial={baseTestimonial}
        currentUser={{ id: 1, role: 'superadmin' }}
        onToggleExample={onToggleExample}
      />
    );

    const btn = screen.getByTestId('example-btn-42');
    expect(btn).toHaveTextContent('Fixar Exemplo');
    fireEvent.click(btn);
    expect(onToggleExample).toHaveBeenCalledWith(42, true);

    rerender(
      <TestimonialCard
        testimonial={{ ...baseTestimonial, is_example: true }}
        currentUser={{ id: 1, role: 'superadmin' }}
        onToggleExample={onToggleExample}
      />
    );

    const unpinBtn = screen.getByTestId('example-btn-42');
    expect(unpinBtn).toHaveTextContent('Remover Exemplo');
    fireEvent.click(unpinBtn);
    expect(onToggleExample).toHaveBeenCalledWith(42, false);
  });
});
