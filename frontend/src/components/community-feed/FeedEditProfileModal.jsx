import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, Check, Globe } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { updateMyProfile, uploadProfileAvatar } from './communityFeedApi';

export default function FeedEditProfileModal({ isOpen, profile, onClose, onProfileUpdated }) {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [bioLink, setBioLink] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setBioLink(profile.bio_link || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('A foto deve ser uma imagem válida (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('A imagem não pode ultrapassar 10MB.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadProfileAvatar(file);
      if (res?.avatar_url) {
        setAvatarUrl(res.avatar_url);
        addToast('Foto de perfil enviada com sucesso! 📸', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao enviar foto de perfil.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('O nome não pode estar em branco.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateMyProfile({
        name: name.trim().slice(0, 30),
        bio: bio.trim().slice(0, 150),
        bio_link: bioLink.trim().slice(0, 255),
        avatar_url: avatarUrl || null,
      });
      addToast('Perfil atualizado com sucesso! ✨', 'success');
      if (onProfileUpdated) onProfileUpdated(updated);
      onClose();
    } catch (err) {
      addToast(err.message || 'Erro ao salvar perfil.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const initial = name ? name.charAt(0).toUpperCase() : 'M';

  return (
    <div
      className="feed-modal-backdrop"
      data-testid="feed-edit-profile-modal"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="feed-edit-profile-container"
        data-testid="feed-edit-profile-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="feed-profile-header">
          <h3 className="feed-profile-title">Editar Perfil</h3>
          <button
            type="button"
            className="feed-likes-modal-close-btn"
            onClick={onClose}
            title="Fechar"
            data-testid="feed-edit-profile-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="feed-edit-form">
          {/* Avatar com upload */}
          <div className="feed-edit-avatar-section">
            <div className="feed-profile-avatar-large">
              <div className="feed-profile-avatar-inner">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: 'none' }}
              data-testid="feed-avatar-file-input"
            />
            <button
              type="button"
              className="feed-edit-avatar-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              data-testid="feed-change-avatar-btn"
            >
              {isUploading ? 'Enviando...' : 'Alterar foto de perfil'}
            </button>
          </div>

          {/* Nome (máx 30) */}
          <div className="feed-edit-field">
            <div className="feed-edit-label-row">
              <label htmlFor="feed-edit-name" className="feed-edit-label">
                Nome de Exibição
              </label>
              <span className="feed-edit-counter">{name.length}/30</span>
            </div>
            <input
              id="feed-edit-name"
              type="text"
              className="feed-edit-input"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 30))}
              maxLength={30}
              placeholder="Seu nome ou apelido"
              data-testid="feed-edit-name-input"
            />
          </div>

          {/* Bio (máx 150) */}
          <div className="feed-edit-field">
            <div className="feed-edit-label-row">
              <label htmlFor="feed-edit-bio" className="feed-edit-label">
                Bio (Biografia)
              </label>
              <span className="feed-edit-counter">{bio.length}/150</span>
            </div>
            <textarea
              id="feed-edit-bio"
              className="feed-edit-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 150))}
              maxLength={150}
              rows={3}
              placeholder="Escreva um pouco sobre você, o que você estuda ou trabalha..."
              data-testid="feed-edit-bio-input"
            />
          </div>

          {/* Link na Bio (máx 255) */}
          <div className="feed-edit-field">
            <div className="feed-edit-label-row">
              <label htmlFor="feed-edit-link" className="feed-edit-label">
                Link na Bio (Site / Instagram / Portfólio)
              </label>
              <span className="feed-edit-counter">{bioLink.length}/255</span>
            </div>
            <input
              id="feed-edit-link"
              type="text"
              className="feed-edit-input"
              value={bioLink}
              onChange={(e) => setBioLink(e.target.value.slice(0, 255))}
              maxLength={255}
              placeholder="ex: instagram.com/seunome ou meulink.com"
              data-testid="feed-edit-link-input"
            />
          </div>

          <button
            type="submit"
            className="feed-edit-submit-btn"
            disabled={isSaving || isUploading}
            data-testid="feed-edit-submit-btn"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="feed-spin-icon" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
