import React, { useState } from 'react';
import { Mail, MessageCircle, Calendar, BookOpen, ChevronDown, ChevronUp, UserCheck, Clock } from 'lucide-react';
import StudentCourseProgressItem from './StudentCourseProgressItem';
import StudentAccessHistoryModal from './StudentAccessHistoryModal';
import StudentTriggerWebhookModal from './StudentTriggerWebhookModal';
import { formatBrasiliaDateTime } from './studentDateUtils';

export default function StudentCard({ student, isLightBg }) {
  const [expanded, setExpanded] = useState(true);
  const [selectedCourseForHistory, setSelectedCourseForHistory] = useState(null);
  const [selectedCourseForWebhook, setSelectedCourseForWebhook] = useState(null);

  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.035)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  const textTitle = isLightBg ? '#0f172a' : '#f8fafc';
  const textMuted = isLightBg ? '#64748b' : '#94a3b8';

  const initial = (student.name || 'A').charAt(0).toUpperCase();

  const formatDateTime = (dateStr) => formatBrasiliaDateTime(dateStr);

  const getWhatsAppUrl = (rawPhone) => {
    if (!rawPhone) return '#';
    const digits = rawPhone.replace(/\D/g, '');
    const fullDigits = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${fullDigits}`;
  };

  return (
    <div
      className="student-card"
      style={{
        backgroundColor: cardBg,
        border: cardBorder,
        borderRadius: '12px',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: isLightBg ? '0 1px 3px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease',
      }}
      data-testid={`student-card-${student.id}`}
    >
      {/* Cabeçalho do Aluno: Avatar, Nome, E-mail, Status e Progresso Geral */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            }}
          >
            {initial}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: textTitle }}>
                {student.name}
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: student.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: student.is_active ? '#34d399' : '#f87171',
                  border: `1px solid ${student.is_active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                <UserCheck size={11} />
                {student.is_active ? 'Aluno Ativo' : 'Inativo'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '4px', fontSize: '0.82rem', color: textMuted }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={13} /> {student.email}
              </span>
              {student.phone && (
                <a
                  href={getWhatsAppUrl(student.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#22c55e',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                  title="Conversar no WhatsApp"
                  data-testid={`student-phone-${student.id}`}
                >
                  <MessageCircle size={13} /> {student.phone}
                </a>
              )}
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="Data e horário em que virou aluno"
                data-testid={`student-created-at-${student.id}`}
              >
                <Clock size={13} /> Aluno desde: {formatDateTime(student.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Resumo do Progresso Geral do Aluno */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: textMuted }}>Progresso Geral</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8' }}>
              {student.overall_progress_percent}%
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent',
              border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: textMuted,
              fontSize: '0.82rem',
              transition: 'all 0.2s ease',
            }}
            data-testid={`toggle-courses-btn-${student.id}`}
          >
            <BookOpen size={14} />
            <span>
              {student.total_courses} {student.total_courses === 1 ? 'curso' : 'cursos'}
            </span>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Lista de Cursos Vinculados com Progresso Individual */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
          {student.courses && student.courses.length > 0 ? (
            student.courses.map((course) => (
              <StudentCourseProgressItem
                key={course.course_id}
                course={course}
                isLightBg={isLightBg}
                onOpenHistory={(c) => setSelectedCourseForHistory(c)}
                onOpenTriggerWebhook={(c) => setSelectedCourseForWebhook(c)}
              />
            ))
          ) : (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                border: isLightBg ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: textMuted,
                fontSize: '0.85rem',
              }}
            >
              Nenhum curso liberado para este aluno ainda.
            </div>
          )}
        </div>
      )}

      {/* Modal de Histórico de Acesso do Aluno ao Curso */}
      <StudentAccessHistoryModal
        isOpen={Boolean(selectedCourseForHistory)}
        onClose={() => setSelectedCourseForHistory(null)}
        student={student}
        course={selectedCourseForHistory}
        isLightBg={isLightBg}
      />

      {/* Modal de Disparo Manual de Integração/Webhook */}
      <StudentTriggerWebhookModal
        isOpen={Boolean(selectedCourseForWebhook)}
        onClose={() => setSelectedCourseForWebhook(null)}
        student={student}
        course={selectedCourseForWebhook}
        isLightBg={isLightBg}
      />
    </div>
  );
}
