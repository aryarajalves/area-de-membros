import React, { useState, useEffect } from 'react';
import { Smartphone, Upload, RotateCcw, Check } from 'lucide-react';
import { syncPwaWhiteLabelMeta } from '../../utils/pwaDeviceUtils';

export default function PlatformWhiteLabelPwaCard({
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
  addToast,
  platformName = 'Área de Membros',
  logoUrl = null,
  initialPwaAppName = '',
  initialPwaIconUrl = null,
  onPwaUpdated,
}) {
  const [pwaAppName, setPwaAppName] = useState(initialPwaAppName || '');
  const [pwaIconUrl, setPwaIconUrl] = useState(initialPwaIconUrl || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [savingName, setSavingName] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [resettingIcon, setResettingIcon] = useState(false);

  useEffect(() => {
    setPwaAppName(initialPwaAppName || '');
  }, [initialPwaAppName]);

  useEffect(() => {
    setPwaIconUrl(initialPwaIconUrl || null);
  }, [initialPwaIconUrl]);

  const effectiveDisplayName = (pwaAppName || '').trim() || platformName || 'Área de Membros';
  const effectivePreviewIcon = previewUrl || pwaIconUrl || logoUrl || '/icon-192x192.png';

  const emitWhitelabelUpdate = (data) => {
    syncPwaWhiteLabelMeta({
      platformName: data?.platform_name || platformName,
      pwaAppName: data?.pwa_app_name,
      logoUrl: data?.logo_url !== undefined ? data.logo_url : logoUrl,
      pwaIconUrl: data?.pwa_icon_url,
      bgColor: data?.bg_color,
    });
    window.dispatchEvent(new CustomEvent('whitelabel_updated', { detail: data }));
    if (onPwaUpdated) onPwaUpdated(data);
  };

  const handleSavePwaName = async (e) => {
    if (e) e.preventDefault();
    setSavingName(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/whitelabel', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pwa_app_name: pwaAppName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setPwaAppName(data.pwa_app_name || '');
        emitWhitelabelUpdate(data);
        addToast('Nome do App (PWA) atualizado com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao salvar nome do App PWA.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao salvar nome do App PWA.', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadPwaIcon = async () => {
    if (!selectedFile) return;
    setUploadingIcon(true);
    const token = localStorage.getItem('auth_token');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/v1/whitelabel/pwa-icon', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPwaIconUrl(data.pwa_icon_url || null);
        setSelectedFile(null);
        setPreviewUrl(null);
        emitWhitelabelUpdate(data);
        addToast('Ícone do App (PWA) atualizado com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao enviar ícone do App PWA.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao enviar ícone do App PWA.', 'error');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleResetPwaIcon = async () => {
    setResettingIcon(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/whitelabel/pwa-icon', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPwaIconUrl(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        emitWhitelabelUpdate(data);
        addToast('Ícone do App (PWA) restaurado para o padrão!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao restaurar ícone padrão.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao restaurar ícone padrão.', 'error');
    } finally {
      setResettingIcon(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '16px',
        padding: '24px',
        backdropFilter: 'blur(12px)',
      }}
      data-testid="whitelabel-pwa-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            flexShrink: 0,
          }}
        >
          <Smartphone size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: textColor }}>
            Aplicativo Instalável (PWA - Celular)
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: subTextColor }}>
            Personalize o nome e o ícone que aparecem na tela inicial do celular quando o aluno instala o app.
          </p>
        </div>
      </div>

      {/* Nome do App PWA */}
      <form
        onSubmit={handleSavePwaName}
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '22px',
        }}
      >
        <input
          type="text"
          value={pwaAppName}
          onChange={(e) => setPwaAppName(e.target.value)}
          placeholder={`Ex: Meu App (padrão: ${platformName || 'Área de Membros'})`}
          maxLength={50}
          data-testid="whitelabel-pwa-name-input"
          style={{
            flex: '1 1 240px',
            minWidth: 0,
            padding: '12px 16px',
            borderRadius: '10px',
            border: `1px solid ${cardBorder}`,
            backgroundColor: 'rgba(0,0,0,0.2)',
            color: textColor,
            fontSize: '0.95rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={savingName}
          data-testid="save-pwa-name-btn"
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: savingName ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            opacity: savingName ? 0.7 : 1,
          }}
        >
          <Check size={16} />
          {savingName ? 'Salvando...' : 'Salvar Nome do App'}
        </button>
      </form>

      {/* Ícone do App PWA + Pré-visualização estilo tela inicial */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 20px',
            borderRadius: '14px',
            border: `1px solid ${cardBorder}`,
            backgroundColor: 'rgba(0,0,0,0.25)',
            minWidth: '140px',
          }}
          data-testid="whitelabel-pwa-preview"
        >
          <span style={{ fontSize: '0.72rem', color: subTextColor, fontWeight: 600 }}>
            Prévia na Tela Inicial
          </span>
          <img
            src={effectivePreviewIcon}
            alt="Prévia do ícone do app PWA"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              objectFit: 'cover',
              border: '1px solid rgba(255,255,255,0.12)',
              backgroundColor: '#0f172a',
            }}
          />
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: textColor,
              maxWidth: '110px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {effectiveDisplayName}
          </span>
        </div>

        <div style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <label
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px dashed rgba(16, 185, 129, 0.5)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#34d399',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.88rem',
              }}
            >
              <Upload size={16} />
              Escolher Ícone do App
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                data-testid="whitelabel-pwa-icon-input"
                style={{ display: 'none' }}
              />
            </label>

            {selectedFile && (
              <button
                type="button"
                onClick={handleUploadPwaIcon}
                disabled={uploadingIcon}
                data-testid="upload-pwa-icon-btn"
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: uploadingIcon ? 'wait' : 'pointer',
                  opacity: uploadingIcon ? 0.7 : 1,
                }}
              >
                {uploadingIcon ? 'Enviando...' : 'Salvar Ícone PWA'}
              </button>
            )}

            {pwaIconUrl && !selectedFile && (
              <button
                type="button"
                onClick={handleResetPwaIcon}
                disabled={resettingIcon}
                data-testid="reset-pwa-icon-btn"
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${cardBorder}`,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: textColor,
                  fontWeight: 500,
                  fontSize: '0.88rem',
                  cursor: resettingIcon ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: resettingIcon ? 0.7 : 1,
                }}
              >
                <RotateCcw size={15} />
                {resettingIcon ? 'Restaurando...' : 'Restaurar Padrão'}
              </button>
            )}
          </div>

          <p style={{ margin: 0, fontSize: '0.8rem', color: subTextColor, lineHeight: 1.45 }}>
            Recomendado: imagem quadrada (<strong>512x512 px</strong>) em PNG, JPG, WEBP ou SVG. Se não definir um ícone específico, o app usará o logotipo da plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}
