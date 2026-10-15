import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseSalesHistoryModal, { formatToBrasiliaWithSeconds } from './CourseSalesHistoryModal';
import * as courseSalesApi from './courseSalesApi';

describe('CourseSalesHistoryModal Component', () => {
  const mockCourse = {
    id: 10,
    title: 'Curso de Astrologia Tradicional'
  };

  const mockClicksData = {
    course_id: 10,
    course_title: 'Curso de Astrologia Tradicional',
    total_clicks: 3,
    clicks: [
      {
        id: 1,
        course_id: 10,
        user_id: 101,
        created_at: '2026-10-15T13:45:30Z',
        user: {
          id: 101,
          name: 'João Silva',
          email: 'joao.silva@exemplo.com',
          role: 'aluno',
          avatar_url: null
        }
      },
      {
        id: 2,
        course_id: 10,
        user_id: 102,
        created_at: '2026-10-15T14:20:10Z',
        user: {
          id: 102,
          name: 'Maria Oliveira',
          email: 'maria.oliveira@exemplo.com',
          role: 'aluno',
          avatar_url: 'https://exemplo.com/maria.jpg'
        }
      },
      {
        id: 3,
        course_id: 10,
        user_id: 101,
        created_at: '2026-10-15T17:10:00Z',
        user: {
          id: 101,
          name: 'João Silva',
          email: 'joao.silva@exemplo.com',
          role: 'aluno',
          avatar_url: null
        }
      }
    ]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly converts UTC timestamp to Brasília timezone (UTC-3) with seconds', () => {
    // 13:45:30 UTC -> 10:45:30 Horário de Brasília
    const result = formatToBrasiliaWithSeconds('2026-10-15T13:45:30Z');
    expect(result).toContain('15/10/2026');
    expect(result).toContain('10:45:30');
  });

  it('groups multiple clicks from the same lead into one card and orders latest lead first', async () => {
    vi.spyOn(courseSalesApi, 'fetchCourseSalesClicks').mockResolvedValue(mockClicksData);

    render(
      <CourseSalesHistoryModal
        isOpen={true}
        course={mockCourse}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Histórico de Interesse')).toBeInTheDocument();
    expect(screen.getByText('Curso de Astrologia Tradicional')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('sales-lead-card-101')).toBeInTheDocument();
    });

    // João Silva clicou 2 vezes (às 13:45 e às 17:10). Seu último clique foi 17:10 UTC (14:10 Brasília).
    // Maria Oliveira clicou 1 vez (às 14:20 UTC / 11:20 Brasília).
    // O total no badge deve mostrar 3 cliques registrados (2 contatos)
    expect(screen.getByTestId('total-clicks-badge')).toHaveTextContent('3 cliques registrados (2 contatos)');

    // Contagem de cliques de João deve ser 2
    expect(screen.getByTestId('lead-clicks-count-101')).toHaveTextContent('2 cliques');
    // Último clique de João deve ser 14:10:00 (Brasília)
    expect(screen.getByTestId('lead-last-click-101')).toHaveTextContent('14:10:00');

    // Contagem de cliques de Maria deve ser 1
    expect(screen.getByTestId('lead-clicks-count-102')).toHaveTextContent('1 clique');
    expect(screen.getByTestId('lead-last-click-102')).toHaveTextContent('11:20:10');

    // Ordem no DOM: Como o último clique de João (17:10) foi posterior ao de Maria (14:20), João deve vir primeiro
    const cards = screen.getAllByTestId(/^sales-lead-card-/);
    expect(cards[0]).toHaveAttribute('data-testid', 'sales-lead-card-101');
    expect(cards[1]).toHaveAttribute('data-testid', 'sales-lead-card-102');
  });

  it('expands accordion on click to show detailed clicks breakdown for that specific contact', async () => {
    vi.spyOn(courseSalesApi, 'fetchCourseSalesClicks').mockResolvedValue(mockClicksData);

    render(
      <CourseSalesHistoryModal
        isOpen={true}
        course={mockCourse}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('sales-lead-row-101')).toBeInTheDocument();
    });

    // Inicialmente a lista expandida não está no DOM
    expect(screen.queryByTestId('sales-lead-expanded-list-101')).not.toBeInTheDocument();

    // Clica no card de João para expandir
    fireEvent.click(screen.getByTestId('sales-lead-row-101'));

    // Agora o subpainel expandido está visível com os 2 cliques
    expect(screen.getByTestId('sales-lead-expanded-list-101')).toBeInTheDocument();
    expect(screen.getByTestId('lead-click-detail-3')).toBeInTheDocument();
    expect(screen.getByTestId('lead-click-detail-1')).toBeInTheDocument();
    expect(screen.getByText('(Último clique)')).toBeInTheDocument();

    // Clica novamente para recolher o acordeão
    fireEvent.click(screen.getByTestId('sales-lead-row-101'));
    expect(screen.queryByTestId('sales-lead-expanded-list-101')).not.toBeInTheDocument();
  });

  it('filters contacts by search term', async () => {
    vi.spyOn(courseSalesApi, 'fetchCourseSalesClicks').mockResolvedValue(mockClicksData);

    render(
      <CourseSalesHistoryModal
        isOpen={true}
        course={mockCourse}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('sales-lead-card-101')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-sales-clicks-input');
    fireEvent.change(searchInput, { target: { value: 'Maria' } });

    expect(screen.queryByTestId('sales-lead-card-101')).not.toBeInTheDocument();
    expect(screen.getByTestId('sales-lead-card-102')).toBeInTheDocument();
  });

  it('paginates contacts when total exceeds items per page', async () => {
    // Cria 8 leads com 1 clique cada
    const eightClicks = Array.from({ length: 8 }, (_, idx) => ({
      id: idx + 1,
      course_id: 10,
      user_id: 200 + idx,
      created_at: `2026-10-15T10:${10 + idx}:00Z`,
      user: {
        id: 200 + idx,
        name: `Aluno Teste ${idx + 1}`,
        email: `aluno${idx + 1}@exemplo.com`,
        role: 'aluno'
      }
    }));

    vi.spyOn(courseSalesApi, 'fetchCourseSalesClicks').mockResolvedValue({
      course_id: 10,
      course_title: 'Curso de Astrologia Tradicional',
      total_clicks: 8,
      clicks: eightClicks
    });

    render(
      <CourseSalesHistoryModal
        isOpen={true}
        course={mockCourse}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('sales-history-pagination')).toBeInTheDocument();
    });

    // Como ITEMS_PER_PAGE = 6, na página 1 deve exibir 6 contatos
    expect(screen.getByText('Mostrando 1–6 de 8 contatos')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-current-page')).toHaveTextContent('1 / 2');

    // Botão Anterior deve estar desativado na página 1
    const prevBtn = screen.getByTestId('pagination-prev-btn');
    const nextBtn = screen.getByTestId('pagination-next-btn');
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Clica em Próxima página
    fireEvent.click(nextBtn);

    expect(screen.getByText('Mostrando 7–8 de 8 contatos')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-current-page')).toHaveTextContent('2 / 2');
    expect(nextBtn).toBeDisabled();
    expect(prevBtn).not.toBeDisabled();

    // Clica em Anterior para voltar
    fireEvent.click(prevBtn);
    expect(screen.getByTestId('pagination-current-page')).toHaveTextContent('1 / 2');
  });

  it('shows empty state message when no clicks are registered', async () => {
    vi.spyOn(courseSalesApi, 'fetchCourseSalesClicks').mockResolvedValue({
      course_id: 10,
      course_title: 'Curso de Astrologia Tradicional',
      total_clicks: 0,
      clicks: []
    });

    render(
      <CourseSalesHistoryModal
        isOpen={true}
        course={mockCourse}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('empty-clicks-message')).toBeInTheDocument();
    });

    expect(screen.getByText('Nenhum clique de interesse registrado')).toBeInTheDocument();
  });

  it('calls onClose when close buttons are clicked', async () => {
    vi.spyOn(courseSalesApi, 'fetchCourseSalesClicks').mockResolvedValue(mockClicksData);
    const onClose = vi.fn();

    render(
      <CourseSalesHistoryModal
        isOpen={true}
        course={mockCourse}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('sales-lead-card-101')).toBeInTheDocument();
    });

    const closeHeaderBtn = screen.getByTestId('close-sales-history-btn');
    fireEvent.click(closeHeaderBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeFooterBtn = screen.getByTestId('close-sales-history-footer-btn');
    fireEvent.click(closeFooterBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
