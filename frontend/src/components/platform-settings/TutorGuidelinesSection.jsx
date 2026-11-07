import React from 'react';
import { ShieldCheck, Ban, CheckCircle2, ExternalLink, HelpCircle } from 'lucide-react';
import ExpandableTextarea from '../common/ExpandableTextarea';

export default function TutorGuidelinesSection({
  allowedTopics = '',
  onChangeAllowedTopics,
  prohibitedTopics = '',
  onChangeProhibitedTopics,
  redirectAppUrl = '',
  onChangeRedirectAppUrl,
  redirectAppName = '',
  onChangeRedirectAppName,
  prohibitedResponseGuideline = '',
  onChangeProhibitedResponseGuideline,
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)'
}) {
  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: cardBorder,
    backgroundColor: isLightBg ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
    color: textColor,
    fontSize: '13px',
    outline: 'none'
  };

  return (
    <div
      data-testid="tutor-guidelines-section"
      style={{
        padding: '24px',
        borderRadius: '12px',
        backgroundColor: cardBg,
        border: cardBorder,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}
        >
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: textColor }}>
            Regras de Conduta: O que é Permitido vs Proibido
          </h4>
          <span style={{ fontSize: '12.5px', color: subTextColor }}>
            Controle com precisão quais assuntos a IA pode ensinar e quais temas ela é expressamente proibida de responder.
          </span>
        </div>
      </div>

      {/* Grid: Permitido vs Proibido */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Card Permitido */}
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: isLightBg ? '#f0fdf4' : 'rgba(16, 185, 129, 0.06)',
            border: isLightBg ? '1px solid #bbf7d0' : '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: isLightBg ? '#166534' : '#34d399' }}>
              O que o Tutor PODE responder (Escopo Permitido):
            </span>
          </div>
          <ExpandableTextarea
            id="allowed_topics"
            name="allowed_topics"
            value={allowedTopics}
            onChange={(val) => onChangeAllowedTopics(typeof val === 'string' ? val : val?.target?.value ?? val)}
            label=""
            rows={5}
            cardBorder={cardBorder}
            cardBg={isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.35)'}
            isLightBg={isLightBg}
            textColor={textColor}
            subTextColor={subTextColor}
            testId="textarea-allowed-topics"
            placeholder="Ex: Tirar dúvidas sobre os conceitos das aulas gravadas, resumir conteúdos, explicar glossário e termos técnicos da astrologia..."
          />
          <span style={{ fontSize: '11px', color: isLightBg ? '#15803d' : '#6ee7b7' }}>
            Diretrizes do escopo oficial de atuação do assistente na plataforma.
          </span>
        </div>

        {/* Card Proibido */}
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: isLightBg ? '#fef2f2' : 'rgba(239, 68, 68, 0.06)',
            border: isLightBg ? '1px solid #fecaca' : '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Ban size={16} color="#ef4444" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: isLightBg ? '#991b1b' : '#f87171' }}>
              O que o Tutor É PROIBIDO de responder:
            </span>
          </div>
          <ExpandableTextarea
            id="prohibited_topics"
            name="prohibited_topics"
            value={prohibitedTopics}
            onChange={(val) => onChangeProhibitedTopics(typeof val === 'string' ? val : val?.target?.value ?? val)}
            label=""
            rows={5}
            cardBorder={cardBorder}
            cardBg={isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.35)'}
            isLightBg={isLightBg}
            textColor={textColor}
            subTextColor={subTextColor}
            testId="textarea-prohibited-topics"
            placeholder="Ex: Proibido interpretar trânsitos astrológicos personalizados, prever acontecimentos de vida ou ler mapas astrais completos dos alunos..."
          />
          <span style={{ fontSize: '11px', color: isLightBg ? '#b91c1c' : '#fca5a5' }}>
            Ao detectar esses tópicos, a IA recusa e direciona o aluno para o app especializado.
          </span>
        </div>
      </div>

      {/* Redirecionamento para App ou Agente Especializado */}
      <div
        style={{
          padding: '16px',
          borderRadius: '10px',
          backgroundColor: isLightBg ? '#eff6ff' : 'rgba(59, 130, 246, 0.07)',
          border: isLightBg ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExternalLink size={16} color="#3b82f6" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: isLightBg ? '#1e40af' : '#60a5fa' }}>
            Aplicativo / Agente Dedicado para Redirecionamento de Trânsitos e Temas Proibidos:
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
              Nome do Aplicativo / Agente Especialista:
            </label>
            <input
              type="text"
              value={redirectAppName}
              onChange={(e) => onChangeRedirectAppName(e.target.value)}
              placeholder="Ex: App de Trânsitos Astrológicos, Agente de Trânsitos..."
              data-testid="input-redirect-app-name"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
              Link de Acesso do Aplicativo (URL):
            </label>
            <input
              type="url"
              value={redirectAppUrl}
              onChange={(e) => onChangeRedirectAppUrl(e.target.value)}
              placeholder="https://app.seusite.com/transitos ou link direto"
              data-testid="input-redirect-app-url"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
            Instrução Personalizada de Resposta ao Recusar (Opcional):
          </label>
          <input
            type="text"
            value={prohibitedResponseGuideline}
            onChange={(e) => onChangeProhibitedResponseGuideline(e.target.value)}
            placeholder="Ex: Explique com simpatia que você cuida das aulas e oriente o aluno a abrir nosso aplicativo de trânsitos no link..."
            data-testid="input-prohibited-guideline"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}
