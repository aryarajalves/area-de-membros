import React from 'react';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import PasswordRequirements from './PasswordRequirements';
import PhoneInputWithCountry from './PhoneInputWithCountry';
import { DEFAULT_COUNTRY, formatPhoneNumber } from './countryData';

export default function RegisterFormStep({
  inviteInfo,
  formError,
  name,
  setName,
  email,
  setEmail,
  phone = '',
  setPhone = () => {},
  selectedCountry = DEFAULT_COUNTRY,
  setSelectedCountry = () => {},
  password,
  setPassword,
  passwordConfirm,
  setPasswordConfirm,
  showPassword,
  setShowPassword,
  showPasswordConfirm,
  setShowPasswordConfirm,
  rules,
  isPasswordValid,
  passwordsMatch,
  isPhoneValid = false,
  submitting,
  bgColor = '#090d16',
  isLightBg = false,
  onSubmit,
}) {
  const handlePhoneInputChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value, selectedCountry.ddi);
    setPhone(formatted);
  };

  const handleCountryChange = (newCountry) => {
    setSelectedCountry(newCountry);
    const formatted = formatPhoneNumber(phone, newCountry.ddi);
    setPhone(formatted);
  };
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
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <h2>Criar Conta</h2>
          <p>
            Você foi convidado como <strong>{inviteInfo?.role === 'admin' ? 'Administrador' : 'Aluno'}</strong>. Preencha seus dados.
          </p>
        </div>

        {formError && (
          <div className="auth-error-banner" data-testid="register-error">
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="auth-form" autoComplete="off">
          <div className="form-group">
            <label htmlFor="reg-name">Nome Completo</label>
            <div className="input-wrapper">
              <User className="input-icon" size={18} />
              <input
                id="reg-name"
                name="fullName"
                type="text"
                required
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                data-testid="reg-name-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">E-mail</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="reg-email"
                name="newEmail"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                data-testid="reg-email-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-phone">
              WhatsApp / Telefone <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <PhoneInputWithCountry
              phone={phone}
              onPhoneChange={handlePhoneInputChange}
              selectedCountry={selectedCountry}
              onCountryChange={handleCountryChange}
              isLightBg={isLightBg}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Senha de Acesso</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="reg-password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 12 caracteres seguros"
                data-testid="reg-password-input"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="reg-toggle-password"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <PasswordRequirements rules={rules} />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password-confirm">Confirmar Senha</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="reg-password-confirm"
                name="newPasswordConfirm"
                type={showPasswordConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Digite a mesma senha novamente"
                data-testid="reg-password-confirm-input"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                data-testid="reg-toggle-confirm-password"
                title={showPasswordConfirm ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordConfirm && (
              <small
                className={passwordsMatch ? 'confirm-match-text' : 'confirm-mismatch-text'}
                data-testid="register-password-match-indicator"
              >
                {passwordsMatch ? '✓ As senhas conferem!' : '✕ As senhas não coincidem.'}
              </small>
            )}
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting || !isPasswordValid || !passwordsMatch || !isPhoneValid}
            data-testid="register-submit-btn"
          >
            {submitting ? 'Criando conta...' : (
              <>
                <span>Concluir Cadastro</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
