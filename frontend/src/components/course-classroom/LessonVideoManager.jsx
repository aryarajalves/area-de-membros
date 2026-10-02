import React, { useState } from 'react';
import { Upload, Link2, Globe, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { UploadProgressModal, FileDeleteConfirmModal } from '../common/FeedbackModals';

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
  lessonTitle = '',
  lessonDescription = '',
  isLightBg = false
}) {
  const [activeLang, setActiveLang] = useState('pt');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const textColor = isLightBg ? '#1e293b' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const outerBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const outerBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';
  const innerBg = isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.55)';
  const innerBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';

  // Garante que exista pelo menos o idioma padrão (Português)
  const currentVideos = videos.length > 0
    ? videos
    : [{ language: 'pt', language_label: 'Português', title: '', description: '', video_url: '', video_type: 'upload' }];

  const activeVideo = currentVideos.find((v) => v.language === activeLang) || currentVideos[0];

  const handleUpdateActiveVideo = (updates) => {
    const updated = currentVideos.map((v) =>
      v.language === activeVideo.language ? { ...v, ...updates } : v
    );
    onChange(updated);
  };

  const handleAddLanguage = (langOpt) => {
    if (currentVideos.some((v) => v.language === langOpt.code)) {
      setActiveLang(langOpt.code);
      setShowAddDropdown(false);
      return;
    }

    const newVideo = {
      language: langOpt.code,
      language_label: langOpt.label,
      title: '',
      description: '',
      video_url: '',
      video_type: 'upload'
    };
    onChange([...currentVideos, newVideo]);
    setActiveLang(langOpt.code);
    setShowAddDropdown(false);
  };

  const handleRequestRemoveLanguage = (langOpt, e) => {
    e.stopPropagation();
    if (currentVideos.length <= 1) return;
    setConfirmDelete({
      isOpen: true,
      title: `Remover Idioma (${langOpt.language_label || langOpt.language})?`,
      message: `Tem certeza que deseja remover o idioma "${langOpt.language_label || langOpt.language}"? As configurações e o vídeo deste idioma serão perdidos.`,
      onConfirm: () => {
        const remaining = currentVideos.filter((v) => v.language !== langOpt.language);
        onChange(remaining);
        if (activeLang === langOpt.language) {
          setActiveLang(remaining[0].language);
        }
        setConfirmDelete({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleRequestRemoveVideo = () => {
    setConfirmDelete({
      isOpen: true,
      title: 'Remover Vídeo da Aula?',
      message: `Tem certeza que deseja remover o vídeo da aula (${activeVideo.language_label})?`,
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

    setUploading(true);
    setUploadProgress(0);
    const uploadedUrl = await onUploadVideo(file, (pct) => {
      setUploadProgress(pct);
    });
    if (uploadedUrl) {
      handleUpdateActiveVideo({
        video_url: uploadedUrl,
        video_type: 'upload'
      });
    }
    setUploading(false);
    setUploadProgress(null);
    e.target.value = '';
  };

  // Idiomas disponíveis para adicionar
  const availableLanguages = LANGUAGE_OPTIONS.filter(
    (opt) => !currentVideos.some((v) => v.language === opt.code)
  );

  return (
    <div style={{ border: outerBorder, borderRadius: '10px', padding: '14px', backgroundColor: outerBg }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe size={16} color="#38bdf8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
            Vídeos da Aula por Idioma
          </span>
        </div>

        {/* Botão de Adicionar Idioma */}
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
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: isLightBg ? '#ffffff' : '#0f172a',
                border: outerBorder,
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                zIndex: 10,
                minWidth: '160px',
                padding: '6px 0'
              }}>
                {availableLanguages.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => handleAddLanguage(opt)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      color: textColor
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isLightBg ? '#f1f5f9' : 'rgba(255,255,255,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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

      {/* Abas dos Idiomas Cadastrados */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {currentVideos.map((v) => {
          const opt = LANGUAGE_OPTIONS.find((o) => o.code === v.language) || { flag: '🌐', label: v.language_label };
          const displayLabel = v.language_label || opt.label;
          const isActive = v.language === activeVideo.language;
          const hasVideo = !!v.video_url;

          return (
            <div
              key={v.language}
              onClick={() => setActiveLang(v.language)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: isActive ? '#2563eb' : (isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.06)'),
                color: isActive ? '#ffffff' : textColor,
                border: isActive ? '1px solid #3b82f6' : outerBorder
              }}
              data-testid={`lang-tab-${v.language}`}
            >
              <span>{opt.flag}</span>
              <span>{displayLabel}</span>
              {hasVideo && (
                <CheckCircle2 size={13} color={isActive ? '#86efac' : '#22c55e'} title="Vídeo anexado" />
              )}
              {currentVideos.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => handleRequestRemoveLanguage(v, e)}
                  title="Remover este idioma"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0 2px',
                    cursor: 'pointer',
                    color: isActive ? '#ffffff' : subTextColor
                  }}
                  data-testid={`remove-lang-${v.language}`}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Conteúdo de Edição do Vídeo do Idioma Ativo */}
      <div style={{ backgroundColor: innerBg, border: innerBorder, borderRadius: '8px', padding: '12px' }}>
        {/* Nome / Rótulo do Idioma */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
            Nome do Idioma
          </label>
          <input
            type="text"
            placeholder="Ex: Português, Inglês, Espanhol..."
            value={activeVideo.language_label || ''}
            onChange={(e) => handleUpdateActiveVideo({ language_label: e.target.value })}
            className="form-control-modern"
            style={{ fontSize: '12px', padding: '7px 10px' }}
            data-testid={`lesson-lang-label-input-${activeVideo.language}`}
          />
          <span style={{ fontSize: '11px', color: subTextColor, marginTop: '2px', display: 'block' }}>
            Nome exibido na aba e no botão de troca de idioma do player para o aluno.
          </span>
        </div>

        {/* Nome da Aula no Idioma */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
            Nome da Aula em {activeVideo.language_label || 'este idioma'}
          </label>
          <input
            type="text"
            placeholder={lessonTitle ? `Ex: ${lessonTitle} (${activeVideo.language_label || 'Idioma'})` : `Nome da aula em ${activeVideo.language_label || 'Idioma'}`}
            value={activeVideo.title || ''}
            onChange={(e) => handleUpdateActiveVideo({ title: e.target.value })}
            className="form-control-modern"
            style={{ fontSize: '12px', padding: '7px 10px' }}
            data-testid={`lesson-lang-title-input-${activeVideo.language}`}
          />
        </div>

        {/* Descrição da Aula no Idioma */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
            Descrição da Aula em {activeVideo.language_label || 'este idioma'}
          </label>
          <textarea
            rows={2}
            placeholder={lessonDescription ? `Ex: ${lessonDescription.slice(0, 50)}...` : `Objetivos e conteúdo da aula em ${activeVideo.language_label || 'este idioma'}...`}
            value={activeVideo.description || ''}
            onChange={(e) => handleUpdateActiveVideo({ description: e.target.value })}
            className="form-control-modern"
            style={{ fontSize: '12px', padding: '7px 10px', resize: 'vertical' }}
            data-testid={`lesson-lang-desc-input-${activeVideo.language}`}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => handleUpdateActiveVideo({ video_type: 'upload' })}
            className={activeVideo.video_type === 'upload' ? 'primary-btn' : 'secondary-btn'}
            style={{ flex: 1, padding: '7px', fontSize: '12px', justifyContent: 'center', gap: '6px' }}
            data-testid="tab-upload-video"
          >
            <Upload size={14} />
            <span>Upload do PC (Backblaze B2)</span>
          </button>
          <button
            type="button"
            onClick={() => handleUpdateActiveVideo({ video_type: 'url' })}
            className={activeVideo.video_type === 'url' ? 'primary-btn' : 'secondary-btn'}
            style={{ flex: 1, padding: '7px', fontSize: '12px', justifyContent: 'center', gap: '6px' }}
            data-testid="tab-url-video"
          >
            <Link2 size={14} />
            <span>Link Externo / Embed</span>
          </button>
        </div>

        {activeVideo.video_type === 'upload' ? (
          <div>
            <div style={{
              border: isLightBg ? '2px dashed #cbd5e1' : '2px dashed rgba(255, 255, 255, 0.18)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)'
            }}>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id={`lesson-video-file-input-${activeVideo.language}`}
                data-testid="lesson-video-file-input"
              />
              <label
                htmlFor={`lesson-video-file-input-${activeVideo.language}`}
                className="primary-btn"
                style={{ display: 'inline-flex', cursor: uploading ? 'wait' : 'pointer', fontSize: '12.5px', padding: '8px 16px' }}
              >
                <Upload size={14} style={{ marginRight: '6px' }} />
                <span>{uploading ? 'Enviando para Backblaze B2...' : 'Escolher Vídeo do Computador'}</span>
              </label>
              <p style={{ fontSize: '11.5px', color: subTextColor, margin: '8px 0 0 0' }}>
                Suporta MP4, WebM ou MOV (até 2 GB). Hospedado com alta velocidade no Backblaze B2.
              </p>
            </div>

            {activeVideo.video_url && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: isLightBg ? '#ecfdf5' : 'rgba(16, 185, 129, 0.14)',
                border: isLightBg ? '1px solid #a7f3d0' : '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '6px',
                fontSize: '12px',
                color: isLightBg ? '#065f46' : '#6ee7b7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                    Vídeo salvo: {activeVideo.video_url}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRequestRemoveVideo}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                  data-testid="remove-video-btn"
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=... ou Vimeo / Link direto"
              value={activeVideo.video_url || ''}
              onChange={(e) => handleUpdateActiveVideo({ video_url: e.target.value })}
              className="form-control-modern"
              style={{ fontSize: '12.5px', padding: '8px 12px' }}
              data-testid="lesson-video-url-input"
            />
            <span style={{ display: 'block', fontSize: '11.5px', color: subTextColor, marginTop: '4px' }}>
              Cole o link do YouTube, Vimeo, Panda Video ou link direto .mp4.
            </span>
          </div>
        )}
      </div>

      {/* Modal de Progresso de Upload de Vídeo */}
      <UploadProgressModal
        isOpen={uploading}
        progress={uploadProgress}
        title="Enviando vídeo da aula..."
        subtitle="Aguarde o envio seguro para o Backblaze B2 ser concluído. O progresso é medido em tempo real."
      />

      {/* Modal de Confirmação de Exclusão (Idioma ou Vídeo) */}
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
