import React, { useState, useEffect } from 'react';
import { BookOpen, X, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function TutorSaveNoteModal({
  isOpen,
  initialContent = '',
  courseId,
  lessonId,
  lessonTitle = '',
  onClose,
  onSuccess,
  isLightBg = false
}) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent || '');
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  const handleConfirmSave = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      addToast('O texto da anotação não pode ficar vazio.', 'warning');
      return;
    }

    if (!courseId || !lessonId) {
      addToast('Não foi possível identificar a aula para salvar a anotação.', 'error');
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

    try {
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content: trimmed })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Não foi possível salvar a anotação.');
      }

      const createdNote = await res.json();

      // Notifica componentes da plataforma que o número de anotações da aula aumentou
      window.dispatchEvent(
        new CustomEvent('lesson-note-created', {
          detail: { lessonId, note: createdNote }
        })
      );

      addToast('Anotação salva com sucesso nas Minhas Anotações!', 'success');

      if (onSuccess) {
        onSuccess(createdNote);
      }
      onClose();
    } catch (err) {
      addToast(err.message || 'Erro ao conectar ao servidor para salvar a anotação.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const modalBg = isLightBg ? '#ffffff' : '#0f172a';
  const textColor = isLightBg ? '#1e293b' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const inputBg = isLightBg ? '#f8fafc' : 'rgba(2, 6, 23, 0.7)';
  const inputBorder = isLightBg ? '#cbd5e1' : 'rgba(168, 85, 247, 0.3)';

  return (
    <div
      data-testid="tutor-save-note-modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div
        data-testid="tutor-save-note-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutor-save-note-title"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: modalBg,
          borderRadius: '16px',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(168, 85, 247, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              flexShrink: 0
            }}
          >
            <BookOpen size={20} />
          </div>

          <div style={{ flex: 1 }}>
            <h3
              id="tutor-save-note-title"
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Salvar nas Minhas Anotações</span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(168, 85, 247, 0.18)',
                  color: '#c084fc',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}
              >
                Caderno de Aula
              </span>
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '12.5px',
                color: subTextColor,
                lineHeight: 1.45
              }}
            >
              Você pode revisar a explicação da IA e adicionar suas próprias palavras antes de confirmar:
            </p>
            {lessonTitle && (
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  fontSize: '11px',
                  color: '#a855f7',
                  fontWeight: 600
                }}
              >
                Aula vinculada: {lessonTitle}
              </span>
            )}
          </div>
        </div>

        {/* Corpo: Textarea de Edição da Anotação */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label
            htmlFor="tutor-note-textarea"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: textColor,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Texto da anotação:</span>
            <span style={{ fontSize: '11px', color: subTextColor, fontWeight: 500 }}>
              {content.length} caracteres
            </span>
          </label>

          <textarea
            id="tutor-note-textarea"
            data-testid="input-edit-note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSaving}
            rows={7}
            placeholder="Edite a explicação da IA ou complemente com seus próprios apontamentos..."
            style={{
              width: '100%',
              backgroundColor: inputBg,
              color: textColor,
              border: `1px solid ${inputBorder}`,
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '13.5px',
              lineHeight: 1.6,
              resize: 'vertical',
              minHeight: '160px',
              maxHeight: '360px',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              color: subTextColor
            }}
          >
            <Sparkles size={13} color="#a855f7" />
            <span>
              Esta anotação ficará visível na aba <strong>Minhas Anotações</strong> desta aula.
            </span>
          </div>
        </div>

        {/* Rodapé: Apenas 1 botão cancelar e 1 botão confirmar (regra de popup) */}
        <div
          style={{
            padding: '14px 24px 20px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            data-testid="btn-cancel-save-note"
            style={{
              padding: '9px 18px',
              borderRadius: '9px',
              backgroundColor: 'transparent',
              border: `1px solid ${borderColor}`,
              color: textColor,
              fontSize: '13px',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={isSaving || !content.trim()}
            data-testid="btn-confirm-save-note"
            style={{
              padding: '9px 20px',
              borderRadius: '9px',
              backgroundColor: '#7c3aed',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isSaving || !content.trim() ? 'not-allowed' : 'pointer',
              opacity: isSaving || !content.trim() ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Salvar Anotação</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
