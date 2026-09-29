import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import RegisterFormStep from './register/RegisterFormStep';
import RegisterOtpStep from './register/RegisterOtpStep';
import {
  RegisterLoadingState,
  RegisterInviteErrorState,
  RegisterSuccessState,
} from './register/RegisterStatusStates';

export default function Register({ token: initialToken, onRegisterSuccess }) {
  const [token, setToken] = useState(initialToken || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
  const { addToast } = useToast();

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

  useEffect(() => {
    let currentToken = initialToken;
    if (!currentToken) {
      const params = new URLSearchParams(window.location.search);
      currentToken = params.get('token');
      if (currentToken) setToken(currentToken);
    }

    if (currentToken) {
      setLoading(true);
      fetch(`/api/v1/auth/invites/validate?token=${currentToken}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setInviteInfo(data);
          } else {
            const err = data.detail || 'Convite inválido ou expirado.';
            setInviteError(err);
            addToast(err, 'error');
          }
        })
        .catch(() => {
          const err = 'Erro ao verificar convite.';
          setInviteError(err);
          addToast(err, 'error');
        })
        .finally(() => setLoading(false));
    } else {
      setInviteError('Nenhum código de convite informado.');
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
      const errMsg = 'As senhas digitadas não coincidem. Confirme sua senha.';
      setFormError(errMsg);
      addToast(errMsg, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          email,
          password,
          password_confirm: passwordConfirm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.detail || 'Erro ao realizar cadastro.';
        addToast(errMsg, 'error');
        throw new Error(errMsg);
      }

      setStep('verify');
      setResendCooldown(60);
      addToast('Código de verificação enviado para o seu e-mail!', 'success');
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

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.detail || 'Código inválido ou expirado.';
        addToast(errMsg, 'error');
        throw new Error(errMsg);
      }

      setSuccess(true);
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

      const data = await res.json();
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
    return <RegisterLoadingState />;
  }

  if (inviteError) {
    return <RegisterInviteErrorState inviteError={inviteError} />;
  }

  if (success) {
    return <RegisterSuccessState inviteInfo={inviteInfo} />;
  }

  if (step === 'verify') {
    return (
      <RegisterOtpStep
        email={email}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        formError={formError}
        verifying={verifying}
        onVerifyCode={handleVerifyCode}
        resending={resending}
        resendCooldown={resendCooldown}
        onResendCode={handleResendCode}
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
      onSubmit={handleSubmit}
    />
  );
}
