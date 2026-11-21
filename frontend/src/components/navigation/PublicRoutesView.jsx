import React from 'react';
import Login from '../Login';
import Register from '../Register';
import ResetPassword from '../ResetPassword';
import VerifyEmailPage from '../VerifyEmailPage';
import CertificatePublicValidationPage from '../certificates/CertificatePublicValidationPage';
import PublicComplianceRouter from '../common/PublicComplianceRouter';

/**
 * Renderiza rotas públicas (privacidade, termos, validação de certificado,
 * verificação de e-mail, reset de senha, convite e login) quando aplicável.
 * Retorna `null` se o usuário estiver autenticado em rota privada.
 */
export default function PublicRoutesView({ pathname, setPathname, user, token, onLoginSuccess }) {
  const clearToRoot = () => {
    if (typeof window !== 'undefined') window.history.replaceState({}, document.title, '/');
    setPathname('/');
  };

  const redirectToTarget = (targetUrl = '/') => {
    if (typeof window !== 'undefined') window.history.replaceState({}, document.title, targetUrl || '/');
    setPathname(String(targetUrl || '/').split('?')[0] || '/');
  };

  if (pathname.includes('/privacidade') || pathname.includes('/termos') || pathname.includes('/excluir-conta')) {
    return <PublicComplianceRouter pathname={pathname} onBack={clearToRoot} />;
  }

  if (pathname.includes('/validar-certificado')) {
    const certCode = pathname.split('/validar-certificado/')[1]?.split('/')[0]?.split('?')[0] || '';
    return <CertificatePublicValidationPage certificateCode={certCode} onBackToPlatform={clearToRoot} />;
  }

  const isVerifyEmailPage = pathname.includes('/verify-email');
  if (isVerifyEmailPage) {
    return (
      <VerifyEmailPage
        onVerifiedSuccess={(verifiedUser, verifiedToken) => {
          clearToRoot();
          onLoginSuccess(verifiedUser, verifiedToken);
        }}
        onBackToLogin={clearToRoot}
      />
    );
  }

  const isResetPasswordPage = pathname.includes('/reset-password');
  if (isResetPasswordPage) {
    return (
      <ResetPassword
        onResetSuccess={() => { window.location.href = '/'; }}
        onRedirectToHome={redirectToTarget}
        onRedirectToLogin={redirectToTarget}
      />
    );
  }

  const isRegisterPage =
    pathname.includes('/register') ||
    (window.location.search.includes('token=') && !isResetPasswordPage && !isVerifyEmailPage);

  if (isRegisterPage) {
    return (
      <Register
        onRegisterSuccess={() => { window.location.href = '/'; }}
        onRedirectToHome={redirectToTarget}
        onRedirectToLogin={redirectToTarget}
      />
    );
  }

  if (!user || !token) {
    return <Login onLoginSuccess={onLoginSuccess} />;
  }

  return null;
}
