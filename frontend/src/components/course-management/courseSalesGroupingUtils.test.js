import { describe, it, expect } from 'vitest';
import { groupClicksByLead } from './courseSalesGroupingUtils';

describe('courseSalesGroupingUtils - groupClicksByLead', () => {
  it('retorna array vazio para lista nula ou vazia', () => {
    expect(groupClicksByLead([])).toEqual([]);
    expect(groupClicksByLead(null)).toEqual([]);
    expect(groupClicksByLead(undefined)).toEqual([]);
  });

  it('agrupa múltiplos cliques do mesmo contato em um único lead', () => {
    const mockClicks = [
      {
        id: 1,
        user_id: 10,
        created_at: '2026-10-15T08:54:03Z',
        user: { id: 10, name: 'Aryaraj', email: 'aryarajunity@gmail.com', role: 'aluno' }
      },
      {
        id: 2,
        user_id: 10,
        created_at: '2026-10-15T08:54:20Z',
        user: { id: 10, name: 'Aryaraj', email: 'aryarajunity@gmail.com', role: 'aluno' }
      }
    ];

    const leads = groupClicksByLead(mockClicks);
    expect(leads).toHaveLength(1);

    const lead = leads[0];
    expect(lead.userId).toBe(10);
    expect(lead.user.name).toBe('Aryaraj');
    expect(lead.totalClicks).toBe(2);
    expect(lead.clicks).toHaveLength(2);
    // O clique mais recente deve ser 08:54:20
    expect(lead.lastClickAt).toBe('2026-10-15T08:54:20Z');
    expect(lead.clicks[0].created_at).toBe('2026-10-15T08:54:20Z');
    expect(lead.clicks[1].created_at).toBe('2026-10-15T08:54:03Z');
  });

  it('ordena contatos colocando na frente quem clicou por último', () => {
    const mockClicks = [
      // Usuário 1 clicou às 08:00
      {
        id: 1,
        user_id: 1,
        created_at: '2026-10-15T08:00:00Z',
        user: { id: 1, name: 'Lead Antigo', email: 'antigo@test.com', role: 'aluno' }
      },
      // Usuário 2 clicou às 09:30
      {
        id: 2,
        user_id: 2,
        created_at: '2026-10-15T09:30:00Z',
        user: { id: 2, name: 'Lead Recente', email: 'recente@test.com', role: 'aluno' }
      },
      // Usuário 1 clicou novamente às 10:15 (passa a ser o mais recente!)
      {
        id: 3,
        user_id: 1,
        created_at: '2026-10-15T10:15:00Z',
        user: { id: 1, name: 'Lead Antigo', email: 'antigo@test.com', role: 'aluno' }
      }
    ];

    const leads = groupClicksByLead(mockClicks);
    expect(leads).toHaveLength(2);

    // O Usuário 1 teve seu último clique às 10:15, então deve aparecer em primeiro
    expect(leads[0].userId).toBe(1);
    expect(leads[0].user.name).toBe('Lead Antigo');
    expect(leads[0].totalClicks).toBe(2);
    expect(leads[0].lastClickAt).toBe('2026-10-15T10:15:00Z');

    // O Usuário 2 teve seu último clique às 09:30, ficando em segundo
    expect(leads[1].userId).toBe(2);
    expect(leads[1].user.name).toBe('Lead Recente');
    expect(leads[1].totalClicks).toBe(1);
  });
});
