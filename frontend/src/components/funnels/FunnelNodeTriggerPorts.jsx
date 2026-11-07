import React from 'react';

export default function FunnelNodeTriggerPorts({
  node,
  data = {},
  triggerEvent,
  meta,
  onStartConnect,
  onConnectTarget,
  isTargetActive = false,
}) {
  if (triggerEvent === 'progress_milestone' && (Array.isArray(data.milestones) ? data.milestones.length > 1 : data.milestone === 'all')) {
    const list = Array.isArray(data.milestones) ? data.milestones : ['25', '50', '75', '100'];
    return (
      <>
        {list.map((m) => {
          const topPercent = m === '25' ? '32%' : m === '50' ? '47%' : m === '75' ? '62%' : '77%';
          const portKey = `output_${m}`;
          return (
            <React.Fragment key={m}>
              <div
                onMouseDown={(e) => { e.stopPropagation(); if (onStartConnect) onStartConnect(node.id, e, node, portKey); }}
                onClick={(e) => { e.stopPropagation(); if (onStartConnect) onStartConnect(node.id, e, node, portKey); }}
                onMouseUp={(e) => { e.stopPropagation(); if (onConnectTarget) onConnectTarget(node.id, portKey); }}
                style={{
                  position: 'absolute',
                  right: '-8px',
                  top: topPercent,
                  transform: 'translateY(-50%)',
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  backgroundColor: '#a855f7',
                  border: '2px solid #0f172a',
                  boxShadow: '0 0 8px #a855f7',
                  cursor: 'grab',
                  zIndex: 10,
                  transition: 'all 0.15s ease',
                }}
                title={`Saída de ${m}%: Conecte ao próximo passo deste marco`}
                data-testid={`node-output-handle-${m}-${node.id}`}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: topPercent,
                  transform: 'translateY(-50%)',
                  fontSize: '8.5px',
                  fontWeight: 800,
                  color: '#c084fc',
                  backgroundColor: 'rgba(168, 85, 247, 0.18)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  pointerEvents: 'none',
                  zIndex: 9,
                }}
              >
                {m}%
              </span>
            </React.Fragment>
          );
        })}
      </>
    );
  }

  if (triggerEvent === 'lesson_module_activity') {
    const list = Array.isArray(data.active_options) ? data.active_options : ['lesson'];
    return (
      <>
        {list.map((opt) => {
          const isLesson = opt === 'lesson';
          const topPercent = isLesson ? '40%' : '68%';
          const portKey = isLesson ? 'output_lesson' : 'output_module';
          const label = isLesson ? 'AULA' : 'MÓDULO';
          return (
            <React.Fragment key={opt}>
              <div
                onMouseDown={(e) => { e.stopPropagation(); if (onStartConnect) onStartConnect(node.id, e, node, portKey); }}
                onClick={(e) => { e.stopPropagation(); if (onStartConnect) onStartConnect(node.id, e, node, portKey); }}
                onMouseUp={(e) => { e.stopPropagation(); if (onConnectTarget) onConnectTarget(node.id, portKey); }}
                style={{
                  position: 'absolute',
                  right: '-8px',
                  top: topPercent,
                  transform: 'translateY(-50%)',
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8',
                  border: '2px solid #0f172a',
                  boxShadow: '0 0 8px #38bdf8',
                  cursor: 'grab',
                  zIndex: 10,
                  transition: 'all 0.15s ease',
                }}
                title={`Saída ${label}: Conecte ao próximo passo`}
                data-testid={`node-output-handle-${opt}-${node.id}`}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: topPercent,
                  transform: 'translateY(-50%)',
                  fontSize: '8.5px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.18)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  pointerEvents: 'none',
                  zIndex: 9,
                }}
              >
                {label}
              </span>
            </React.Fragment>
          );
        })}
      </>
    );
  }

  if (triggerEvent === 'tutor_ia_lifecycle') {
    const list = Array.isArray(data.active_events) ? data.active_events : ['first_chat', 'quota_exhausted'];
    const labelMap = {
      first_chat: '1ª DÚVIDA',
      quota_exhausted: 'COTA 0',
      expiring_soon: 'VENCENDO',
      expired: 'EXPIRADO',
    };
    return (
      <>
        {list.map((ev) => {
          const topPercent = ev === 'first_chat' ? '28%' : ev === 'quota_exhausted' ? '48%' : ev === 'expiring_soon' ? '68%' : '88%';
          const portKey = `output_${ev}`;
          return (
            <React.Fragment key={ev}>
              <div
                onMouseDown={(e) => { e.stopPropagation(); if (onStartConnect) onStartConnect(node.id, e, node, portKey); }}
                onClick={(e) => { e.stopPropagation(); if (onStartConnect) onStartConnect(node.id, e, node, portKey); }}
                onMouseUp={(e) => { e.stopPropagation(); if (onConnectTarget) onConnectTarget(node.id, portKey); }}
                style={{
                  position: 'absolute',
                  right: '-8px',
                  top: topPercent,
                  transform: 'translateY(-50%)',
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  backgroundColor: '#a855f7',
                  border: '2px solid #0f172a',
                  boxShadow: '0 0 8px #a855f7',
                  cursor: 'grab',
                  zIndex: 10,
                  transition: 'all 0.15s ease',
                }}
                title={`Saída ${labelMap[ev] || ev}: Conecte ao próximo passo`}
                data-testid={`node-output-handle-${ev}-${node.id}`}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: topPercent,
                  transform: 'translateY(-50%)',
                  fontSize: '8.5px',
                  fontWeight: 800,
                  color: '#c084fc',
                  backgroundColor: 'rgba(168, 85, 247, 0.18)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  pointerEvents: 'none',
                  zIndex: 9,
                }}
              >
                {labelMap[ev] || ev}
              </span>
            </React.Fragment>
          );
        })}
      </>
    );
  }

  // Padrão: Porta Única
  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        if (onStartConnect) onStartConnect(node.id, e, node, 'output');
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onStartConnect) onStartConnect(node.id, e, node, 'output');
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        if (onConnectTarget) onConnectTarget(node.id, 'output');
      }}
      style={{
        position: 'absolute',
        right: '-8px',
        top: '50%',
        transform: isTargetActive ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%)',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: meta?.themeColor || '#a855f7',
        border: '2px solid #0f172a',
        boxShadow: `0 0 10px ${meta?.themeColor || '#a855f7'}`,
        cursor: 'grab',
        zIndex: 10,
        transition: 'all 0.15s ease',
      }}
      title="Clique ou arraste para conectar ao próximo passo do funil"
      data-testid={`node-output-handle-${node.id}`}
    />
  );
}
