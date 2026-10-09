import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ConfirmGenerateAiMetadataModal from './ConfirmGenerateAiMetadataModal';

/**
 * Botão para geração sob demanda do título e descrição da aula via IA (GPT-4o)
 * utilizando a transcrição existente. Exibe modal de confirmação antes da execução.
 */
export default function LessonAiGenerateButton({
  courseId,
  moduleId,
  lessonId,
  onSuccess,
  disabled = false,
  isLightBg = false
}) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!courseId || !moduleId || !lessonId) {
    return null;
  }

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const res = await fetch(
        `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/generate-metadata`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Falha ao gerar título e descrição da aula com IA.');
      }

      const data = await res.json();
      if (onSuccess) {
        onSuccess({ title: data.title, description: data.description });
      }
      addToast('Título e descrição da aula gerados com sucesso com base na transcrição!', 'success');
      setConfirmOpen(false);
    } catch (err) {
      console.error('Erro ao gerar título e descrição com IA:', err);
      addToast(err.message || 'Erro ao gerar conteúdo com IA.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={disabled || loading}
        className="table-action-btn"
        data-testid="btn-generate-lesson-ai-metadata"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: '7px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.24) 100%)',
          color: '#c084fc',
          border: '1px solid rgba(168, 85, 247, 0.45)',
          cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
          opacity: (disabled || loading) ? 0.7 : 1,
          transition: 'all 0.2s ease'
        }}
        title="Gerar título e descrição pedagógica com base na transcrição da aula"
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Sparkles size={13} />
        )}
        <span>{loading ? 'Gerando com IA...' : 'Gerar com IA'}</span>
      </button>

      <ConfirmGenerateAiMetadataModal
        isOpen={confirmOpen}
        onClose={() => !loading && setConfirmOpen(false)}
        onConfirm={handleGenerate}
        loading={loading}
        isLightBg={isLightBg}
        title="Gerar Título e Descrição com IA?"
        message="A Inteligência Artificial analisará a transcrição completa desta aula para formular um novo título atrativo e uma descrição pedagógica detalhada. Os campos serão preenchidos para você revisar."
      />
    </>
  );
}
