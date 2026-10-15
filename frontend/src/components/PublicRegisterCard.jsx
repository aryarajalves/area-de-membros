import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import PhoneInputWithCountry from './register/PhoneInputWithCountry';
import { COUNTRIES, DEFAULT_COUNTRY, formatPhoneNumber } from './register/countryData';
import { useToast } from '../context/ToastContext';

export default function PublicRegisterCard({ onRegisterSuccess, onBackToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  // Garante que o formulário inicie estritamente vazio e sem valores preenchidos por autofill
  useEffect(() => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
  }, []);

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value, selectedCountry.ddi);
    setPhone(formatted);
  };

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    // Reformata o telefone com o novo DDI se já houver dígitos
    if (phone) {
      setPhone(formatPhoneNumber(phone, country.ddi));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      const err = 'As senhas digitadas não coincidem.';
      setError(err);
      addToast(err, 'error');
      return;
    }

    if (password.length < 12) {
      const err = 'A senha deve ter no mínimo 12 caracteres.';
      setError(err);
      addToast(err, 'error');
      return;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      const err = 'A senha deve conter ao menos 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.';
      setError(err);
      addToast(err, 'error');
      return;
    }

    setLoading(true);
    try {
      // Monta o telefone formatado com DDI se informado
      const fullPhone = phone.trim() ? `${selectedCountry.ddi} ${phone.trim()}` : undefined;

      const response = await fetch('/api/v1/auth/public-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: fullPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.detail || 'Erro ao criar conta.';
        addToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('active_tab', 'courses');
      addToast(`Conta criada com sucesso! Bem-vindo(a), ${data.user.name}!`, 'success');

      if (onRegisterSuccess) {
        onRegisterSuccess(data.user, data.access_token);
      }
    } catch (err) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-card public-register-card"
      style={{
        width: '100%',
        maxWidth: '450px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
        padding: '20px 24px',
        margin: 'auto',
      }}
      data-testid="public-register-container"
    >
      {/* Cabeçalho Compacto */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            color: '#0284c7',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '6px',
          }}
        >
          <UserPlus size={20} color="#0284c7" />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
          Criar Conta
        </h2>
        <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
          Cadastre-se para acessar a comunidade e interagir com membros
        </p>
      </div>

      {/* Alerta de Benefícios Compacto */}
      <div
        style={{
          marginBottom: '12px',
          padding: '7px 10px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: '#0369a1',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <CheckCircle2 size={15} color="#0284c7" style={{ flexShrink: 0 }} />
        <span>Acesso gratuito ao Chat, Apresente-se, Depoimentos, Ranking e Vitrine.</span>
      </div>

      {/* Erro */}
      {error && (
        <div className="auth-error-banner" data-testid="register-error" style={{ marginBottom: '10px', padding: '8px 12px', fontSize: '0.8125rem' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Campos ocultos para neutralizar autofill agressivo de login dos navegadores */}
        <input type="text" name="fake_user_autocomplete" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />
        <input type="password" name="fake_pass_autocomplete" tabIndex={-1} autoComplete="new-password" style={{ display: 'none' }} />

        {/* Nome Completo */}
        <div className="form-group" style={{ gap: '3px' }}>
          <label htmlFor="reg-name" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
            Nome Completo
          </label>
          <div className="input-wrapper">
            <UserIcon className="input-icon" size={16} />
            <input
              id="reg-name"
              name="register_user_fullname"
              type="text"
              required
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              data-testid="register-name-input"
              style={{ height: '38px', padding: '8px 12px 8px 38px', fontSize: '0.84rem' }}
            />
          </div>
        </div>

        {/* E-mail */}
        <div className="form-group" style={{ gap: '3px' }}>
          <label htmlFor="reg-email" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
            E-mail
          </label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={16} />
            <input
              id="reg-email"
              name="register_user_email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              data-testid="register-email-input"
              style={{ height: '38px', padding: '8px 12px 8px 38px', fontSize: '0.84rem' }}
            />
          </div>
        </div>

        {/* WhatsApp / Telefone com Dropdown de Sigla e DDI */}
        <div className="form-group" style={{ gap: '3px' }}>
          <label htmlFor="reg-phone" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
            WhatsApp / Telefone (opcional)
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {/* Seletor DDI com Sigla em Destaque (Padrão BR +55) */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0 8px',
                height: '38px',
                minWidth: '96px',
                cursor: 'pointer',
                gap: '5px',
              }}
              data-testid="phone-country-selector-box"
            >
              <span
                data-testid="phone-country-code-badge"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#0284c7',
                  backgroundColor: 'rgba(2, 132, 199, 0.08)',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  letterSpacing: '0.5px',
                }}
              >
                {selectedCountry.code}
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b' }}>
                {selectedCountry.ddi}
              </span>
              <ChevronDown size={13} style={{ color: '#64748b', marginLeft: 'auto' }} />
              <select
                value={selectedCountry.code}
                onChange={(e) => {
                  const found = COUNTRIES.find((c) => c.code === e.target.value);
                  if (found) handleCountryChange(found);
                }}
                data-testid="phone-country-select"
                aria-label="Selecionar código do país (DDI)"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 2,
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
                    {c.code} - {c.name} ({c.ddi})
                  </option>
                ))}
              </select>
            </div>

            {/* Input de Telefone */}
            <div className="input-wrapper" style={{ flex: 1 }}>
              <input
                id="reg-phone"
                name="register_user_phone"
                type="tel"
                autoComplete="off"
                value={phone}
                onChange={handlePhoneChange}
                placeholder={selectedCountry.code === 'BR' ? '(11) 99999-9999' : 'Número de telefone'}
                data-testid="register-phone-input"
                style={{ height: '38px', padding: '8px 12px', fontSize: '0.84rem' }}
              />
            </div>
          </div>
        </div>

        {/* Senha */}
        <div className="form-group" style={{ gap: '3px' }}>
          <label htmlFor="reg-password" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
            Senha
          </label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={16} />
            <input
              id="reg-password"
              name="register_user_password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 12 caracteres"
              data-testid="register-password-input"
              style={{ height: '38px', padding: '8px 40px 8px 38px', fontSize: '0.84rem' }}
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              data-testid="toggle-reg-password-visibility"
              title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              style={{ padding: '2px' }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '1px' }}>
            12+ caracteres com maiúscula, minúscula, número e símbolo.
          </span>
        </div>

        {/* Confirmar Senha */}
        <div className="form-group" style={{ gap: '3px' }}>
          <label htmlFor="reg-confirm-password" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
            Confirmar Senha
          </label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={16} />
            <input
              id="reg-confirm-password"
              name="register_user_confirm_password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita sua senha"
              data-testid="register-confirm-password-input"
              style={{ height: '38px', padding: '8px 12px 8px 38px', fontSize: '0.84rem' }}
            />
          </div>
        </div>

        {/* Botão de Envio */}
        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
          data-testid="register-submit-btn"
          style={{
            height: '40px',
            fontSize: '0.875rem',
            marginTop: '4px',
            borderRadius: '8px',
          }}
        >
          {loading ? 'Criando conta...' : (
            <>
              <span>Criar Conta e Acessar</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Voltar ao Login */}
      <div
        style={{
          marginTop: '12px',
          textAlign: 'center',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '10px',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
          Já possui uma conta cadastrada?{' '}
          <button
            type="button"
            onClick={onBackToLogin}
            data-testid="go-to-login-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
              fontSize: '0.8125rem',
            }}
          >
            Entrar no sistema
          </button>
        </p>
      </div>
    </div>
  );
}
