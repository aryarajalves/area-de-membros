import React from 'react';
import {
  MessageSquare,
  Phone,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { BUDGET_TYPE_LABELS } from './freelanceApi';

export default function FreelanceJobCard({
  job,
  currentUser,
  onOpenDm,
  onEdit,
  onToggleStatus,
  onRequestDelete,
}) {
  const isClosed = job.status === 'closed';
  const isOwnJob = Number(currentUser?.id) === Number(job.user_id);

  const budgetDisplay =
    job.budget_type === 'negotiable'
      ? 'A combinar'
      : job.budget_value
        ? `${BUDGET_TYPE_LABELS[job.budget_type] || 'Valor'}: ${job.budget_value}`
        : BUDGET_TYPE_LABELS[job.budget_type] || 'A combinar';

  const whatsappDigits = (job.contact_whatsapp || '').replace(/\D/g, '');
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits.length <= 11 ? `55${whatsappDigits}` : whatsappDigits}?text=${encodeURIComponent(`Olá ${job.author?.name || ''}! Vi sua vaga "${job.title}" na Área de Membros e tenho interesse.`)}`
    : null;

  const formattedDate = job.created_at
    ? new Date(job.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return (
    <article
      data-testid={`freelance-job-card-${job.id}`}
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        border: isClosed ? '1px solid rgba(148, 163, 184, 0.16)' : '1px solid rgba(56, 189, 248, 0.22)',
        borderRadius: '14px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        opacity: isClosed ? 0.78 : 1,
        transition: 'border-color 0.2s ease, transform 0.2s ease',
      }}
    >
      {/* Cabeçalho: Autor + Badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {job.author?.avatar_url ? (
            <img
              src={job.author.avatar_url}
              alt={job.author.name}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(56, 189, 248, 0.18)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem',
                flexShrink: 0,
              }}
            >
              {(job.author?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {job.author?.name || 'Usuário'} {isOwnJob && <span style={{ color: '#38bdf8', fontSize: '0.75rem' }}>(Você)</span>}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Publicado em {formattedDate}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '3px 9px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(139, 92, 246, 0.16)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              color: '#c4b5fd',
            }}
          >
            {job.category}
          </span>
          <span
            data-testid={`freelance-job-status-${job.id}`}
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '9999px',
              backgroundColor: isClosed ? 'rgba(100, 116, 139, 0.2)' : 'rgba(16, 185, 129, 0.16)',
              border: isClosed ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(16, 185, 129, 0.35)',
              color: isClosed ? '#cbd5e1' : '#34d399',
            }}
          >
            {isClosed ? 'Encerrada' : 'Aberta'}
          </span>
        </div>
      </div>

      {/* Título e Descrição */}
      <div>
        <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
          {job.title}
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
          {job.description}
        </p>
      </div>

      {/* Metadados: Orçamento e Prazo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.8125rem', color: '#94a3b8' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#38bdf8', fontWeight: 600 }}>
          <DollarSign size={14} />
          {budgetDisplay}
        </span>
        {job.deadline && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={14} color="#94a3b8" />
            Prazo: {job.deadline}
          </span>
        )}
      </div>

      {/* Rodapé de Ações */}
      <div
        style={{
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {!isOwnJob && !isClosed && (
            <button
              type="button"
              data-testid={`freelance-dm-btn-${job.id}`}
              onClick={() => onOpenDm && onOpenDm(job.author)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                backgroundColor: 'rgba(56, 189, 248, 0.16)',
                color: '#e0f2fe',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <MessageSquare size={14} />
              <span>Chamar na DM</span>
            </button>
          )}

          {!isOwnJob && !isClosed && whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`freelance-whatsapp-btn-${job.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                backgroundColor: 'rgba(16, 185, 129, 0.14)',
                color: '#34d399',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Phone size={14} />
              <span>WhatsApp</span>
            </a>
          )}
        </div>

        {job.can_manage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <button
              type="button"
              data-testid={`freelance-toggle-status-btn-${job.id}`}
              onClick={() => onToggleStatus && onToggleStatus(job)}
              title={isClosed ? 'Reabrir vaga' : 'Marcar como encerrada'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: isClosed ? '#38bdf8' : '#34d399',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isClosed ? <RotateCcw size={13} /> : <CheckCircle2 size={13} />}
              <span>{isClosed ? 'Reabrir' : 'Encerrar'}</span>
            </button>

            <button
              type="button"
              data-testid={`freelance-edit-btn-${job.id}`}
              onClick={() => onEdit && onEdit(job)}
              title="Editar vaga"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Edit2 size={13} />
              <span>Editar</span>
            </button>

            <button
              type="button"
              data-testid={`freelance-delete-btn-${job.id}`}
              onClick={() => onRequestDelete && onRequestDelete(job)}
              title="Excluir vaga"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#fca5a5',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={13} />
              <span>Excluir</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
