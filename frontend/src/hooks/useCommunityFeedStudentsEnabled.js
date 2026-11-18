import { useState, useEffect } from 'react';

const STORAGE_KEY = 'community_feed_students_enabled';

/**
 * Hook que retorna se o Feed da Comunidade está liberado para alunos via WhiteLabel.
 * Sincroniza automaticamente com localStorage e eventos 'whitelabel_updated'.
 */
export default function useCommunityFeedStudentsEnabled() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let isMounted = true;

    const syncFromApi = async () => {
      try {
        const res = await fetch('/api/v1/whitelabel');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && data.community_feed_students_enabled !== undefined) {
            const val = Boolean(data.community_feed_students_enabled);
            setEnabled(val);
            try {
              localStorage.setItem(STORAGE_KEY, String(val));
            } catch {
              // ignore storage errors
            }
          }
        }
      } catch {
        // silent fallback
      }
    };

    const handleWhiteLabelUpdated = (e) => {
      if (e?.detail?.community_feed_students_enabled !== undefined) {
        const val = Boolean(e.detail.community_feed_students_enabled);
        setEnabled(val);
        try {
          localStorage.setItem(STORAGE_KEY, String(val));
        } catch {
          // ignore
        }
      }
    };

    syncFromApi();
    window.addEventListener('whitelabel_updated', handleWhiteLabelUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('whitelabel_updated', handleWhiteLabelUpdated);
    };
  }, []);

  return enabled;
}
