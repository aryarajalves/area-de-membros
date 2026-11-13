import React from 'react';
import { Upload, Link2 } from 'lucide-react';
import LessonVideoPreviewPlayer from './LessonVideoPreviewPlayer';

/**
 * Seção de Upload (Backblaze B2) vs Link Externo (YouTube/Vimeo/Embed) da Parte da Aula.
 */
export default function LessonVideoUploadSection({
  activeVideo,
  handleUpdateActiveVideo,
  handleFileChange,
  handleRequestRemoveVideo,
  uploading,
  currentUpload,
  textColor,
  subTextColor,
  isLightBg
}) {
  return (
    <div>
      {/* Seletor de Tipo de Vídeo (Upload B2 vs Link Externo) */}
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

          {currentUpload && (
            <div
              data-testid="inline-upload-progress"
              style={{
                marginTop: '10px',
                padding: '10px 14px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
                  🚀 Enviando em segundo plano: {currentUpload.progress}%
                </span>
                <span style={{ fontSize: '11px', color: subTextColor }}>
                  Você já pode salvar esta aula sem esperar!
                </span>
              </div>
              <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${currentUpload.progress}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.2s ease-out' }} />
              </div>
            </div>
          )}

          {activeVideo.video_url && (
            <LessonVideoPreviewPlayer
              videoUrl={activeVideo.video_url}
              videoType={activeVideo.video_type}
              onRemove={handleRequestRemoveVideo}
              isLightBg={isLightBg}
            />
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
          {activeVideo.video_url && (
            <LessonVideoPreviewPlayer
              videoUrl={activeVideo.video_url}
              videoType="url"
              onRemove={handleRequestRemoveVideo}
              isLightBg={isLightBg}
            />
          )}
        </div>
      )}
    </div>
  );
}
