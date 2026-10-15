import React from 'react';
import FunnelNodeMessage from './FunnelNodeMessage';
import FunnelNodeDelay from './FunnelNodeDelay';
import FunnelNodeMedia from './FunnelNodeMedia';
import FunnelNodeAudio from './FunnelNodeAudio';
import FunnelNodeTrigger from './FunnelNodeTrigger';
import FunnelNodeTag from './FunnelNodeTag';

export default function FunnelNodeRenderer({
  node,
  isSelected,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  isTargetActive,
  availableSenders = [],
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
    availableSenders,
  };

  switch (node.type) {
    case 'trigger':
      return <FunnelNodeTrigger {...commonProps} />;
    case 'tag':
      return <FunnelNodeTag {...commonProps} />;
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
