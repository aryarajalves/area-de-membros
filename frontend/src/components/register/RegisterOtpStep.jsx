import React from 'react';
import { Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterOtpStep({
  email,
  otpCode,
  setOtpCode,
  formError,
  verifying,
  onVerifyCode,
  resending,
  resendCooldown,
  onResendCode,
  onBackToForm,
  bgColor = '#090d16',
  isLightBg = false,
}) {
  return (
    <div
      className={`auth-page-container ${!isLightBg ? 'auth-dark-theme' : ''}`}
      style={{
        backgroundColor: bgColor,
        minHeight: '100vh',
        width: '100%',
        transition: 'background-color 0.3s ease'
      }}
    >
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Mail size={22} />
          </div>
          <h2>Validar E-mail</h2>
          <p>
            Enviamos um código de 6 dígitos para o e-mail <strong>{email}</strong>. Digite-o abaixo para concluir seu cadastro:
          </p>
        </div>

        {formError && (
          <div className="auth-error-banner" data-testid="verify-error">
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onVerifyCode} className="auth-form" autoComplete="off">
          <div className="otp-container">
            <input
              id="reg-otp-code"
              name="otpCode"
              type="text"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="otp-code-input"
              data-testid="reg-otp-input"
              autoFocus
            />
            <small style={{ color: '#64748b', fontSize: '13px' }}>
              O código expira em 15 minutos.
            </small>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={verifying || otpCode.trim().length !== 6}
            data-testid="verify-submit-btn"
          >
            {verifying ? 'Validando...' : (
              <>
                <span>Confirmar e Ativar Conta</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="otp-actions">
            <button
              type="button"
              className="text-btn"
              onClick={onBackToForm}
              data-testid="back-to-form-btn"
            >
              Voltar e alterar dados
            </button>

            <button
              type="button"
              className="text-btn"
              onClick={onResendCode}
              disabled={resendCooldown > 0 || resending}
              data-testid="resend-code-btn"
            >
              {resending
                ? 'Reenviando...'
                : resendCooldown > 0
                ? `Reenviar código (${resendCooldown}s)`
                : 'Reenviar código'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
