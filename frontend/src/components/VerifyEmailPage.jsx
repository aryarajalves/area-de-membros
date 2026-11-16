import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function VerifyEmailPage({ onVerifiedSuccess, onBackToLogin }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [platformBgColor, setPlatformBgColor] = useState(() => {
    return localStorage.getItem('platform_theme_bg') || '#090d16';
  });
  const { addToast } = useToast();

  useEffect(() => {
    try {
      const p = fetch('/api/v1/courses/platform-theme');
      if (p && typeof p.then === 'function') {
        p.then((res) => (res && res.ok ? res.json() : null))
          .then((data) => {
            if (data?.bg_color) {
              setPlatformBgColor(data.bg_color);
              localStorage.setItem('platform_theme_bg', data.bg_color);
            }
          })
          .catch(() => {});
      }
    } catch {
      // Ignora falhas de tema em ambiente de teste
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('Link de confirmação inválido ou incompleto.');
      return;
    }

    let cancelled = false;
    const confirmLink = async () => {
      try {
        const res = await fetch('/api/v1/auth/register/verify-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        let data = {};
        try {
          data = await res.json();
        } catch {
          data = { detail: 'Erro inesperado no servidor.' };
        }

        if (cancelled) return;

        if (!res.ok) {
          const msg = data.detail || 'Link de confirmação inválido ou expirado.';
          setStatus('error');
          setErrorMessage(msg);
          addToast(msg, 'error');
          return;
        }

        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        localStorage.setItem('active_tab', 'courses');
        setStatus('success');
        addToast(`Conta confirmada! Bem-vindo(a), ${data.user?.name || ''}!`, 'success');

        setTimeout(() => {
          if (onVerifiedSuccess) {
            onVerifiedSuccess(data.user, data.access_token);
          } else {
            window.location.href = '/';
          }
        }, 1200);
      } catch {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage('Erro de conexão ao validar seu e-mail. Tente novamente.');
        }
      }
    };

    confirmLink();
    return () => {
      cancelled = true;
    };
  }, []);

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((platformBgColor || '').toLowerCase());

  return (
    <div
      className={`auth-page-container ${!isLightBg ? 'auth-dark-theme' : ''}`}
      style={{
        backgroundColor: platformBgColor,
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      data-testid="verify-email-page"
    >
      <div className="auth-card" style={{ textAlign: 'center', maxWidth: '440px' }}>
        {status === 'loading' && (
          <div data-testid="verify-email-loading">
            <div className="auth-logo-badge" style={{ margin: '0 auto 14px auto' }}>
              <Loader2 size={24} className="spin-icon" />
            </div>
            <h2>Confirmando sua conta...</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Aguarde um instante enquanto validamos seu e-mail e preparamos seu acesso à comunidade.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div data-testid="verify-email-success">
            <div
              className="auth-logo-badge"
              style={{
                margin: '0 auto 14px auto',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
              }}
            >
              <CheckCircle2 size={26} />
            </div>
            <h2>Conta Confirmada!</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Seu e-mail foi validado com sucesso. Redirecionando você para a comunidade...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div data-testid="verify-email-error">
            <div
              className="auth-logo-badge"
              style={{
                margin: '0 auto 14px auto',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
              }}
            >
              <AlertCircle size={26} />
            </div>
            <h2>Link Inválido ou Expirado</h2>
            <p style={{ color: '#fca5a5', fontSize: '0.9rem', marginBottom: '20px' }}>
              {errorMessage}
            </p>
            <button
              type="button"
              className="auth-submit-btn"
              onClick={() => {
                if (onBackToLogin) {
                  onBackToLogin();
                } else {
                  window.location.href = '/';
                }
              }}
              data-testid="verify-email-back-btn"
            >
              <span>Ir para o Login</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
