import React, { useState, useEffect, useRef } from 'react';
import CourseUpsellModal from './CourseUpsellModal';
import { checkEligibleUpsell, dismissUpsellOffer, clickUpsellOffer } from '../course-management/courseUpsellApi';

export default function CourseUpsellManager({
  courseId,
  completedCount = 0,
  totalCount = 0
}) {
  const [currentOffer, setCurrentOffer] = useState(null);
  const [targetActionUrl, setTargetActionUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const checkedProgressMilestonesRef = useRef(new Set());

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  useEffect(() => {
    if (!courseId || progressPct <= 0) return;

    // Se já verificamos essa porcentagem exata nesta sessão e não abriu oferta, evita requisições duplicadas
    if (checkedProgressMilestonesRef.current.has(progressPct)) return;
    checkedProgressMilestonesRef.current.add(progressPct);

    let isMounted = true;
    checkEligibleUpsell(courseId, progressPct)
      .then((data) => {
        if (!isMounted) return;
        if (data && data.has_offer && data.offer) {
          setCurrentOffer(data.offer);
          setTargetActionUrl(data.target_action_url || '');
          setIsOpen(true);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [courseId, progressPct]);

  const handleDismiss = async () => {
    setIsOpen(false);
    if (currentOffer?.id) {
      try {
        await dismissUpsellOffer(currentOffer.id);
      } catch (e) {
        // Silently catch
      }
    }
  };

  const handleCtaClick = async () => {
    setIsOpen(false);
    if (currentOffer?.id) {
      try {
        await clickUpsellOffer(currentOffer.id);
      } catch (e) {
        // Silently catch
      }
    }
  };

  return (
    <CourseUpsellModal
      isOpen={isOpen}
      offer={currentOffer}
      targetActionUrl={targetActionUrl}
      onDismiss={handleDismiss}
      onCtaClick={handleCtaClick}
    />
  );
}
