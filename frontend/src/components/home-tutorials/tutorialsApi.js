export async function fetchTutorialsApi(token) {
  const res = await fetch('/api/v1/tutorials', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao carregar vídeos tutoriais.');
  }
  return res.json();
}

export async function createTutorialApi(data, token) {
  const res = await fetch('/api/v1/tutorials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao criar vídeo tutorial.');
  }
  return res.json();
}

export async function updateTutorialApi(id, data, token) {
  const res = await fetch(`/api/v1/tutorials/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao atualizar vídeo tutorial.');
  }
  return res.json();
}

export async function deleteTutorialApi(id, token) {
  const res = await fetch(`/api/v1/tutorials/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao excluir vídeo tutorial.');
  }
  return res.json();
}

export async function uploadTutorialVideoApi(file, token) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/v1/tutorials/upload-video', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha no upload do arquivo de vídeo.');
  }

  return res.json();
}

export async function generateTutorialAiDescriptionApi({ file, videoUrl, videoKey, title }, token) {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (videoUrl) {
    formData.append('video_url', videoUrl);
  }
  if (videoKey) {
    formData.append('video_key', videoKey);
  }
  if (title) {
    formData.append('title', title);
  }

  const res = await fetch('/api/v1/tutorials/generate-ai-description', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = 'Falha ao gerar descrição com IA.';
    try {
      const errorData = await res.json();
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
        errorMessage = errorData.detail[0].msg;
      }
    } catch {
      if (res.status === 413) {
        errorMessage = 'O arquivo de vídeo excede o tamanho suportado diretamente pela requisição. Tente utilizar um arquivo menor ou envie o vídeo primeiro.';
      } else if (res.status === 504) {
        errorMessage = 'Tempo limite excedido na transcrição da IA. Tente novamente.';
      }
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

