import React from 'react';
import { UploadCloud, Link as LinkIcon, Video, FileCheck, X } from 'lucide-react';

export default function IntroCreateMediaTab({
  mediaOption,
  setMediaOption,
  mediaFile,
  mediaUrl,
  mediaType,
  videoEmbedUrl,
  setVideoEmbedUrl,
  uploadingMedia,
  mediaUploadError,
  onFileUpload,
  onRemoveMedia,
}) {
  return (
    <div className="intro-tab-pane" data-testid="pane-media">
      <p className="intro-tab-desc">
        Adicione um vídeo de apresentação ou uma foto para aumentar drasticamente suas conexões!
      </p>

      <div className="media-options-selector">
        <button
          type="button"
          className={`media-opt-pill ${mediaOption === 'upload' ? 'active' : ''}`}
          onClick={() => setMediaOption('upload')}
          data-testid="media-opt-upload"
        >
          <UploadCloud size={15} />
          <span>Upload de Arquivo (Foto ou Vídeo)</span>
        </button>
        <button
          type="button"
          className={`media-opt-pill ${mediaOption === 'embed' ? 'active' : ''}`}
          onClick={() => setMediaOption('embed')}
          data-testid="media-opt-embed"
        >
          <LinkIcon size={15} />
          <span>Link de Vídeo (YouTube, Loom, Vimeo)</span>
        </button>
      </div>

      {mediaOption === 'upload' && (
        <div className="upload-media-box">
          {!mediaUrl ? (
            <label className="upload-dropzone">
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={onFileUpload}
                disabled={uploadingMedia}
                style={{ display: 'none' }}
                data-testid="intro-file-upload-input"
              />
              <UploadCloud size={32} className="dropzone-icon" />
              <span className="dropzone-title">
                {uploadingMedia ? 'Enviando mídia...' : 'Clique para selecionar foto ou vídeo'}
              </span>
              <span className="dropzone-subtitle">
                Formatos aceitos: JPG, PNG, WEBP, MP4, WebM (até 50 MB)
              </span>
            </label>
          ) : (
            <div className="uploaded-file-preview" data-testid="uploaded-file-preview">
              <div className="preview-left">
                <FileCheck size={24} className="check-icon" />
                <div>
                  <span className="file-name">{mediaFile?.name || 'Arquivo anexado'}</span>
                  <span className="file-type">Tipo: {mediaType === 'video' ? 'Vídeo' : 'Imagem'}</span>
                </div>
              </div>
              <button
                type="button"
                className="remove-file-btn"
                onClick={onRemoveMedia}
              >
                <X size={16} /> Remover
              </button>
            </div>
          )}

          {mediaUploadError && (
            <p className="intro-error-msg">{mediaUploadError}</p>
          )}
        </div>
      )}

      {mediaOption === 'embed' && (
        <div className="form-group">
          <label htmlFor="intro-embed-input">
            <Video size={14} /> Link do Vídeo (YouTube, Loom ou Vimeo)
          </label>
          <input
            id="intro-embed-input"
            type="url"
            value={videoEmbedUrl}
            onChange={(e) => setVideoEmbedUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... ou https://www.loom.com/share/..."
            data-testid="intro-embed-input"
          />
          <span className="form-hint">
            O player de vídeo será embutido diretamente no card da sua apresentação.
          </span>
        </div>
      )}
    </div>
  );
}
