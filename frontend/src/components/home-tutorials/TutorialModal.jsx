import React, { useState, useEffect } from 'react';
import { X, Video, Sparkles } from 'lucide-react';
import {
  uploadTutorialVideoApi,
  createTutorialApi,
  updateTutorialApi,
  generateTutorialAiDescriptionApi,
} from './tutorialsApi';
import TutorialVideoInputSection from './TutorialVideoInputSection';

export default function TutorialModal({
  isOpen,
  onClose,
  tutorial = null,
  onSuccess,
  addToast,
}) {
  const isEditing = Boolean(tutorial);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoType, setVideoType] = useState('upload'); // 'upload' | 'url'
  const [videoUrl, setVideoUrl] = useState('');
  const [videoKey, setVideoKey] = useState('');
  const [duration, setDuration] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (tutorial) {
        setTitle(tutorial.title || '');
        setDescription(tutorial.description || '');
        setVideoUrl(tutorial.video_url || '');
        setVideoKey(tutorial.video_key || '');
        setDuration(tutorial.duration || '');
        setOrderIndex(tutorial.order_index ?? 0);
        setVideoType(tutorial.video_url?.startsWith('/api/v1') || tutorial.video_key ? 'upload' : 'url');
      } else {
        setTitle('');
        setDescription('');
        setVideoType('upload');
        setVideoUrl('');
        setVideoKey('');
        setDuration('');
        setOrderIndex(0);
      }
      setSelectedFile(null);
      setError('');
    }
  }, [isOpen, tutorial]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');

    // Preenche título inicial se estiver em branco
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Lê duração do arquivo localmente
    try {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElement.src);
        const totalSeconds = Math.round(videoElement.duration);
        if (!isNaN(totalSeconds) && totalSeconds > 0) {
          const mins = Math.floor(totalSeconds / 60);
          const secs = totalSeconds % 60;
          setDuration(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        }
      };
      videoElement.src = URL.createObjectURL(file);
    } catch {
      // Ignora erro de medição local
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Por favor, informe o título da aula de tutorial.');
      return;
    }

    let finalVideoUrl = videoUrl.trim();
    let finalVideoKey = videoKey;

    const token = localStorage.getItem('auth_token');

    // Se escolheu upload e tem arquivo novo selecionado
    if (videoType === 'upload' && selectedFile) {
      setUploading(true);
      try {
        const uploadRes = await uploadTutorialVideoApi(selectedFile, token);
        finalVideoUrl = uploadRes.video_url;
        finalVideoKey = uploadRes.video_key;
      } catch (uploadErr) {
        setUploading(false);
        setError(uploadErr.message || 'Erro ao fazer upload do vídeo.');
        if (addToast) addToast(uploadErr.message || 'Erro no upload.', 'error');
        return;
      }
      setUploading(false);
    }

    if (!finalVideoUrl) {
      setError(
        videoType === 'upload'
          ? 'Por favor, selecione um arquivo de vídeo para upload.'
          : 'Por favor, informe a URL do vídeo tutorial.'
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        video_url: finalVideoUrl,
        video_key: finalVideoKey || null,
        duration: duration.trim() || null,
        order_index: Number(orderIndex) || 0,
      };

      let result;
      if (isEditing) {
        result = await updateTutorialApi(tutorial.id, payload, token);
        if (addToast) addToast('Tutorial atualizado com sucesso!', 'success');
      } else {
        result = await createTutorialApi(payload, token);
        if (addToast) addToast('Aula de tutorial criada com sucesso!', 'success');
      }

      if (onSuccess) onSuccess(result);
      onClose();
    } catch (saveErr) {
      setError(saveErr.message || 'Erro ao salvar tutorial.');
      if (addToast) addToast(saveErr.message || 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAiDescription = async () => {
    if (!selectedFile && !videoUrl.trim()) {
      setError('Por favor, selecione um arquivo de vídeo ou informe a URL para gerar a descrição com IA.');
      return;
    }

    setGeneratingAi(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      let effectiveVideoUrl = videoUrl.trim();
      let effectiveVideoKey = videoKey;

      // Se há um arquivo selecionado e ainda não tem URL, tenta upload prévio para economizar tráfego
      if (videoType === 'upload' && selectedFile && !effectiveVideoUrl) {
        if (addToast) addToast('Processando e transcrevendo vídeo com IA...', 'info');
        setUploading(true);
        try {
          const uploadRes = await uploadTutorialVideoApi(selectedFile, token);
          if (uploadRes?.video_url) {
            effectiveVideoUrl = uploadRes.video_url;
            effectiveVideoKey = uploadRes.video_key;
            setVideoUrl(effectiveVideoUrl);
            setVideoKey(effectiveVideoKey);
          }
        } catch {
          // Fallback seguro: se upload prévio não responder, envia selectedFile diretamente
        } finally {
          setUploading(false);
        }
      }

      const res = await generateTutorialAiDescriptionApi(
        {
          file: effectiveVideoUrl ? null : selectedFile,
          videoUrl: effectiveVideoUrl,
          videoKey: effectiveVideoKey,
          title: title.trim(),
        },
        token
      );

      if (res.description) {
        setDescription(res.description);
      }
      if (res.duration && (!duration || duration === '00:00')) {
        setDuration(res.duration);
      }
      if (addToast) addToast('Descrição gerada com sucesso pela IA!', 'success');
    } catch (err) {
      setError(err.message || 'Erro ao gerar descrição com IA.');
      if (addToast) addToast(err.message || 'Falha na IA.', 'error');
    } finally {
      setGeneratingAi(false);
      setUploading(false);
    }
  };

  const isBusy = uploading || saving || generatingAi;

  return (
    <div
      className="modal-overlay custom-modal-overlay"
      role="dialog"
      aria-modal="true"
      data-testid="tutorial-modal"
      style={{
        overflowY: 'auto',
        padding: '24px 16px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="modal-content custom-scrollbar"
        style={{
          maxWidth: '580px',
          width: '100%',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={20} color="#3b82f6" />
            <h3 style={{ margin: 0 }}>
              {isEditing ? 'Editar Aula de Tutorial' : 'Nova Aula de Tutorial'}
            </h3>
          </div>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            disabled={isBusy}
            data-testid="close-tutorial-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" data-testid="tutorial-form">
          {error && (
            <div className="auth-error-banner" data-testid="tutorial-error-banner" style={{ marginBottom: '14px' }}>
              {error}
            </div>
          )}

          {/* Título */}
          <div className="form-group">
            <label htmlFor="tutorial-title">Título do Tutorial *</label>
            <input
              id="tutorial-title"
              type="text"
              placeholder="Ex: Como Navegar pela Plataforma"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-testid="tutorial-title-input"
            />
          </div>

          {/* Descrição */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label htmlFor="tutorial-description" style={{ margin: 0 }}>
                Descrição / O que você vai aprender
              </label>
              <button
                type="button"
                onClick={handleGenerateAiDescription}
                disabled={isBusy || (!selectedFile && !videoUrl.trim())}
                data-testid="generate-ai-description-btn"
                title={
                  !selectedFile && !videoUrl.trim()
                    ? 'Selecione um arquivo de vídeo ou insira uma URL para transcrever com IA'
                    : 'Transcrever vídeo e gerar descrição detalhada com IA'
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  background: generatingAi ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.12)',
                  color: '#c084fc',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isBusy || (!selectedFile && !videoUrl.trim()) ? 'not-allowed' : 'pointer',
                  opacity: isBusy || (!selectedFile && !videoUrl.trim()) ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <Sparkles size={13} />
                <span>{generatingAi ? 'Transcrevendo com IA...' : 'Gerar com IA'}</span>
              </button>
            </div>
            <textarea
              id="tutorial-description"
              rows={4}
              placeholder="Breve resumo dos tópicos abordados neste vídeo tutorial..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="tutorial-description-input"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                resize: 'vertical',
                fontSize: '13.5px',
              }}
            />
          </div>

          {/* Origem, Upload/URL e Pré-visualização do Vídeo */}
          <TutorialVideoInputSection
            videoType={videoType}
            setVideoType={setVideoType}
            isEditing={isEditing}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            selectedFile={selectedFile}
            handleFileChange={handleFileChange}
          />

          {/* Duração e Ordem */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="tutorial-duration">Duração (MM:SS)</label>
              <input
                id="tutorial-duration"
                type="text"
                placeholder="Ex: 04:30"
                value={duration || ''}
                onChange={(e) => setDuration(e.target.value)}
                data-testid="tutorial-duration-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tutorial-order">Ordem na Playlist</label>
              <input
                id="tutorial-order"
                type="number"
                min="0"
                value={orderIndex ?? 0}
                onChange={(e) => setOrderIndex(e.target.value)}
                data-testid="tutorial-order-input"
              />
            </div>
          </div>

          {/* Ações Fixas no Rodapé com Rolagem Perfeita */}
          <div
            className="modal-actions"
            style={{
              marginTop: '20px',
              position: 'sticky',
              bottom: 0,
              background: '#0f172a',
              paddingTop: '12px',
              paddingBottom: '4px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={isBusy}
              data-testid="cancel-tutorial-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={isBusy}
              data-testid="submit-tutorial-btn"
            >
              {uploading ? 'Enviando Vídeo...' : saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Tutorial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
