import React, { useState, useEffect } from 'react';
import { CalendarCheck, Calendar, Hash } from 'lucide-react';

export default function FunnelTriggerEventAttendanceConfig({
  nodeId,
  data = {},
  propEvents = null,
  onUpdateData,
}) {
  const [events, setEvents] = useState(propEvents || []);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const mode = data.attendance_mode || 'event'; // 'event' ou 'count'
  const selectedEventId = data.event_id || 'any';
  const targetCount = data.target_count !== undefined ? data.target_count : 1;

  useEffect(() => {
    if (propEvents && propEvents.length > 0) {
      setEvents(propEvents);
      return;
    }
    let isMounted = true;
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/v1/events', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const list = await res.json();
          if (isMounted) setEvents(Array.isArray(list) ? list : []);
        }
      } catch {
        /* fallback silencioso */
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    };
    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, [propEvents]);

  const handleModeChange = (newMode) => {
    onUpdateData(nodeId, {
      ...data,
      attendance_mode: newMode,
      target_count: newMode === 'count' ? (data.target_count || 1) : data.target_count,
    });
  };

  const handleEventChange = (e) => {
    const val = e.target.value;
    if (!val || val === 'any') {
      onUpdateData(nodeId, {
        ...data,
        event_id: 'any',
        event_title: 'Qualquer Evento',
      });
    } else {
      const evtId = parseInt(val, 10);
      const found = events.find((evt) => evt.id === evtId);
      onUpdateData(nodeId, {
        ...data,
        event_id: evtId,
        event_title: found ? found.title : `Evento #${evtId}`,
      });
    }
  };

  const handleTargetCountChange = (val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    onUpdateData(nodeId, {
      ...data,
      target_count: num,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
        Dispara quando o aluno clicar no botão de <strong>confirmar presença / participação</strong> no evento.
      </p>

      {/* Seletor de Modo: Por Evento ou Por Quantidade (X Eventos) */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#ec4899',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Regra de Disparo:
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            data-testid={`attendance-mode-event-btn-${nodeId}`}
            onClick={() => handleModeChange('event')}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: mode === 'event' ? 'rgba(244, 114, 182, 0.25)' : '#020617',
              border: mode === 'event' ? '1px solid #f472b6' : '1px solid rgba(255, 255, 255, 0.1)',
              color: mode === 'event' ? '#fce7f3' : '#94a3b8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <Calendar size={13} color={mode === 'event' ? '#f472b6' : '#94a3b8'} />
            Por Evento
          </button>
          <button
            type="button"
            data-testid={`attendance-mode-count-btn-${nodeId}`}
            onClick={() => handleModeChange('count')}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: mode === 'count' ? 'rgba(244, 114, 182, 0.25)' : '#020617',
              border: mode === 'count' ? '1px solid #f472b6' : '1px solid rgba(255, 255, 255, 0.1)',
              color: mode === 'count' ? '#fce7f3' : '#94a3b8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <Hash size={13} color={mode === 'count' ? '#f472b6' : '#94a3b8'} />
            Meta de X Eventos
          </button>
        </div>
      </div>

      {/* Modo: Filtrar por Evento */}
      {mode === 'event' && (
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#ec4899',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Filtrar por Evento:
          </label>
          <select
            value={selectedEventId}
            onChange={handleEventChange}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            disabled={loadingEvents}
            data-testid={`select-attendance-event-${nodeId}`}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              backgroundColor: '#020617',
              border: '1px solid rgba(244, 114, 182, 0.4)',
              color: '#fce7f3',
              fontSize: '0.75rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="any">🎟️ Qualquer Evento (Qualquer Confirmação)</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Modo: Quantidade de X Eventos Confirmados */}
      {mode === 'count' && (
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#ec4899',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Disparar ao Confirmar X Eventos:
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              min="1"
              max="999"
              value={targetCount}
              onChange={(e) => handleTargetCountChange(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              data-testid={`input-target-attendance-count-${nodeId}`}
              style={{
                width: '80px',
                padding: '7px 10px',
                borderRadius: '6px',
                backgroundColor: '#020617',
                border: '1px solid rgba(244, 114, 182, 0.4)',
                color: '#fce7f3',
                fontSize: '0.85rem',
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[1, 2, 3, 5, 10].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleTargetCountChange(preset)}
                  data-testid={`preset-attendance-count-${preset}-${nodeId}`}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    backgroundColor: targetCount === preset ? '#ec4899' : 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(244, 114, 182, 0.3)',
                    color: targetCount === preset ? '#ffffff' : '#cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  {preset} {preset === 1 ? 'evento' : 'eventos'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resumo do Gatilho */}
      <div
        style={{
          padding: '8px 10px',
          backgroundColor: '#020617',
          border: '1px solid rgba(244, 114, 182, 0.25)',
          borderLeftWidth: '3px',
          borderLeftColor: '#f472b6',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        data-testid={`event-attendance-trigger-summary-${nodeId}`}
      >
        <CalendarCheck size={14} color="#f472b6" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', color: '#fce7f3' }}>
          {mode === 'count' ? (
            <>
              Ativa quando o aluno confirmar presença em{' '}
              <strong>
                {targetCount} {targetCount === 1 ? 'evento' : 'eventos'}
              </strong>
            </>
          ) : (
            <>
              Ativa na presença em: <strong>{data.event_title || 'Qualquer Evento'}</strong>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
