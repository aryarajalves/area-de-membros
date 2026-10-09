import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, FileText } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ConfirmGenerateAiMetadataModal from './ConfirmGenerateAiMetadataModal';

export default function LessonOverviewTab({
  lesson,
  courseId,
  moduleId,
  currentDescription,
  isManager,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  mutedColor = '#64748b',
  onLessonUpdated
}) {
  const { addToast } = useToast();
  const [hasTranscription, setHasTranscription] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    let isMounted = true;
    const checkTranscription = async () => {
      if (!courseId || !moduleId || !lesson?.id) return;
      try {
        const res = await fetch(
          `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/transcription`,
          { headers: getAuthHeaders() }
        );
        if (res.ok && isMounted) {
          const json = await res.json();
          const hasReadyTranscript =
            (json.status === 'completed' || Boolean(json.full_transcript)) &&
            ((json.full_transcript && json.full_transcript.length > 10) ||
              (json.summary_markdown && json.summary_markdown.length > 10));
          setHasTranscription(Boolean(hasReadyTranscript));
        }
      } catch {
        // Silencioso se falhar
      }
    };
    checkTranscription();
    return () => {
      isMounted = false;
    };
  }, [courseId, moduleId, lesson?.id]);

  const handleGenerateMetadata = async () => {
    if (!isManager || generating) return;
    try {
      setGenerating(true);
      addToast('Analisando transcrição e gerando novo título e descrição com IA...', 'info');

      const res = await fetch(
        `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/generate-metadata`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Falha ao gerar título e descrição da aula.');
      }

      const updated = await res.json();
      addToast('Título e descrição da aula atualizados com sucesso pela IA!', 'success');
      setShowConfirmModal(false);
      if (onLessonUpdated) {
        onLessonUpdated(updated);
      }
    } catch (err) {
      console.error('Erro ao gerar metadados da aula:', err);
      addToast(err.message || 'Erro ao gerar dados com IA.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ marginTop: '22px' }} data-testid="lesson-overview-tab">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} color="#eab308" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>
            Descrição da Aula
          </span>
        </div>

        {isManager && hasTranscription && (
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={generating}
            data-testid="btn-generate-lesson-metadata"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: generating ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.2s ease',
              opacity: generating ? 0.7 : 1
            }}
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{generating ? 'Gerando com IA...' : 'Gerar Título e Descrição com IA'}</span>
          </button>
        )}
      </div>

      {currentDescription ? (
        <div
          style={{
            fontSize: '14.5px',
            color: subTextColor,
            lineHeight: '1.75',
            whiteSpace: 'pre-wrap'
          }}
          data-testid="active-lesson-description"
        >
          {currentDescription}
        </div>
      ) : (
        <div
          style={{
            padding: '24px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}
        >
          <p style={{ fontSize: '13.5px', color: mutedColor, fontStyle: 'italic', margin: '0 0 8px 0' }}>
            Esta aula não possui descrição textual adicional.
          </p>
          {isManager && hasTranscription && (
            <p style={{ fontSize: '12.5px', color: '#a5b4fc', margin: 0, fontWeight: 500 }}>
              💡 A transcrição desta aula já foi gerada! Clique no botão acima para criar o título e a descrição automaticamente com IA.
            </p>
          )}
        </div>
      )}

      {/* Modal de confirmação para geração de título e descrição com IA */}
      <ConfirmGenerateAiMetadataModal
        isOpen={showConfirmModal}
        onConfirm={handleGenerateMetadata}
        onClose={() => setShowConfirmModal(false)}
        loading={generating}
      />
    </div>
  );
}
