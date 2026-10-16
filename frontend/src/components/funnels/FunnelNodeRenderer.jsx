import React from 'react';
import FunnelNodeMessage from './FunnelNodeMessage';
import FunnelNodeDelay from './FunnelNodeDelay';
import FunnelNodeMedia from './FunnelNodeMedia';
import FunnelNodeAudio from './FunnelNodeAudio';
import FunnelNodeTrigger from './FunnelNodeTrigger';
import FunnelNodeTag from './FunnelNodeTag';
import FunnelNodeWebhook from './FunnelNodeWebhook';
import FunnelNodeEnrollment from './FunnelNodeEnrollment';
import FunnelNodeGamificationXp from './FunnelNodeGamificationXp';
import FunnelNodeInternalNotify from './FunnelNodeInternalNotify';
import FunnelNodeAbSplit from './FunnelNodeAbSplit';
import FunnelNodeCourseCondition from './FunnelNodeCourseCondition';
import FunnelNodeStop from './FunnelNodeStop';

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
    case 'ab_split':
      return <FunnelNodeAbSplit {...commonProps} />;
    case 'condition_course':
      return <FunnelNodeCourseCondition {...commonProps} />;
    case 'stop':
      return <FunnelNodeStop {...commonProps} />;
    case 'action_webhook':
      return <FunnelNodeWebhook {...commonProps} />;
    case 'action_enrollment':
      return <FunnelNodeEnrollment {...commonProps} />;
    case 'action_gamification_xp':
      return <FunnelNodeGamificationXp {...commonProps} />;
    case 'action_internal_notify':
      return <FunnelNodeInternalNotify {...commonProps} />;
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
