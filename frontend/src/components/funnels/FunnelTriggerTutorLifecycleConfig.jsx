import React from 'react';
import { Bot, Sparkles, CheckCircle2, GitFork, Hourglass, AlertCircle, MessageSquare } from 'lucide-react';

export default function FunnelTriggerTutorLifecycleConfig({
  nodeId,
  data,
  onUpdateData,
}) {
  const activeEvents = Array.isArray(data.active_events)
    ? data.active_events
    : ['first_chat', 'quota_exhausted'];

  const daysBefore = data.days_before_expiration !== undefined ? data.days_before_expiration : 3;

  const handleToggleEvent = (ev) => {
    let next;
    if (activeEvents.includes(ev)) {
      if (activeEvents.length > 1) {
        next = activeEvents.filter((e) => e !== ev);
      } else {
        next = activeEvents;
      }
    } else {
      next = [...activeEvents, ev];
    }

    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'tutor_ia_lifecycle',
      active_events: next,
    });
  };

  const handleChangeDays = (e) => {
    const val = parseInt(e.target.value, 10);
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'tutor_ia_lifecycle',
      days_before_expiration: isNaN(val) ? 3 : Math.max(1, Math.min(30, val)),
    });
  };

  const EVENT_OPTIONS = [
    { id: 'first_chat', label: '1ª Dúvida (Estreia)', icon: MessageSquare, desc: 'Onboarding & Boas-vindas' },
    { id: 'quota_exhausted', label: 'Cota Esgotada', icon: Sparkles, desc: 'Oferta de Assinatura Ilimitada' },
    { id: 'expiring_soon', label: 'Perto de Expirar', icon: Hourglass, desc: 'Aviso prévio de renovação' },
    { id: 'expired', label: 'Assinatura Vencida', icon: AlertCircle, desc: 'Recuperação de Churn' },
  ];

  return (
    <>
      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        Dispara nos marcos do Tutor IA (Tech Agente). Cada evento ativado terá seu conector de saída exclusivo:
      </p>

      {/* Grid de Eventos do Tutor */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Eventos Ativos:</span>
          <span style={{ fontSize: '0.65rem', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <GitFork size={10} />
            <span>{activeEvents.length} saídas ativas</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {EVENT_OPTIONS.map((item) => {
            const isAct = activeEvents.includes(item.id);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggleEvent(item.id)}
                style={{
                  padding: '7px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isAct ? '1.5px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isAct ? 'rgba(168, 85, 247, 0.28)' : 'rgba(255, 255, 255, 0.03)',
                  color: isAct ? '#e9d5ff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                data-testid={`trigger-tutor-opt-${item.id}-${nodeId}`}
                title={item.desc}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icon size={12} />
                  <span>{item.label}</span>
                </div>
                {isAct && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#a855f7' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuração de Dias se 'expiring_soon' estiver ativo */}
      {activeEvents.includes('expiring_soon') && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
              Antecedência da expiração (dias):
            </label>
            <span style={{ fontSize: '0.7rem', color: '#c084fc', fontWeight: 700 }}>
              {daysBefore} dias antes
            </span>
          </div>
          <input
            type="number"
            min="1"
            max="30"
            value={daysBefore}
            onChange={handleChangeDays}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: '#0a0703',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#e9d5ff',
              fontSize: '0.76rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            data-testid={`trigger-tutor-days-input-${nodeId}`}
          />
        </div>
      )}

      {/* Resumo */}
      <div
        style={{
          padding: '8px 10px',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderLeft: '3px solid #a855f7',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
        }}
      >
        <CheckCircle2 size={13} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '0.7rem', color: '#e9d5ff', lineHeight: 1.35 }}>
          Cada evento ativado segue por sua porta de saída exclusiva para mensagens altamente contextualizadas.
        </span>
      </div>
    </>
  );
}
