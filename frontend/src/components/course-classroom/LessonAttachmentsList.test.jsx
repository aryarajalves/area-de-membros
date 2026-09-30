import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LessonAttachmentsList from './LessonAttachmentsList';

describe('LessonAttachmentsList Component', () => {
  it('renders empty state when there are no attachments', () => {
    render(<LessonAttachmentsList attachments={[]} />);
    expect(screen.getByText('Nenhum material complementar anexado')).toBeInTheDocument();
    expect(screen.getByTestId('empty-attachments-state')).toBeInTheDocument();
  });

  it('renders list of materials with description and Acessar buttons', () => {
    const mockList = [
      {
        id: 1,
        title: 'Checklist de Lançamento.pdf',
        description: 'Checklist detalhado com todas as tarefas de lançamento',
        file_url: 'https://b2.com/chk.pdf',
        file_type: 'pdf',
        file_size_bytes: 1048576
      },
      {
        id: 2,
        title: 'Modelos de Scripts.zip',
        description: 'Arquivos de scripts e templates para envio',
        file_url: 'https://b2.com/scripts.zip',
        file_type: 'zip',
        file_size_bytes: 5242880
      }
    ];

    render(<LessonAttachmentsList attachments={mockList} />);

    expect(screen.getByText('Checklist de Lançamento.pdf')).toBeInTheDocument();
    expect(screen.getByText('Checklist detalhado com todas as tarefas de lançamento')).toBeInTheDocument();
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();

    expect(screen.getByText('Modelos de Scripts.zip')).toBeInTheDocument();
    expect(screen.getByText('Arquivos de scripts e templates para envio')).toBeInTheDocument();
    expect(screen.getByText('5.0 MB')).toBeInTheDocument();

    const accessButtons = screen.getAllByRole('link', { name: /Acessar/i });
    expect(accessButtons).toHaveLength(2);
    expect(accessButtons[0]).toHaveAttribute('href', 'https://b2.com/chk.pdf');
    expect(accessButtons[1]).toHaveAttribute('href', 'https://b2.com/scripts.zip');
  });
});
