import React from 'react';
import { LogIn, Sparkles, ShieldCheck } from 'lucide-react';

export default function FunnelTriggerFirstLoginConfig({
  nodeId,
  data = {},
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
        Dispara automaticamente no instante em que o aluno realiza seu <strong>primeiríssimo login (1º acesso)</strong> na Área de Membros.
      </p>

      {/* Card Visual de Boas-Vindas & Primeiro Acesso */}
      <div
        style={{
          padding: '10px 12px',
          backgroundColor: '#020617',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderLeftWidth: '3px',
          borderLeftColor: '#06b6d4',
          borderRadius: '0 8px 8px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
        data-testid={`first-login-trigger-summary-${nodeId}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LogIn size={14} color="#06b6d4" />
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#67e8f9' }}>
            Boas-Vindas no 1º Acesso (Onboarding)
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#a5f3fc' }}>
          Ideal para enviar mensagem calorosa na DM, áudio de boas-vindas do mentor e orientar a assistir aos tutoriais.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: '#94a3b8' }}>
        <ShieldCheck size={11} color="#06b6d4" />
        <span>Gatilho com execução única por aluno (garantia anti-duplicação).</span>
      </div>
    </div>
  );
}
