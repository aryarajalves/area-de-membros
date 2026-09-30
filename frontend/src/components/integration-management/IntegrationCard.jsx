import React, { useState } from 'react';
import {
  Webhook, Send, History, Edit2, Trash2,
  ShieldCheck, Copy, Check, Loader2, BookOpen
} from 'lucide-react';

const EVENT_LABELS = {
  'course.progress.25': '25% Curso',
  'course.progress.50': '50% Curso',
  'course.progress.75': '75% Curso',
  'course.progress.100': '100% Concluído',
  'lesson.completed': 'Aula Assistida',
  'student.enrolled': 'Matrícula',
  'course.renewal.warning_7d': 'Aviso Renovação (7d)',
  'course.renewal.expired': 'Renovação do Curso',
};

export default function IntegrationCard({
  wh,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
  testingId,
  onTest,
  onOpenLogs,
  onEdit,
  onDeletePrompt,
  onCopyUrl,
  copiedId,
}) {
  return (
    <div
      style={{
        backgroundColor: cardBg,
        border: cardBorder,
        borderRadius: '12px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 0.2s ease',
      }}
      data-testid={`integration-card-${wh.id}`}
    >
      {/* Topo do Card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: wh.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: wh.is_active ? '#34d399' : '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Webhook size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: textColor }}>
                {wh.name}
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '20px',
                  backgroundColor: wh.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: wh.is_active ? '#34d399' : '#f87171',
                  border: wh.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                {wh.is_active ? 'Ativa' : 'Inativa'}
              </span>
              {wh.secret_key && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#34d399',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                  title="Assinatura HMAC ativa"
                >
                  <ShieldCheck size={12} /> HMAC
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: subTextColor, fontFamily: 'monospace' }}>
                {wh.url}
              </span>
              <button
                type="button"
                onClick={() => onCopyUrl(wh.url, wh.id)}
                style={{ background: 'none', border: 'none', color: subTextColor, cursor: 'pointer', padding: 0 }}
                title="Copiar URL"
                data-testid={`copy-url-btn-${wh.id}`}
              >
                {copiedId === wh.id ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onTest(wh)}
            disabled={testingId === wh.id}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: testingId === wh.id ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            data-testid={`test-webhook-btn-${wh.id}`}
          >
            {testingId === wh.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Testar
          </button>

          <button
            type="button"
            onClick={() => onOpenLogs(wh)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: textColor,
              border: cardBorder,
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            data-testid={`view-logs-btn-${wh.id}`}
          >
            <History size={13} />
            Logs ({wh.total_dispatches})
          </button>

          <button
            type="button"
            onClick={() => onEdit(wh)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: subTextColor,
              border: cardBorder,
              cursor: 'pointer',
            }}
            title="Editar"
            data-testid={`edit-integration-btn-${wh.id}`}
          >
            <Edit2 size={14} />
          </button>

          <button
            type="button"
            onClick={() => onDeletePrompt(wh.id)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              cursor: 'pointer',
            }}
            title="Excluir"
            data-testid={`delete-integration-btn-${wh.id}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Informações de Eventos e Cursos */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <span style={{ fontSize: '0.78rem', color: subTextColor, display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px' }}>
          <BookOpen size={13} /> {wh.course_title || 'Todos os Cursos'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
        {wh.events.map((ev) => (
          <span
            key={ev}
            style={{
              fontSize: '0.74rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: ev.includes('100')
                ? 'rgba(168, 85, 247, 0.15)'
                : ev.includes('75')
                ? 'rgba(59, 130, 246, 0.15)'
                : ev.includes('50')
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
              color: ev.includes('100')
                ? '#c084fc'
                : ev.includes('75')
                ? '#60a5fa'
                : ev.includes('50')
                ? '#34d399'
                : '#fbbf24',
            }}
          >
            {EVENT_LABELS[ev] || ev}
          </span>
        ))}
      </div>
    </div>
  );
}
