export async function fetchCertificateStatusApi(courseId, token) {
  const authToken = token || localStorage.getItem('auth_token');
  const res = await fetch(`/api/v1/certificates/course/${courseId}/status`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao consultar status do certificado.');
  }
  return res.json();
}

export async function issueCertificateApi(courseId, token) {
  const authToken = token || localStorage.getItem('auth_token');
  const res = await fetch(`/api/v1/certificates/course/${courseId}/issue`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao emitir certificado.');
  }
  return res.json();
}

export function getCertificateDownloadUrl(certificateCode) {
  return `/api/v1/certificates/${certificateCode}/download`;
}

export async function validatePublicCertificateApi(certificateCode) {
  const res = await fetch(`/api/v1/certificates/public/${certificateCode}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Certificado inválido ou não encontrado.');
  }
  return res.json();
}
