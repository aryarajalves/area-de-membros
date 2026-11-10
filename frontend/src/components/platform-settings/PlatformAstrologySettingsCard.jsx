import React, { useState } from 'react';
import { Sparkles, Shield, Loader2 } from 'lucide-react';

export default function PlatformAstrologySettingsCard({
  isAstrologyPlatform = false,
  currentUser,
  cardBg = '#121622',
  cardBorder = 'rgba(255, 255, 255, 0.1)',
  textColor = '#ffffff',
  subTextColor = '#94a3b8',
  addToast,
  onSettingChange,
}) {
  const [updating, setUpdating] = useState(false);

  // Acesso rigorosamente restrito a Super Admin
  if (currentUser?.role !== 'superadmin') {
    return null;
  }

  const handleToggle = async () => {
    if (updating) return;
    const nextVal = !isAstrologyPlatform;
    setUpdating(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/whitelabel', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_astrology_platform: nextVal }),
      });

      if (res.ok) {
        const data = await res.json();
        if (onSettingChange) onSettingChange(data.is_astrology_platform);
        localStorage.setItem('is_astrology_platform', String(data.is_astrology_platform));
        window.dispatchEvent(new CustomEvent('whitelabel_updated', { detail: data }));
        addToast(
          nextVal
            ? 'Módulo de Astrologia ativado com sucesso! Signos agora são visíveis.'
            : 'Módulo de Astrologia desativado. Signos ocultados na plataforma.',
          'success'
        );
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao alterar configuração de Astrologia.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao atualizar configuração.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="astrology-settings-card"
      data-testid="astrology-settings-card"
      style={{
        background: cardBg,
        border: `1px solid ${isAstrologyPlatform ? 'rgba(192, 132, 252, 0.4)' : cardBorder}`,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: isAstrologyPlatform
          ? '0 8px 30px rgba(192, 132, 252, 0.12)'
          : '0 4px 20px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '260px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: isAstrologyPlatform
                ? 'rgba(192, 132, 252, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isAstrologyPlatform ? 'rgba(192, 132, 252, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isAstrologyPlatform ? '#c084fc' : '#94a3b8',
              fontSize: '22px',
              flexShrink: 0,
            }}
          >
            {isAstrologyPlatform ? '✨' : '🔮'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: textColor }}>
                Módulo de Astrologia & Signos Zodiacais
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <Shield size={11} />
                <span>Super Admin</span>
              </span>
            </div>

            <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: subTextColor, lineHeight: 1.5 }}>
              Calcula e exibe automaticamente o <strong>Signo Solar (♈ ♉ ♊ ♋ ...)</strong> dos alunos com base na data de nascimento no perfil, na gestão de alunos e na comunidade. Em plataformas padrão (não-astrológicas), mantenha desativado para ocultar os signos completamente.
            </p>
          </div>
        </div>

        {/* Switch Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleToggle}
            disabled={updating}
            role="switch"
            aria-checked={isAstrologyPlatform}
            data-testid="toggle-astrology-platform-btn"
            style={{
              position: 'relative',
              width: '54px',
              height: '28px',
              borderRadius: '20px',
              background: isAstrologyPlatform ? '#9333ea' : 'rgba(255, 255, 255, 0.15)',
              border: `1px solid ${isAstrologyPlatform ? '#a855f7' : 'rgba(255, 255, 255, 0.2)'}`,
              cursor: updating ? 'not-allowed' : 'pointer',
              transition: 'background 0.25s ease, border-color 0.25s ease',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px',
              outline: 'none',
            }}
          >
            <span
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.4)',
                transform: isAstrologyPlatform ? 'translateX(26px)' : 'translateX(0)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {updating && <Loader2 size={12} className="animate-spin" style={{ color: '#9333ea' }} />}
            </span>
          </button>

          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: isAstrologyPlatform ? '#c084fc' : subTextColor,
              minWidth: '58px',
            }}
          >
            {isAstrologyPlatform ? 'Ativado' : 'Oculto'}
          </span>
        </div>
      </div>
    </div>
  );
}
