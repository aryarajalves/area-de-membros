import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatUserEloBadge, { getChatAvatarEloStyle } from './ChatUserEloBadge';

describe('ChatUserEloBadge', () => {
  it('não renderiza nada se o usuário for nulo ou não for aluno', () => {
    const { container: c1 } = render(<ChatUserEloBadge user={null} />);
    expect(c1.firstChild).toBeNull();

    const admin = { id: 1, role: 'admin', gamification_tier: 'Ouro' };
    const { container: c2 } = render(<ChatUserEloBadge user={admin} />);
    expect(c2.firstChild).toBeNull();
  });

  it('renderiza o badge com o título e estilo do Elo para aluno', () => {
    const student = {
      id: 10,
      role: 'aluno',
      gamification_tier: 'Ouro',
      gamification_badge: '👑 Ouro II',
      gamification_tier_color: '#f59e0b',
    };

    render(<ChatUserEloBadge user={student} />);

    const badge = screen.getByTestId('chat-user-elo-badge-10');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('👑 Ouro II');
    expect(badge).toHaveAttribute('title', 'Elo RPG na Comunidade: 👑 Ouro II');
  });

  it('getChatAvatarEloStyle retorna moldura neon para alunos com elo', () => {
    const student = {
      role: 'aluno',
      gamification_tier: 'Diamante',
      gamification_tier_color: '#38bdf8',
    };

    const style = getChatAvatarEloStyle(student);
    expect(style.border).toBe('2px solid #38bdf8');
    expect(style.boxShadow).toContain('#38bdf8');
  });

  it('getChatAvatarEloStyle retorna borda padrão para administradores', () => {
    const admin = { role: 'admin' };
    const style = getChatAvatarEloStyle(admin);
    expect(style.border).toBe('1px solid rgba(255, 255, 255, 0.12)');
  });
});
