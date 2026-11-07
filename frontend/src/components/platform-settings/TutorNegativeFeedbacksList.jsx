import React from 'react';
import { AlertTriangle, Sparkles, User, Calendar, MessageSquare } from 'lucide-react';

export function formatToBrasiliaDateTime(dateString) {
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

export default function TutorNegativeFeedbacksList({
  feedbacks = [],
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  innerCardBg = 'rgba(2, 6, 23, 0.6)',
  innerCardBorder = '1px solid rgba(255, 255, 255, 0.08)'
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h5
          style={{
            margin: 0,
            fontSize: '14.5px',
            fontWeight: 700,
            color: textColor,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <AlertTriangle size={16} color="#f97316" />
          <span>Feedbacks Negativos dos Alunos & O Que Melhorar</span>
        </h5>
        <span style={{ fontSize: '12px', color: subTextColor }}>Justificativas reais enviadas pelos alunos</span>
      </div>

      {feedbacks.length === 0 ? (
        <div
          data-testid="empty-negative-feedbacks"
          style={{
            backgroundColor: innerCardBg,
            border: innerCardBorder,
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            color: '#10b981',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={16} />
          <span>Nenhuma avaliação negativa registrada! Seus alunos estão satisfeitos com as explicações.</span>
        </div>
      ) : (
        <div
          data-testid="recent-negative-feedbacks-list"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {feedbacks.map((f) => (
            <div
              key={f.message_id}
              data-testid={`feedback-item-${f.message_id}`}
              style={{
                backgroundColor: innerCardBg,
                border: '1px solid rgba(249, 115, 22, 0.25)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: textColor }}>
                  <User size={13} color="#f97316" />
                  <span>{f.student_name}</span>
                  <span style={{ color: subTextColor }}>em</span>
                  <span style={{ color: '#a855f7' }}>{f.course_title} • {f.lesson_title}</span>
                </div>
                {f.feedback_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: subTextColor }}>
                    <Calendar size={11} />
                    <span>{formatToBrasiliaDateTime(f.feedback_at)}</span>
                  </div>
                )}
              </div>

              {/* Justificativa do Aluno em Destaque */}
              <div
                style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.08)',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  color: '#fb923c',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px'
                }}
              >
                <MessageSquare size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Motivo informado pelo aluno:</strong> "{f.feedback_text}"
                </span>
              </div>

              {/* Resposta do Tutor gerada */}
              {f.answer_preview && (
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: subTextColor,
                    lineHeight: 1.5,
                    fontStyle: 'italic'
                  }}
                >
                  Resposta do Tutor: "{f.answer_preview}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
