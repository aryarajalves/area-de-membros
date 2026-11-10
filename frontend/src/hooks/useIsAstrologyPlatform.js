import { useState, useEffect } from 'react';

/**
 * Hook para saber se a Área de Membros está operando no nicho de Astrologia.
 * Lê do cache local, busca no endpoint público /api/v1/whitelabel e escuta eventos de atualização em tempo real.
 */
export default function useIsAstrologyPlatform() {
  const [isAstrology, setIsAstrology] = useState(() => {
    return localStorage.getItem('is_astrology_platform') === 'true';
  });

  useEffect(() => {
    // Em testes unitários (Vitest), evita requisições soltas que possam desordenar mocks sequenciais
    if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test' && !window.__FORCE_ASTROLOGY_FETCH__) {
      const handleStorageUpdate = (e) => {
        if (e?.detail?.is_astrology_platform !== undefined) {
          setIsAstrology(Boolean(e.detail.is_astrology_platform));
        }
      };
      window.addEventListener('whitelabel_updated', handleStorageUpdate);
      return () => {
        window.removeEventListener('whitelabel_updated', handleStorageUpdate);
      };
    }

    let isMounted = true;

    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/v1/whitelabel');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && data.is_astrology_platform !== undefined) {
            const val = Boolean(data.is_astrology_platform);
            setIsAstrology(val);
            localStorage.setItem('is_astrology_platform', String(val));
          }
        }
      } catch {
        // silencioso
      }
    };

    fetchConfig();

    const handleUpdate = (e) => {
      if (e?.detail?.is_astrology_platform !== undefined) {
        setIsAstrology(Boolean(e.detail.is_astrology_platform));
      } else {
        fetchConfig();
      }
    };

    window.addEventListener('whitelabel_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('whitelabel_updated', handleUpdate);
    };
  }, []);

  return isAstrology;
}
