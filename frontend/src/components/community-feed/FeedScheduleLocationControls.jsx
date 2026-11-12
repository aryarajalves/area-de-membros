import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, X, Check } from 'lucide-react';

export default function FeedScheduleLocationControls({
  location,
  onLocationChange,
  scheduledAt,
  onScheduledAtChange,
}) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleInput, setScheduleInput] = useState('');

  const locationRef = useRef(null);
  const scheduleRef = useRef(null);

  // Calcula o valor mínimo para agendamento (5 minutos a partir de agora)
  const getMinDateTime = () => {
    const now = new Date(Date.now() + 5 * 60 * 1000);
    return now.toISOString().slice(0, 16);
  };

  const handleApplyLocation = () => {
    if (locationInput.trim()) {
      onLocationChange(locationInput.trim());
    }
    setIsLocationOpen(false);
  };

  const handleApplySchedule = () => {
    if (scheduleInput) {
      onScheduledAtChange(new Date(scheduleInput).toISOString());
    }
    setIsScheduleOpen(false);
  };

  const formatScheduleDisplay = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="feed-schedule-location-controls" data-testid="feed-schedule-location-controls">
      {/* Bloco de Localização */}
      {location ? (
        <div className="feed-attached-pill location" data-testid="feed-location-pill">
          <MapPin size={13} className="feed-pill-icon" />
          <span className="feed-pill-text">{location}</span>
          <button
            type="button"
            className="feed-pill-remove-btn"
            onClick={() => onLocationChange(null)}
            title="Remover localização"
            data-testid="feed-remove-location-btn"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="feed-popover-anchor" ref={locationRef}>
          <button
            type="button"
            className="feed-create-tool-btn"
            onClick={() => {
              setIsLocationOpen((prev) => !prev);
              setIsScheduleOpen(false);
            }}
            title="Adicionar localização (cidade, estado)"
            data-testid="feed-open-location-btn"
          >
            <MapPin size={15} />
            <span>Local</span>
          </button>

          {isLocationOpen && (
            <div className="feed-mini-popover location" data-testid="feed-location-popover">
              <span className="feed-mini-popover-title">📍 Onde você está?</span>
              <div className="feed-mini-popover-row">
                <input
                  type="text"
                  placeholder="Ex: São Paulo, SP"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyLocation())}
                  className="feed-mini-popover-input"
                  maxLength={100}
                  autoFocus
                  data-testid="feed-location-input"
                />
                <button
                  type="button"
                  className="feed-mini-popover-apply-btn"
                  onClick={handleApplyLocation}
                  disabled={!locationInput.trim()}
                  title="Confirmar local"
                  data-testid="feed-apply-location-btn"
                >
                  <Check size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bloco de Agendamento */}
      {scheduledAt ? (
        <div className="feed-attached-pill schedule" data-testid="feed-schedule-pill">
          <Calendar size={13} className="feed-pill-icon" />
          <span className="feed-pill-text">Agendado: {formatScheduleDisplay(scheduledAt)}</span>
          <button
            type="button"
            className="feed-pill-remove-btn"
            onClick={() => onScheduledAtChange(null)}
            title="Remover agendamento (publicar imediatamente)"
            data-testid="feed-remove-schedule-btn"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="feed-popover-anchor" ref={scheduleRef}>
          <button
            type="button"
            className="feed-create-tool-btn"
            onClick={() => {
              setIsScheduleOpen((prev) => !prev);
              setIsLocationOpen(false);
            }}
            title="Agendar publicação para data e hora futura"
            data-testid="feed-open-schedule-btn"
          >
            <Calendar size={15} />
            <span>Agendar</span>
          </button>

          {isScheduleOpen && (
            <div className="feed-mini-popover schedule" data-testid="feed-schedule-popover">
              <span className="feed-mini-popover-title">📅 Escolha a data e hora:</span>
              <input
                type="datetime-local"
                min={getMinDateTime()}
                value={scheduleInput}
                onChange={(e) => setScheduleInput(e.target.value)}
                className="feed-mini-popover-datetime"
                data-testid="feed-schedule-datetime-input"
              />
              <div className="feed-mini-popover-actions">
                <button
                  type="button"
                  className="feed-mini-popover-confirm-btn"
                  onClick={handleApplySchedule}
                  disabled={!scheduleInput}
                  data-testid="feed-apply-schedule-btn"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
