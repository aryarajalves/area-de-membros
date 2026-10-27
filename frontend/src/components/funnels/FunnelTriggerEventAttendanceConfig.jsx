import React, { useState, useEffect } from 'react';
import { CalendarCheck, Calendar } from 'lucide-react';

export default function FunnelTriggerEventAttendanceConfig({
  nodeId,
  data = {},
  propEvents = null,
  onUpdateData,
}) {
  const [events, setEvents] = useState(propEvents || []);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const selectedEventId = data.event_id || 'any';

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
        Dispara quando o aluno clicar no botão de <strong>confirmar presença / participação</strong> no evento.
      </p>

      {/* Seletor de Evento */}
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
          Ativa na presença em: <strong>{data.event_title || 'Qualquer Evento'}</strong>
        </span>
      </div>
    </div>
  );
}
