import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Send, X, History } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ChatBroadcastAudienceSelector from './ChatBroadcastAudienceSelector';
import ChatBroadcastButtonConfig from './ChatBroadcastButtonConfig';
import ChatBroadcastEstimateCard from './ChatBroadcastEstimateCard';
import ChatBroadcastConfirmDialog from './ChatBroadcastConfirmDialog';

export default function ChatBroadcastModal({
  isOpen,
  onClose,
  courses = [],
  tags = [],
  onOpenHistory,
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');
  const [filterDays, setFilterDays] = useState(30);
  const [enableButton, setEnableButton] = useState(false);
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [buttonActionType, setButtonActionType] = useState('url');
  const [filterRole, setFilterRole] = useState('aluno');
  const [estimate, setEstimate] = useState({ total_recipients: 0, estimated_duration_seconds: 0, sample_students: [] });
  const [estimating, setEstimating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTitle('');
      setMessage('');
      setFilterType('all');
      setSelectedCourseId('');
      setSelectedTagId('');
      setFilterDays(30);
      setEnableButton(false);
      setButtonText('');
      setButtonUrl('');
      setButtonActionType('url');
      setShowConfirm(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const fetchEstimate = useCallback(async () => {
    if (!isOpen) return;
    setEstimating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        filter_type: filterType,
        filter_course_id: selectedCourseId ? Number(selectedCourseId) : null,
        filter_tag_id: selectedTagId ? Number(selectedTagId) : null,
        filter_days: filterType === 'recent_days' ? Number(filterDays || 30) : null,
        filter_role: filterRole,
      };
      const res = await fetch('/api/v1/chat/broadcast/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setEstimate(data);
      }
    } catch {
      // silencioso
    } finally {
      setEstimating(false);
    }
  }, [isOpen, filterType, selectedCourseId, selectedTagId, filterDays, filterRole]);

  useEffect(() => {
    fetchEstimate();
  }, [fetchEstimate]);

  const handleStartBroadcast = async () => {
    if (!title.trim()) {
      addToast('Informe o título da campanha de disparo', 'error');
      return;
    }
    if (!message.trim()) {
      addToast('Digite o texto da mensagem a ser enviada', 'error');
      return;
    }
    if (enableButton) {
      if (!buttonText.trim()) {
        addToast('Informe o texto do botão ou desative a opção de botão', 'error');
        return;
      }
      if (!buttonUrl.trim()) {
        addToast('Informe a URL ou destino do botão de ação', 'error');
        return;
      }
    }
    if (estimate.total_recipients === 0) {
      addToast('Nenhum aluno encontrado para o filtro selecionado', 'error');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        title: title.trim(),
        message: message.trim(),
        filter_type: filterType,
        filter_course_id: selectedCourseId ? Number(selectedCourseId) : null,
        filter_tag_id: selectedTagId ? Number(selectedTagId) : null,
        filter_days: filterType === 'recent_days' ? Number(filterDays || 30) : null,
        filter_role: filterRole,
        button_text: enableButton && buttonText.trim() ? buttonText.trim() : null,
        button_url: enableButton && buttonUrl.trim() ? buttonUrl.trim() : null,
        button_action_type: enableButton ? buttonActionType : null,
      };

      const res = await fetch('/api/v1/chat/broadcast/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Falha ao iniciar disparo');
      }

      addToast(
        `Disparo iniciado para ${estimate.total_recipients} alunos com delay de 1s!`,
        'success'
      );
      setShowConfirm(false);
      onClose();
      if (onOpenHistory) onOpenHistory();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
      }}
      data-testid="chat-broadcast-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
        data-testid="chat-broadcast-modal-container"
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Send size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Disparo em Massa de DMs
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Envie comunicados no privado dos alunos com delay seguro de 1 segundo.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onOpenHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                data-testid="open-broadcast-history-btn"
              >
                <History size={15} color="#8b5cf6" />
                Histórico
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
              }}
              data-testid="close-broadcast-modal-btn"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Título da Campanha */}
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              Título / Identificação do Disparo:
            </label>
            <input
              type="text"
              placeholder="Ex: Aviso Importante de Mentoria, Início da Nova Turma..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '0.9rem',
                outline: 'none',
              }}
              data-testid="broadcast-title-input"
            />
          </div>

          {/* Seleção do Público Modular */}
          <ChatBroadcastAudienceSelector
            filterType={filterType}
            setFilterType={setFilterType}
            courses={courses}
            tags={tags}
            selectedCourseId={selectedCourseId}
            setSelectedCourseId={setSelectedCourseId}
            selectedTagId={selectedTagId}
            setSelectedTagId={setSelectedTagId}
            filterDays={filterDays}
            setFilterDays={setFilterDays}
          />

          {/* Mensagem Privada */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0' }}>
                Mensagem a ser enviada no privado:
              </label>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {message.length} caracteres
              </span>
            </div>
            <textarea
              rows={5}
              placeholder="Digite aqui o texto que será entregue na conversa privada (DM) de cada aluno..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                outline: 'none',
                resize: 'vertical',
                minHeight: '110px',
              }}
              data-testid="broadcast-message-textarea"
            />
          </div>

          {/* Configuração de Botão de Ação Interativo (CTA) */}
          <ChatBroadcastButtonConfig
            enableButton={enableButton}
            setEnableButton={setEnableButton}
            buttonText={buttonText}
            setButtonText={setButtonText}
            buttonUrl={buttonUrl}
            setButtonUrl={setButtonUrl}
            buttonActionType={buttonActionType}
            setButtonActionType={setButtonActionType}
            courses={courses}
          />

          {/* Card de Estimativa Modular */}
          <ChatBroadcastEstimateCard estimate={estimate} estimating={estimating} />
        </div>

        {/* Rodapé de Ações */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={!title.trim() || !message.trim() || estimate.total_recipients === 0}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: !title.trim() || !message.trim() || estimate.total_recipients === 0 ? 'not-allowed' : 'pointer',
              opacity: !title.trim() || !message.trim() || estimate.total_recipients === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            }}
            data-testid="open-confirm-broadcast-btn"
          >
            <Send size={16} />
            Iniciar Disparo
          </button>
        </div>
      </div>

      {/* Confirmação Modular */}
      <ChatBroadcastConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleStartBroadcast}
        totalRecipients={estimate.total_recipients}
        sending={sending}
      />
    </div>,
    document.body
  );
}
