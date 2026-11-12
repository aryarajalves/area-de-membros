const API_BASE = '/api/v1/community';

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const fetchMyStrikesStatus = async () => {
  const res = await fetch(`${API_BASE}/strikes/my-status`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao consultar status de strikes.');
  }
  return res.json();
};

export const appealStrike = async (strikeId, reason) => {
  const res = await fetch(`${API_BASE}/strikes/${strikeId}/appeal`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao enviar recurso do strike.');
  }
  return res.json();
};

export const fetchPendingStrikeAppeals = async (statusFilter = 'pending') => {
  const res = await fetch(`${API_BASE}/admin/strikes/appeals?status_filter=${encodeURIComponent(statusFilter)}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao carregar recursos de strikes.');
  }
  return res.json();
};

export const judgeStrikeAppeal = async (strikeId, action) => {
  const res = await fetch(`${API_BASE}/admin/strikes/${strikeId}/appeal`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao julgar recurso do strike.');
  }
  return res.json();
};

export const applyAdminStrike = async ({ userId, reason, description = null, postId = null, commentId = null }) => {
  const res = await fetch(`${API_BASE}/admin/strikes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      user_id: userId,
      reason,
      description,
      post_id: postId,
      comment_id: commentId,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao aplicar strike ao usuário.');
  }
  return res.json();
};
