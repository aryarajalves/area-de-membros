import React, { useState, useRef } from 'react';
import { UploadCloud, Upload, Trash2, Link as LinkIcon, Loader2, Image as ImageIcon, Video, CheckCircle2 } from 'lucide-react';

export default function CourseUpsellMediaUploader({
  mediaType = 'image',
  mediaUrl = '',
  onMediaChange = () => {},
  addToast = () => {}
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef(null);

  const isVideo = mediaType === 'video';
  const acceptedTypes = isVideo
    ? 'video/mp4,video/webm,video/quicktime,video/x-matroska'
    : 'image/png,image/jpeg,image/webp';
  const maxSize = isVideo ? 2048 * 1024 * 1024 : 5 * 1024 * 1024;
  const maxSizeLabel = isVideo ? '2 GB' : '5 MB';

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (file.size > maxSize) {
      addToast(
        isVideo
          ? `O arquivo de vídeo excede o limite máximo de ${maxSizeLabel}.`
          : `A imagem excede o limite máximo permitido de ${maxSizeLabel}.`,
        'error'
      );
      return;
    }

    const token = localStorage.getItem('auth_token');
    const endpoint = isVideo
      ? '/api/v1/courses/upload-video'
      : '/api/v1/courses/upload-thumbnail';

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      setUploading(false);
      setUploadProgress(0);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const returnedUrl = isVideo ? data.video_url : data.thumbnail_url;
          if (returnedUrl) {
            onMediaChange(returnedUrl);
            addToast(
              isVideo ? 'Vídeo enviado com sucesso!' : 'Imagem enviada com sucesso!',
              'success'
            );
          } else {
            addToast('Resposta inesperada do servidor ao enviar mídia.', 'error');
          }
        } catch (e) {
          addToast('Erro ao processar resposta do servidor.', 'error');
        }
      } else {
        let errMessage = isVideo ? 'Erro ao enviar vídeo.' : 'Erro ao enviar imagem.';
        try {
          const err = JSON.parse(xhr.responseText);
          errMessage = err.detail || errMessage;
        } catch {
          errMessage = `${errMessage} (Status ${xhr.status})`;
        }
        addToast(errMessage, 'error');
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setUploadProgress(0);
      addToast('Falha na comunicação de rede durante o upload.', 'error');
    };

    xhr.send(formData);
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reseta o input para permitir selecionar o mesmo arquivo se quiser
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const isEmbedVideo = (url) => {
    if (!url) return false;
    return (
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('vimeo.com')
    );
  };

  return (
    <div data-testid="upsell-media-uploader" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={onFileInputChange}
        data-testid="upsell-media-file-input"
        style={{ display: 'none' }}
        disabled={uploading}
      />

      {/* Caixa de Preview quando já há mídia enviada */}
      {mediaUrl && (
        <div
          data-testid="upsell-media-preview-box"
          style={{
            background: '#0d1527',
            border: '1.5px solid #334155',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={14} color="#38bdf8" />
              {isVideo ? 'Vídeo Selecionado' : 'Imagem Selecionada'}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                data-testid="upsell-media-change-btn"
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Upload size={12} />
                Trocar Arquivo
              </button>
              <button
                type="button"
                onClick={() => onMediaChange('')}
                disabled={uploading}
                data-testid="upsell-media-remove-btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={12} />
                Remover
              </button>
            </div>
          </div>

          {/* Renderização do Preview de Imagem ou Vídeo */}
          <div
            style={{
              width: '100%',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#020617',
              border: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxHeight: '220px'
            }}
          >
            {isVideo ? (
              isEmbedVideo(mediaUrl) ? (
                <iframe
                  src={mediaUrl}
                  title="Preview do Vídeo"
                  data-testid="upsell-video-preview-iframe"
                  style={{ width: '100%', height: '200px', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={mediaUrl}
                  controls
                  data-testid="upsell-video-preview-player"
                  style={{ width: '100%', maxHeight: '220px', objectFit: 'contain' }}
                />
              )
            ) : (
              <img
                src={mediaUrl}
                alt="Pré-visualização do Anúncio"
                data-testid="upsell-image-preview-img"
                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
              />
            )}
          </div>
        </div>
      )}

      {/* Caixa de Dropzone e Botão de Upload quando não há mídia ou durante envio */}
      {(!mediaUrl || uploading) && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          data-testid="upsell-dropzone-box"
          style={{
            border: `2px dashed ${isDragging ? '#38bdf8' : '#475569'}`,
            borderRadius: '12px',
            padding: '24px 16px',
            background: isDragging ? 'rgba(56, 189, 248, 0.08)' : '#141e33',
            textAlign: 'center',
            cursor: uploading ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={32} color="#38bdf8" style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                {isVideo ? `Enviando vídeo... ${uploadProgress}%` : 'Enviando imagem...'}
              </div>
              {isVideo && (
                <div style={{ width: '80%', height: '6px', background: '#334155', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #38bdf8, #2563eb)',
                      transition: 'width 0.2s ease'
                    }}
                  />
                </div>
              )}
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Aguarde a conclusão do envio...</span>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '2px'
                }}
              >
                {isVideo ? <Video size={22} color="#38bdf8" /> : <UploadCloud size={22} color="#38bdf8" />}
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                {isVideo ? 'Clique ou arraste o arquivo de Vídeo' : 'Clique ou arraste o arquivo de Imagem'}
              </div>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                {isVideo
                  ? `Formatos: MP4, WebM, MOV ou MKV (Máximo ${maxSizeLabel})`
                  : `Formatos: JPG, PNG ou WEBP (Máximo ${maxSizeLabel})`}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                data-testid="upsell-choose-file-btn"
                style={{
                  marginTop: '6px',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                }}
              >
                <Upload size={14} />
                Escolher do Computador
              </button>
            </>
          )}
        </div>
      )}

      {/* Opção Alternativa: Colar URL manualmente se o usuário preferir */}
      <div style={{ marginTop: '2px' }}>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          data-testid="upsell-toggle-manual-url-btn"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '11.5px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 0',
            textDecoration: 'underline'
          }}
        >
          <LinkIcon size={12} />
          {showManualUrl ? 'Ocultar campo de link manual' : 'Prefere colar uma URL externa manualmente?'}
        </button>

        {showManualUrl && (
          <div style={{ marginTop: '6px' }}>
            <input
              type="text"
              value={mediaUrl}
              onChange={(e) => onMediaChange(e.target.value)}
              placeholder={
                isVideo
                  ? 'https://exemplo.com/pitch.mp4 ou embed do YouTube/Vimeo'
                  : 'https://exemplo.com/banner.png'
              }
              data-testid="upsell-media-url-input"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: '#1e293b',
                border: '1.5px solid #475569',
                color: '#ffffff',
                fontSize: '12.5px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
