import React from 'react';
import { Star, CheckCircle, XCircle, Trash2, Edit3, Bookmark, User, Clock } from 'lucide-react';

export default function TestimonialCard({
  testimonial,
  currentUser,
  onEdit,
  onDelete,
  onModerate,
  onToggleFeature
}) {
  const isManager = ['admin', 'superadmin'].includes(currentUser?.role);
  const isOwner = testimonial.user_id === currentUser?.id;

  const statusConfig = {
    pending: { label: 'Aguardando Moderação', bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: 'rgba(234, 179, 8, 0.3)' },
    approved: { label: 'Aprovado', bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
    rejected: { label: 'Rejeitado', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' }
  };

  const statusInfo = statusConfig[testimonial.status] || statusConfig.pending;

  const formattedDate = testimonial.created_at
    ? new Date(testimonial.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '';

  return (
    <div
      className="testimonial-card"
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        border: testimonial.is_featured
          ? '1px solid rgba(234, 179, 8, 0.45)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: testimonial.is_featured
          ? '0 10px 25px -5px rgba(234, 179, 8, 0.15)'
          : '0 10px 20px -5px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        transition: 'all 0.2s ease-in-out'
      }}
      data-testid={`testimonial-card-${testimonial.id}`}
    >
      {/* Top Header: Autor + Badge Curso + Status */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {testimonial.user?.avatar_url ? (
              <img
                src={testimonial.user.avatar_url}
                alt={testimonial.user.name}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(59, 130, 246, 0.4)'
                }}
                data-testid="author-avatar-img"
              />
            ) : (
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}
              >
                {testimonial.user?.name ? testimonial.user.name.charAt(0).toUpperCase() : <User size={20} />}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>
                {testimonial.user?.name || 'Aluno'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
                background: statusInfo.bg,
                color: statusInfo.color,
                border: `1px solid ${statusInfo.border}`
              }}
              data-testid="testimonial-status-badge"
            >
              {statusInfo.label}
            </span>

            {testimonial.is_featured && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(234, 179, 8, 0.2)',
                  color: '#facc15',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                data-testid="testimonial-featured-badge"
              >
                ⭐ Destaque
              </span>
            )}
          </div>
        </div>

        {/* Curso Referenciado */}
        <div style={{ marginBottom: '12px' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}
          >
            📚 {testimonial.course?.title || 'Curso'}
          </span>
        </div>

        {/* Estrelas */}
        <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }} data-testid="card-stars">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={18}
              fill={s <= testimonial.rating ? '#eab308' : 'none'}
              color={s <= testimonial.rating ? '#eab308' : '#475569'}
            />
          ))}
        </div>

        {/* Título (se houver) */}
        {testimonial.title && (
          <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
            "{testimonial.title}"
          </h4>
        )}

        {/* Conteúdo do Relato */}
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '0.88rem',
            color: '#cbd5e1',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}
        >
          {testimonial.content}
        </p>
      </div>

      {/* Rodapé / Ações */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {/* Ações de Moderação (Admin) */}
        {isManager && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {testimonial.status !== 'approved' && (
              <button
                type="button"
                onClick={() => onModerate(testimonial.id, 'approved')}
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#4ade80',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                data-testid={`approve-btn-${testimonial.id}`}
              >
                <CheckCircle size={14} /> Aprovar
              </button>
            )}

            {testimonial.status !== 'rejected' && (
              <button
                type="button"
                onClick={() => onModerate(testimonial.id, 'rejected')}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                data-testid={`reject-btn-${testimonial.id}`}
              >
                <XCircle size={14} /> Rejeitar
              </button>
            )}

            <button
              type="button"
              onClick={() => onToggleFeature(testimonial.id, !testimonial.is_featured)}
              style={{
                background: testimonial.is_featured ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: testimonial.is_featured ? '#facc15' : '#94a3b8',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              data-testid={`feature-btn-${testimonial.id}`}
            >
              <Bookmark size={14} /> {testimonial.is_featured ? 'Remover Destaque' : 'Destacar'}
            </button>
          </div>
        )}

        {/* Ações de Edição e Exclusão do Autor */}
        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
          {isOwner && (
            <button
              type="button"
              onClick={() => onEdit(testimonial)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              data-testid={`edit-testimonial-btn-${testimonial.id}`}
            >
              <Edit3 size={14} /> Editar
            </button>
          )}

          {(isOwner || isManager) && (
            <button
              type="button"
              onClick={() => onDelete(testimonial)}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              data-testid={`delete-testimonial-btn-${testimonial.id}`}
            >
              <Trash2 size={14} /> Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
