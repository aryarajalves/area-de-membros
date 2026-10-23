import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import CourseTypeSelector from './CourseTypeSelector';
import ExpandableTextarea from '../common/ExpandableTextarea';

export default function CourseModalInfoTab({
  itemType = 'course',
  setItemType,
  toolUrl = '',
  setToolUrl,
  title,
  setTitle,
  description,
  setDescription,
  editingCourse,
  textColor,
  isLightBg,
  aiLoading,
  saving,
  onOpenAiConfirm
}) {
  return (
    <div data-testid="course-modal-tab-panel-info">
      {/* Seletor de Tipo de Item (Curso ou Ferramenta) */}
      {setItemType && (
        <CourseTypeSelector
          itemType={itemType}
          onChangeItemType={setItemType}
          toolUrl={toolUrl}
          onChangeToolUrl={setToolUrl}
          isLightBg={isLightBg}
        />
      )}

      <div className="form-group">
        <label htmlFor="course-title">
          {itemType === 'tool' ? 'Nome da Ferramenta / Aplicativo *' : 'Título do Curso *'}
        </label>
        <input
          id="course-title"
          type="text"
          required
          placeholder={itemType === 'tool' ? 'Ex: ZapVoice - Disparador WhatsApp' : 'Ex: Formação em Tráfego Direto'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="course-title-input"
        />
      </div>

      <div className="form-group">
        <ExpandableTextarea
          id="course-description"
          label="Descrição"
          placeholder="Descrição do conteúdo e objetivos do curso..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          testId="course-description-input"
          textColor={textColor}
          extraActions={
            editingCourse?.id ? (
              <button
                type="button"
                onClick={onOpenAiConfirm}
                disabled={aiLoading || saving}
                data-testid="generate-course-ai-description-btn"
                title="Analisar módulos do curso e gerar descrição automaticamente com IA"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.22) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.45)',
                  color: '#c084fc',
                  cursor: aiLoading || saving ? 'not-allowed' : 'pointer',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  opacity: aiLoading || saving ? 0.6 : 1
                }}
              >
                {aiLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Gerar com IA</span>
                  </>
                )}
              </button>
            ) : null
          }
        />
      </div>
    </div>
  );
}
