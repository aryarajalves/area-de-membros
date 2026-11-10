const API_BASE = '/api/v1/community';

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('auth_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const fetchFeed = async ({ filter = 'all', courseId = null, search = '', page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (filter) params.append('filter', filter);
  if (courseId) params.append('course_id', courseId);
  if (search) params.append('search', search);
  params.append('page', page);
  params.append('limit', limit);

  const res = await fetch(`${API_BASE}/feed?${params.toString()}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao carregar o feed da comunidade.');
  }
  return res.json();
};

export const createFeedPost = async ({
  content,
  courseId = null,
  mediaUrls = [],
  mediaType = 'none',
  mediaThumbnailUrl = null,
}) => {
  const res = await fetch(`${API_BASE}/feed`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      content,
      course_id: courseId ? Number(courseId) : null,
      media_urls: mediaUrls,
      media_type: mediaType,
      media_thumbnail_url: mediaThumbnailUrl || null,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao criar publicação.');
  }
  return res.json();
};

export const updateFeedPost = async (postId, data) => {
  const res = await fetch(`${API_BASE}/feed/${postId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao atualizar publicação.');
  }
  return res.json();
};

export const deleteFeedPost = async (postId) => {
  const res = await fetch(`${API_BASE}/feed/${postId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao excluir publicação.');
  }
  return true;
};

export const toggleLikeFeedPost = async (postId) => {
  const res = await fetch(`${API_BASE}/feed/${postId}/like`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao curtir publicação.');
  }
  return res.json();
};

export const fetchFeedPostLikes = async (postId) => {
  const res = await fetch(`${API_BASE}/feed/${postId}/likes`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao carregar curtidas da publicação.');
  }
  return res.json();
};

export const togglePinFeedPost = async (postId) => {
  const res = await fetch(`${API_BASE}/feed/${postId}/pin`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao fixar publicação.');
  }
  return res.json();
};

export const fetchFeedPostComments = async (postId) => {
  const res = await fetch(`${API_BASE}/feed/${postId}/comments`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao carregar comentários.');
  }
  return res.json();
};

export const createFeedPostComment = async (postId, content, parentId = null) => {
  const res = await fetch(`${API_BASE}/feed/${postId}/comments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      content,
      parent_id: parentId,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao enviar comentário.');
  }
  return res.json();
};

export const deleteFeedPostComment = async (postId, commentId) => {
  const res = await fetch(`${API_BASE}/feed/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao excluir comentário.');
  }
  return true;
};

export const createFeedComment = createFeedPostComment;
export const deleteFeedComment = deleteFeedPostComment;

export const fetchFeedCourses = async () => {
  const res = await fetch(`${API_BASE}/feed/courses`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    return [];
  }
  return res.json();
};

export const fetchMentionCandidates = async (query = '') => {
  const res = await fetch(`${API_BASE}/feed/mention-candidates?q=${encodeURIComponent(query)}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    return [];
  }
  return res.json();
};

export const uploadFeedMedia = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/feed/upload`, {
    method: 'POST',
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao fazer upload de mídia.');
  }
  return res.json();
};

export const toggleBookmarkFeedPost = async (postId) => {
  const res = await fetch(`${API_BASE}/feed/${postId}/bookmark`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao salvar/remover dos favoritos.');
  }
  return res.json();
};

export const fetchFeedNotifications = async () => {
  const res = await fetch(`${API_BASE}/feed/notifications`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao carregar notificações.');
  }
  return res.json();
};

export const fetchFeedUnreadNotificationsCount = async () => {
  const res = await fetch(`${API_BASE}/feed/notifications/unread-count`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao carregar contagem de notificações.');
  }
  return res.json();
};

export const fetchFeedUnreadCount = fetchFeedUnreadNotificationsCount;

export const markFeedNotificationAsRead = async (notificationId) => {
  const res = await fetch(`${API_BASE}/feed/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao marcar notificação como lida.');
  }
  return res.json();
};

export const markAllFeedNotificationsAsRead = async () => {
  const res = await fetch(`${API_BASE}/feed/notifications/read-all`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao marcar todas as notificações como lidas.');
  }
  return res.json();
};

export const deleteFeedNotification = async (notificationId) => {
  const res = await fetch(`${API_BASE}/feed/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao excluir notificação.');
  }
  return true;
};

export const fetchUserProfile = async (userId) => {
  const res = await fetch(`${API_BASE}/feed/profile/${userId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao carregar perfil do usuário.');
  }
  return res.json();
};

export const updateMyProfile = async ({ name, bio, bio_link, avatar_url }) => {
  const res = await fetch(`${API_BASE}/feed/profile/me`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      name,
      bio,
      bio_link,
      avatar_url,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao atualizar perfil.');
  }
  return res.json();
};

export const uploadProfileAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/feed/profile/avatar`, {
    method: 'POST',
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao fazer upload da foto de perfil.');
  }
  return res.json();
};

export const toggleFollowUser = async (userId) => {
  const res = await fetch(`${API_BASE}/feed/users/${userId}/follow`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao seguir/deixar de seguir usuário.');
  }
  return res.json();
};

export const fetchUserFollowers = async (userId) => {
  const res = await fetch(`${API_BASE}/feed/users/${userId}/followers`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao buscar seguidores.');
  }
  return res.json();
};

export const fetchUserFollowing = async (userId) => {
  const res = await fetch(`${API_BASE}/feed/users/${userId}/following`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao buscar quem o usuário está seguindo.');
  }
  return res.json();
};

export const recordFeedPostView = async (postId) => {
  const res = await fetch(`${API_BASE}/feed/${postId}/view`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    return { recorded: false };
  }
  return res.json();
};

export const fetchFeedPostInsights = async (postId) => {
  const res = await fetch(`${API_BASE}/feed/${postId}/insights`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao carregar insights da publicação.');
  }
  return res.json();
};
