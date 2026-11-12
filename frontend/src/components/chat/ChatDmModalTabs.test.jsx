import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatDmModalTabs from './ChatDmModalTabs';

describe('ChatDmModalTabs', () => {
  it('renders inbox and unread tabs and triggers setActiveTab', () => {
    const setActiveTab = vi.fn();
    const onStartNewConversation = vi.fn();

    render(
      <ChatDmModalTabs
        activeTab="inbox"
        setActiveTab={setActiveTab}
        unreadTotal={3}
        currentUser={{ role: 'aluno' }}
        onStartNewConversation={onStartNewConversation}
      />
    );

    expect(screen.getByTestId('dm-tab-inbox')).toBeInTheDocument();
    expect(screen.getByTestId('dm-tab-unread')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByTestId('dm-tab-team-support')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('dm-tab-unread'));
    expect(setActiveTab).toHaveBeenCalledWith('unread');

    fireEvent.click(screen.getByTestId('dm-new-conversation-btn'));
    expect(onStartNewConversation).toHaveBeenCalled();
  });

  it('renders team support tab for superadmin', () => {
    const setActiveTab = vi.fn();

    render(
      <ChatDmModalTabs
        activeTab="team_support"
        setActiveTab={setActiveTab}
        unreadTotal={0}
        currentUser={{ role: 'superadmin' }}
        onStartNewConversation={vi.fn()}
      />
    );

    expect(screen.getByTestId('dm-tab-team-support')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('dm-tab-team-support'));
    expect(setActiveTab).toHaveBeenCalledWith('team_support');
  });
});
