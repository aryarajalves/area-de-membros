export const FREELANCE_CATEGORIES = [
  'Design',
  'Edição de Vídeo',
  'Programação',
  'Tráfego Pago',
  'Copywriting',
  'Social Media',
  'Automação / IA',
  'Outro',
];

export const BUDGET_TYPE_LABELS = {
  fixed: 'Valor Fixo',
  hourly: 'Por Hora',
  negotiable: 'A combinar',
};

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listFreelanceJobs({ status = 'all', category = 'all', search = '', mineOnly = false } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (category && category !== 'all') params.set('category', category);
  if (search && search.trim()) params.set('search', search.trim());
  if (mineOnly) params.set('mine_only', 'true');

  const res = await fetch(`/api/v1/freelance/jobs?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Erro ao carregar vagas de freelancer.');
  return data;
}

export async function createFreelanceJob(payload) {
  const res = await fetch('/api/v1/freelance/jobs', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Erro ao publicar vaga.');
  return data;
}

export async function updateFreelanceJob(jobId, payload) {
  const res = await fetch(`/api/v1/freelance/jobs/${jobId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Erro ao atualizar vaga.');
  return data;
}

export async function deleteFreelanceJob(jobId) {
  const res = await fetch(`/api/v1/freelance/jobs/${jobId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Erro ao excluir vaga.');
  }
  return true;
}
