import React from 'react';
import usePwaInstall from '../../hooks/usePwaInstall';
import PwaInstallBanner from './PwaInstallBanner';
import PwaInstallInstructionsModal from './PwaInstallInstructionsModal';

export default function PwaInstallPortal() {
  const {
    isIos,
    canShowBanner,
    showInstructionsModal,
    handleInstallClick,
    dismissBanner,
    closeInstructionsModal,
  } = usePwaInstall();

  return (
    <>
      {canShowBanner && (
        <PwaInstallBanner
          onInstall={handleInstallClick}
          onDismiss={dismissBanner}
        />
      )}
      <PwaInstallInstructionsModal
        isOpen={showInstructionsModal}
        isIos={isIos}
        onClose={closeInstructionsModal}
      />
    </>
  );
}
