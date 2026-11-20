import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import RegisterFormStep from './register/RegisterFormStep';
import RegisterEmailSentStep from './register/RegisterEmailSentStep';
import {
  RegisterLoadingState,
  RegisterInviteErrorState,
  RegisterSuccessState,
} from './register/RegisterStatusStates';

import { DEFAULT_COUNTRY } from './register/countryData';

export default function Register({
  token: initialToken,
  onRegisterSuccess,
  onRedirectToHome,
  onRedirectToLogin,
}) {
  const [token, setToken] = useState(initialToken || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteError, setInviteError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formError, setFormError] = useState('');
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
      // Ignora falhas em mock de teste ou rede
    }
  }, []);

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((platformBgColor || '').toLowerCase());

  // Password rules validation
  const rules = [
    { label: 'No mínimo 12 caracteres', valid: password.length >= 12 },
    { label: 'Pelo menos 1 letra maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'Pelo menos 1 letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'Pelo menos 1 número', valid: /\d/.test(password) },
    { label: 'Pelo menos 1 caractere especial (!@#$...)', valid: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password) },
  ];

  const isPasswordValid = rules.every((r) => r.valid);
  const passwordsMatch = password.length > 0 && password === passwordConfirm;
  const digitsOnly = phone.replace(/\D/g, '');
  const isPhoneValid = selectedCountry.code === 'BR'
    ? digitsOnly.length >= 10 && digitsOnly.length <= 11
    : digitsOnly.length >= 7;

  // Contador para reenvio de código OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const redirectToHome = (message, toastType = 'info') => {
    addToast(message, toastType);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, '/');
    }
    if (onRedirectToHome) {
      onRedirectToHome();
    } else {
      window.location.href = '/';
    }
  };

  const redirectToLoginUsedInvite = (targetEmail, message = 'Sua conta já foi criada anteriormente com este convite. Faça login para acessar seus cursos.') => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    const cleanEmail = (targetEmail || '').trim();
    if (cleanEmail) {
      localStorage.setItem('prefill_login_email', cleanEmail);
    }
    addToast(message, 'info');
    const loginUrl = cleanEmail
      ? `/login?convite=usado&email=${encodeURIComponent(cleanEmail)}`
      : '/login?convite=usado';
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, loginUrl);
    }
    if (onRedirectToLogin) {
      onRedirectToLogin(loginUrl);
    } else {
      window.location.href = loginUrl;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let currentToken = initialToken;
    if (!currentToken) {
      const params = new URLSearchParams(window.location.search);
      currentToken = params.get('token');
      if (currentToken) setToken(currentToken);
    }

    const validateInviteFlow = async () => {
      if (!currentToken) {
        setInviteError('Nenhum código de convite informado.');
        return;
      }

      setLoading(true);
      try {
        // 1. Verifica sessão existente antes de validar o convite ou exibir formulário
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
          try {
            const meRes = await fetch('/api/v1/auth/me', {
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            if (!isMounted) return;
            if (meRes && meRes.ok) {
              redirectToHome('Você já está logado! Redirecionando para a tela principal...', 'info');
              return;
            }
          } catch {
            // Token inválido ou erro de rede na checagem: limpa e segue fluxo normal
          }
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }

        // 2. Valida o token de convite
        const res = await fetch(`/api/v1/auth/invites/validate?token=${currentToken}`);
        const data = await res.json();
        if (!isMounted) return;

        if (data.valid) {
          setInviteInfo(data);
        } else if (data.already_used || (data.detail && data.detail.includes('já foi utilizado'))) {
          redirectToLoginUsedInvite(data.used_by_email);
        } else if (data.is_expired || (data.detail && data.detail.includes('expirou'))) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          addToast('Este convite expirou. Solicite um novo convite ao administrador do sistema.', 'error');
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, '/login');
          }
          if (onRedirectToLogin) {
            onRedirectToLogin('/login');
          } else {
            window.location.href = '/login';
          }
        } else {
          const err = data.detail || 'Convite inválido.';
          setInviteError(err);
          addToast(err, 'error');
        }
      } catch {
        if (!isMounted) return;
        const err = 'Erro ao verificar convite.';
        setInviteError(err);
        addToast(err, 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    validateInviteFlow();
    return () => {
      isMounted = false;
    };
  }, [initialToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!isPhoneValid) {
      const errMsg = 'Por favor, informe um número de WhatsApp válido.';
      setFormError(errMsg);
      addToast(errMsg, 'error');
      return;
    }

    if (!isPasswordValid) {
      const errMsg = 'Por favor, atenda a todos os requisitos de segurança da senha.';
      setFormError(errMsg);
      addToast(errMsg, 'error');
      return;
    }

    if (!passwordsMatch) {
      const errMsg = 'As senhas digitadas não coincidem. Confirme sua senha.';
      setFormError(errMsg);
      addToast(errMsg, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formattedPhoneWithDdi = `${selectedCountry.ddi} ${phone.trim()}`;
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          email,
          phone: formattedPhoneWithDdi,
          password,
          password_confirm: passwordConfirm,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        data = { detail: res.ok ? '' : 'Erro inesperado no servidor. Tente novamente mais tarde.' };
      }
      if (!res.ok) {
        const errMsg = data.detail || 'Erro ao realizar cadastro.';
        const lowerMsg = errMsg.toLowerCase();
        const isEmailAlreadyRegistered =
          lowerMsg.includes('já existe um usuário') ||
          lowerMsg.includes('já cadastrado') ||
          lowerMsg.includes('e-mail já') ||
          lowerMsg.includes('email já');
        if (isEmailAlreadyRegistered) {
          redirectToLoginUsedInvite(
            email,
            'Este e-mail já está cadastrado! Redirecionando para a tela de login...'
          );
          return;
        }
        addToast(errMsg, 'error');
        throw new Error(errMsg);
      }

      setStep('verify');
      setResendCooldown(60);
      addToast('Link de confirmação enviado para o seu e-mail!', 'success');
    } catch (err) {
      setFormError(err.message || 'Erro ao cadastrar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setFormError('');

    if (otpCode.trim().length !== 6) {
      const errMsg = 'Por favor, insira o código de 6 dígitos.';
      setFormError(errMsg);
      addToast(errMsg, 'error');
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch('/api/v1/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: otpCode.trim(),
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        data = { detail: res.ok ? '' : 'Erro inesperado no servidor. Tente novamente mais tarde.' };
      }
      if (!res.ok) {
        const errMsg = data.detail || 'Código inválido ou expirado.';
        addToast(errMsg, 'error');
        throw new Error(errMsg);
      }

      setSuccess(true);
      localStorage.setItem('active_tab', 'courses');
      addToast('E-mail validado e conta criada com sucesso!', 'success');
      if (onRegisterSuccess) {
        setTimeout(() => {
          onRegisterSuccess();
        }, 2000);
      }
    } catch (err) {
      setFormError(err.message || 'Erro ao verificar código.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setFormError('');
    try {
      const res = await fetch('/api/v1/auth/register/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          invite_token: token,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        data = { detail: res.ok ? '' : 'Erro inesperado no servidor. Tente novamente mais tarde.' };
      }
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao reenviar código.');
      }

      addToast('Novo código enviado para seu e-mail!', 'success');
      setResendCooldown(60);
    } catch (err) {
      const errMsg = err.message || 'Erro ao reenviar código.';
      setFormError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return <RegisterLoadingState bgColor={platformBgColor} isLightBg={isLightBg} />;
  }

  if (inviteError) {
    return <RegisterInviteErrorState inviteError={inviteError} bgColor={platformBgColor} isLightBg={isLightBg} />;
  }

  if (success) {
    return <RegisterSuccessState inviteInfo={inviteInfo} bgColor={platformBgColor} isLightBg={isLightBg} />;
  }

  if (step === 'verify') {
    return (
      <RegisterEmailSentStep
        email={email}
        formError={formError}
        resending={resending}
        resendCooldown={resendCooldown}
        onResendEmail={handleResendCode}
        bgColor={platformBgColor}
        isLightBg={isLightBg}
        onBackToForm={() => {
          setStep('form');
          setOtpCode('');
          setFormError('');
        }}
      />
    );
  }

  return (
    <RegisterFormStep
      inviteInfo={inviteInfo}
      formError={formError}
      name={name}
      setName={setName}
      email={email}
      setEmail={setEmail}
      phone={phone}
      setPhone={setPhone}
      selectedCountry={selectedCountry}
      setSelectedCountry={setSelectedCountry}
      isPhoneValid={isPhoneValid}
      password={password}
      setPassword={setPassword}
      passwordConfirm={passwordConfirm}
      setPasswordConfirm={setPasswordConfirm}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      showPasswordConfirm={showPasswordConfirm}
      setShowPasswordConfirm={setShowPasswordConfirm}
      rules={rules}
      isPasswordValid={isPasswordValid}
      passwordsMatch={passwordsMatch}
      submitting={submitting}
      bgColor={platformBgColor}
      isLightBg={isLightBg}
      onSubmit={handleSubmit}
    />
  );
}
