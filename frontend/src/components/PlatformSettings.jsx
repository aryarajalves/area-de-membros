import React, { useState, useEffect } from 'react';
import { Settings, Palette, Check, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const BG_COLOR_PRESETS = [
  { label: 'Netflix Dark', color: '#090d16' },
  { label: 'Preto OLED', color: '#000000' },
  { label: 'Grafite Escuro', color: '#121620' },
  { label: 'Azul Meia-Noite', color: '#0b1120' },
  { label: 'Claro Clássico', color: '#f8fafc' }
];

export default function PlatformSettings({ bgColor = '#090d16', onThemeColorChange }) {
  const [selectedColor, setSelectedColor] = useState(bgColor || '#090d16');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (bgColor) {
      setSelectedColor(bgColor);
    }
  }, [bgColor]);

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((selectedColor || '').toLowerCase());
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const cleanColor = (selectedColor || '#090d16').trim();
    setSaving(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/courses/platform-theme', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bg_color: cleanColor })
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
        transition: 'background-color 0.3s ease'
      }}
    >
      {/* Cabeçalho */}
      <div className="backup-page-header courses-header-box">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div className="logo-icon" style={{ backgroundColor: '#2563eb' }}>
              <Settings size={18} />
            </div>
            <h1 style={{ color: textColor, margin: 0 }}>Configurações da Área de Membros</h1>
          </div>
          <p style={{ color: subTextColor, margin: 0 }}>
            Personalize a aparência e a cor de fundo global de toda a plataforma (Cursos, Relatos de Aulas e Segurança).
          </p>
        </div>
      </div>

      {/* Card de Configuração de Cor Global */}
      <div
        className="table-card"
        style={{
          backgroundColor: cardBg,
          border: cardBorder,
          padding: '28px',
          maxWidth: '760px'
        }}
      >
        <form onSubmit={handleSaveSettings}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Palette size={20} style={{ color: '#38bdf8' }} />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: textColor }}>
              Cor de Fundo da Área de Membros (Estilo Netflix)
            </h3>
          </div>
          <p style={{ fontSize: '13.5px', color: subTextColor, margin: '0 0 22px 0', lineHeight: 1.5 }}>
            Esta cor é aplicada globalmente em toda a Área de Membros (barra lateral, vitrine de cursos, relatos de aulas, abas de segurança, sala de aula e popups), garantindo uma identidade visual única em todo o sistema.
          </p>

          {/* Seletor de Cor + Input Hexadecimal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <input
              type="color"
              value={selectedColor || '#090d16'}
              onChange={(e) => setSelectedColor(e.target.value)}
              style={{
                width: '48px',
                height: '42px',
                padding: '3px',
                border: cardBorder,
                borderRadius: '8px',
                backgroundColor: isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                cursor: 'pointer'
              }}
              data-testid="platform-bgcolor-picker"
            />
            <input
              type="text"
              value={selectedColor || '#090d16'}
              onChange={(e) => setSelectedColor(e.target.value)}
              placeholder="#090d16"
              className="form-control-modern"
              style={{
                width: '135px',
                padding: '10px 14px',
                fontSize: '14px',
                fontFamily: 'monospace',
                fontWeight: 600,
                backgroundColor: isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.75)',
                color: textColor,
                border: cardBorder
              }}
              data-testid="platform-bgcolor-input"
            />
          </div>

          {/* Presets Rápidos */}
          <div style={{ marginBottom: '26px' }}>
            <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: subTextColor, marginBottom: '10px' }}>
              Temas Recomendados:
            </span>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {BG_COLOR_PRESETS.map((preset) => {
                const isSelected = (selectedColor || '').toLowerCase() === preset.color.toLowerCase();
                return (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setSelectedColor(preset.color)}
                    data-testid={`preset-bgcolor-${preset.color}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #38bdf8' : cardBorder,
                      backgroundColor: isSelected
                        ? (isLightBg ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)')
                        : (isLightBg ? '#f8fafc' : 'rgba(15, 23, 42, 0.65)'),
                      color: textColor,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: preset.color,
                        border: '1px solid rgba(148, 163, 184, 0.6)'
                      }}
                    />
                    <span>{preset.label}</span>
                    {isSelected && <Check size={14} style={{ color: '#38bdf8' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pré-visualização ao Vivo */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '10px',
              backgroundColor: selectedColor,
              border: '1px solid rgba(56, 189, 248, 0.3)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} style={{ color: '#f59e0b' }} />
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: textColor }}>
                  Pré-visualização do Tema Ativo ({selectedColor})
                </div>
                <div style={{ fontSize: '12px', color: subTextColor }}>
                  Todos os cursos, módulos, aulas e popups seguirão exatamente esta paleta.
                </div>
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="primary-btn"
              disabled={saving}
              data-testid="save-platform-settings-btn"
              style={{ padding: '10px 22px', fontSize: '13.5px', fontWeight: 600 }}
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
