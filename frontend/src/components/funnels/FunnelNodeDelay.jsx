import React from 'react';
import { Hourglass, Trash2, Copy, Clock, Calendar } from 'lucide-react';

export default function FunnelNodeDelay({
  node,
  isSelected,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  isTargetActive = false,
}) {
  const data = node.data || {};
  const delayVal = data.delay_value ?? data.delay_seconds ?? 2;
  const delayUnit = data.delay_unit || 'seconds';
  const businessHoursEnabled = Boolean(data.business_hours_enabled);
  const businessHoursStart = data.business_hours_start || '09:00';
  const businessHoursEnd = data.business_hours_end || '20:00';
  const businessDaysOnly = Boolean(data.business_days_only);

  const calculateSeconds = (val, unit) => {
    const multipliers = { seconds: 1, minutes: 60, hours: 3600, days: 86400 };
    return Math.max(1, (parseInt(val, 10) || 1) * (multipliers[unit] || 1));
  };

  const handleChangeValue = (e) => {
    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
    const secs = calculateSeconds(val, delayUnit);
    onUpdateData(node.id, {
      ...data,
      delay_value: val,
      delay_seconds: secs,
    });
  };

  const handleChangeUnit = (e) => {
    const unit = e.target.value;
    const secs = calculateSeconds(delayVal, unit);
    onUpdateData(node.id, {
      ...data,
      delay_unit: unit,
      delay_seconds: secs,
    });
  };

  const handleToggleBusinessHours = (e) => {
    onUpdateData(node.id, {
      ...data,
      business_hours_enabled: e.target.checked,
    });
  };

  const handleChangeStartTime = (e) => {
    onUpdateData(node.id, {
      ...data,
      business_hours_start: e.target.value,
    });
  };

  const handleChangeEndTime = (e) => {
    onUpdateData(node.id, {
      ...data,
      business_hours_end: e.target.value,
    });
  };

  const handleToggleBusinessDaysOnly = (e) => {
    onUpdateData(node.id, {
      ...data,
      business_days_only: e.target.checked,
    });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '280px',
        backgroundColor: '#17120a',
        border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.4)',
        borderRadius: '14px',
        boxShadow: isSelected ? '0 10px 30px rgba(245, 158, 11, 0.3)' : '0 10px 25px rgba(0, 0, 0, 0.65)',
        color: '#f8fafc',
        padding: '12px 14px',
        userSelect: 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid={`funnel-node-delay-${node.id}`}
    >
      {/* Port de Entrada */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'input');
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'input');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'input');
        }}
        style={{
          position: 'absolute',
          left: '-8px',
          top: '50%',
          transform: isTargetActive ? 'translateY(-50%) scale(1.45)' : 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: isTargetActive ? '#10b981' : '#f59e0b',
          border: isTargetActive ? '2px solid #ffffff' : '2px solid #0f172a',
          boxShadow: isTargetActive ? '0 0 14px #10b981' : '0 0 8px rgba(245, 158, 11, 0.6)',
          cursor: 'crosshair',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Ponto de entrada (arraste ou solte para conectar)"
        data-testid={`node-input-handle-${node.id}`}
      />

      {/* Port de Saída */}
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
          backgroundColor: '#f59e0b',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #f59e0b',
          cursor: 'grab',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Clique ou arraste até outro nó para conectar"
        data-testid={`node-output-handle-${node.id}`}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
          <Hourglass size={15} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            DELAY
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button
            onClick={() => onDuplicateNode(node.id)}
            title="Duplicar"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
          >
            <Copy size={12} />
          </button>
          <button
            onClick={() => onDeleteNode(node.id)}
            title="Excluir"
            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Tempo Base de Espera */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Aguardar antes do próximo nó:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            min="1"
            max="1000"
            value={delayVal}
            onChange={handleChangeValue}
            style={{
              width: '70px',
              backgroundColor: '#020617',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '6px',
              color: '#ffffff',
              padding: '5px 8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              outline: 'none',
            }}
            data-testid={`node-delay-input-${node.id}`}
          />
          <select
            value={delayUnit}
            onChange={handleChangeUnit}
            style={{
              backgroundColor: '#020617',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '6px',
              color: '#cbd5e1',
              padding: '5px 8px',
              fontSize: '0.78rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="seconds">segundos</option>
            <option value="minutes">minutos</option>
            <option value="hours">horas</option>
            <option value="days">dias</option>
          </select>
        </div>
      </div>

      {/* Janela de Horário Comercial */}
      <div
        style={{
          backgroundColor: businessHoursEnabled ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
          border: businessHoursEnabled ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '8px',
          padding: '8px',
          marginTop: '6px',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            marginBottom: businessHoursEnabled ? '6px' : '0',
          }}
        >
          <input
            type="checkbox"
            checked={businessHoursEnabled}
            onChange={handleToggleBusinessHours}
            style={{ accentColor: '#f59e0b', cursor: 'pointer' }}
            data-testid={`delay-business-hours-toggle-${node.id}`}
          />
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: businessHoursEnabled ? '#fbbf24' : '#cbd5e1' }}>
            Janela de Horário Comercial
          </span>
        </label>

        {businessHoursEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#94a3b8' }}>
              <Clock size={12} color="#f59e0b" />
              <span>Enviar entre:</span>
              <input
                type="time"
                value={businessHoursStart}
                onChange={handleChangeStartTime}
                style={{
                  backgroundColor: '#020617',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  padding: '2px 4px',
                  fontSize: '0.72rem',
                }}
              />
              <span>e</span>
              <input
                type="time"
                value={businessHoursEnd}
                onChange={handleChangeEndTime}
                style={{
                  backgroundColor: '#020617',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  padding: '2px 4px',
                  fontSize: '0.72rem',
                }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.68rem', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={businessDaysOnly}
                onChange={handleToggleBusinessDaysOnly}
                style={{ accentColor: '#f59e0b', cursor: 'pointer' }}
              />
              <Calendar size={11} color="#f59e0b" />
              <span>Apenas dias úteis (Seg a Sex)</span>
            </label>

            <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.2 }}>
              Se expirar de madrugada ou fora do horário, aguardará até as {businessHoursStart} do próximo dia útil.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
