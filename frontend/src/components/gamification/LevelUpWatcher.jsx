import React, { useState, useEffect, useCallback, useRef } from 'react';
import LevelUpCelebrationModal from './LevelUpCelebrationModal';
import { calculateStudentLevel } from '../../utils/gamificationLevelUtils';
import { useToast } from '../../context/ToastContext';

/**
 * Função utilitária global para disparar a celebração de subida de nível
 * de qualquer lugar do frontend (ex: conclusão de aula, envio de suporte, quiz).
 */
export function triggerLevelUpCelebration(levelData) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:level-up', { detail: levelData }));
  }
}

export function triggerXpEarnedToast(points, reason = '') {
  if (typeof window !== 'undefined' && Number(points) > 0) {
    window.dispatchEvent(new CustomEvent('app:xp-earned', { detail: { points: Number(points), reason } }));
  }
}

export default function LevelUpWatcher({ currentUser }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [levelData, setLevelData] = useState(null);
  const { addToast } = useToast();
  const addToastRef = useRef(addToast);
  addToastRef.current = addToast;

  const evaluatePoints = useCallback(
    (pts) => {
      if (!currentUser || currentUser.role !== 'aluno') return;
      const numericPts = Number(pts || 0);

      // Verifica se o aluno ganhou novos pontos de XP para exibir Toast no canto superior direito
      const xpStorageKey = `last_known_xp_${currentUser.id}`;
      const rawLastXp = localStorage.getItem(xpStorageKey);
      const lastKnownXp = rawLastXp !== null ? parseInt(rawLastXp, 10) : NaN;
      if (!isNaN(lastKnownXp) && numericPts > lastKnownXp) {
        const diff = numericPts - lastKnownXp;
        if (addToastRef.current) addToastRef.current(`⚡ +${diff} XP ganhos!`, 'success');
      }
      localStorage.setItem(xpStorageKey, String(numericPts));

      const currentLevel = calculateStudentLevel(numericPts);
      const storageKey = `last_celebrated_level_${currentUser.id}`;
      const rawStored = localStorage.getItem(storageKey);
      const lastCelebrated = rawStored !== null ? parseInt(rawStored, 10) : NaN;

      // Todo aluno começa no Nível 1 (Bronze I). Se nunca celebrou antes e já está no Nível 2+, dispara a celebração!
      const effectiveBaseline = isNaN(lastCelebrated) ? 1 : lastCelebrated;

      if (isNaN(lastCelebrated) && currentLevel.level <= 1) {
        localStorage.setItem(storageKey, '1');
      } else if (currentLevel.level > effectiveBaseline) {
        setLevelData(currentLevel);
        setModalOpen(true);
      }
    },
    [currentUser]
  );

  const fetchAndCheckStudentPoints = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'aluno') return;
    const token = localStorage.getItem('auth_token');
    if (!token || typeof fetch !== 'function') return;

    try {
      const res = await fetch('/api/v1/gamification/ranking?period=all_time', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res && res.ok) {
        const data = await res.json();
        const myPoints = data?.my_position?.points;
        if (myPoints !== undefined && myPoints !== null) {
          evaluatePoints(myPoints);
        }
      }
    } catch {
      // Ignora erros de rede silenciosamente
    }
  }, [currentUser, evaluatePoints]);

  useEffect(() => {
    const handleLevelUpEvent = (e) => {
      if (e.detail) {
        setLevelData(e.detail);
        setModalOpen(true);
      }
    };

    const handleCheckLevelUp = (e) => {
      const toastedXp = Number(e?.detail?.xpAlreadyToasted || 0);
      if (toastedXp > 0 && currentUser?.id) {
        const xpKey = `last_known_xp_${currentUser.id}`;
        const rawPrev = localStorage.getItem(xpKey);
        if (rawPrev !== null && !isNaN(parseInt(rawPrev, 10))) {
          localStorage.setItem(xpKey, String(parseInt(rawPrev, 10) + toastedXp));
        }
      }
      fetchAndCheckStudentPoints();
    };

    const handleXpEarnedEvent = (e) => {
      const pts = Number(e?.detail?.points || 0);
      const reason = e?.detail?.reason || '';
      if (pts > 0) {
        if (currentUser?.id) {
          const xpKey = `last_known_xp_${currentUser.id}`;
          const rawPrev = localStorage.getItem(xpKey);
          if (rawPrev !== null && !isNaN(parseInt(rawPrev, 10))) {
            localStorage.setItem(xpKey, String(parseInt(rawPrev, 10) + pts));
          }
        }
        if (addToastRef.current) {
          addToastRef.current(reason ? `⚡ +${pts} XP ganhos! (${reason})` : `⚡ +${pts} XP ganhos!`, 'success');
        }
      }
    };

    window.addEventListener('app:level-up', handleLevelUpEvent);
    window.addEventListener('app:check-level-up', handleCheckLevelUp);
    window.addEventListener('app:xp-earned', handleXpEarnedEvent);
    return () => {
      window.removeEventListener('app:level-up', handleLevelUpEvent);
      window.removeEventListener('app:check-level-up', handleCheckLevelUp);
      window.removeEventListener('app:xp-earned', handleXpEarnedEvent);
    };
  }, [fetchAndCheckStudentPoints, currentUser?.id]);

  // Monitora pontuação do usuário via props e via consulta de ranking
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'aluno') return;
    const directPts = Number(currentUser.gamification_points ?? currentUser.points ?? -1);
    if (directPts >= 0) {
      evaluatePoints(directPts);
    }
    fetchAndCheckStudentPoints();
  }, [currentUser, evaluatePoints, fetchAndCheckStudentPoints]);

  const handleClose = () => {
    if (currentUser?.id && levelData?.level) {
      localStorage.setItem(`last_celebrated_level_${currentUser.id}`, String(levelData.level));
    }
    setModalOpen(false);
  };

  return (
    <LevelUpCelebrationModal
      isOpen={modalOpen}
      onClose={handleClose}
      levelData={levelData}
      studentName={currentUser?.name || 'Aluno'}
    />
  );
}
