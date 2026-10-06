import React from 'react';
import FunnelNodeMessage from './FunnelNodeMessage';
import FunnelNodeDelay from './FunnelNodeDelay';
import FunnelNodeMedia from './FunnelNodeMedia';
import FunnelNodeAudio from './FunnelNodeAudio';

export default function FunnelNodeRenderer({
  node,
  isSelected,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  isTargetActive,
}) {
  const commonProps = {
    node,
    isSelected,
    onUpdateData,
    onDeleteNode,
    onDuplicateNode,
    onStartConnect,
    onConnectTarget,
    isTargetActive,
  };

  switch (node.type) {
    case 'delay':
      return <FunnelNodeDelay {...commonProps} />;
    case 'media':
      return <FunnelNodeMedia {...commonProps} />;
    case 'audio':
      return <FunnelNodeAudio {...commonProps} />;
    case 'message':
    default:
      return <FunnelNodeMessage {...commonProps} />;
  }
}
