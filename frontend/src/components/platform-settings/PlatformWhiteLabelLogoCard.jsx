import React, { useState, useEffect } from 'react';
import { Upload, RotateCcw, Eye, Sparkles } from 'lucide-react';

export default function PlatformWhiteLabelLogoCard({
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
  addToast,
  initialLogoUrl = null,
  onLogoUpdated,
}) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [resettingLogo, setResettingLogo] = useState(false);

  useEffect(() => {
    setLogoUrl(initialLogoUrl);
  }, [initialLogoUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) return;
    setUploadingLogo(true);
    const token = localStorage.getItem('auth_token');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/v1/whitelabel/logo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setLogoUrl(data.logo_url);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (data.logo_url) {
          localStorage.setItem('platform_logo', data.logo_url);
        } else {
          localStorage.removeItem('platform_logo');
        }
        window.dispatchEvent(new CustomEvent('whitelabel_updated', { detail: data }));
        if (onLogoUpdated) onLogoUpdated(data.logo_url);
        addToast('Novo logotipo da plataforma salvo com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao enviar logotipo.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao enviar logotipo.', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleResetLogo = async () => {
    setResettingLogo(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/whitelabel/logo', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLogoUrl(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        localStorage.removeItem('platform_logo');
        window.dispatchEvent(new CustomEvent('whitelabel_updated', { detail: data }));
        if (onLogoUpdated) onLogoUpdated(null);
        addToast('Logotipo restaurado para o padrão do sistema!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao restaurar logotipo padrão.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao restaurar logotipo padrão.', 'error');
    } finally {
      setResettingLogo(false);
    }
  };

  const activeDisplayLogo = previewUrl || logoUrl;

  return (
    <div
      className="settings-section-card"
      data-testid="platform-whitelabel-logo-card"
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: '16px',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ padding: '8px', background: 'rgba(234, 56, 76, 0.12)', borderRadius: '10px', color: '#ea384c' }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: textColor }}>
            Logotipo da Plataforma (Barra Lateral / Topo)
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: subTextColor }}>
            Substitua a logo padrão vermelha do topo da barra lateral esquerda pela marca da sua empresa.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)', gap: '24px', alignItems: 'center' }}>
        {/* Pré-visualização da Logo */}
        <div
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: subTextColor }}>
            <Eye size={14} />
            <span>
              {previewUrl
                ? 'Pré-visualização (Novo Arquivo)'
                : logoUrl
                ? 'Logotipo Personalizado Ativo'
                : 'Logotipo Padrão do Sistema'}
            </span>
          </div>

          <div
            style={{
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: '1px dashed rgba(255, 255, 255, 0.08)',
              padding: '8px',
            }}
          >
            {activeDisplayLogo ? (
              <img
                src={activeDisplayLogo}
                alt="Logotipo da Plataforma"
                data-testid="platform-logo-preview-img"
                style={{
                  maxHeight: '56px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div
                data-testid="platform-logo-default-preview"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#ea384c',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(234, 56, 76, 0.35)',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span style={{ fontSize: '13px', color: textColor, fontWeight: 600 }}>Ícone Padrão</span>
              </div>
            )}
          </div>
        </div>

        {/* Controles de Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              htmlFor="platform-logo-file-input"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 18px',
                borderRadius: '10px',
                background: 'rgba(234, 56, 76, 0.12)',
                border: '1px dashed #ea384c',
                color: '#f87171',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              data-testid="select-logo-file-label"
            >
              <Upload size={16} />
              <span>Escolher Novo Logotipo do Computador</span>
            </label>
            <input
              id="platform-logo-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileChange}
              data-testid="platform-logo-file-input"
              style={{ display: 'none' }}
            />
            <small style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: subTextColor }}>
              Formatos recomendados: PNG transparente, SVG ou WEBP (quadrado ou ícone com boa legibilidade).
            </small>
          </div>

          {selectedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 500 }}>
                ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </span>
              <button
                type="button"
                onClick={handleUploadLogo}
                className="primary-btn"
                disabled={uploadingLogo}
                data-testid="confirm-upload-logo-btn"
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
              >
                {uploadingLogo ? 'Enviando...' : 'Confirmar e Salvar Logotipo'}
              </button>
            </div>
          )}

          {logoUrl && !selectedFile && (
            <div>
              <button
                type="button"
                onClick={handleResetLogo}
                className="cancel-btn"
                disabled={resettingLogo}
                data-testid="reset-platform-logo-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', fontSize: '13px' }}
              >
                <RotateCcw size={14} />
                <span>{resettingLogo ? 'Restaurando...' : 'Restaurar Logotipo Padrão'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
