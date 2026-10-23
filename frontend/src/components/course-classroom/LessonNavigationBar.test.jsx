import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LessonNavigationBar from './LessonNavigationBar';

describe('LessonNavigationBar Component', () => {
  const mockPrev = { id: 101, title: 'Aula 01 - Introdução' };
  const mockNext = { id: 103, title: 'Aula 03 - Conclusão' };

  it('renders nothing when neither prevLesson nor nextLesson exist', () => {
    const { container } = render(
      <LessonNavigationBar
        prevLesson={null}
        nextLesson={null}
        onSelectLesson={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('lesson-navigation-bar')).not.toBeInTheDocument();
  });

  it('renders ONLY "Próxima Aula" when on the first lesson (prevLesson is null)', () => {
    const onSelectLesson = vi.fn();
    render(
      <LessonNavigationBar
        prevLesson={null}
        nextLesson={mockNext}
        onSelectLesson={onSelectLesson}
      />
    );

    expect(screen.getByTestId('lesson-navigation-bar')).toBeInTheDocument();
    expect(screen.getByTestId('next-lesson-btn')).toBeInTheDocument();
    expect(screen.getByText('Próxima Aula')).toBeInTheDocument();
    expect(screen.queryByTestId('prev-lesson-btn')).not.toBeInTheDocument();
    expect(screen.queryByText('Aula Anterior')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('next-lesson-btn'));
    expect(onSelectLesson).toHaveBeenCalledWith(mockNext);
  });

  it('renders ONLY "Aula Anterior" when on the last lesson (nextLesson is null)', () => {
    const onSelectLesson = vi.fn();
    render(
      <LessonNavigationBar
        prevLesson={mockPrev}
        nextLesson={null}
        onSelectLesson={onSelectLesson}
      />
    );

    expect(screen.getByTestId('lesson-navigation-bar')).toBeInTheDocument();
    expect(screen.getByTestId('prev-lesson-btn')).toBeInTheDocument();
    expect(screen.getByText('Aula Anterior')).toBeInTheDocument();
    expect(screen.queryByTestId('next-lesson-btn')).not.toBeInTheDocument();
    expect(screen.queryByText('Próxima Aula')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('prev-lesson-btn'));
    expect(onSelectLesson).toHaveBeenCalledWith(mockPrev);
  });

  it('renders BOTH buttons when on an intermediate lesson (both prevLesson and nextLesson exist)', () => {
    const onSelectLesson = vi.fn();
    render(
      <LessonNavigationBar
        prevLesson={mockPrev}
        nextLesson={mockNext}
        onSelectLesson={onSelectLesson}
      />
    );

    expect(screen.getByTestId('lesson-navigation-bar')).toBeInTheDocument();
    expect(screen.getByTestId('prev-lesson-btn')).toBeInTheDocument();
    expect(screen.getByTestId('next-lesson-btn')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('prev-lesson-btn'));
    expect(onSelectLesson).toHaveBeenCalledWith(mockPrev);

    fireEvent.click(screen.getByTestId('next-lesson-btn'));
    expect(onSelectLesson).toHaveBeenCalledWith(mockNext);
  });
});
