import React, { useState, useEffect } from 'react';
import LevelUpCelebrationModal from './LevelUpCelebrationModal';
import { calculateStudentLevel } from '../../utils/gamificationLevelUtils';

/**
 * Função utilitária global para disparar a celebração de subida de nível
 * de qualquer lugar do frontend (ex: conclusão de aula, envio de suporte, quiz).
 */
export function triggerLevelUpCelebration(levelData) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:level-up', { detail: levelData }));
  }
}

export default function LevelUpWatcher({ currentUser }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [levelData, setLevelData] = useState(null);

  useEffect(() => {
    const handleLevelUpEvent = (e) => {
      if (e.detail) {
        setLevelData(e.detail);
        setModalOpen(true);
      }
    };

    window.addEventListener('app:level-up', handleLevelUpEvent);
    return () => {
      window.removeEventListener('app:level-up', handleLevelUpEvent);
    };
  }, []);

  // Monitora pontuação do usuário e dispara se subir de nível
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'aluno') return;
    const pts = Number(currentUser.gamification_points || currentUser.points || 0);
    if (pts <= 0) return;

    const currentLevel = calculateStudentLevel(pts);
    const storageKey = `last_celebrated_level_${currentUser.id}`;
    const lastCelebrated = parseInt(localStorage.getItem(storageKey), 10);

    if (isNaN(lastCelebrated)) {
      // Primeira vez gravando o nível inicial para não exibir popup no primeiro login sem ter subido
      localStorage.setItem(storageKey, String(currentLevel.level));
    } else if (currentLevel.level > lastCelebrated) {
      setLevelData(currentLevel);
      setModalOpen(true);
    }
  }, [currentUser]);

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
