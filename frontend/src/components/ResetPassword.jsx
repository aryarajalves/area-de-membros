import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowRight, Check, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ResetPassword({ token: initialToken, onResetSuccess }) {
  const [token, setToken] = useState(initialToken || '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const { addToast } = useToast();

  const rules = [
    { label: 'No mínimo 12 caracteres', valid: password.length >= 12 },
    { label: 'Pelo menos 1 letra maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'Pelo menos 1 letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'Pelo menos 1 número', valid: /\d/.test(password) },
    { label: 'Pelo menos 1 caractere especial (!@#$...)', valid: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password) },
  ];

  const isPasswordValid = rules.every((r) => r.valid);
  const passwordsMatch = password && passwordConfirm && password === passwordConfirm;

  useEffect(() => {
    let currentToken = initialToken;
    if (!currentToken) {
      const params = new URLSearchParams(window.location.search);
      currentToken = params.get('token');
      if (currentToken) setToken(currentToken);
    }

    if (currentToken) {
      fetch(`/api/v1/auth/reset-password/validate?token=${currentToken}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setTargetUser(data);
          } else {
            const err = data.detail || 'Link de redefinição inválido ou expirado.';
            setTokenError(err);
            addToast(err, 'error');
          }
        })
        .catch(() => {
          const err = 'Erro ao verificar link de redefinição.';
          setTokenError(err);
          addToast(err, 'error');
        })
        .finally(() => setValidating(false));
    } else {
      setTokenError('Nenhum código de redefinição informado.');
      setValidating(false);
    }
  }, [initialToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isPasswordValid) {
      const errMsg = 'Por favor, atenda a todos os requisitos de segurança da senha.';
      setFormError(errMsg);
      addToast(errMsg, 'error');
      return;
    }

    if (!passwordsMatch) {
      const errMsg = 'A confirmação de senha não confere com a nova senha digitada.';
      setFormError(errMsg);
      addToast(errMsg, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          password_confirm: passwordConfirm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.detail || 'Erro ao redefinir senha.';
        addToast(errMsg, 'error');
        throw new Error(errMsg);
      }

      setSuccess(true);
      addToast('Senha redefinida com sucesso!', 'success');
      if (onResetSuccess) {
        setTimeout(() => {
          onResetSuccess();
        }, 2000);
      }
    } catch (err) {
      setFormError(err.message || 'Erro ao redefinir.');
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="auth-page-container">
        <div className="auth-card text-center">
          <p>Verificando link de redefinição...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="auth-page-container">
        <div className="auth-card text-center">
          <div className="auth-error-banner">
            <AlertCircle size={20} />
            <span>{tokenError}</span>
          </div>
          <p style={{ marginTop: '16px' }}>
            Solicite um novo link de redefinição ao administrador.
          </p>
          <a href="/" className="cancel-btn" style={{ display: 'inline-block', marginTop: '16px' }}>
            Ir para Login
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page-container">
        <div className="auth-card text-center">
          <CheckCircle size={44} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <h3>Senha atualizada com sucesso!</h3>
          <p style={{ margin: '12px 0 24px' }}>
            Agora você já pode fazer login utilizando sua nova senha.
          </p>
          <a href="/" className="primary-btn" style={{ display: 'inline-block' }}>
            Ir para o Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <h2>Redefinir Senha</h2>
          <p>
            Defina uma nova senha para a conta de <strong>{targetUser?.name}</strong> ({targetUser?.email}).
          </p>
        </div>

        {formError && (
          <div className="auth-error-banner" data-testid="reset-error">
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          {/* Campo Nova Senha */}
          <div className="form-group">
            <label htmlFor="reset-new-password">Nova Senha</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="reset-new-password"
                name="resetNewPassword"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 12 caracteres seguros"
                data-testid="reset-password-input"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="reset-toggle-password"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Checklist de requisitos de senha */}
            <div className="password-rules-card" data-testid="password-requirements">
              <span className="rules-title">Requisitos da senha:</span>
              <ul className="rules-list">
                {rules.map((rule, idx) => (
                  <li key={idx} className={rule.valid ? 'rule-met' : 'rule-unmet'}>
                    <span className="rule-bullet">{rule.valid ? '✓' : '○'}</span>
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Campo Confirmar Senha */}
          <div className="form-group">
            <label htmlFor="reset-password-confirm">Confirmar Nova Senha</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="reset-password-confirm"
                name="resetPasswordConfirm"
                type={showPasswordConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Digite a mesma senha novamente"
                data-testid="reset-password-confirm-input"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                data-testid="reset-toggle-confirm-password"
                title={showPasswordConfirm ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordConfirm && (
              <small className={passwordsMatch ? 'confirm-match-text' : 'confirm-mismatch-text'} data-testid="password-match-indicator">
                {passwordsMatch ? '✓ As senhas conferem!' : '✕ As senhas não coincidem.'}
              </small>
            )}
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting || !isPasswordValid || !passwordsMatch}
            data-testid="reset-submit-btn"
          >
            {submitting ? 'Salvando...' : (
              <>
                <span>Redefinir e Salvar</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
