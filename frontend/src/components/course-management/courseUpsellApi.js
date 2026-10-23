export async function fetchCourseUpsellOffers(courseId) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`/api/v1/courses/${courseId}/upsell-offers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erro ao carregar anúncios de upsell.');
  }
  return res.json();
}

export async function createCourseUpsellOffer(courseId, data) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`/api/v1/courses/${courseId}/upsell-offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erro ao criar anúncio de upsell.');
  }
  return res.json();
}

export async function updateCourseUpsellOffer(offerId, data) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`/api/v1/courses/upsell-offers/${offerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erro ao atualizar anúncio de upsell.');
  }
  return res.json();
}

export async function deleteCourseUpsellOffer(offerId) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`/api/v1/courses/upsell-offers/${offerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Erro ao excluir anúncio de upsell.');
  }
  return true;
}

export async function checkEligibleUpsell(courseId, progressPct) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`/api/v1/courses/${courseId}/upsell-check?progress=${encodeURIComponent(progressPct)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return { has_offer: false, offer: null };
  return res.json();
}

export async function dismissUpsellOffer(offerId) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`/api/v1/courses/upsell-offers/${offerId}/dismiss`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return false;
  return res.json();
}

export async function clickUpsellOffer(offerId) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`/api/v1/courses/upsell-offers/${offerId}/click`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return false;
  return res.json();
}

export async function fetchSidebarUpsellOffer(courseId) {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`/api/v1/courses/${courseId}/upsell-sidebar`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return { has_offer: false, offer: null };
  return res.json();
}
