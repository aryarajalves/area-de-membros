import React from 'react';
import AgentFlowKbSelector from './AgentFlowKbSelector';

export default function CourseModalAiTab({
  agentflowKbId = null,
  setAgentflowKbId,
  agentflowKbName = '',
  setAgentflowKbName,
  title,
  isLightBg
}) {
  return (
    <div data-testid="course-modal-tab-panel-ai">
      {/* Integração AgentFlow - Base de Conhecimento RAG */}
      <AgentFlowKbSelector
        selectedKbId={agentflowKbId}
        selectedKbName={agentflowKbName}
        onChangeKb={(id, name) => {
          if (setAgentflowKbId) setAgentflowKbId(id);
          if (setAgentflowKbName) setAgentflowKbName(name);
        }}
        courseTitle={title}
        isLightBg={isLightBg}
      />
    </div>
  );
}
