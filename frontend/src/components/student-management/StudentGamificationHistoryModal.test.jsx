import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentGamificationHistoryModal from './StudentGamificationHistoryModal';

describe('StudentGamificationHistoryModal Component', () => {
  const mockStudent = {
    id: 10,
    name: 'Mariana Teste',
    email: 'mariana@test.com'
  };

  const mockHistoryData = {
    student_id: 10,
    student_name: 'Mariana Teste',
    total_points: 65,
    current_rank: 1,
    badge: '🥇 Mestre da Comunidade',
    history: [
      {
        id: 1,
        action: 'support_solution',
        points: 50,
        description: 'Melhor Solução no Suporte',
        created_at: '2026-10-05T14:00:00Z'
      },
      {
        id: 2,
        action: 'lesson_completed',
        points: 15,
        description: 'Aula Concluída: Introdução',
        created_at: '2026-10-05T13:30:00Z'
      }
    ]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <StudentGamificationHistoryModal
        isOpen={false}
        onClose={vi.fn()}
        student={mockStudent}
        isLightBg={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal and displays points, rank, badge and timeline when open', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistoryData
    });

    const onClose = vi.fn();

    render(
      <StudentGamificationHistoryModal
        isOpen={true}
        onClose={onClose}
        student={mockStudent}
        isLightBg={false}
      />
    );

    expect(screen.getByText('Histórico de Pontos e Conquistas')).toBeInTheDocument();
    expect(screen.getByText(/Mariana Teste • mariana@test.com/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('modal-total-points')).toHaveTextContent('65 pts');
      expect(screen.getByTestId('modal-current-rank')).toHaveTextContent('#1');
      expect(screen.getByTestId('modal-badge')).toHaveTextContent('🥇 Mestre da Comunidade');
    });

    expect(screen.getByText('Melhor Solução no Suporte')).toBeInTheDocument();
    expect(screen.getByText('+50 pts')).toBeInTheDocument();
    expect(screen.getByText('Aula Concluída: Introdução')).toBeInTheDocument();
    expect(screen.getByText('+15 pts')).toBeInTheDocument();

    // Testa fechamento via botão X e rodapé
    const closeBtn = screen.getByTestId('close-gamification-modal-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles empty history state correctly', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockHistoryData,
        total_points: 0,
        history: []
      })
    });

    render(
      <StudentGamificationHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
        isLightBg={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('gamification-history-empty')).toHaveTextContent('Nenhum ponto registrado para este aluno ainda.');
    });
  });
});
