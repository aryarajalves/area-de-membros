import React from 'react';
import { Upload, Link } from 'lucide-react';
import TutorialVideoPreview from './TutorialVideoPreview';

export default function TutorialVideoInputSection({
  videoType,
  setVideoType,
  isEditing,
  videoUrl,
  setVideoUrl,
  selectedFile,
  handleFileChange,
}) {
  return (
    <>
      {/* Escolha do tipo de vídeo: Upload vs URL */}
      <div className="form-group">
        <label>Origem do Vídeo</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => setVideoType('upload')}
            data-testid="tutorial-video-type-upload-btn"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: '8px',
              border: videoType === 'upload' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.12)',
              background: videoType === 'upload' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: videoType === 'upload' ? '#60a5fa' : '#94a3b8',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Upload size={16} />
            <span>Upload de Arquivo</span>
          </button>
          <button
            type="button"
            onClick={() => setVideoType('url')}
            data-testid="tutorial-video-type-url-btn"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: '8px',
              border: videoType === 'url' ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.12)',
              background: videoType === 'url' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: videoType === 'url' ? '#60a5fa' : '#94a3b8',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <Link size={16} />
            <span>Link Externo / URL</span>
          </button>
        </div>
      </div>

      {videoType === 'upload' ? (
        <div className="form-group">
          <label htmlFor="tutorial-file-input">
            {isEditing && videoUrl ? 'Substituir Arquivo de Vídeo (Opcional)' : 'Arquivo de Vídeo *'}
          </label>
          <input
            id="tutorial-file-input"
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
            onChange={handleFileChange}
            data-testid="tutorial-file-input"
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px dashed rgba(59, 130, 246, 0.5)',
              background: 'rgba(59, 130, 246, 0.05)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          />
          {selectedFile && (
            <small style={{ color: '#22c55e', display: 'block', marginTop: '4px' }}>
              ✓ Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
            </small>
          )}
          {isEditing && !selectedFile && videoUrl && (
            <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>
              Vídeo atual: {videoUrl.split('/').pop()}
            </small>
          )}
        </div>
      ) : (
        <div className="form-group">
          <label htmlFor="tutorial-video-url">URL do Vídeo *</label>
          <input
            id="tutorial-video-url"
            type="url"
            placeholder="Ex: https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
            value={videoUrl || ''}
            onChange={(e) => setVideoUrl(e.target.value)}
            data-testid="tutorial-video-url-input"
          />
        </div>
      )}

      {/* Renderização do Vídeo (Pré-visualização) */}
      <TutorialVideoPreview
        selectedFile={selectedFile}
        videoUrl={videoUrl}
        videoType={videoType}
      />
    </>
  );
}
