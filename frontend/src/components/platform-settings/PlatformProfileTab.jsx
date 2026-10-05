import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ProfileAvatarSection from './ProfileAvatarSection';

export default function PlatformProfileTab({
  currentUser,
  onUserUpdated,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
  isLightBg
}) {
  const { addToast } = useToast();

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAvatarUrl(currentUser.avatar_url || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSuperAdmin) {
      if (!name.trim()) {
        addToast('O nome do usuário é obrigatório.', 'error');
        return;
      }
      if (!email.trim()) {
        addToast('O e-mail é obrigatório.', 'error');
        return;
      }
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          addToast('A confirmação de senha não confere.', 'error');
          return;
        }
        if (newPassword.length < 12) {
          addToast('A nova senha deve ter no mínimo 12 caracteres.', 'error');
          return;
        }
      }
    }

    setSaving(true);
    const token = localStorage.getItem('auth_token');

    try {
      const payload = {
        avatar_url: avatarUrl,
      };

      if (!isSuperAdmin) {
        payload.name = name.trim();
        payload.email = email.trim();
        payload.phone = phone.trim();
        if (newPassword.trim()) {
          payload.password = newPassword.trim();
        }
      }

      const res = await fetch('/api/v1/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        if (onUserUpdated) {
          onUserUpdated(updated);
        }
        setNewPassword('');
        setConfirmPassword('');
        addToast('Dados do perfil salvos com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao salvar perfil.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao atualizar dados do perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const userInitial = (name || currentUser?.name || 'U').charAt(0).toUpperCase();

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: cardBorder,
    backgroundColor: isLightBg ? '#f8fafc' : 'rgba(15, 23, 42, 0.65)',
    color: textColor,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const disabledInputStyle = {
    ...inputStyle,
    backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(30, 41, 59, 0.45)',
    color: subTextColor,
    cursor: 'not-allowed',
    borderStyle: 'dashed',
  };

  return (
    <div
      style={{
        backgroundColor: cardBg,
        border: cardBorder,
        borderRadius: '16px',
        padding: '28px',
        maxWidth: '820px',
        boxSizing: 'border-box',
      }}
      data-testid="platform-profile-tab"
    >
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: textColor }}>
          Meu Perfil e Identidade
        </h2>
        <p style={{ fontSize: '13.5px', color: subTextColor, margin: 0 }}>
          Atualize seus dados cadastrais, informações de contato e a sua foto de perfil exibida no sistema.
        </p>
      </div>

      {isSuperAdmin && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            backgroundColor: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '24px',
          }}
          data-testid="superadmin-notice-banner"
        >
          <ShieldAlert size={20} color="#eab308" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', color: isLightBg ? '#854d0e' : '#fef08a', lineHeight: 1.5 }}>
            <strong>Conta Super Administrador Protegida:</strong> Por políticas de segurança da conta mestre do sistema,
            o nome, e-mail e senha do Super Admin são protegidos e não podem ser alterados por esta tela.
            <strong> Você pode alterar livremente a sua foto de perfil / logo abaixo.</strong>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Bloco Foto / Logo do Usuário */}
        <ProfileAvatarSection
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
          userInitial={userInitial}
          onUserUpdated={onUserUpdated}
          cardBorder={cardBorder}
          textColor={textColor}
          subTextColor={subTextColor}
        />

        {/* Campos de Dados Pessoais */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: textColor }}>
              Nome do Contato / Usuário {isSuperAdmin && <Lock size={12} style={{ display: 'inline', marginLeft: '4px' }} />}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSuperAdmin}
              placeholder="Seu nome completo"
              style={isSuperAdmin ? disabledInputStyle : inputStyle}
              data-testid="profile-input-name"
            />
            {isSuperAdmin && (
              <span style={{ fontSize: '11px', color: subTextColor, marginTop: '4px', display: 'block' }}>
                Protegido na conta Super Admin
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: textColor }}>
              E-mail de Acesso {isSuperAdmin && <Lock size={12} style={{ display: 'inline', marginLeft: '4px' }} />}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSuperAdmin}
              placeholder="seuemail@exemplo.com"
              style={isSuperAdmin ? disabledInputStyle : inputStyle}
              data-testid="profile-input-email"
            />
            {isSuperAdmin && (
              <span style={{ fontSize: '11px', color: subTextColor, marginTop: '4px', display: 'block' }}>
                Protegido na conta Super Admin
              </span>
            )}
          </div>
        </div>

        {/* WhatsApp / Telefone */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: textColor }}>
            WhatsApp / Telefone de Contato
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            style={inputStyle}
            data-testid="profile-input-phone"
          />
        </div>

        {/* Bloco de Troca de Senha */}
        <div
          style={{
            borderTop: cardBorder,
            paddingTop: '20px',
            marginBottom: '26px',
          }}
        >
          <h4 style={{ fontSize: '14.5px', fontWeight: 600, margin: '0 0 6px 0', color: textColor }}>
            Segurança e Troca de Senha
          </h4>

          {isSuperAdmin ? (
            <div
              style={{
                fontSize: '12.5px',
                color: subTextColor,
                backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.03)',
                padding: '12px 14px',
                borderRadius: '8px',
                border: cardBorder,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              data-testid="superadmin-password-blocked-box"
            >
              <Lock size={14} />
              <span>A troca de senha do Super Admin é bloqueada por esta tela por segurança mestre.</span>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '12.5px', color: subTextColor, margin: '0 0 14px 0' }}>
                Preencha os campos abaixo apenas se desejar alterar a sua senha de acesso. Mínimo 12 caracteres, incluindo maiúscula, minúscula, número e símbolo.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: textColor }}>
                    Nova Senha
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 12 caracteres"
                    style={{ ...inputStyle, paddingRight: '40px' }}
                    data-testid="profile-input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '32px',
                      background: 'none',
                      border: 'none',
                      color: subTextColor,
                      cursor: 'pointer',
                    }}
                    title={showPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: textColor }}>
                    Confirmar Nova Senha
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    style={inputStyle}
                    data-testid="profile-input-confirm-password"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botão de Envio */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '11px 24px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.15s ease',
            }}
            data-testid="btn-save-profile"
          >
            <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
