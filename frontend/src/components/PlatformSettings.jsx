import React, { useState, useEffect } from 'react';
import { Settings, Palette, KeyRound, User, Link2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import PlatformAppearanceTab from './platform-settings/PlatformAppearanceTab';
import PlatformApiTokensTab from './platform-settings/PlatformApiTokensTab';
import PlatformProfileTab from './platform-settings/PlatformProfileTab';
import PlatformLinksTab from './platform-settings/PlatformLinksTab';

export default function PlatformSettings({
  bgColor = '#090d16',
  onThemeColorChange,
  currentUser,
  onUserUpdated
}) {
  const [activeTab, setActiveTab] = useState('appearance'); // 'appearance' | 'profile' | 'api_tokens' | 'links'
  const [selectedColor, setSelectedColor] = useState(bgColor || '#090d16');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (bgColor) {
      setSelectedColor(bgColor);
    }
  }, [bgColor]);

  useEffect(() => {
    if (currentUser?.role === 'aluno' && (activeTab === 'api_tokens' || activeTab === 'links')) {
      setActiveTab('appearance');
    }
  }, [currentUser?.role, activeTab]);


  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((selectedColor || '').toLowerCase());
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';

  const handleSaveAppearance = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanColor = (selectedColor || '#090d16').trim();
    setSaving(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/courses/platform-theme', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bg_color: cleanColor }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedColor = data.bg_color || cleanColor;
        if (onThemeColorChange) {
          onThemeColorChange(updatedColor);
        }
        addToast('Cor de fundo da Área de Membros atualizada com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao salvar configurações.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao salvar configurações da plataforma.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`backup-page-container ${!isLightBg ? 'classroom-dark-theme' : ''}`}
      data-testid="platform-settings-page"
      style={{
        backgroundColor: selectedColor,
        color: textColor,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: '28px 32px',
        boxSizing: 'border-box',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Cabeçalho */}
      <div className="backup-page-header courses-header-box" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div className="logo-icon" style={{ backgroundColor: '#2563eb' }}>
              <Settings size={18} />
            </div>
            <h1 style={{ color: textColor, margin: 0 }}>Configurações da Área de Membros</h1>
          </div>
          <p style={{ color: subTextColor, margin: 0 }}>
            Personalize a aparência visual e gerencie chaves de API para integrações externas.
          </p>
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '26px',
          borderBottom: cardBorder,
          paddingBottom: '12px',
        }}
        data-testid="platform-settings-tabs"
      >
        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'appearance' ? 700 : 500,
            cursor: 'pointer',
            backgroundColor: activeTab === 'appearance' ? '#0284c7' : 'transparent',
            color: activeTab === 'appearance' ? '#ffffff' : subTextColor,
            border: activeTab === 'appearance' ? 'none' : '1px solid transparent',
            boxShadow: activeTab === 'appearance' ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.2s ease',
          }}
          data-testid="tab-appearance-btn"
        >
          <Palette size={16} />
          <span>Cor de Fundo da Plataforma</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'profile' ? 700 : 500,
            cursor: 'pointer',
            backgroundColor: activeTab === 'profile' ? '#0284c7' : 'transparent',
            color: activeTab === 'profile' ? '#ffffff' : subTextColor,
            border: activeTab === 'profile' ? 'none' : '1px solid transparent',
            boxShadow: activeTab === 'profile' ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
            transition: 'all 0.2s ease',
          }}
          data-testid="tab-profile-btn"
        >
          <User size={16} />
          <span>Meu Perfil</span>
        </button>

        {currentUser?.role !== 'aluno' && (
          <button
            type="button"
            onClick={() => setActiveTab('api_tokens')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: activeTab === 'api_tokens' ? 700 : 500,
              cursor: 'pointer',
              backgroundColor: activeTab === 'api_tokens' ? '#0284c7' : 'transparent',
              color: activeTab === 'api_tokens' ? '#ffffff' : subTextColor,
              border: activeTab === 'api_tokens' ? 'none' : '1px solid transparent',
              boxShadow: activeTab === 'api_tokens' ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
            data-testid="tab-api-tokens-btn"
          >
            <KeyRound size={16} />
            <span>Tokens de API</span>
          </button>
        )}

        {currentUser?.role !== 'aluno' && (
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: activeTab === 'links' ? 700 : 500,
              cursor: 'pointer',
              backgroundColor: activeTab === 'links' ? '#0284c7' : 'transparent',
              color: activeTab === 'links' ? '#ffffff' : subTextColor,
              border: activeTab === 'links' ? 'none' : '1px solid transparent',
              boxShadow: activeTab === 'links' ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
            data-testid="tab-platform-links-btn"
          >
            <Link2 size={16} />
            <span>Links da Plataforma</span>
          </button>
        )}
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'appearance' && (
        <PlatformAppearanceTab
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          saving={saving}
          onSave={handleSaveAppearance}
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          subTextColor={subTextColor}
          isLightBg={isLightBg}
        />
      )}

      {activeTab === 'profile' && (
        <PlatformProfileTab
          currentUser={currentUser || (() => { try { return JSON.parse(localStorage.getItem('auth_user')); } catch { return null; } })()}
          onUserUpdated={onUserUpdated}
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          subTextColor={subTextColor}
          isLightBg={isLightBg}
        />
      )}

      {activeTab === 'api_tokens' && currentUser?.role !== 'aluno' && (
        <PlatformApiTokensTab
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          subTextColor={subTextColor}
          isLightBg={isLightBg}
        />
      )}

      {activeTab === 'links' && currentUser?.role !== 'aluno' && (
        <PlatformLinksTab
          cardBg={cardBg}
          cardBorder={cardBorder}
          textColor={textColor}
          subTextColor={subTextColor}
          isLightBg={isLightBg}
        />
      )}
    </div>
  );
}
