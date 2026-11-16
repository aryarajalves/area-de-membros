import React from 'react';
import { Mail, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function RegisterEmailSentStep({
  email,
  formError,
  resending,
  resendCooldown,
  onResendEmail,
  onBackToForm,
  bgColor = '#090d16',
  isLightBg = false,
  inlineCard = false,
}) {
  const content = (
    <div
      className={inlineCard ? '' : 'auth-card'}
      data-testid="verify-email-sent-step"
      style={inlineCard ? { textAlign: 'center' } : undefined}
    >
      <div className="auth-header" style={inlineCard ? { marginBottom: '16px' } : undefined}>
        <div
          className="auth-logo-badge"
          style={{
            background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.16), rgba(202, 138, 4, 0.2))',
            color: '#eab308',
            border: '1px solid rgba(234, 179, 8, 0.35)',
          }}
        >
          <Mail size={22} />
        </div>
        <h2 style={inlineCard ? { color: '#0f172a', margin: '8px 0 6px 0' } : undefined}>
          Confirme seu E-mail
        </h2>
        <p style={inlineCard ? { color: '#475569', fontSize: '0.875rem', lineHeight: 1.5 } : undefined}>
          Enviamos um botão de confirmação para <strong>{email}</strong>.
          <br />
          Abra sua caixa de entrada e clique no botão para ativar sua conta e entrar automaticamente na comunidade.
        </p>
      </div>

      {formError && (
        <div className="auth-error-banner" data-testid="verify-error" style={{ marginBottom: '14px' }}>
          <AlertCircle size={16} />
          <span>{formError}</span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 14px',
          borderRadius: '10px',
          backgroundColor: inlineCard ? '#f8fafc' : 'rgba(234, 179, 8, 0.08)',
          border: inlineCard ? '1px solid #e2e8f0' : '1px solid rgba(234, 179, 8, 0.22)',
          color: inlineCard ? '#475569' : '#fde68a',
          fontSize: '0.8125rem',
          marginBottom: '18px',
        }}
      >
        <CheckCircle2 size={16} color="#eab308" />
        <span>O link de confirmação é válido por <strong>30 minutos</strong>.</span>
      </div>

      <button
        type="button"
        className="auth-submit-btn"
        onClick={onResendEmail}
        disabled={resendCooldown > 0 || resending}
        data-testid="resend-code-btn"
        style={{ width: '100%' }}
      >
        <RefreshCw size={17} className={resending ? 'spin-icon' : ''} />
        <span>
          {resending
            ? 'Reenviando e-mail...'
            : resendCooldown > 0
            ? `Reenviar e-mail (${resendCooldown}s)`
            : 'Reenviar e-mail de confirmação'}
        </span>
      </button>

      <div style={{ marginTop: '14px', textAlign: 'center' }}>
        <button
          type="button"
          className="text-btn"
          onClick={onBackToForm}
          data-testid="back-to-form-btn"
          style={inlineCard ? { color: '#0284c7', fontSize: '0.8125rem', fontWeight: 600 } : undefined}
        >
          Voltar e alterar dados
        </button>
      </div>
    </div>
  );

  if (inlineCard) {
    return content;
  }

  return (
    <div
      className={`auth-page-container ${!isLightBg ? 'auth-dark-theme' : ''}`}
      style={{
        backgroundColor: bgColor,
        height: '100%',
        minHeight: '100%',
        maxHeight: '100dvh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        width: '100%',
        transition: 'background-color 0.3s ease',
      }}
    >
      {content}
    </div>
  );
}
