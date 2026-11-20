import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import loginBanner from '../assets/login-banner.jpg';
import { useToast } from '../context/ToastContext';
import PublicRegisterCard from './PublicRegisterCard';
import { getLogoSizePx, DEFAULT_LOGO_SIZE } from '../utils/logoSizeUtils';

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [inviteUsedNotice] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('convite') === 'usado';
    } catch {
      return false;
    }
  });
  const [email, setEmail] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get('email');
      if (urlEmail) {
        localStorage.removeItem('prefill_login_email');
        return urlEmail;
      }
    } catch {
      // ignora
    }
    const prefill = localStorage.getItem('prefill_login_email');
    if (prefill) {
      localStorage.removeItem('prefill_login_email');
      return prefill;
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [platformName, setPlatformName] = useState(() => localStorage.getItem('platform_name') || 'Área de Membros');
  const [bannerUrl, setBannerUrl] = useState(null);
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('platform_logo') || null);
  const [logoSize, setLogoSize] = useState(() => localStorage.getItem('platform_logo_size') || DEFAULT_LOGO_SIZE);
  const { addToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const fetchWhiteLabel = async () => {
      try {
        const res = await fetch('/api/v1/whitelabel');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.platform_name) {
            setPlatformName(data.platform_name);
            localStorage.setItem('platform_name', data.platform_name);
          }
          if (data.login_banner_url) {
            setBannerUrl(data.login_banner_url);
          }
          if (data.logo_url) {
            setLogoUrl(data.logo_url);
            localStorage.setItem('platform_logo', data.logo_url);
          } else if (data.logo_url === null) {
            setLogoUrl(null);
            localStorage.removeItem('platform_logo');
          }
          if (data.logo_size) {
            setLogoSize(data.logo_size);
            localStorage.setItem('platform_logo_size', data.logo_size);
          }
        }
      } catch {
        // Silencioso em caso de offline
      }
    };
    fetchWhiteLabel();

    const checkExistingSession = async () => {
      const savedToken = localStorage.getItem('auth_token');
      if (!savedToken) return;
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (!isMounted) return;
        if (res && res.ok) {
          const userData = await res.json();
          localStorage.setItem('auth_user', JSON.stringify(userData));
          if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) {
            window.history.replaceState({}, document.title, '/');
          }
          if (onLoginSuccess) {
            onLoginSuccess(userData, savedToken);
          }
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    };
    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.detail || 'Email ou senha incorretos';
        addToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      if (data.user?.role === 'aluno') {
        localStorage.setItem('active_tab', 'courses');
      }
      addToast(`Bem-vindo, ${data.user.name}!`, 'success');
      if (onLoginSuccess) {
        onLoginSuccess(data.user, data.access_token);
      }
    } catch (err) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  // Se o usuário clicar em "Criar conta", renderiza a tela de cadastro centralizada e sem banner lateral
  if (isRegistering) {
    return (
      <div
        className="register-page-container"
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '16px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <PublicRegisterCard
          onRegisterSuccess={(user, token) => {
            if (onLoginSuccess) {
              onLoginSuccess(user, token);
            }
          }}
          onBackToLogin={() => {
            setIsRegistering(false);
            setError('');
          }}
        />
      </div>
    );
  }

  return (
    <div className="login-split-page">
      {/* Coluna da Esquerda: Formulário de Login */}
      <div className="login-form-side">
        <div className="login-form-container">
          <div className="auth-header text-left">
            <div
              className="auth-logo-badge"
              style={
                logoUrl
                  ? {
                      background: 'transparent',
                      boxShadow: 'none',
                      width: `${getLogoSizePx(logoSize)}px`,
                      height: `${getLogoSizePx(logoSize)}px`,
                    }
                  : undefined
              }
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={platformName || 'Logo'}
                  data-testid="login-custom-logo-img"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                />
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
            <h2>{platformName || 'Área de Membros'}</h2>
            <p>Informe suas credenciais para acessar o painel</p>
          </div>

          {inviteUsedNotice && !error && (
            <div
              data-testid="login-invite-used-banner"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                fontSize: '0.84rem',
                lineHeight: 1.4,
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '1px', color: '#2563eb' }} />
              <span>
                Seu cadastro já foi concluído! Basta entrar com seu e-mail e senha para acessar a plataforma.
              </span>
            </div>
          )}

          {error && (
            <div className="auth-error-banner" data-testid="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-email">E-mail</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Senha</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="toggle-password-visibility"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? 'Entrando...' : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Opção para Criar Conta */}
          <div
            style={{
              marginTop: '20px',
              textAlign: 'center',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '16px',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
              Não tem uma conta na comunidade?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError('');
                }}
                data-testid="go-to-register-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Criar conta
              </button>
            </p>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '0.75rem', color: '#94a3b8' }}>
              <a href="/privacidade" style={{ color: '#64748b', textDecoration: 'underline' }}>Política de Privacidade</a>
              <span>•</span>
              <a href="/termos" style={{ color: '#64748b', textDecoration: 'underline' }}>Termos de Uso</a>
            </div>
          </div>
        </div>
      </div>

      {/* Coluna da Direita: Banner Ilustrativo Moderno (Apenas no Login) */}
      <div className="login-image-side">
        <div className="image-overlay-card">
          <img
            src={bannerUrl || loginBanner}
            alt={platformName || 'Área de Membros'}
            className="login-feature-img"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            data-testid="login-banner-image"
          />
          <div className="image-caption">
            <h3>Gerenciamento Centralizado</h3>
            <p>Acesse suas ferramentas e gerencie sua equipe com segurança e alto desempenho.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
