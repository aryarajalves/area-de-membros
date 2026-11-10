import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeedPostInsightsModal from './FeedPostInsightsModal';
import * as feedApi from './communityFeedApi';

vi.mock('./communityFeedApi', () => ({
  fetchFeedPostInsights: vi.fn(),
}));

describe('FeedPostInsightsModal Component', () => {
  const mockInsights = {
    post_id: 42,
    views_count: 120,
    likes_count: 24,
    comments_count: 6,
    bookmarks_count: 5,
    total_interactions: 35,
    engagement_rate: 29.17,
    recent_viewers: [
      {
        user_id: 1,
        name: 'Carlos Aluno',
        role: 'aluno',
        avatar_url: null,
        viewed_at: new Date().toISOString(),
      },
      {
        user_id: 2,
        name: 'Ana Professora',
        role: 'admin',
        avatar_url: null,
        viewed_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<FeedPostInsightsModal isOpen={false} postId={42} onClose={() => {}} />);
    expect(screen.queryByTestId('feed-post-insights-modal')).not.toBeInTheDocument();
  });

  it('loads and displays KPIs, interaction stats and recent viewers when open', async () => {
    feedApi.fetchFeedPostInsights.mockResolvedValueOnce(mockInsights);

    render(<FeedPostInsightsModal isOpen={true} postId={42} onClose={() => {}} />);

    expect(screen.getByText(/Calculando métricas e alcance/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('kpi-views')).toHaveTextContent('120');
      expect(screen.getByTestId('kpi-interactions')).toHaveTextContent('35');
      expect(screen.getByTestId('kpi-rate')).toHaveTextContent('29.17%');
      expect(screen.getByTestId('stat-likes')).toHaveTextContent('24');
      expect(screen.getByTestId('stat-comments')).toHaveTextContent('6');
      expect(screen.getByTestId('stat-bookmarks')).toHaveTextContent('5');
      expect(screen.getByText('Carlos Aluno')).toBeInTheDocument();
      expect(screen.getByText('Ana Professora')).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    feedApi.fetchFeedPostInsights.mockRejectedValueOnce(
      new Error('Apenas o autor da publicação pode ver os insights.')
    );

    render(<FeedPostInsightsModal isOpen={true} postId={42} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-insights-error')).toHaveTextContent(
        'Apenas o autor da publicação pode ver os insights.'
      );
    });
  });

  it('calls onClose when close button is clicked', async () => {
    feedApi.fetchFeedPostInsights.mockResolvedValueOnce(mockInsights);
    const onClose = vi.fn();

    render(<FeedPostInsightsModal isOpen={true} postId={42} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-insights-close-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('feed-insights-close-btn'));
    expect(onClose).toHaveBeenCalled();
  });
});
