import React from 'react';
import {
  Calendar, Check, RotateCcw, Trash2, MessageSquare, ExternalLink,
  Video, Volume2, FileText, HelpCircle, AlertTriangle
} from 'lucide-react';

export const ISSUE_TYPE_CONFIG = {
  video: { label: 'Vídeo / Reprodução', icon: Video, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  audio: { label: 'Áudio / Som', icon: Volume2, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  material: { label: 'Material / Anexo', icon: FileText, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  content: { label: 'Conteúdo da Aula', icon: HelpCircle, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  other: { label: 'Outro Problema', icon: AlertTriangle, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' }
};

export function formatToBrasilia(dateString) {
  if (!dateString) return '';
  const isoString = dateString.endsWith('Z') || dateString.includes('+')
    ? dateString
    : `${dateString}Z`;

  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export const getRoleBadge = (role) => {
  if (role === 'superadmin') return { label: 'Super Admin', bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' };
  if (role === 'admin') return { label: 'Admin', bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
  if (role === 'aluno') return { label: 'Aluno', bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' };
  return { label: 'Usuário', bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
};

export default function LessonReportCard({
  report,
  isManager,
  isLightBg,
  textColor,
  subTextColor,
  cardBg,
  cardBorder,
  innerBg,
  innerBorder,
  actionLoadingId,
  onOpenLesson,
  onOpenDm,
  onRequestResolve,
  onToggleStatus,
  onRequestDelete
}) {
  const config = ISSUE_TYPE_CONFIG[report.issue_type] || ISSUE_TYPE_CONFIG.other;
  const Icon = config.icon;
  const isOpen = report.status === 'open';

  return (
    <div
      className="table-card lesson-report-card"
      style={{
        padding: '20px',
        borderRadius: '10px',
        backgroundColor: cardBg,
        border: isOpen ? (isLightBg ? '1px solid #fecaca' : '1px solid rgba(239, 68, 68, 0.3)') : cardBorder,
        borderLeft: isOpen ? '4px solid #ef4444' : '4px solid #10b981',
        transition: 'all 0.15s ease'
      }}
      data-testid={`report-card-${report.id}`}
    >
      {/* Linha Superior: Tipo de Problema, Status e Data */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}`, padding: '3px 9px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600 }}>
            <Icon size={13} />
            <span>{config.label}</span>
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: isOpen ? '#fef2f2' : '#ecfdf5',
              color: isOpen ? '#b91c1c' : '#047857',
              border: isOpen ? '1px solid #fca5a5' : '1px solid #a7f3d0',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600
            }}
            data-testid={`report-status-${report.id}`}
          >
            {isOpen ? 'Em Aberto' : 'Resolvido'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: subTextColor, fontSize: '12px' }}>
          <Calendar size={13} />
          <span>{formatToBrasilia(report.created_at)}</span>
        </div>
      </div>

      {/* Curso e Aula com Link para Acessar Aula */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {report.course_title ? `${report.course_title} > ` : ''}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>
            {report.lesson_title || `Aula #${report.lesson_id}`}
          </span>
        </div>

        {report.lesson_id && (
          <button
            type="button"
            onClick={() => onOpenLesson(report)}
            title="Abrir e assistir esta aula"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: isLightBg ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)',
              border: isLightBg ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.35)',
              color: isLightBg ? '#1d4ed8' : '#60a5fa',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            data-testid={`access-lesson-btn-${report.id}`}
          >
            <ExternalLink size={13} />
            <span>Acessar Aula</span>
          </button>
        )}
      </div>

      {/* Descrição do Relato */}
      <div
        style={{
          padding: '12px 14px',
          backgroundColor: innerBg,
          border: innerBorder,
          borderRadius: '6px',
          fontSize: '13px',
          color: textColor,
          lineHeight: 1.5,
          marginBottom: '14px',
          whiteSpace: 'pre-wrap'
        }}
        data-testid={`report-description-${report.id}`}
      >
        {report.description}
      </div>

      {/* Linha Inferior: Aluno, Botão de DM e Ações de Moderação */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: innerBorder, paddingTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: isLightBg ? '#eff6ff' : 'rgba(37, 99, 235, 0.2)',
              color: isLightBg ? '#2563eb' : '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            {(report.user_name || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
                {report.user_name || 'Usuário'}
              </span>
              {(() => {
                const badge = getRoleBadge(report.user_role);
                return (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '1px 8px',
                      borderRadius: '12px',
                      backgroundColor: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`
                    }}
                    data-testid={`user-role-badge-${report.id}`}
                  >
                    {badge.label}
                  </span>
                );
              })()}
            </div>
            {report.user_email && (
              <div style={{ fontSize: '11px', color: subTextColor }}>
                {report.user_email}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Botão de Contato na DM com o Aluno */}
          {report.user_id && (
            <button
              type="button"
              onClick={() => onOpenDm(report)}
              className="secondary-btn"
              title={`Iniciar conversa na DM com ${report.user_name || 'o aluno'}`}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                color: isLightBg ? '#1e293b' : '#38bdf8',
                borderColor: isLightBg ? '#cbd5e1' : 'rgba(56, 189, 248, 0.4)'
              }}
              data-testid={`dm-contact-btn-${report.id}`}
            >
              <MessageSquare size={13} color="#38bdf8" />
              <span>Contatar na DM</span>
            </button>
          )}

          {isManager && (
            <>
              <button
                type="button"
                onClick={() => (isOpen ? onRequestResolve(report) : onToggleStatus(report))}
                disabled={actionLoadingId === report.id}
                className={isOpen ? 'primary-btn' : 'secondary-btn'}
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: isOpen ? '#16a34a' : 'transparent',
                  borderColor: isOpen ? '#16a34a' : '#cbd5e1',
                  color: isOpen ? '#ffffff' : textColor
                }}
                data-testid={`toggle-status-btn-${report.id}`}
              >
                {isOpen ? (
                  <>
                    <Check size={14} />
                    <span>Marcar como Resolvido</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>Reabrir Chamado</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onRequestDelete(report)}
                className="table-action-btn btn-danger"
                title="Excluir relato"
                style={{ padding: '6px' }}
                data-testid={`delete-report-btn-${report.id}`}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
