import React from 'react';
import { Globe, Wrench, Shield, AlertTriangle } from 'lucide-react';

const ACCESS_MODES = [
  {
    id: 'public',
    title: 'Liberado para Todos',
    badge: 'Público',
    badgeColor: '#10b981',
    description: 'Alunos e administradores podem interagir livremente com o Tutor IA nas aulas.',
    icon: Globe
  },
  {
    id: 'maintenance',
    title: 'Modo Manutenção',
    badge: 'Em Manutenção',
    badgeColor: '#f59e0b',
    description: 'Chat fica visível para os alunos informando manutenção (envio bloqueado). Admins mantêm acesso para testes.',
    icon: Wrench
  },
  {
    id: 'private_team',
    title: 'Oculto / Privado',
    badge: 'Apenas Equipe',
    badgeColor: '#8b5cf6',
    description: 'A aba do Tutor IA fica completamente oculta para os alunos. Visível apenas para Super Admin e Admins.',
    icon: Shield
  }
];

export default function TutorAccessModeSection({
  accessMode = 'public',
  onChangeAccessMode,
  maintenanceMessage = '',
  onChangeMaintenanceMessage,
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)'
}) {
  return (
    <div
      data-testid="tutor-access-mode-section"
      style={{
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: cardBg,
        border: cardBorder,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textColor }}>
            Modo de Acesso & Visibilidade
          </h4>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: accessMode === 'maintenance' ? 'rgba(245, 158, 11, 0.15)' : accessMode === 'private_team' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: accessMode === 'maintenance' ? '#f59e0b' : accessMode === 'private_team' ? '#a78bfa' : '#34d399',
              border: `1px solid ${accessMode === 'maintenance' ? 'rgba(245, 158, 11, 0.3)' : accessMode === 'private_team' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}
          >
            {accessMode === 'maintenance' ? '🛠️ Manutenção Ativa' : accessMode === 'private_team' ? '🔒 Privado (Equipe)' : '✨ Aberto para Alunos'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '12.5px', color: subTextColor }}>
          Escolha como a aba e o chat do Tutor IA serão exibidos para os alunos na sala de aula.
        </p>
      </div>

      {/* Grid com os 3 Modos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}
      >
        {ACCESS_MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = accessMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChangeAccessMode(mode.id)}
              data-testid={`btn-access-mode-${mode.id}`}
              style={{
                textAlign: 'left',
                padding: '14px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                backgroundColor: isSelected
                  ? isLightBg ? '#eff6ff' : 'rgba(124, 58, 237, 0.15)'
                  : isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                border: isSelected
                  ? '1.5px solid #a855f7'
                  : isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isSelected ? '0 0 14px rgba(168, 85, 247, 0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={16} color={isSelected ? '#c084fc' : subTextColor} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? textColor : subTextColor }}>
                    {mode.title}
                  </span>
                </div>
                {isSelected && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }} />
                )}
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: subTextColor, lineHeight: 1.45 }}>
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Mensagem personalizada se Modo Manutenção estiver selecionado */}
      {accessMode === 'maintenance' && (
        <div
          data-testid="maintenance-message-config"
          style={{
            marginTop: '4px',
            padding: '14px',
            borderRadius: '8px',
            backgroundColor: isLightBg ? '#fffbeb' : 'rgba(245, 158, 11, 0.08)',
            border: isLightBg ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} color="#f59e0b" />
            <label
              htmlFor="maintenance-message-input"
              style={{ fontSize: '12.5px', fontWeight: 700, color: isLightBg ? '#92400e' : '#fbbf24' }}
            >
              Mensagem de Manutenção exibida no chat:
            </label>
          </div>
          <textarea
            id="maintenance-message-input"
            rows={2}
            value={maintenanceMessage}
            onChange={(e) => onChangeMaintenanceMessage(e.target.value)}
            placeholder="Ex: O Tutor IA está passando por uma manutenção preventiva para melhorias. O envio de dúvidas voltará em breve!"
            data-testid="input-maintenance-message"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.35)',
              color: textColor,
              fontSize: '12.5px',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <span style={{ fontSize: '11px', color: isLightBg ? '#b45309' : '#d97706' }}>
            Esta mensagem será mostrada no topo do chat e como aviso quando o aluno tentar digitar.
          </span>
        </div>
      )}
    </div>
  );
}
