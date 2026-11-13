import React, { useState } from 'react';
import { Globe, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

/**
 * Barra discreta para traduzir textos gerados por IA (Resumo, Capítulos, Destaques)
 * para o idioma atualmente selecionado no Player (quando diferente de Português).
 */
export default function LessonTranscriptionTranslateBar({
  courseId,
  moduleId,
  lessonId,
  selectedLang = 'pt',
  activeLanguage = 'pt',
  availableTranslations = [],
  isManager = false,
  onTranslated,
  isLightBg = false
}) {
  const [translating, setTranslating] = useState(false);
  const { addToast } = useToast();

  if (!selectedLang || selectedLang === 'pt') return null;

  const isTranslated = availableTranslations.includes(selectedLang) || activeLanguage === selectedLang;
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#475569' : '#94a3b8';

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch(
        `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/transcription/translate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ target_language: selectedLang })
        }
      );
      if (res.ok) {
        addToast('Textos traduzidos com sucesso para o idioma selecionado!', 'success');
        if (onTranslated) onTranslated();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail || 'Erro ao traduzir textos da aula.', 'error');
      }
    } catch {
      addToast('Erro de conexão ao tentar traduzir textos.', 'error');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div
      data-testid="lesson-transcription-translate-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        marginBottom: '14px',
        borderRadius: '10px',
        backgroundColor: isTranslated ? 'rgba(34, 197, 94, 0.1)' : 'rgba(56, 189, 248, 0.1)',
        border: isTranslated ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
        flexWrap: 'wrap',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isTranslated ? <CheckCircle2 size={16} color="#22c55e" /> : <Globe size={16} color="#38bdf8" />}
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: textColor }}>
          {isTranslated
            ? `Textos exibidos no idioma selecionado (${selectedLang.toUpperCase()}).`
            : `Estes textos estão no idioma original (PT).`}
        </span>
      </div>

      {isManager && (
        <button
          type="button"
          onClick={handleTranslate}
          disabled={translating}
          className="secondary-btn"
          style={{ padding: '5px 12px', fontSize: '12px', gap: '6px', cursor: translating ? 'wait' : 'pointer' }}
          data-testid="translate-transcription-btn"
        >
          {translating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} color="#38bdf8" />}
          <span>{translating ? 'Traduzindo...' : (isTranslated ? `Retraduzir (${selectedLang.toUpperCase()})` : `Traduzir para ${selectedLang.toUpperCase()}`)}</span>
        </button>
      )}
    </div>
  );
}
