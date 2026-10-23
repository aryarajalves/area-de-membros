import React from 'react';
import { HardDrive, Cpu, Zap, ShieldCheck } from 'lucide-react';

export default function InfrastructureResourcesTab({ hardware, alertConfig }) {
  if (!hardware) return null;

  const ramThreshold = alertConfig?.ram_alert_threshold || 80;
  const cpuThreshold = alertConfig?.cpu_alert_threshold || 85;

  const getBadgeStyle = (status) => {
    if (status === 'Crítico' || status === 'Alto') {
      return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
    }
    if (status === 'Atenção') {
      return { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' };
    }
    return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' };
  };

  const ramBadge = getBadgeStyle(hardware.ram_status);
  const cpuBadge = getBadgeStyle(hardware.cpu_status);

  return (
    <div className="infra-tab-content" data-testid="infra-resources-tab" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Grade de 3 Cards Superiores com Glassmorphism */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Card 1: Memória RAM (VPS) */}
        <div
          className="infra-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <HardDrive size={18} color="#60a5fa" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Memória RAM (VPS)</span>
              </div>
              <span
                style={{
                  background: ramBadge.bg,
                  color: ramBadge.text,
                  border: `1px solid ${ramBadge.border}`,
                  padding: '3px 11px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)',
                }}
              >
                ● {hardware.ram_status}
              </span>
            </div>

            <div style={{ fontSize: '25px', fontWeight: 800, color: '#f8fafc', marginBottom: '14px' }}>
              {hardware.ram_used_gb} GB{' '}
              <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 500 }}>/ {hardware.ram_total_gb} GB</span>{' '}
              <span style={{ fontSize: '16px', color: '#38bdf8', fontWeight: 700 }}>({hardware.ram_pct}%)</span>
            </div>

            {/* Barra de Progresso com Neon */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <div
                style={{
                  width: `${Math.min(100, hardware.ram_pct)}%`,
                  height: '100%',
                  background: hardware.ram_pct >= 90 ? 'linear-gradient(90deg, #dc2626, #ef4444)' : 'linear-gradient(90deg, #2563eb, #38bdf8)',
                  borderRadius: '10px',
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '12px' }}>
            <span>Resta livre: <strong style={{ color: '#f8fafc' }}>{hardware.ram_free_gb} GB</strong></span>
            <span>Contêiner API: <strong style={{ color: '#f8fafc' }}>{hardware.api_container_mb} MB</strong></span>
          </div>
        </div>

        {/* Card 2: Processamento (CPU) */}
        <div
          className="infra-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Cpu size={18} color="#38bdf8" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Processamento (CPU)</span>
              </div>
              <span
                style={{
                  background: cpuBadge.bg,
                  color: cpuBadge.text,
                  border: `1px solid ${cpuBadge.border}`,
                  padding: '3px 11px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                }}
              >
                ● {hardware.cpu_status}
              </span>
            </div>

            <div style={{ fontSize: '25px', fontWeight: 800, color: '#f8fafc', marginBottom: '14px' }}>
              {hardware.cpu_pct}%{' '}
              <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>({hardware.vcpus} vCPUs disponíveis)</span>
            </div>

            {/* Barra de Progresso */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <div
                style={{
                  width: `${Math.min(100, hardware.cpu_pct)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                  borderRadius: '10px',
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '12px' }}>
            <span>Alerta dispara quando o uso sustentado passar de <strong style={{ color: '#f8fafc' }}>{cpuThreshold}%</strong>.</span>
          </div>
        </div>

        {/* Card 3: Maiores Picos de Hardware (24h) */}
        <div
          className="infra-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <Zap size={18} color="#fbbf24" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Maiores Picos de Hardware (24h)</span>
            </div>
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                padding: '3px 11px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 700,
              }}
            >
              Hoje
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span style={{ color: '#94a3b8' }}>Pico Máximo de RAM:</span>
                <strong style={{ color: '#f8fafc' }}>{hardware.peak_ram_details || `${hardware.peak_ram_pct}%`}</strong>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                Registrado em: {hardware.peak_ram_recorded_at}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span style={{ color: '#94a3b8' }}>Pico Máximo de CPU:</span>
                <strong style={{ color: '#f8fafc' }}>{hardware.peak_cpu_pct}%</strong>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                Registrado em: {hardware.peak_cpu_recorded_at}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Inferior: Diretrizes de Infraestrutura */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          padding: '22px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
          <ShieldCheck size={18} color="#60a5fa" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>Diretrizes de Infraestrutura do Servidor</h4>
        </div>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1' }}>
          Todos os horários de picos acima seguem o <strong>Horário Oficial de Brasília (UTC-3)</strong>. Caso o consumo de memória RAM passe do limite configurado ({ramThreshold}%), um alerta será disparado automaticamente para evitar a sobrecarga do servidor por falta de memória (OOM Killer).
        </p>
      </div>
    </div>
  );
}
