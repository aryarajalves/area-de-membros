/**
 * API client para registro e consulta de histórico de cliques na página de vendas de cursos.
 */

export async function recordCourseSalesClick(courseId) {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    const res = await fetch(`/api/v1/courses/${courseId}/sales-click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      console.warn(`[CourseSales] Falha ao registrar clique no curso ${courseId} (status: ${res.status})`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[CourseSales] Erro na requisição de registro de clique:', err);
    return null;
  }
}

export async function fetchCourseSalesClicks(courseId) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`/api/v1/courses/${courseId}/sales-clicks`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Não foi possível carregar o histórico de cliques.');
  }

  return await res.json();
}
