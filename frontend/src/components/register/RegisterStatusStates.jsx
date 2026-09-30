import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function RegisterLoadingState({ bgColor = '#090d16', isLightBg = false }) {
  return (
    <div
      className={`auth-page-container ${!isLightBg ? 'auth-dark-theme' : ''}`}
      style={{ backgroundColor: bgColor, minHeight: '100vh', width: '100%' }}
    >
      <div className="auth-card text-center">
        <p>Verificando convite...</p>
      </div>
    </div>
  );
}

export function RegisterInviteErrorState({ inviteError, bgColor = '#090d16', isLightBg = false }) {
  return (
    <div
      className={`auth-page-container ${!isLightBg ? 'auth-dark-theme' : ''}`}
      style={{ backgroundColor: bgColor, minHeight: '100vh', width: '100%' }}
    >
      <div className="auth-card text-center">
        <div className="auth-error-banner">
          <AlertCircle size={20} />
          <span>{inviteError}</span>
        </div>
        <p style={{ marginTop: '16px' }}>
          Solicite um novo convite ao administrador do sistema.
        </p>
        <a href="/" className="cancel-btn" style={{ display: 'inline-block', marginTop: '16px' }}>
          Ir para Login
        </a>
      </div>
    </div>
  );
}

export function RegisterSuccessState({ inviteInfo, bgColor = '#090d16', isLightBg = false }) {
  return (
    <div
      className={`auth-page-container ${!isLightBg ? 'auth-dark-theme' : ''}`}
      style={{ backgroundColor: bgColor, minHeight: '100vh', width: '100%' }}
    >
      <div className="auth-card text-center">
        <CheckCircle size={44} color="#10b981" style={{ margin: '0 auto 16px' }} />
        <h3>Conta criada com sucesso!</h3>
        <p style={{ margin: '12px 0 24px' }}>
          Seu e-mail foi validado e seu cadastro foi concluído como <strong>{inviteInfo?.role === 'admin' ? 'Administrador' : 'Aluno'}</strong>.
        </p>
        <a href="/" className="primary-btn" style={{ display: 'inline-block' }}>
          Fazer Login Agora
        </a>
      </div>
    </div>
  );
}
