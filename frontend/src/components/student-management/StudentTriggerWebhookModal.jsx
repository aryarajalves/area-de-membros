import React, { useState, useEffect } from 'react';
import { Zap, Send, Loader2, AlertCircle, AlertTriangle, CheckCircle, Info, BookOpen, User, Link2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const INTEGRATION_EVENTS = [
  { value: 'student.enrolled', label: '🎓 Matrícula / Acesso Concedido ao Curso' },
  { value: 'course.progress.25', label: '🥉 Marco 25% Concluído' },
  { value: 'course.progress.50', label: '🥈 Marco 50% Concluído' },
  { value: 'course.progress.75', label: '🥇 Marco 75% Concluído' },
  { value: 'course.progress.100', label: '🏆 Marco 100% Concluído (Curso Finalizado)' },
  { value: 'lesson.completed', label: '✅ Conclusão de Aula' },
  { value: 'course.renewal.warning_7d', label: '⏳ Aviso de Renovação (7 Dias Restantes)' },
  { value: 'course.renewal.expired', label: '⚠️ Acesso Expirado / Renovação do Curso' },
];

export default function StudentTriggerWebhookModal({ isOpen, onClose, student, course, isLightBg }) {
  const [selectedEvent, setSelectedEvent] = useState('course.progress.100');
  const [availableWebhooks, setAvailableWebhooks] = useState([]);
  const [selectedWebhookId, setSelectedWebhookId] = useState('');
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen || !course) return;

    let isMounted = true;
    const fetchIntegrations = async () => {
      setLoadingWebhooks(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/v1/integrations', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const list = await res.json();
          if (isMounted) {
            // Filtra integrações ativas compatíveis com este curso (ou globais)
            const filtered = (Array.isArray(list) ? list : []).filter(
              (wh) => wh.is_active && (wh.course_id === null || wh.course_id === course.course_id)
            );
            setAvailableWebhooks(filtered);
            if (filtered.length > 0) {
              setSelectedWebhookId(String(filtered[0].id));
            } else {
              setSelectedWebhookId('');
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar integrações de webhook:', err);
      } finally {
        if (isMounted) {
          setLoadingWebhooks(false);
        }
      }
    };

    fetchIntegrations();

    return () => {
      isMounted = false;
    };
  }, [isOpen, course?.course_id]);

  if (!isOpen || !student || !course) return null;

  const modalBg = isLightBg ? '#ffffff' : '#0f172a';
  const modalBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const itemBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)';
  const itemBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';

  const handleTrigger = async () => {
    if (availableWebhooks.length === 0) {
      addToast('Não é possível disparar: nenhum webhook ativo configurado para este curso.', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        event: selectedEvent,
      };
      if (selectedWebhookId && selectedWebhookId !== 'all') {
        payload.webhook_id = parseInt(selectedWebhookId, 10);
      }

      const res = await fetch(`/api/v1/students/${student.id}/courses/${course.course_id}/trigger-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Falha ao disparar evento de webhook.');
      }

      if (data.status === 'warning') {
        addToast(data.message, 'warning');
      } else {
        addToast(data.message || 'Evento disparado com sucesso!', 'success');
        onClose();
      }
    } catch (err) {
      addToast(err.message || 'Erro ao disparar evento de integração.', 'error');
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
      data-testid="student-trigger-webhook-modal-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          backgroundColor: modalBg,
          border: modalBorder,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: textColor,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-trigger-modal-title"
        data-testid="student-trigger-webhook-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <h2 id="student-trigger-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              Disparar Evento de Integração
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: subTextColor }}>
              Envie manualmente um evento de webhook para os serviços conectados a este aluno.
            </p>
          </div>
        </div>

        {/* Card Informativo do Aluno e Curso */}
        <div
          style={{
            backgroundColor: itemBg,
            border: itemBorder,
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.86rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={15} style={{ color: '#3b82f6' }} />
            <span>Aluno: <strong style={{ color: textColor }}>{student.name}</strong> ({student.email})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={15} style={{ color: '#a855f7' }} />
            <span>Curso: <strong style={{ color: '#60a5fa' }}>{course.course_title}</strong></span>
          </div>
        </div>

        {/* Seletor de Integração Configurada */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="trigger-integration-select" style={{ fontSize: '0.88rem', fontWeight: 600, color: textColor }}>
            Selecione a Integração Configurada:
          </label>
          {loadingWebhooks ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: itemBg,
                border: itemBorder,
                fontSize: '0.86rem',
                color: subTextColor,
              }}
              data-testid="loading-webhooks-indicator"
            >
              <Loader2 size={16} className="animate-spin" />
              <span>Carregando integrações configuradas...</span>
            </div>
          ) : availableWebhooks.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.84rem',
              }}
              data-testid="no-webhooks-configured-alert"
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Nenhuma integração configurada</strong>
                <span>
                  Não há nenhum webhook ativo configurado para este curso. Cadastre uma integração na aba <strong>Integrações</strong> antes de efetuar disparos.
                </span>
              </div>
            </div>
          ) : (
            <select
              id="trigger-integration-select"
              value={selectedWebhookId}
              onChange={(e) => setSelectedWebhookId(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                color: textColor,
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
              }}
              data-testid="trigger-integration-select"
            >
              {availableWebhooks.length > 1 && (
                <option value="all" style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
                  ⚡ Todas as Integrações Ativas ({availableWebhooks.length})
                </option>
              )}
              {availableWebhooks.map((wh) => (
                <option key={wh.id} value={wh.id} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
                  🔗 {wh.name} {wh.url ? `(${wh.url})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Seletor de Evento */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="trigger-event-select" style={{ fontSize: '0.88rem', fontWeight: 600, color: textColor }}>
            Selecione o Evento para Disparo:
          </label>
          <select
            id="trigger-event-select"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            disabled={!loadingWebhooks && availableWebhooks.length === 0}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              color: (!loadingWebhooks && availableWebhooks.length === 0) ? subTextColor : textColor,
              fontSize: '0.9rem',
              outline: 'none',
              cursor: (!loadingWebhooks && availableWebhooks.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (!loadingWebhooks && availableWebhooks.length === 0) ? 0.6 : 1,
            }}
            data-testid="trigger-event-select"
          >
            {INTEGRATION_EVENTS.map((ev) => (
              <option key={ev.value} value={ev.value} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
                {ev.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nota explicativa */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.8rem',
            color: subTextColor,
            backgroundColor: isLightBg ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.1)',
            padding: '10px 14px',
            borderRadius: '8px',
            border: isLightBg ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.25)',
          }}
        >
          <Info size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
          <span>
            O webhook enviará um payload JSON contendo os dados cadastrais do aluno, dados do curso, progresso de aulas e identificador de disparo manual.
          </span>
        </div>

        {/* Rodapé com Botão Cancelar e Botão Disparar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '9px 20px',
              backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
              color: textColor,
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            data-testid="cancel-trigger-webhook-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleTrigger}
            disabled={loading || loadingWebhooks || availableWebhooks.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 22px',
              backgroundColor: (loadingWebhooks || availableWebhooks.length === 0)
                ? (isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)')
                : '#f59e0b',
              color: (loadingWebhooks || availableWebhooks.length === 0)
                ? (isLightBg ? '#94a3b8' : 'rgba(255, 255, 255, 0.4)')
                : '#0f172a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: (loading || loadingWebhooks || availableWebhooks.length === 0) ? 'not-allowed' : 'pointer',
              boxShadow: (loadingWebhooks || availableWebhooks.length === 0) ? 'none' : '0 2px 10px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.2s ease',
            }}
            data-testid="submit-trigger-webhook-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Disparando...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Disparar Evento Agora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
