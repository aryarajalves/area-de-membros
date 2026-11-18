import React, { useState } from 'react';
import { ShieldCheck, Trash2, ArrowLeft } from 'lucide-react';

function LegalWrapper({ title, onBack, children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', padding: '32px 16px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '760px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '28px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px' }}
        >
          <ArrowLeft size={15} /> Voltar
        </button>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

function PublicAccountDeletionPage({ onBack }) {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/v1/auth/public-account-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Erro ao enviar solicitação.');
      setFeedback({ type: 'success', text: data.message });
      setEmail('');
      setReason('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LegalWrapper title={<><Trash2 size={22} color="#f87171" /> Exclusão de Conta e Dados</>} onBack={onBack}>
      <p style={{ color: '#cbd5e1', lineHeight: 1.6, marginBottom: '18px' }}>
        Você pode excluir sua conta imediatamente dentro do aplicativo (em <strong>Configurações &gt; Meu Perfil</strong>) ou solicitar a exclusão dos seus dados pessoais por este formulário público.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>E-mail cadastrado</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#020617', color: '#f8fafc' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>Motivo (opcional)</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Informe se desejar..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: '#020617', color: '#f8fafc' }}
          />
        </div>
        {feedback && (
          <div style={{ padding: '12px', borderRadius: '10px', background: feedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: feedback.type === 'success' ? '#6ee7b7' : '#fca5a5', fontSize: '0.9rem' }}>
            {feedback.text}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{ padding: '11px 18px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}
        >
          {submitting ? 'Enviando...' : 'Solicitar Exclusão de Conta'}
        </button>
      </form>
    </LegalWrapper>
  );
}

export default function PublicComplianceRouter({ pathname, onBack }) {
  if (pathname.includes('/excluir-conta')) {
    return <PublicAccountDeletionPage onBack={onBack} />;
  }
  if (pathname.includes('/privacidade')) {
    return (
      <LegalWrapper title={<><ShieldCheck size={22} color="#38bdf8" /> Política de Privacidade</>} onBack={onBack}>
        <div style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p>Esta Política de Privacidade descreve como coletamos, usamos e protegemos os dados pessoais dos membros na plataforma.</p>
          <p><strong>1. Dados Coletados:</strong> Nome, e-mail, foto de perfil, telefone (quando informado), progresso nas aulas, publicações na comunidade e token de dispositivo para notificações push.</p>
          <p><strong>2. Finalidade:</strong> Autenticação segura, liberação de acesso aos cursos adquiridos, interação na comunidade e envio de notificações solicitadas.</p>
          <p><strong>3. Compartilhamento:</strong> Não vendemos ou compartilhamos seus dados pessoais com terceiros para fins publicitários.</p>
          <p><strong>4. Exclusão de Dados:</strong> Você pode excluir sua conta a qualquer momento em Configurações &gt; Meu Perfil ou acessando <code>/excluir-conta</code>.</p>
        </div>
      </LegalWrapper>
    );
  }
  if (pathname.includes('/termos')) {
    return (
      <LegalWrapper title={<><ShieldCheck size={22} color="#38bdf8" /> Termos de Uso e Diretrizes</>} onBack={onBack}>
        <div style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p>Ao utilizar a plataforma e sua comunidade, você concorda em manter o respeito mútuo e seguir as diretrizes de convivência.</p>
          <p><strong>1. Conteúdo Gerado por Usuários:</strong> É proibido publicar conteúdo ofensivo, spam, discurso de ódio, assédio ou material ilegal. Publicações podem ser denunciadas e usuários podem ser bloqueados ou suspensos.</p>
          <p><strong>2. Acesso Pessoal:</strong> Sua conta é individual e intransferível.</p>
        </div>
      </LegalWrapper>
    );
  }
  return null;
}
