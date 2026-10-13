const getStoredToken = (token) => {
  if (token && typeof token === 'string' && token.trim() !== '') {
    return token;
  }
  return localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
};

export const deleteUserApi = async (userId, token) => {
  const authToken = getStoredToken(token);
  const res = await fetch(`/api/v1/auth/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Erro ao excluir usuário.');
  return data;
};

export const bulkDeleteUsersApi = async (selectedUserIds, token) => {
  const authToken = getStoredToken(token);
  const res = await fetch('/api/v1/auth/users/bulk-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ ids: selectedUserIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Erro ao excluir usuários.');
  return data;
};

export const deleteInviteApi = async (inviteId, token) => {
  const authToken = getStoredToken(token);
  const res = await fetch(`/api/v1/auth/invites/${inviteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Erro ao excluir convite.');
  return data;
};

export const bulkDeleteInvitesApi = async (selectedInviteIds, token) => {
  const authToken = getStoredToken(token);
  const res = await fetch('/api/v1/auth/invites/bulk-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ ids: selectedInviteIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Erro ao excluir convites.');
  return data;
};

export const createUserManualApi = async (userData, token) => {
  const authToken = getStoredToken(token);
  const res = await fetch('/api/v1/auth/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(userData),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = { detail: 'Erro inesperado no servidor. Tente novamente mais tarde.' };
  }
  if (!res.ok) throw new Error(data.detail || 'Erro ao criar usuário.');
  return data;
};
