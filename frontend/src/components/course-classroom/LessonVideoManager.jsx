import React, { useState } from 'react';
import { Globe, Plus, Trash2, CheckCircle2, Clock, Film, Layers } from 'lucide-react';
import { FileDeleteConfirmModal } from '../common/FeedbackModals';
import { useUploadQueue } from '../../context/UploadQueueContext';
import { getVideoFileDuration, formatSecondsToClock } from './lessonUtils';
import ExpandableTextarea from '../common/ExpandableTextarea';
import LessonVideoUploadSection from './LessonVideoUploadSection';

export const LANGUAGE_OPTIONS = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'Inglês', flag: '🇺🇸' },
  { code: 'es', label: 'Espanhol', flag: '🇪🇸' },
  { code: 'fr', label: 'Francês', flag: '🇫🇷' },
  { code: 'de', label: 'Alemão', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'other', label: 'Outro Idioma', flag: '🌐' }
];

export default function LessonVideoManager({
  videos = [],
  onChange,
  onUploadVideo,
  uploading,
  setUploading,
  lessonId = null,
  lessonTitle = '',
  lessonDescription = '',
  isLightBg = false,
  onDurationDetected = null
}) {
  const [activeLang, setActiveLang] = useState('pt');
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  let uploadQueue = null;
  try {
    uploadQueue = useUploadQueue();
  } catch {
    uploadQueue = null;
  }

  const textColor = isLightBg ? '#1e293b' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const outerBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const outerBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';
  const innerBg = isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.55)';
  const innerBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';

  // Garante pelo menos um vídeo inicial
  const currentVideos = videos.length > 0
    ? videos
    : [{ language: 'pt', language_label: 'Português', title: '', description: '', duration: '', video_url: '', video_type: 'upload', order_index: 0 }];

  // Nível 1: Idiomas únicos cadastrados
  const languageGroups = [];
  const seenLangs = new Set();
  for (const v of currentVideos) {
    const code = v.language || 'pt';
    if (!seenLangs.has(code)) {
      seenLangs.add(code);
      const opt = LANGUAGE_OPTIONS.find((o) => o.code === code);
      languageGroups.push({
        code,
        label: v.language_label && !v.language_label.toLowerCase().startsWith('parte') ? v.language_label : (opt?.label || code),
        flag: opt?.flag || '🌐'
      });
    }
  }

  const effectiveLang = seenLangs.has(activeLang) ? activeLang : (languageGroups[0]?.code || 'pt');
  const activeLangGroup = languageGroups.find((g) => g.code === effectiveLang) || languageGroups[0];

  // Nível 2: Partes pertencentes ao idioma selecionado
  const langParts = currentVideos.filter((v) => (v.language || 'pt') === effectiveLang);
  const safePartIndex = activePartIndex < langParts.length ? activePartIndex : 0;
  const activeVideo = langParts[safePartIndex] || currentVideos[0];

  const currentUpload = uploadQueue?.uploads?.find(
    (u) => u.status === 'uploading' && u.language === effectiveLang && (!lessonId || !u.lessonId || String(u.lessonId) === String(lessonId))
  );

  const handleUpdateActiveVideo = (updates) => {
    let partCounter = 0;
    const updated = currentVideos.map((v) => {
      if ((v.language || 'pt') === effectiveLang) {
        const isTarget = partCounter === safePartIndex;
        partCounter += 1;
        return isTarget ? { ...v, ...updates } : v;
      }
      return v;
    });
    onChange(updated);
  };

  const handleUpdateLanguageLabel = (newLabel) => {
    const updated = currentVideos.map((v) =>
      (v.language || 'pt') === effectiveLang ? { ...v, language_label: newLabel } : v
    );
    onChange(updated);
  };

  const handleAddPart = () => {
    const partNum = langParts.length + 1;
    const newPart = {
      language: effectiveLang,
      language_label: activeLangGroup?.label || 'Português',
      title: `Parte ${partNum}`,
      description: '',
      duration: '',
      video_url: '',
      video_type: 'upload',
      order_index: langParts.length
    };
    onChange([...currentVideos, newPart]);
    setActivePartIndex(langParts.length);
  };

  const handleAddLanguage = (langOpt) => {
    if (seenLangs.has(langOpt.code)) {
      setActiveLang(langOpt.code);
      setActivePartIndex(0);
      setShowAddDropdown(false);
      return;
    }

    const newVideo = {
      language: langOpt.code,
      language_label: langOpt.label,
      title: '',
      description: '',
      duration: '',
      video_url: '',
      video_type: 'upload',
      order_index: 0
    };
    onChange([...currentVideos, newVideo]);
    setActiveLang(langOpt.code);
    setActivePartIndex(0);
    setShowAddDropdown(false);
  };

  const handleRequestRemoveLanguage = (langItem, e) => {
    if (e) e.stopPropagation();
    if (languageGroups.length <= 1) return;
    setConfirmDelete({
      isOpen: true,
      title: `Remover Idioma (${langItem.label})?`,
      message: `Tem certeza que deseja remover o idioma "${langItem.label}" e todas as suas partes?`,
      onConfirm: () => {
        const remaining = currentVideos.filter((v) => (v.language || 'pt') !== langItem.code);
        onChange(remaining);
        if (effectiveLang === langItem.code) {
          setActiveLang(remaining[0]?.language || 'pt');
          setActivePartIndex(0);
        }
        setConfirmDelete({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleRequestRemovePart = (partIdx, e) => {
    if (e) e.stopPropagation();
    if (langParts.length <= 1) return;
    setConfirmDelete({
      isOpen: true,
      title: `Remover Parte ${partIdx + 1}?`,
      message: `Tem certeza que deseja remover a Parte ${partIdx + 1} (${activeLangGroup?.label})?`,
      onConfirm: () => {
        let counter = 0;
        const remaining = currentVideos.filter((v) => {
          if ((v.language || 'pt') === effectiveLang) {
            const keep = counter !== partIdx;
            counter += 1;
            return keep;
          }
          return true;
        });
        onChange(remaining);
        if (safePartIndex >= langParts.length - 1) {
          setActivePartIndex(Math.max(0, langParts.length - 2));
        }
        setConfirmDelete({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleRequestRemoveVideo = () => {
    setConfirmDelete({
      isOpen: true,
      title: 'Remover Vídeo da Aula?',
      message: `Tem certeza que deseja remover o vídeo da Parte ${safePartIndex + 1} (${activeLangGroup?.label})?`,
      onConfirm: () => {
        handleUpdateActiveVideo({ video_url: '' });
        setConfirmDelete({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2048 * 1024 * 1024) {
      alert('O arquivo de vídeo excede o limite máximo permitido de 2 GB.');
      e.target.value = '';
      return;
    }

    getVideoFileDuration(file).then((durSec) => {
      if (durSec > 0) {
        const clockTime = formatSecondsToClock(durSec);
        handleUpdateActiveVideo({ duration: clockTime });
        if (onDurationDetected && safePartIndex === 0 && effectiveLang === 'pt') {
          onDurationDetected(clockTime);
        }
      }
    }).catch(() => {});

    if (uploadQueue?.startVideoUpload) {
      uploadQueue.startVideoUpload({
        file,
        lessonId: lessonId || null,
        lessonTitle: activeVideo.title || lessonTitle || file.name,
        language: effectiveLang,
        onSuccessUrl: (url) => {
          handleUpdateActiveVideo({ video_url: url, video_type: 'upload' });
        }
      });
    } else if (onUploadVideo) {
      if (setUploading) setUploading(true);
      setUploadProgress(0);
      const uploadedUrl = await onUploadVideo(file, (pct) => setUploadProgress(pct));
      if (uploadedUrl) {
        handleUpdateActiveVideo({ video_url: uploadedUrl, video_type: 'upload' });
      }
      if (setUploading) setUploading(false);
      setUploadProgress(null);
    }
    e.target.value = '';
  };

  const availableLanguages = LANGUAGE_OPTIONS.filter((opt) => !seenLangs.has(opt.code));

  return (
    <div style={{ border: outerBorder, borderRadius: '10px', padding: '14px', backgroundColor: outerBg }}>
      {/* NÍVEL 1: Cabeçalho e Abas de Idioma */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe size={16} color="#38bdf8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
            Vídeos da Aula por Idioma
          </span>
        </div>

        {availableLanguages.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              style={{ padding: '5px 10px', fontSize: '12px', gap: '4px' }}
              data-testid="add-language-btn"
            >
              <Plus size={14} />
              <span>Adicionar Idioma</span>
            </button>

            {showAddDropdown && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                backgroundColor: isLightBg ? '#ffffff' : '#0f172a', border: outerBorder,
                borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)', zIndex: 10, minWidth: '160px', padding: '6px 0'
              }}>
                {availableLanguages.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => handleAddLanguage(opt)}
                    style={{
                      width: '100%', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px',
                      border: 'none', background: 'none', textAlign: 'left', fontSize: '12.5px', cursor: 'pointer', color: textColor
                    }}
                    data-testid={`select-lang-${opt.code}`}
                  >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Abas dos Idiomas (Nível 1) */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {languageGroups.map((langItem) => {
          const isActive = langItem.code === effectiveLang;
          const partsOfLang = currentVideos.filter((v) => (v.language || 'pt') === langItem.code);
          const hasAnyVideo = partsOfLang.some((p) => !!p.video_url);
          return (
            <div
              key={langItem.code}
              onClick={() => { setActiveLang(langItem.code); setActivePartIndex(0); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                backgroundColor: isActive ? '#2563eb' : (isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.06)'),
                color: isActive ? '#ffffff' : textColor,
                border: isActive ? '1px solid #3b82f6' : outerBorder
              }}
              data-testid={`lang-tab-${langItem.code}`}
            >
              <span>{langItem.flag}</span>
              <span>{langItem.label}</span>
              {partsOfLang.length > 1 && (
                <span style={{ fontSize: '10.5px', opacity: 0.85 }}>({partsOfLang.length} partes)</span>
              )}
              {hasAnyVideo && <CheckCircle2 size={13} color={isActive ? '#86efac' : '#22c55e'} />}
              {languageGroups.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => handleRequestRemoveLanguage(langItem, e)}
                  style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', color: isActive ? '#ffffff' : subTextColor }}
                  data-testid={`remove-lang-${langItem.code}`}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* NÍVEL 2: Barra de Partes dentro do Idioma Selecionado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '8px 10px', borderRadius: '8px', backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(15, 23, 42, 0.7)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Layers size={14} color="#38bdf8" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: subTextColor, marginRight: '4px' }}>
            Partes ({activeLangGroup?.label}):
          </span>
          {langParts.map((part, idx) => {
            const isPartActive = idx === safePartIndex;
            return (
              <div
                key={`part-${idx}`}
                onClick={() => setActivePartIndex(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px',
                  fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
                  backgroundColor: isPartActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: isPartActive ? '#38bdf8' : textColor,
                  border: isPartActive ? '1px solid #38bdf8' : outerBorder
                }}
                data-testid={`part-tab-${idx}`}
              >
                <Film size={12} />
                <span>Parte {idx + 1}</span>
                {part.duration && <span style={{ fontSize: '10px', opacity: 0.8 }}>({part.duration})</span>}
                {part.video_url && <CheckCircle2 size={11} color="#22c55e" />}
                {langParts.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleRequestRemovePart(idx, e)}
                    style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', color: subTextColor }}
                    data-testid={`remove-part-${idx}`}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={handleAddPart}
          style={{ padding: '4px 10px', fontSize: '11.5px', gap: '4px', borderColor: 'rgba(56, 189, 248, 0.4)' }}
          data-testid="add-part-btn"
        >
          <Plus size={13} color="#38bdf8" />
          <span>+ Adicionar Parte</span>
        </button>
      </div>

      {/* Formulário da Parte Ativa no Idioma Ativo */}
      <div style={{ backgroundColor: innerBg, border: innerBorder, borderRadius: '8px', padding: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
              Nome do Idioma
            </label>
            <input
              type="text"
              placeholder="Ex: Português, Inglês..."
              value={activeLangGroup?.label || ''}
              onChange={(e) => handleUpdateLanguageLabel(e.target.value)}
              className="form-control-modern"
              style={{ fontSize: '12px', padding: '7px 10px' }}
              data-testid={`lesson-lang-label-input-${effectiveLang}`}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
              <Clock size={13} color="#38bdf8" />
              <span>Duração da Parte {safePartIndex + 1} (MM:SS)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: 15:30"
              value={activeVideo.duration || ''}
              onChange={(e) => handleUpdateActiveVideo({ duration: e.target.value })}
              className="form-control-modern"
              style={{ fontSize: '12px', padding: '7px 10px' }}
              data-testid="lesson-video-duration-input"
            />
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
            Nome da Aula em {activeLangGroup?.label || 'este idioma'} {langParts.length > 1 ? `(Parte ${safePartIndex + 1})` : ''}
          </label>
          <input
            type="text"
            placeholder={lessonTitle ? `Ex: ${lessonTitle}` : `Nome da aula`}
            value={activeVideo.title || ''}
            onChange={(e) => handleUpdateActiveVideo({ title: e.target.value })}
            className="form-control-modern"
            style={{ fontSize: '12px', padding: '7px 10px' }}
            data-testid={`lesson-lang-title-input-${effectiveLang}`}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <ExpandableTextarea
            label={`Descrição da Aula em ${activeLangGroup?.label || 'este idioma'}`}
            placeholder={lessonDescription ? `Ex: ${lessonDescription.slice(0, 50)}...` : `Objetivos e conteúdo...`}
            value={activeVideo.description || ''}
            onChange={(e) => handleUpdateActiveVideo({ description: e.target.value })}
            rows={6}
            minHeight="170px"
            textColor={textColor}
            subTextColor={subTextColor}
            testId={`lesson-lang-desc-input-${effectiveLang}`}
            fullscreenTestId={`fullscreen-desc-btn-${effectiveLang}`}
          />
        </div>

        <LessonVideoUploadSection
          activeVideo={activeVideo}
          handleUpdateActiveVideo={handleUpdateActiveVideo}
          handleFileChange={handleFileChange}
          handleRequestRemoveVideo={handleRequestRemoveVideo}
          uploading={uploading}
          currentUpload={currentUpload}
          textColor={textColor}
          subTextColor={subTextColor}
          isLightBg={isLightBg}
        />
      </div>

      <FileDeleteConfirmModal
        isOpen={confirmDelete.isOpen}
        title={confirmDelete.title}
        message={confirmDelete.message}
        onConfirm={confirmDelete.onConfirm}
        onCancel={() => setConfirmDelete({ isOpen: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  );
}
