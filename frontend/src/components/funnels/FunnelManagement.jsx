import React, { useState } from 'react';
import FunnelsListPage from './FunnelsListPage';
import FunnelCanvasPage from './FunnelCanvasPage';

export default function FunnelManagement() {
  const [activeFunnelId, setActiveFunnelId] = useState(null);

  if (activeFunnelId) {
    return (
      <FunnelCanvasPage
        funnelId={activeFunnelId}
        onBack={() => setActiveFunnelId(null)}
      />
    );
  }

  return <FunnelsListPage onSelectFunnel={(id) => setActiveFunnelId(id)} />;
}
