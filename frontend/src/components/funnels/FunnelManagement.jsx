import React, { useState } from 'react';
import FunnelsListPage from './FunnelsListPage';
import FunnelCanvasPage from './FunnelCanvasPage';

export default function FunnelManagement({ onFunnelViewChange }) {
  const [activeFunnelId, setActiveFunnelId] = useState(null);

  const handleSelectFunnel = (id) => {
    setActiveFunnelId(id);
    if (onFunnelViewChange) onFunnelViewChange(true);
  };

  const handleBackToList = () => {
    setActiveFunnelId(null);
    if (onFunnelViewChange) onFunnelViewChange(false);
  };

  if (activeFunnelId) {
    return (
      <FunnelCanvasPage
        funnelId={activeFunnelId}
        onBack={handleBackToList}
      />
    );
  }

  return <FunnelsListPage onSelectFunnel={handleSelectFunnel} />;
}
