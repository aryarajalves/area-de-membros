import { useState, useEffect, useCallback } from 'react';

/**
 * Verifica se o usuário tem acesso à aba de Vagas & Serviços:
 * - Respeita o toggle `freelance_enabled` configurado no WhiteLabel
 * - admin e superadmin têm acesso quando o módulo está ativo
 * - aluno só tem acesso se o módulo estiver ativo e possuir pelo menos 1 curso liberado
 */
export default function useFreelanceAccess(user) {
  const isManager = user?.role === 'superadmin' || user?.role === 'admin';
  const [hasAccess, setHasAccess] = useState(() => isManager);

  const checkAccess = useCallback(() => {
    if (!user) {
      setHasAccess(false);
      return;
    }

    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      setHasAccess(isManager);
      return;
    }

    let cancelled = false;
    fetch('/api/v1/freelance/access', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.has_access === 'boolean') {
          setHasAccess(data.has_access);
        }
      })
      .catch(() => {
        if (!cancelled) setHasAccess(isManager);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, isManager]);

  useEffect(() => {
    const cleanup = checkAccess();
    const handleWhiteLabelUpdate = (e) => {
      if (e?.detail && typeof e.detail.freelance_enabled === 'boolean' && !e.detail.freelance_enabled) {
        setHasAccess(false);
        return;
      }
      checkAccess();
    };
    window.addEventListener('whitelabel_updated', handleWhiteLabelUpdate);
    return () => {
      if (typeof cleanup === 'function') cleanup();
      window.removeEventListener('whitelabel_updated', handleWhiteLabelUpdate);
    };
  }, [checkAccess]);

  return hasAccess;
}
