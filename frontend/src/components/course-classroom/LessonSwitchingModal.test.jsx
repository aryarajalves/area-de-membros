import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LessonSwitchingModal from './LessonSwitchingModal';

describe('LessonSwitchingModal Component', () => {
  it('não renderiza quando isOpen é false', () => {
    const { container } = render(
      <LessonSwitchingModal isOpen={false} lessonTitle="Próxima Aula" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza popup de carregamento com o título da próxima aula quando isOpen é true', () => {
    render(
      <LessonSwitchingModal
        isOpen={true}
        lessonTitle="Aula 02 - Aspectos Solares"
      />
    );

    const dialog = screen.getByTestId('lesson-switching-modal');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Carregando aula...')).toBeInTheDocument();
    expect(screen.getByText('Aula 02 - Aspectos Solares')).toBeInTheDocument();
  });
});
