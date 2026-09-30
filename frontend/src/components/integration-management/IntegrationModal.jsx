import React, { useState, useEffect } from 'react';
import { Webhook, ShieldCheck, CheckSquare, Square, X, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const AVAILABLE_EVENTS = [
  { id: 'course.progress.25', label: 'Curso 25% Concluído', desc: 'Disparado quando o aluno atinge 25% de progresso no curso.' },
  { id: 'course.progress.50', label: 'Curso 50% Concluído', desc: 'Disparado quando o aluno atinge a metade (50%) do curso.' },
  { id: 'course.progress.75', label: 'Curso 75% Concluído', desc: 'Disparado quando o aluno atinge 75% de conclusão.' },
  { id: 'course.progress.100', label: 'Curso 100% Concluído', desc: 'Disparado quando o aluno conclui todas as aulas do curso.' },
  { id: 'lesson.completed', label: 'Aula Concluída', desc: 'Disparado a cada aula individual que o aluno marca como assistida.' },
  { id: 'student.enrolled', label: 'Aluno Matriculado', desc: 'Disparado quando um aluno recebe acesso a um curso.' },
  { id: 'course.renewal.warning_7d', label: 'Aviso de Renovação (1 semana antes)', desc: 'Disparado 7 dias antes de expirar a validade de acesso ao curso.' },
  { id: 'course.renewal.expired', label: 'Renovação do Curso (Acesso Expirado)', desc: 'Disparado quando termina o prazo do curso (Status: Renovação do Curso).' },
];

export default function IntegrationModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [courseId, setCourseId] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(['course.progress.25', 'course.progress.50', 'course.progress.75', 'course.progress.100']);
  const [isActive, setIsActive] = useState(true);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setUrl(initialData.url || '');
        setSecretKey(initialData.secret_key || '');
        setCourseId(initialData.course_id ? String(initialData.course_id) : '');
        setSelectedEvents(initialData.events && initialData.events.length > 0 ? initialData.events : ['course.progress.100']);
        setIsActive(initialData.is_active ?? true);
      } else {
        setName('');
        setUrl('');
        setSecretKey('');
        setCourseId('');
        setSelectedEvents(['course.progress.25', 'course.progress.50', 'course.progress.75', 'course.progress.100']);
        setIsActive(true);
      }

      // Carrega cursos para o dropdown
      const token = localStorage.getItem('auth_token');
      fetch('/api/v1/courses', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setCourses(Array.isArray(data) ? data : []))
        .catch(() => setCourses([]));
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleToggleEvent = (eventId) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleSelectAllEvents = () => {
    if (selectedEvents.length === AVAILABLE_EVENTS.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(AVAILABLE_EVENTS.map((e) => e.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Informe o nome da integração.', 'error');
      return;
    }
    if (!url.trim()) {
      addToast('Informe a URL do Webhook.', 'error');
      return;
    }
    if (selectedEvents.length === 0) {
      addToast('Selecione ao menos um evento para disparar o webhook.', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        name: name.trim(),
        url: url.trim(),
        secret_key: secretKey.trim() || null,
        course_id: courseId ? Number(courseId) : null,
        events: selectedEvents,
        is_active: isActive,
      };

      const endpoint = initialData ? `/api/v1/integrations/${initialData.id}` : '/api/v1/integrations';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Falha ao salvar integração.');
      }

      addToast(initialData ? 'Integração atualizada com sucesso!' : 'Integração criada com sucesso!', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.message || 'Erro ao salvar integração.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      data-testid="integration-modal-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#f8fafc',
          padding: '28px',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-modal-title"
        data-testid="integration-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Webhook size={22} />
          </div>
          <div>
            <h2 id="integration-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              {initialData ? 'Editar Integração' : 'Nova Integração com Webhook'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
              Configure a URL de destino e os eventos de progresso que você deseja disparar.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nome */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="integration-name-input" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              Nome da Integração *
            </label>
            <input
              id="integration-name-input"
              type="text"
              placeholder="Ex: Notificação de Alunos no Zapier, ActiveCampaign, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#f8fafc',
                fontSize: '0.88rem',
                outline: 'none',
              }}
              data-testid="integration-name-input"
            />
          </div>

          {/* URL do Webhook */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="integration-url-input" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              URL do Webhook (Endpoint POST) *
            </label>
            <input
              id="integration-url-input"
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/... ou sua API"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#f8fafc',
                fontSize: '0.88rem',
                outline: 'none',
              }}
              data-testid="integration-url-input"
            />
          </div>

          {/* Curso Específico ou Todos */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="integration-course-select" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              Aplicar a qual curso?
            </label>
            <select
              id="integration-course-select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#f8fafc',
                fontSize: '0.88rem',
                outline: 'none',
              }}
              data-testid="integration-course-select"
            >
              <option value="" style={{ backgroundColor: '#0f172a' }}>Todos os Cursos da Plataforma</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id} style={{ backgroundColor: '#0f172a' }}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Chave Secreta HMAC */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <label htmlFor="integration-secret-input" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
                Chave Secreta para Assinatura (Opcional)
              </label>
              <ShieldCheck size={14} style={{ color: '#34d399' }} />
            </div>
            <input
              id="integration-secret-input"
              type="text"
              placeholder="Ex: secret_token_1234 (enviado no header X-Webhook-Signature)"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#f8fafc',
                fontSize: '0.88rem',
                outline: 'none',
              }}
              data-testid="integration-secret-input"
            />
          </div>

          {/* Seleção de Eventos */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
                Eventos Disparados * ({selectedEvents.length} selecionados)
              </label>
              <button
                type="button"
                onClick={handleSelectAllEvents}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
                data-testid="toggle-all-events-btn"
              >
                {selectedEvents.length === AVAILABLE_EVENTS.length ? 'Desmarcar Todos' : 'Marcar Todos'}
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '190px',
                overflowY: 'auto',
              }}
            >
              {AVAILABLE_EVENTS.map((event) => {
                const isSelected = selectedEvents.includes(event.id);
                return (
                  <label
                    key={event.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    data-testid={`event-checkbox-label-${event.id}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleEvent(event.id)}
                      style={{ accentColor: '#3b82f6', width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                      data-testid={`event-checkbox-${event.id}`}
                    />
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: isSelected ? '#93c5fd' : '#e2e8f0' }}>
                        {event.label}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                        {event.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status Ativo / Inativo */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '0.86rem',
                color: '#e2e8f0',
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                data-testid="integration-is-active-checkbox"
              />
              <span>Manter esta integração ativa para envio de eventos</span>
            </label>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 18px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              data-testid="cancel-integration-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 22px',
                backgroundColor: loading ? '#9333ea80' : '#9333ea',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              data-testid="submit-integration-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Salvando...
                </>
              ) : initialData ? (
                'Salvar Alterações'
              ) : (
                'Criar Integração'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
