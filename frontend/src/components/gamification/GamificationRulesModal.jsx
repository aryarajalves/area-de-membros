import React from 'react';
import { X, Award, ShieldCheck, Flame, MessageSquare, CheckCircle, HelpCircle } from 'lucide-react';

export default function GamificationRulesModal({ isOpen, onClose, rules = [] }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }}
      data-testid="rules-modal-overlay"
    >
      <div
        className="modal-container"
        style={{
          width: '100%',
          maxWidth: '600px',
          background: '#0d1527',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#f8fafc',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="gamification-rules-modal"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(234, 179, 8, 0.15)', padding: '8px', borderRadius: '10px', color: '#eab308' }}>
              <Award size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                Regras de Pontuação & Gamificação
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Veja como acumular pontos e subir de posição no ranking mensal da comunidade.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px'
            }}
            data-testid="close-rules-modal-btn"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rules.map((rule) => (
            <div
              key={rule.action}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                  {rule.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
                  {rule.description}
                </div>
                {rule.daily_limit && (
                  <div style={{ fontSize: '0.75rem', color: '#eab308', marginTop: '4px', fontWeight: 600 }}>
                    ⏱️ {rule.daily_limit}
                  </div>
                )}
              </div>
              <div
                style={{
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  color: '#facc15',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  whiteSpace: 'nowrap'
                }}
              >
                +{rule.points} pts
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '12px 16px', fontSize: '0.82rem', color: '#93c5fd', lineHeight: 1.5 }}>
          🛡️ <strong>Apenas Alunos participam:</strong> os instrutores e administradores não concorrem às vagas do pódio para garantir uma disputa saudável e justa entre os estudantes.
        </div>

        <div style={{ textAlign: 'right', marginTop: '18px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#3b82f6',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
