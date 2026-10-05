import React, { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ProfileAvatarSection({
  avatarUrl,
  setAvatarUrl,
  userInitial,
  onUserUpdated,
  cardBorder,
  textColor,
  subTextColor,
}) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      addToast('Formato inválido. Selecione uma imagem JPG, PNG ou WEBP.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('A imagem selecionada excede o limite máximo de 5 MB.', 'error');
      return;
    }

    setUploadingAvatar(true);
    const token = localStorage.getItem('auth_token');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/auth/upload-avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatar_url);
        if (data.user && onUserUpdated) {
          onUserUpdated(data.user);
        }
        addToast('Foto de perfil enviada e atualizada com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao enviar foto.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao enviar foto de perfil.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setRemovingAvatar(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_url: '' }),
      });

      if (res.ok) {
        const updated = await res.json();
        setAvatarUrl('');
        if (onUserUpdated) {
          onUserUpdated(updated);
        }
        addToast('Foto de perfil removida com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao remover foto.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao remover foto.', 'error');
    } finally {
      setRemovingAvatar(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        paddingBottom: '24px',
        marginBottom: '24px',
        borderBottom: cardBorder,
      }}
      data-testid="profile-avatar-section"
    >
      {/* Avatar Preview */}
      <div
        style={{
          position: 'relative',
          width: '84px',
          height: '84px',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#1e293b',
          border: '2px solid rgba(59, 130, 246, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        }}
        data-testid="profile-avatar-preview"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Foto do perfil"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            data-testid="profile-avatar-img"
          />
        ) : (
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            data-testid="profile-avatar-fallback"
          >
            {userInitial}
          </div>
        )}
      </div>

      {/* Botões de Ação da Foto */}
      <div>
        <h4 style={{ fontSize: '14.5px', fontWeight: 600, margin: '0 0 6px 0', color: textColor }}>
          Foto do Usuário / Logo
        </h4>
        <p style={{ fontSize: '12.5px', color: subTextColor, margin: '0 0 12px 0' }}>
          Formatos aceitos: JPG, PNG ou WEBP (máx. 5 MB).
        </p>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarFileChange}
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            data-testid="profile-avatar-file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
              opacity: uploadingAvatar ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
            }}
            data-testid="btn-upload-avatar"
          >
            <Camera size={14} />
            <span>{uploadingAvatar ? 'Enviando...' : avatarUrl ? 'Trocar Foto' : 'Enviar Foto'}</span>
          </button>

          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={uploadingAvatar || removingAvatar}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="btn-remove-avatar"
            >
              <Trash2 size={13} />
              <span>{removingAvatar ? 'Removendo...' : 'Remover'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
