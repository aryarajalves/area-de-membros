import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function EventThumbnailUploader({
  thumbnailUrl,
  onChangeThumbnail,
  addToast,
}) {
  const fileInputRef = useRef(null);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      addToast?.('Formato de imagem inválido. Use JPG, PNG ou WEBP.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast?.('A imagem não pode ultrapassar 5 MB.', 'error');
      return;
    }

    setIsUploadingThumb(true);
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/courses/upload-thumbnail', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Falha no upload da capa');
      }

      const data = await res.json();
      onChangeThumbnail(data.thumbnail_url || data.url);
      addToast?.('Capa do evento carregada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro no upload de thumbnail:', err);
      addToast?.('Erro ao enviar imagem de capa.', 'error');
    } finally {
      setIsUploadingThumb(false);
    }
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
        Imagem de Capa / Thumbnail (Opcional)
      </label>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleThumbnailUpload}
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
        />
        <button
          type="button"
          data-testid="upload-event-thumb-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingThumb}
          style={{
            padding: '9px 16px',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            fontSize: '0.86rem',
            fontWeight: '600',
            cursor: isUploadingThumb ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Upload size={16} />
          {isUploadingThumb ? 'Enviando Capa...' : 'Fazer Upload da Capa'}
        </button>

        <input
          type="text"
          value={thumbnailUrl}
          onChange={(e) => onChangeThumbnail(e.target.value)}
          placeholder="Ou cole a URL da imagem..."
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: '8px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontSize: '0.86rem',
          }}
        />
      </div>
      {thumbnailUrl && (
        <div style={{ marginTop: '10px', position: 'relative', width: '120px', height: '68px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
          <img src={thumbnailUrl} alt="Preview da Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button
            type="button"
            onClick={() => onChangeThumbnail('')}
            style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', padding: '2px' }}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
