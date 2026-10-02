import React from 'react';
import { Palette, Check, Sparkles, Loader2 } from 'lucide-react';

const BG_COLOR_PRESETS = [
  { label: 'Netflix Dark', color: '#090d16' },
  { label: 'Preto OLED', color: '#000000' },
  { label: 'Grafite Escuro', color: '#121620' },
  { label: 'Azul Meia-Noite', color: '#0b1120' },
  { label: 'Claro Clássico', color: '#f8fafc' },
];

export default function PlatformAppearanceTab({
  selectedColor,
  setSelectedColor,
  saving,
  onSave,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
  isLightBg,
}) {
  return (
    <div
      className="table-card"
      style={{
        backgroundColor: cardBg,
        border: cardBorder,
        borderRadius: '16px',
        padding: '28px',
        maxWidth: '850px',
        boxShadow: isLightBg ? '0 10px 25px -5px rgba(0, 0, 0, 0.05)' : '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
      }}
      data-testid="platform-appearance-tab"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Palette size={20} color="#38bdf8" />
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: textColor }}>
          Cor de Fundo da Área de Membros (Estilo Netflix)
        </h2>
      </div>
      <p style={{ fontSize: '13px', color: subTextColor, margin: '0 0 20px 0', lineHeight: 1.5 }}>
        Esta cor é aplicada globalmente em toda a Área de Membros (barra lateral, vitrine de cursos, relatos de aulas, abas de segurança, sala de aula e popups), garantindo uma identidade visual única em todo o sistema.
      </p>

      {/* Input com Seletor Livre de Cor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
        <div
          style={{
            position: 'relative',
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: selectedColor,
            cursor: 'pointer',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          }}
        >
          <input
            type="color"
            value={['#f8fafc', '#ffffff', '#f1f5f9'].includes(selectedColor.toLowerCase()) ? '#f8fafc' : selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            style={{
              opacity: 0,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
            }}
            data-testid="platform-bg-color-picker"
            title="Escolha uma cor personalizada"
          />
        </div>

        <input
          type="text"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          placeholder="#090d16"
          style={{
            backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(0, 0, 0, 0.3)',
            border: cardBorder,
            borderRadius: '8px',
            padding: '10px 14px',
            color: textColor,
            fontSize: '14px',
            fontWeight: 600,
            width: '140px',
            outline: 'none',
          }}
          data-testid="platform-bgcolor-input"
        />
      </div>

      {/* Presets Rápidos Recomendados */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: subTextColor, display: 'block', marginBottom: '10px' }}>
          Temas Recomendados:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {BG_COLOR_PRESETS.map((preset) => {
            const isSelected = selectedColor.toLowerCase() === preset.color.toLowerCase();
            return (
              <button
                key={preset.color}
                type="button"
                onClick={() => setSelectedColor(preset.color)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #38bdf8' : cardBorder,
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#38bdf8' : textColor,
                  transition: 'all 0.2s ease',
                }}
                data-testid={`preset-bgcolor-${preset.color}`}
              >
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: preset.color,
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'inline-block',
                  }}
                />
                {preset.label}
                {isSelected && <Check size={14} color="#38bdf8" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Caixa de Pré-visualização */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: selectedColor,
          border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '28px',
          boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.25)',
        }}
      >
        <Sparkles size={20} color="#eab308" />
        <div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: isLightBg ? '#0f172a' : '#f8fafc', display: 'block' }}>
            Pré-visualização do Tema Ativo ({selectedColor})
          </span>
          <span style={{ fontSize: '12px', color: isLightBg ? '#475569' : '#94a3b8' }}>
            Todos os cursos, módulos, aulas e popups seguirão exatamente esta paleta.
          </span>
        </div>
      </div>

      {/* Botão de Salvar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            padding: '10px 24px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
            transition: 'all 0.2s ease',
          }}
          data-testid="save-platform-settings-btn"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="spin-animation" />
              <span>Salvando...</span>
            </>
          ) : (
            <span>Salvar Configurações</span>
          )}
        </button>
      </div>
    </div>
  );
}
