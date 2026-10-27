import React, { useState, useEffect } from 'react';
import { X, Calendar, Check } from 'lucide-react';
import EventThumbnailUploader from './EventThumbnailUploader';
import EventAccessRuleSelector from './EventAccessRuleSelector';

export default function EventFormModal({
  isOpen,
  onClose,
  onSave,
  eventData = null,
  courses = [],
  addToast,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [courseId, setCourseId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const toLocalInputValue = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (eventData) {
      setTitle(eventData.title || '');
      setDescription(eventData.description || '');
      setStartTime(toLocalInputValue(eventData.start_time));
      setEndTime(toLocalInputValue(eventData.end_time));
      setMeetingUrl(eventData.meeting_url || '');
      setRecordingUrl(eventData.recording_url || '');
      setThumbnailUrl(eventData.thumbnail_url || '');
      setTargetType(eventData.target_type || 'all');
      setCourseId(eventData.course_id ? String(eventData.course_id) : '');
      setIsActive(eventData.is_active !== false);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(20, 0, 0, 0);
      setTitle('');
      setDescription('');
      setStartTime(toLocalInputValue(tomorrow.toISOString()));
      setEndTime('');
      setMeetingUrl('');
      setRecordingUrl('');
      setThumbnailUrl('');
      setTargetType('all');
      setCourseId('');
      setIsActive(true);
    }
  }, [eventData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      addToast?.('Informe o título do evento.', 'error');
      return;
    }

    if (!startTime) {
      addToast?.('Informe a data e horário de início.', 'error');
      return;
    }

    if (targetType === 'course' && !courseId) {
      addToast?.('Selecione o curso exclusivo para este evento.', 'error');
      return;
    }

    const startIso = new Date(startTime).toISOString();
    const endIso = endTime ? new Date(endTime).toISOString() : null;

    if (endIso && new Date(endIso) <= new Date(startIso)) {
      addToast?.('O horário de término deve ser posterior ao de início.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        start_time: startIso,
        end_time: endIso,
        meeting_url: meetingUrl.trim() || null,
        recording_url: recordingUrl.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        target_type: targetType,
        course_id: targetType === 'course' ? Number(courseId) : null,
        is_active: isActive,
      };

      await onSave(payload);
    } catch (err) {
      console.error('Erro ao salvar evento:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #131b2e, #0b1120)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#f8fafc',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.18rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                {eventData ? 'Editar Evento' : 'Novo Evento / Live'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Preencha os dados e horário oficial de Brasília
              </span>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-event-modal-btn"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Título */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
              Nome do Evento *
            </label>
            <input
              type="text"
              data-testid="event-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Mentoria Semanal de Tráfego Pago"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '0.92rem',
              }}
            />
          </div>

          {/* Capa / Thumbnail */}
          <EventThumbnailUploader
            thumbnailUrl={thumbnailUrl}
            onChangeThumbnail={setThumbnailUrl}
            addToast={addToast}
          />

          {/* Data e Horário (Início e Término) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                Início (Horário de Brasília) *
              </label>
              <input
                type="datetime-local"
                data-testid="event-start-time-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                Término Previsto (Opcional)
              </label>
              <input
                type="datetime-local"
                data-testid="event-end-time-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* Links (Transmissão e Gravação) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                Link da Transmissão Ao Vivo
              </label>
              <input
                type="url"
                data-testid="event-meeting-url-input"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="Ex: https://zoom.us/j/... ou Meet"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '0.88rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                Link da Gravação (Pós-Evento)
              </label>
              <input
                type="url"
                data-testid="event-recording-url-input"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                placeholder="Ex: https://youtube.com/watch?v=..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  fontSize: '0.88rem',
                }}
              />
            </div>
          </div>

          {/* Regra de Visibilidade / Acesso */}
          <EventAccessRuleSelector
            targetType={targetType}
            onChangeTargetType={setTargetType}
            courseId={courseId}
            onChangeCourseId={setCourseId}
            courses={courses}
          />

          {/* Descrição */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
              Descrição e Tópicos Abordados
            </label>
            <textarea
              data-testid="event-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que os alunos vão aprender, materiais necessários e orientações..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '0.88rem',
                resize: 'vertical',
                lineHeight: '1.5',
              }}
            />
          </div>

          {/* Checkbox Ativo */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#e2e8f0' }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Evento ativo e visível na agenda</span>
          </label>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              data-testid="cancel-event-form-btn"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="submit-event-form-btn"
              disabled={isSaving}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none',
                color: '#fff',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              <Check size={16} />
              {isSaving ? 'Salvando...' : eventData ? 'Salvar Alterações' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
