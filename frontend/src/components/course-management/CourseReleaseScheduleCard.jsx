import React from 'react';
import { Unlock, Lock, Calendar } from 'lucide-react';

/**
 * Converte uma string ISO (ou Date) para o formato aceito por input[type="datetime-local"] (YYYY-MM-DDTHH:mm)
 * no fuso horário local do navegador.
 */
export function toDatetimeLocalValue(isoString) {
  if (!isoString) return '';
  try {
    const dt = new Date(isoString);
    if (Number.isNaN(dt.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth() + 1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const min = pad(dt.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch {
    return '';
  }
}

/**
 * Formata uma data ISO para exibição amigável em PT-BR (DD/MM/AAAA às HH:MM).
 */
export function formatReleaseDateTimePtBr(isoString) {
  if (!isoString) return '';
  try {
    const dt = new Date(isoString);
    if (Number.isNaN(dt.getTime())) return '';
    const datePart = dt.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timePart = dt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${datePart} às ${timePart}`;
  } catch {
    return '';
  }
}

export default function CourseReleaseScheduleCard({
  releaseType = 'immediate',
  setReleaseType,
  releaseDate = '',
  setReleaseDate,
  isLightBg = false,
  textColor = '#f8fafc'
}) {
  if (typeof setReleaseType !== 'function') return null;

  const currentType = releaseType || 'immediate';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';

  const options = [
    {
      value: 'immediate',
      label: 'Liberado Normalmente',
      subtitle: 'Alunos matriculados acessam imediatamente',
      icon: Unlock,
      activeColor: '#22c55e',
      activeBg: 'rgba(34, 197, 94, 0.14)',
      activeBorder: 'rgba(34, 197, 94, 0.45)'
    },
    {
      value: 'closed',
      label: 'Fechar para Todos os Alunos',
      subtitle: 'Bloqueia o acesso de todos os alunos até você liberar',
      icon: Lock,
      activeColor: '#ef4444',
      activeBg: 'rgba(239, 68, 68, 0.14)',
      activeBorder: 'rgba(239, 68, 68, 0.45)'
    },
    {
      value: 'specific_date',
      label: 'Liberar em Data e Hora',
      subtitle: 'Fecha agora e abre automaticamente na data programada',
      icon: Calendar,
      activeColor: '#f59e0b',
      activeBg: 'rgba(245, 158, 11, 0.14)',
      activeBorder: 'rgba(245, 158, 11, 0.45)'
    }
  ];

  const activeOption = options.find((o) => o.value === currentType) || options[0];

  return (
    <div
      data-testid="course-release-schedule-card"
      style={{
        padding: '13px 14px',
        marginTop: '10px',
        borderRadius: '10px',
        backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${activeOption.activeBorder}`,
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Status de Liberação do Curso para Alunos</span>
            <span
              data-testid="course-release-status-badge"
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 8px',
                borderRadius: '999px',
                backgroundColor: activeOption.activeBg,
                color: activeOption.activeColor,
                border: `1px solid ${activeOption.activeBorder}`
              }}
            >
              {currentType === 'immediate' && 'Liberado'}
              {currentType === 'closed' && 'Fechado p/ Todos'}
              {currentType === 'specific_date' && 'Agendado'}
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: subTextColor, marginTop: '2px' }}>
            Controle se o curso está aberto aos alunos matriculados, trancado temporariamente ou com estreia agendada.
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '8px'
        }}
      >
        {options.map((opt) => {
          const IconComponent = opt.icon;
          const isSelected = currentType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`course-release-option-${opt.value}`}
              onClick={() => setReleaseType(opt.value)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '4px',
                padding: '9px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                backgroundColor: isSelected
                  ? opt.activeBg
                  : (isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.55)'),
                border: isSelected
                  ? `1.5px solid ${opt.activeBorder}`
                  : (isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'),
                color: textColor,
                transition: 'all 0.18s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: isSelected ? opt.activeColor : textColor }}>
                <IconComponent size={14} />
                <span>{opt.label}</span>
              </div>
              <span style={{ fontSize: '10.5px', color: subTextColor, lineHeight: 1.3 }}>
                {opt.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {currentType === 'specific_date' && (
        <div
          data-testid="course-release-datetime-wrapper"
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <label
            htmlFor="course-release-datetime-input"
            style={{ fontSize: '12px', fontWeight: 600, color: textColor, margin: 0 }}
          >
            Data e Hora de Liberação Automática *
          </label>
          <input
            id="course-release-datetime-input"
            type="datetime-local"
            data-testid="course-release-datetime-input"
            value={releaseDate || ''}
            onChange={(e) => setReleaseDate && setReleaseDate(e.target.value)}
            style={{
              padding: '8px 11px',
              borderRadius: '8px',
              fontSize: '13px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
              color: textColor,
              border: '1px solid rgba(245, 158, 11, 0.45)',
              colorScheme: isLightBg ? 'light' : 'dark'
            }}
          />
          <span style={{ fontSize: '11px', color: subTextColor }}>
            Enquanto essa data e hora não chegarem, todos os alunos verão o curso com cadeado informando o horário exato de liberação.
          </span>
        </div>
      )}
    </div>
  );
}
