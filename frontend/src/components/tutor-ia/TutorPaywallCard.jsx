import React from 'react';
import { Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TutorPaywallCard({
  checkoutUrl,
  monthlyPrice = 10.0,
  isLightBg = false
}) {
  const formattedPrice = Number(monthlyPrice).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const handleCheckoutClick = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      data-testid="tutor-paywall-card"
      style={{
        margin: '16px 0',
        padding: '24px 20px',
        borderRadius: '14px',
        background: isLightBg
          ? 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
          : 'linear-gradient(135deg, rgba(124, 58, 237, 0.16) 0%, rgba(59, 130, 246, 0.08) 100%)',
        border: '1.5px solid rgba(168, 85, 247, 0.45)',
        boxShadow: '0 8px 32px rgba(124, 58, 237, 0.15)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(168, 85, 247, 0.25)',
          border: '1px solid rgba(168, 85, 247, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#c084fc'
        }}
      >
        <Lock size={22} />
      </div>

      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 700, color: isLightBg ? '#4c1d95' : '#f3e8ff' }}>
          Desbloqueie o Tutor IA Ilimitado 24h
        </h4>
        <p style={{ margin: 0, fontSize: '13.5px', color: isLightBg ? '#6d28d9' : '#d8b4fe', maxWidth: '440px', lineHeight: 1.5 }}>
          Você utilizou sua cota de degustação gratuita deste mês. Tenha um professor particular 24 horas por dia respondendo todas as suas dúvidas.
        </p>
      </div>

      {/* Lista de Benefícios */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'flex-start',
          margin: '6px 0',
          fontSize: '12.5px',
          color: isLightBg ? '#475569' : '#cbd5e1'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={15} color="#10b981" />
          <span>Perguntas e dúvidas ilimitadas em todas as aulas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={15} color="#10b981" />
          <span>Respostas instantâneas com minutagem exata dos vídeos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={15} color="#10b981" />
          <span>Indicação inteligente de outras aulas do curso</span>
        </div>
      </div>

      {/* Preço e Botão */}
      <div style={{ marginTop: '4px' }}>
        <div style={{ marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', color: isLightBg ? '#64748b' : '#94a3b8' }}>Apenas </span>
          <strong style={{ fontSize: '20px', color: '#10b981' }}>{formattedPrice}</strong>
          <span style={{ fontSize: '12px', color: isLightBg ? '#64748b' : '#94a3b8' }}> / mês</span>
        </div>

        {checkoutUrl ? (
          <button
            type="button"
            onClick={handleCheckoutClick}
            data-testid="btn-tutor-paywall-subscribe"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 24px',
              borderRadius: '9px',
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(124, 58, 237, 0.45)',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={16} />
            <span>Assinar Tutor IA Ilimitado</span>
            <ArrowRight size={15} />
          </button>
        ) : (
          <span style={{ fontSize: '12px', color: isLightBg ? '#64748b' : '#94a3b8', fontStyle: 'italic' }}>
            Link de assinatura em configuração pelo instrutor.
          </span>
        )}
      </div>
    </div>
  );
}
