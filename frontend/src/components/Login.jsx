import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import loginBanner from '../assets/login-banner.jpg';
import { useToast } from '../context/ToastContext';
import PublicRegisterCard from './PublicRegisterCard';

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState(() => {
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
        }
      } catch {
        // Silencioso em caso de offline
      }
    };
    fetchWhiteLabel();
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
            <div className="auth-logo-badge">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h2>{platformName || 'Área de Membros'}</h2>
            <p>Informe suas credenciais para acessar o painel</p>
          </div>

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
