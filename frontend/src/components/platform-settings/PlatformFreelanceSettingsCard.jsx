import React, { useState } from 'react';
import { Briefcase, Users, EyeOff, Loader2 } from 'lucide-react';

export default function PlatformFreelanceSettingsCard({
  freelanceEnabled = true,
  cardBg = '#121622',
  cardBorder = 'rgba(255, 255, 255, 0.1)',
  textColor = '#ffffff',
  subTextColor = '#94a3b8',
  addToast,
  onSettingChange,
}) {
  const [updating, setUpdating] = useState(false);

  const handleToggle = async () => {
    if (updating) return;
    const nextVal = !freelanceEnabled;
    setUpdating(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/whitelabel', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ freelance_enabled: nextVal }),
      });

      if (res.ok) {
        const data = await res.json();
        const savedVal = Boolean(data.freelance_enabled);
        if (onSettingChange) onSettingChange(savedVal);
        localStorage.setItem('freelance_enabled', String(savedVal));
        window.dispatchEvent(new CustomEvent('whitelabel_updated', { detail: data }));
        addToast(
          savedVal
            ? 'Módulo de Vagas & Serviços liberado na área de membros!'
            : 'Módulo de Vagas & Serviços ocultado da área de membros.',
          'success'
        );
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao alterar permissão de Vagas & Serviços.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao atualizar configuração.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      data-testid="freelance-settings-card"
      style={{
        background: cardBg,
        border: `1px solid ${freelanceEnabled ? 'rgba(14, 165, 233, 0.4)' : cardBorder}`,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: freelanceEnabled
          ? '0 8px 30px rgba(14, 165, 233, 0.12)'
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
              background: freelanceEnabled
                ? 'rgba(14, 165, 233, 0.2)'
                : 'rgba(148, 163, 184, 0.1)',
              border: `1px solid ${freelanceEnabled ? 'rgba(56, 189, 248, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Briefcase size={22} color={freelanceEnabled ? '#38bdf8' : subTextColor} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: textColor }}>
                Acesso a Vagas &amp; Serviços
              </h3>
              <span
                data-testid="freelance-access-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: freelanceEnabled
                    ? 'rgba(14, 165, 233, 0.16)'
                    : 'rgba(100, 116, 139, 0.18)',
                  color: freelanceEnabled ? '#38bdf8' : '#cbd5e1',
                  border: `1px solid ${freelanceEnabled ? 'rgba(56, 189, 248, 0.35)' : 'rgba(148, 163, 184, 0.3)'}`,
                }}
              >
                {freelanceEnabled ? <Users size={11} /> : <EyeOff size={11} />}
                <span>{freelanceEnabled ? 'Liberado' : 'Oculto'}</span>
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: subTextColor, lineHeight: 1.5 }}>
              {freelanceEnabled
                ? 'O mural de Vagas & Serviços está ativo para administradores e alunos com curso liberado.'
                : 'O mural de Vagas & Serviços está oculto para toda a plataforma. Ative para liberar o acesso.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={freelanceEnabled}
          data-testid="toggle-freelance-enabled-btn"
          disabled={updating}
          onClick={handleToggle}
          style={{
            position: 'relative',
            width: '54px',
            height: '30px',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: freelanceEnabled ? '#0ea5e9' : 'rgba(148, 163, 184, 0.3)',
            cursor: updating ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.25s ease',
            flexShrink: 0,
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '3px',
              left: freelanceEnabled ? '27px' : '3px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'left 0.25s ease',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
            }}
          >
            {updating && <Loader2 size={12} className="animate-spin" color="#0ea5e9" />}
          </span>
        </button>
      </div>
    </div>
  );
}
