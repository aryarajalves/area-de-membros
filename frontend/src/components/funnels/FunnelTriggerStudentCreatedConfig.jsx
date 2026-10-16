import React from 'react';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';

export default function FunnelTriggerStudentCreatedConfig({
  nodeId,
  data,
  onUpdateData,
}) {
  const daysAfter = parseInt(data.days_after, 10) || 0;
  const delayType =
    data.delay_type ||
    (daysAfter === 0 ? 'immediate' : [7, 14, 21].includes(daysAfter) ? `${daysAfter}_days` : 'custom');

  const handleSelectPreset = (presetDays, type) => {
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'student_created',
      delay_type: type,
      days_after: presetDays,
    });
  };

  const handleCustomDaysChange = (e) => {
    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'student_created',
      delay_type: val === 0 ? 'immediate' : 'custom',
      days_after: val,
    });
  };

  return (
    <>
      <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        Dispara esta sequência de mensagens quando uma nova conta de aluno for criada.
      </p>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
          <Clock size={12} color="#facc15" />
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Momento do disparo:</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <button
            type="button"
            onClick={() => handleSelectPreset(0, 'immediate')}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border:
                delayType === 'immediate' || daysAfter === 0
                  ? '1.5px solid #eab308'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor:
                delayType === 'immediate' || daysAfter === 0
                  ? 'rgba(234, 179, 8, 0.2)'
                  : 'rgba(255, 255, 255, 0.03)',
              color: delayType === 'immediate' || daysAfter === 0 ? '#fef08a' : '#cbd5e1',
            }}
            data-testid={`trigger-preset-immediate-${nodeId}`}
          >
            ⚡ Imediatamente
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset(7, '7_days')}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border:
                delayType === '7_days' && daysAfter === 7
                  ? '1.5px solid #eab308'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor:
                delayType === '7_days' && daysAfter === 7
                  ? 'rgba(234, 179, 8, 0.2)'
                  : 'rgba(255, 255, 255, 0.03)',
              color: delayType === '7_days' && daysAfter === 7 ? '#fef08a' : '#cbd5e1',
            }}
            data-testid={`trigger-preset-7d-${nodeId}`}
          >
            📅 7 dias depois
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset(14, '14_days')}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border:
                delayType === '14_days' && daysAfter === 14
                  ? '1.5px solid #eab308'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor:
                delayType === '14_days' && daysAfter === 14
                  ? 'rgba(234, 179, 8, 0.2)'
                  : 'rgba(255, 255, 255, 0.03)',
              color: delayType === '14_days' && daysAfter === 14 ? '#fef08a' : '#cbd5e1',
            }}
            data-testid={`trigger-preset-14d-${nodeId}`}
          >
            📅 14 dias depois
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset(21, '21_days')}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border:
                delayType === '21_days' && daysAfter === 21
                  ? '1.5px solid #eab308'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor:
                delayType === '21_days' && daysAfter === 21
                  ? 'rgba(234, 179, 8, 0.2)'
                  : 'rgba(255, 255, 255, 0.03)',
              color: delayType === '21_days' && daysAfter === 21 ? '#fef08a' : '#cbd5e1',
            }}
            data-testid={`trigger-preset-21d-${nodeId}`}
          >
            📅 21 dias depois
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <Calendar size={12} color="#facc15" />
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
            Ou defina dias personalizados:
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min="0"
            max="365"
            value={daysAfter}
            onChange={handleCustomDaysChange}
            style={{
              width: '80px',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: '#0a0703',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              color: '#fef08a',
              fontSize: '0.8rem',
              fontWeight: 700,
              outline: 'none',
              textAlign: 'center',
            }}
            data-testid={`trigger-custom-days-input-${nodeId}`}
          />
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
            {daysAfter === 0 ? 'dias (disparo imediato)' : daysAfter === 1 ? 'dia após cadastro' : 'dias após cadastro'}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: '8px 10px',
          backgroundColor: 'rgba(234, 179, 8, 0.08)',
          borderLeft: '3px solid #eab308',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
        }}
      >
        <CheckCircle2 size={13} color="#facc15" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '0.7rem', color: '#fef08a', lineHeight: 1.35 }}>
          {daysAfter === 0
            ? 'Disparará imediatamente assim que o aluno for cadastrado.'
            : `Disparará automaticamente ${daysAfter} dia(s) após a criação do aluno.`}
        </span>
      </div>
    </>
  );
}
