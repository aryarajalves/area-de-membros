import React, { useState, useEffect } from 'react';
import { Tag, Image, Upload, RotateCcw, Check, Sparkles, HelpCircle, Eye } from 'lucide-react';
import defaultLoginBanner from '../../assets/login-banner.jpg';

export default function PlatformWhiteLabelTab({
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
  addToast,
  onPlatformNameChange,
}) {
  const [platformName, setPlatformName] = useState('Área de Membros');
  const [loginBannerUrl, setLoginBannerUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [resettingBanner, setResettingBanner] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/whitelabel');
        if (res.ok && isMounted) {
          const data = await res.json();
          setPlatformName(data.platform_name || 'Área de Membros');
          setLoginBannerUrl(data.login_banner_url || null);
        }
      } catch (err) {
        console.error('Erro ao carregar configurações WhiteLabel:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveName = async (e) => {
    if (e) e.preventDefault();
    const cleanName = platformName.trim() || 'Área de Membros';
    setSavingName(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/whitelabel', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform_name: cleanName }),
      });

      if (res.ok) {
        const data = await res.json();
        setPlatformName(data.platform_name);
        localStorage.setItem('platform_name', data.platform_name);
        window.dispatchEvent(new CustomEvent('whitelabel_updated', { detail: data }));
        if (onPlatformNameChange) onPlatformNameChange(data.platform_name);
        addToast('Nome da plataforma atualizado com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao salvar nome da plataforma.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao salvar nome.', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadBanner = async () => {
    if (!selectedFile) return;
    setUploadingBanner(true);
    const token = localStorage.getItem('auth_token');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/v1/whitelabel/login-banner', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLoginBannerUrl(data.login_banner_url);
        setSelectedFile(null);
        setPreviewUrl(null);
        window.dispatchEvent(new CustomEvent('whitelabel_updated', { detail: data }));
        addToast('Nova imagem da tela de login enviada com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao enviar imagem de login.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao enviar imagem.', 'error');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleResetBanner = async () => {
    setResettingBanner(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/whitelabel/login-banner', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLoginBannerUrl(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        window.dispatchEvent(new CustomEvent('whitelabel_updated', { detail: data }));
        addToast('Imagem da tela de login restaurada para o padrão!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao restaurar imagem padrão.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao restaurar imagem.', 'error');
    } finally {
      setResettingBanner(false);
    }
  };

  const currentBannerSource = previewUrl || loginBannerUrl || defaultLoginBanner;

  return (
    <div className="platform-whitelabel-tab" data-testid="platform-whitelabel-tab" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Nome da Plataforma */}
      <div
        className="settings-section-card"
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.12)', borderRadius: '10px', color: '#3b82f6' }}>
            <Tag size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: textColor }}>
              Nome da Plataforma (Marca / WhiteLabel)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: subTextColor }}>
              Personalize o nome exibido no topo da barra lateral, cabeçalho e na tela de login.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '540px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="platform-name-input" style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Nome Exibido na Plataforma
            </label>
            <input
              id="platform-name-input"
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="Ex: Área de Membros, Academia VIP, etc."
              maxLength={100}
              data-testid="platform-name-input"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: textColor,
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="submit"
              className="primary-btn"
              disabled={savingName || loading}
              data-testid="save-platform-name-btn"
              style={{ padding: '10px 18px', borderRadius: '10px', fontWeight: 600, fontSize: '13.5px' }}
            >
              {savingName ? 'Salvando...' : 'Salvar Nome da Plataforma'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlatformName('Área de Membros');
              }}
              className="cancel-btn"
              title="Restaurar nome padrão"
              style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}
            >
              Restaurar Padrão
            </button>
          </div>
        </form>
      </div>

      {/* 2. Imagem da Tela de Login */}
      <div
        className="settings-section-card"
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '8px', background: 'rgba(168, 85, 247, 0.12)', borderRadius: '10px', color: '#a855f7' }}>
            <Image size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: textColor }}>
              Imagem de Banner da Tela de Login
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: subTextColor }}>
              Faça upload de uma nova imagem personalizada para ilustrar a lateral da tela de login.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 360px) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
          {/* Pré-visualização da Imagem */}
          <div
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#000',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: subTextColor, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Eye size={14} />
              <span>{previewUrl ? 'Pré-visualização (Novo Arquivo)' : loginBannerUrl ? 'Imagem Personalizada Ativa' : 'Imagem Padrão do Sistema'}</span>
            </div>
            <img
              src={currentBannerSource}
              alt="Pré-visualização do Banner de Login"
              data-testid="login-banner-preview-img"
              style={{
                width: '100%',
                height: '220px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>

          {/* Controles de Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                htmlFor="login-banner-file-input"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 18px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.14)',
                  border: '1px dashed #3b82f6',
                  color: '#60a5fa',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                data-testid="select-banner-file-label"
              >
                <Upload size={16} />
                <span>Escolher Nova Imagem do Computador</span>
              </label>
              <input
                id="login-banner-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                data-testid="login-banner-file-input"
                style={{ display: 'none' }}
              />
              <small style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: subTextColor }}>
                Formatos recomendados: JPG, PNG ou WEBP em alta resolução (widescreen).
              </small>
            </div>

            {selectedFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 500 }}>
                  ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
                <button
                  type="button"
                  onClick={handleUploadBanner}
                  className="primary-btn"
                  disabled={uploadingBanner}
                  data-testid="confirm-upload-banner-btn"
                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
                >
                  {uploadingBanner ? 'Enviando...' : 'Confirmar e Salvar Imagem'}
                </button>
              </div>
            )}

            {loginBannerUrl && !selectedFile && (
              <div>
                <button
                  type="button"
                  onClick={handleResetBanner}
                  className="cancel-btn"
                  disabled={resettingBanner}
                  data-testid="reset-login-banner-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', fontSize: '13px' }}
                >
                  <RotateCcw size={14} />
                  <span>{resettingBanner ? 'Restaurando...' : 'Restaurar Imagem Padrão'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
