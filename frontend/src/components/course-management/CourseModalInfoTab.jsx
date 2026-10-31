import React from 'react';
import { Sparkles, Loader2, Shield } from 'lucide-react';
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
  watermarkEnabled = true,
  setWatermarkEnabled,
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

      {itemType !== 'tool' && typeof setWatermarkEnabled === 'function' && (
        <div
          data-testid="course-watermark-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            padding: '12px 14px',
            marginTop: '6px',
            borderRadius: '10px',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
            border: watermarkEnabled
              ? '1px solid rgba(56, 189, 248, 0.35)'
              : (isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)'),
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: watermarkEnabled ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: watermarkEnabled ? '#38bdf8' : '#94a3b8',
                flexShrink: 0,
                marginTop: '1px'
              }}
            >
              <Shield size={16} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: textColor || '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Marca d&apos;Água Anti-Pirataria nas Aulas</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: '999px',
                    backgroundColor: watermarkEnabled ? 'rgba(34, 197, 94, 0.16)' : 'rgba(148, 163, 184, 0.15)',
                    color: watermarkEnabled ? '#4ade80' : '#94a3b8',
                    border: watermarkEnabled ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(148, 163, 184, 0.25)'
                  }}
                >
                  {watermarkEnabled ? 'Ativada' : 'Desativada'}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: isLightBg ? '#64748b' : '#94a3b8', marginTop: '2px', lineHeight: 1.4 }}>
                Exibe o e-mail/identificação do aluno de forma flutuante sobre o vídeo das aulas para coibir gravações de tela.
              </div>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(watermarkEnabled)}
            data-testid="course-watermark-toggle"
            onClick={() => setWatermarkEnabled(!watermarkEnabled)}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '999px',
              backgroundColor: watermarkEnabled ? '#0284c7' : (isLightBg ? '#cbd5e1' : '#334155'),
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0,
              transition: 'background-color 0.2s ease'
            }}
            title={watermarkEnabled ? 'Clique para desativar a marca d\'água neste curso' : 'Clique para ativar a marca d\'água neste curso'}
          >
            <span
              style={{
                display: 'block',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                transform: watermarkEnabled ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
              }}
            />
          </button>
        </div>
      )}
    </div>
  );
}
