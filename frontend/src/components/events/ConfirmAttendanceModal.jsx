import React from 'react';
import { CalendarCheck, CalendarX, Calendar, Clock, Loader2 } from 'lucide-react';
import { formatBrasiliaDate } from './googleCalendarHelper';

export default function ConfirmAttendanceModal({
  isOpen,
  event,
  isConfirmed = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen || !event) return null;

  const formattedStart = event.start_time ? formatBrasiliaDate(event.start_time) : null;
  const formattedEnd = event.end_time ? formatBrasiliaDate(event.end_time).split('às')[1] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-attendance-modal-title"
      data-testid="confirm-attendance-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={(e) => e.stopPropagation()} // NÃO fecha ao clicar no fundo
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #131b2e, #0b1120)',
          border: isConfirmed
            ? '1px solid rgba(245, 158, 11, 0.4)'
            : '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          padding: '28px',
          boxShadow: isConfirmed
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(245, 158, 11, 0.15)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(168, 85, 247, 0.2)',
          color: '#f8fafc',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone no topo com círculo brilhante */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: isConfirmed ? 'rgba(245, 158, 11, 0.12)' : 'rgba(168, 85, 247, 0.15)',
            border: isConfirmed ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(168, 85, 247, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: isConfirmed ? '#fbbf24' : '#c084fc',
            boxShadow: isConfirmed ? '0 0 16px rgba(245, 158, 11, 0.25)' : '0 0 18px rgba(168, 85, 247, 0.3)',
          }}
        >
          {isConfirmed ? <CalendarX size={30} /> : <CalendarCheck size={30} />}
        </div>

        {/* Título */}
        <h3
          id="confirm-attendance-modal-title"
          style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: '#fff' }}
        >
          {isConfirmed ? 'Cancelar Presença no Evento' : 'Confirmar Presença no Evento'}
        </h3>

        {/* Descrição contextual */}
        <p style={{ fontSize: '0.90rem', color: '#94a3b8', marginBottom: '18px', lineHeight: '1.5' }}>
          {isConfirmed
            ? 'Você já confirmou presença neste evento. Deseja cancelar sua participação?'
            : 'Deseja confirmar sua participação nesta aula ou encontro ao vivo? Sua vaga será garantida e você terá acesso às atualizações exclusivas.'}
        </p>

        {/* Card Resumo do Evento */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '24px',
            textAlign: 'left',
          }}
        >
          <div style={{ fontWeight: '700', color: '#f1f5f9', fontSize: '0.95rem', marginBottom: '6px' }}>
            {event.title}
          </div>
          {formattedStart && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '0.82rem' }}>
              <Calendar size={14} />
              <span>
                {formattedStart}
                {formattedEnd ? ` às${formattedEnd}` : ''}
                <span style={{ color: '#94a3b8', marginLeft: '4px' }}>(Horário de Brasília)</span>
              </span>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            data-testid="cancel-attendance-modal-btn"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isConfirmed ? 'Manter Inscrição' : 'Voltar'}
          </button>

          <button
            type="button"
            data-testid="confirm-attendance-modal-btn"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 18px',
              borderRadius: '8px',
              background: isConfirmed
                ? 'linear-gradient(135deg, #d97706, #b45309)'
                : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              border: 'none',
              color: '#fff',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isConfirmed
                ? '0 4px 14px rgba(217, 119, 6, 0.35)'
                : '0 4px 14px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            <span>
              {isLoading
                ? 'Processando...'
                : isConfirmed
                ? 'Sim, Cancelar'
                : 'Sim, Confirmar Presença'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
