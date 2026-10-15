/**
 * Utilitários para agrupamento de cliques por lead/contato no histórico de interesse.
 */

export function groupClicksByLead(clicks = []) {
  if (!clicks || clicks.length === 0) return [];

  const leadsMap = new Map();

  clicks.forEach((click) => {
    if (!click) return;
    const userId = click.user_id || click.user?.id || 'unknown';

    if (!leadsMap.has(userId)) {
      leadsMap.set(userId, {
        userId,
        user: click.user || { id: userId, name: 'Usuário Não Identificado', email: '', role: 'aluno' },
        clicks: [],
        totalClicks: 0,
        lastClickAt: click.created_at,
        firstClickAt: click.created_at
      });
    }

    const lead = leadsMap.get(userId);
    lead.clicks.push(click);
    lead.totalClicks += 1;

    // Atualiza o clique mais recente do lead
    if (!lead.lastClickAt || new Date(click.created_at) > new Date(lead.lastClickAt)) {
      lead.lastClickAt = click.created_at;
    }
    // Atualiza o primeiro clique do lead
    if (!lead.firstClickAt || new Date(click.created_at) < new Date(lead.firstClickAt)) {
      lead.firstClickAt = click.created_at;
    }
  });

  // Ordena os cliques internos de cada lead do mais recente para o mais antigo
  leadsMap.forEach((lead) => {
    lead.clicks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  });

  // Converte para lista e ordena os leads: o contato que clicou por último aparece primeiro!
  const sortedLeads = Array.from(leadsMap.values()).sort((a, b) => {
    return new Date(b.lastClickAt) - new Date(a.lastClickAt);
  });

  return sortedLeads;
}
