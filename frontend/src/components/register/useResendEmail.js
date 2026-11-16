import { useState, useEffect } from 'react';

export function useResendVerificationEmail({ onError, onSuccess }) {
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resendEmail = async ({ email, inviteToken }) => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      const payload = inviteToken ? { email, invite_token: inviteToken } : { email };
      const res = await fetch('/api/v1/auth/register/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao reenviar e-mail de confirmação.');
      }
      setResendCooldown(60);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (onError) onError(err.message || 'Erro ao reenviar e-mail.');
    } finally {
      setResending(false);
    }
  };

  return { resending, resendCooldown, setResendCooldown, resendEmail };
}
