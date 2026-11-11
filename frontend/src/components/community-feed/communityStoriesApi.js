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

export const fetchStoriesTray = async () => {
  const res = await fetch(`${API_BASE}/stories/tray`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao carregar os stories.');
  }
  return res.json();
};

export const fetchUserStories = async (userId, includeHighlights = false) => {
  const params = includeHighlights ? '?include_highlights=true' : '';
  const res = await fetch(`${API_BASE}/stories/user/${userId}${params}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao carregar stories do usuário.');
  }
  return res.json();
};

export const createStory = async ({
  mediaUrl,
  mediaType = 'image',
  mediaThumbnailUrl = null,
  caption = '',
  durationSeconds = 5,
  isHighlight = false,
  highlightTitle = null,
}) => {
  const res = await fetch(`${API_BASE}/stories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      media_url: mediaUrl,
      media_type: mediaType,
      media_thumbnail_url: mediaThumbnailUrl,
      caption: caption || null,
      duration_seconds: durationSeconds,
      is_highlight: isHighlight,
      highlight_title: highlightTitle,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao publicar story.');
  }
  return res.json();
};

export const deleteStory = async (storyId) => {
  const res = await fetch(`${API_BASE}/stories/${storyId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao excluir story.');
  }
  return res.json();
};

export const recordStoryView = async (storyId) => {
  const res = await fetch(`${API_BASE}/stories/${storyId}/view`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) return { viewed: false };
  return res.json();
};

export const reactToStory = async (storyId, reactionType) => {
  const res = await fetch(`${API_BASE}/stories/${storyId}/react`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reaction_type: reactionType }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao reagir ao story.');
  }
  return res.json();
};

export const fetchStoryViews = async (storyId) => {
  const res = await fetch(`${API_BASE}/stories/${storyId}/views`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao obter visualizadores.');
  }
  return res.json();
};

export const replyToStory = async (storyId, message) => {
  const res = await fetch(`${API_BASE}/stories/${storyId}/reply`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao responder story.');
  }
  return res.json();
};

export const uploadStoryMedia = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/stories/upload`, {
    method: 'POST',
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao fazer upload da mídia do story.');
  }
  return res.json();
};
