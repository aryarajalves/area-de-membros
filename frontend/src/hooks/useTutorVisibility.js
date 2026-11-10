import { useState, useEffect } from 'react';

export function useTutorVisibility(currentUser) {
  const isManager = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
  const [isTutorVisible, setIsTutorVisible] = useState(true);
  const [loading, setLoading] = useState(!isManager);

  useEffect(() => {
    if (isManager) {
      setIsTutorVisible(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const res = await fetch('/api/v1/tutor-ia/status', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.is_visible !== undefined) {
            setIsTutorVisible(Boolean(data.is_visible));
          }
        }
      } catch (err) {
        console.error('Erro ao verificar visibilidade do Tutor IA:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStatus();

    const handleStatusUpdate = (e) => {
      if (e?.detail?.is_visible !== undefined) {
        setIsTutorVisible(Boolean(e.detail.is_visible));
      } else {
        fetchStatus();
      }
    };
    window.addEventListener('tutor-settings-updated', handleStatusUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('tutor-settings-updated', handleStatusUpdate);
    };
  }, [isManager, currentUser?.id]);

  return { isTutorVisible, loading };
}
