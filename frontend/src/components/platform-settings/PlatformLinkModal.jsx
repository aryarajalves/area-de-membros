import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, Loader2 } from 'lucide-react';
import { LINK_ICON_OPTIONS, getLinkIcon, getLinkColor } from './linkIcons';

export default function PlatformLinkModal({
  isOpen,
  initialData = null,
  onClose,
  onSave,
  loading = false,
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('instagram');
  const [orderIndex, setOrderIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setUrl(initialData.url || '');
      setIcon(initialData.icon || 'instagram');
      setOrderIndex(initialData.order_index ?? 0);
      setIsActive(initialData.is_active ?? true);
      setError('');
    } else {
      setTitle('');
      setUrl('');
      setIcon('instagram');
      setOrderIndex(0);
      setIsActive(true);
      setError('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe o título do link.');
      return;
    }
    if (!url.trim()) {
      setError('Por favor, informe a URL de destino.');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('A URL deve começar com https:// ou http://');
      return;
    }

    onSave({
      title: title.trim(),
      url: url.trim(),
      icon,
      order_index: Number(orderIndex) || 0,
      is_active: isActive,
    });
  };

  const SelectedIconComponent = getLinkIcon(icon);
  const selectedIconColor = getLinkColor(icon);

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      data-testid="platform-link-modal-backdrop"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.1)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '26px',
        }}
        data-testid="platform-link-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: `${selectedIconColor}1a`,
              color: selectedIconColor,
              border: `1px solid ${selectedIconColor}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SelectedIconComponent size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: '0 0 3px 0' }}>
              {initialData ? 'Editar Link da Plataforma' : 'Criar Novo Link na Barra Lateral'}
            </h2>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
              Adicione links rápidos para redes sociais e páginas externas na barra lateral.
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 500,
            }}
            data-testid="platform-link-modal-error"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Título do Link */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
              }}
            >
              Título do Link *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Instagram Oficial, Canal do YouTube, Grupo VIP"
              maxLength={100}
              required
              data-testid="link-title-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(2, 6, 23, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* URL de Destino */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                URL de Destino *
              </label>
              {url && (url.startsWith('http://') || url.startsWith('https://')) && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  <ExternalLink size={12} /> Testar Link
                </a>
              )}
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://instagram.com/seu_perfil"
              maxLength={500}
              required
              data-testid="link-url-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'rgba(2, 6, 23, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Seletor de Ícone */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#cbd5e1',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              Selecione o Ícone da Rede / Serviço
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
                gap: '8px',
                maxHeight: '180px',
                overflowY: 'auto',
                padding: '4px',
              }}
            >
              {LINK_ICON_OPTIONS.map((opt) => {
                const IconItem = opt.icon;
                const isSelected = icon === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIcon(opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: isSelected ? '1.5px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.22)' : 'rgba(2, 6, 23, 0.6)',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      transition: 'all 0.15s ease',
                    }}
                    data-testid={`icon-option-${opt.id}`}
                  >
                    <span style={{ color: opt.color, display: 'flex', alignItems: 'center' }}>
                      <IconItem size={17} />
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ordem de Exibição e Visibilidade */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingTop: '4px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Ordem na Barra
              </label>
              <input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
                min={0}
                max={999}
                data-testid="link-order-input"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Menor número aparece primeiro.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                Visibilidade
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  data-testid="link-active-checkbox"
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0284c7' }}
                />
                <span style={{ fontSize: '13px', color: isActive ? '#38bdf8' : '#94a3b8', fontWeight: 600 }}>
                  {isActive ? 'Ativo na Barra Lateral' : 'Oculto na Barra'}
                </span>
              </label>
            </div>
          </div>

          {/* Rodapé do Modal */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '12px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 18px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="cancel-link-modal-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 20px',
                backgroundColor: '#0284c7',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              }}
              data-testid="save-link-btn"
            >
              {loading ? <Loader2 size={16} className="spin-animation" /> : <Check size={16} />}
              {loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
