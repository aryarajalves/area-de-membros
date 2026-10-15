import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CourseSalesLeadItem from './CourseSalesLeadItem';

describe('CourseSalesLeadItem Component', () => {
  const mockLead = {
    userId: 42,
    user: {
      id: 42,
      name: 'Carlos Drummond',
      email: 'carlos@exemplo.com',
      role: 'aluno',
      avatar_url: null
    },
    totalClicks: 2,
    lastClickAt: '2026-10-15T18:00:00Z',
    firstClickAt: '2026-10-15T12:00:00Z',
    clicks: [
      {
        id: 201,
        created_at: '2026-10-15T18:00:00Z'
      },
      {
        id: 200,
        created_at: '2026-10-15T12:00:00Z'
      }
    ]
  };

  it('renders lead basic info, click badge, and formatted last click', () => {
    render(
      <CourseSalesLeadItem
        lead={mockLead}
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        cardItemBg="rgba(255, 255, 255, 0.03)"
        cardItemBorder="1px solid rgba(255, 255, 255, 0.06)"
      />
    );

    expect(screen.getByText('Carlos Drummond')).toBeInTheDocument();
    expect(screen.getByText('carlos@exemplo.com')).toBeInTheDocument();
    expect(screen.getByText('Aluno')).toBeInTheDocument();
    expect(screen.getByTestId('lead-clicks-count-42')).toHaveTextContent('2 cliques');
    expect(screen.getByTestId('lead-last-click-42')).toHaveTextContent('15:00:00'); // 18:00 UTC = 15:00 BRT
  });

  it('toggles expansion when clicked and reveals individual clicks', () => {
    render(
      <CourseSalesLeadItem
        lead={mockLead}
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        cardItemBg="rgba(255, 255, 255, 0.03)"
        cardItemBorder="1px solid rgba(255, 255, 255, 0.06)"
      />
    );

    expect(screen.queryByTestId('sales-lead-expanded-list-42')).not.toBeInTheDocument();

    const row = screen.getByTestId('sales-lead-row-42');
    fireEvent.click(row);

    expect(screen.getByTestId('sales-lead-expanded-list-42')).toBeInTheDocument();
    expect(screen.getByTestId('lead-click-detail-201')).toBeInTheDocument();
    expect(screen.getByTestId('lead-click-detail-200')).toBeInTheDocument();
    expect(screen.getByText('(Último clique)')).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByTestId('sales-lead-expanded-list-42')).not.toBeInTheDocument();
  });
});
