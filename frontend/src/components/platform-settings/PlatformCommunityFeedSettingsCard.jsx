import React, { useState } from 'react';
import { Compass, Users, Shield, Loader2 } from 'lucide-react';

export default function PlatformCommunityFeedSettingsCard({
  communityFeedStudentsEnabled = false,
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
    const nextVal = !communityFeedStudentsEnabled;
    setUpdating(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/whitelabel', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ community_feed_students_enabled: nextVal }),
      });

      if (res.ok) {
        const data = await res.json();
        const savedVal = Boolean(data.community_feed_students_enabled);
        if (onSettingChange) onSettingChange(savedVal);
        localStorage.setItem('community_feed_students_enabled', String(savedVal));
        window.dispatchEvent(new CustomEvent('whitelabel_updated', { detail: data }));
        addToast(
          savedVal
            ? 'Feed da Comunidade liberado para alunos visualizarem e publicarem!'
            : 'Feed da Comunidade restrito apenas para administradores.',
          'success'
        );
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao alterar permissão do Feed da Comunidade.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao atualizar configuração.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      data-testid="community-feed-settings-card"
      style={{
        background: cardBg,
        border: `1px solid ${communityFeedStudentsEnabled ? 'rgba(14, 165, 233, 0.4)' : cardBorder}`,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: communityFeedStudentsEnabled
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
              background: communityFeedStudentsEnabled
                ? 'rgba(14, 165, 233, 0.2)'
                : 'rgba(148, 163, 184, 0.1)',
              border: `1px solid ${communityFeedStudentsEnabled ? 'rgba(56, 189, 248, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Compass size={22} color={communityFeedStudentsEnabled ? '#38bdf8' : subTextColor} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: textColor }}>
                Acesso ao Feed da Comunidade
              </h3>
              <span
                data-testid="community-feed-access-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: communityFeedStudentsEnabled
                    ? 'rgba(14, 165, 233, 0.16)'
                    : 'rgba(245, 158, 11, 0.14)',
                  color: communityFeedStudentsEnabled ? '#38bdf8' : '#fbbf24',
                  border: `1px solid ${communityFeedStudentsEnabled ? 'rgba(56, 189, 248, 0.35)' : 'rgba(251, 191, 36, 0.35)'}`,
                }}
              >
                {communityFeedStudentsEnabled ? <Users size={11} /> : <Shield size={11} />}
                <span>{communityFeedStudentsEnabled ? 'Admins e Alunos' : 'Apenas Admins'}</span>
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: subTextColor, lineHeight: 1.5 }}>
              {communityFeedStudentsEnabled
                ? 'Atualmente todos os alunos e administradores podem visualizar os posts e publicar no Feed da Comunidade.'
                : 'Atualmente apenas administradores podem visualizar e publicar no Feed da Comunidade. Ative para liberar para todos os alunos.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={communityFeedStudentsEnabled}
          disabled={updating}
          onClick={handleToggle}
          data-testid="switch-community-feed-students"
          title={
            communityFeedStudentsEnabled
              ? 'Restringir Feed apenas para Admins'
              : 'Liberar Feed para Alunos e Admins'
          }
          style={{
            position: 'relative',
            width: '54px',
            height: '28px',
            borderRadius: '14px',
            backgroundColor: communityFeedStudentsEnabled
              ? '#0284c7'
              : 'rgba(255, 255, 255, 0.16)',
            border: 'none',
            cursor: updating ? 'not-allowed' : 'pointer',
            opacity: updating ? 0.7 : 1,
            transition: 'background-color 0.2s ease',
            flexShrink: 0,
            padding: 0,
            outline: 'none',
            boxShadow: communityFeedStudentsEnabled ? '0 0 12px rgba(2, 132, 199, 0.5)' : 'none',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '4px',
              left: communityFeedStudentsEnabled ? '30px' : '4px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
              transition: 'left 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {updating && <Loader2 size={12} color="#0284c7" className="spin" />}
          </span>
        </button>
      </div>
    </div>
  );
}
