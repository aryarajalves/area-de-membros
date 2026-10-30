import React from 'react';
import { Clock, Calendar, Zap, CheckCircle2, Lock } from 'lucide-react';

export default function LessonReleaseSettings({
  availabilityStatus,
  setAvailabilityStatus,
  releaseType,
  setReleaseType,
  releaseDays,
  setReleaseDays,
  releaseDate,
  setReleaseDate,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  isLightBg = false,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Status Geral de Disponibilidade */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
          Status de Liberação da Aula
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setAvailabilityStatus('available')}
            data-testid="lesson-status-available-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: availabilityStatus === 'available' ? 700 : 500,
              cursor: 'pointer',
              border:
                availabilityStatus === 'available'
                  ? '1.5px solid #22c55e'
                  : isLightBg
                  ? '1px solid #e2e8f0'
                  : '1px solid rgba(255,255,255,0.12)',
              backgroundColor:
                availabilityStatus === 'available'
                  ? isLightBg
                    ? '#f0fdf4'
                    : 'rgba(34, 197, 94, 0.16)'
                  : isLightBg
                  ? '#ffffff'
                  : 'rgba(255,255,255,0.03)',
              color: availabilityStatus === 'available' ? '#22c55e' : subTextColor,
            }}
          >
            <CheckCircle2 size={15} color={availabilityStatus === 'available' ? '#22c55e' : subTextColor} />
            <span>Disponível para os Alunos</span>
          </button>

          <button
            type="button"
            onClick={() => setAvailabilityStatus('coming_soon')}
            data-testid="lesson-status-coming-soon-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: availabilityStatus === 'coming_soon' ? 700 : 500,
              cursor: 'pointer',
              border:
                availabilityStatus === 'coming_soon'
                  ? '1.5px solid #eab308'
                  : isLightBg
                  ? '1px solid #e2e8f0'
                  : '1px solid rgba(255,255,255,0.12)',
              backgroundColor:
                availabilityStatus === 'coming_soon'
                  ? isLightBg
                    ? '#fefce8'
                    : 'rgba(234, 179, 8, 0.16)'
                  : isLightBg
                  ? '#ffffff'
                  : 'rgba(255,255,255,0.03)',
              color: availabilityStatus === 'coming_soon' ? '#eab308' : subTextColor,
            }}
          >
            <Clock size={15} color={availabilityStatus === 'coming_soon' ? '#eab308' : subTextColor} />
            <span>Em Breve</span>
          </button>
        </div>
      </div>

      {/* Liberação Programada por Aula (Drip Content / 7 Dias da Garantia) */}
      <div
        data-testid="lesson-drip-settings-container"
        style={{
          padding: '12px 14px',
          borderRadius: '10px',
          backgroundColor: isLightBg ? '#f8fafc' : 'rgba(15, 23, 42, 0.65)',
          border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(234, 179, 8, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={15} style={{ color: '#eab308' }} />
          <label style={{ fontSize: '13px', fontWeight: 700, color: textColor, margin: 0 }}>
            Liberação Programada / Dias da Garantia (Drip Content da Aula)
          </label>
        </div>
        <span style={{ fontSize: '11.5px', color: subTextColor }}>
          Defina se esta aula abre imediatamente ou somente após os dias da garantia (ex: 7 dias após a matrícula).
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '2px' }}>
          <button
            type="button"
            onClick={() => setReleaseType('immediate')}
            data-testid="lesson-drip-immediate"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 6px',
              borderRadius: '8px',
              border:
                releaseType === 'immediate'
                  ? '1.5px solid #eab308'
                  : isLightBg
                  ? '1px solid #cbd5e1'
                  : '1px solid rgba(255,255,255,0.1)',
              backgroundColor:
                releaseType === 'immediate'
                  ? isLightBg
                    ? '#fef9c3'
                    : 'rgba(234, 179, 8, 0.15)'
                  : isLightBg
                  ? '#ffffff'
                  : 'rgba(30, 41, 59, 0.5)',
              color: releaseType === 'immediate' ? '#eab308' : textColor,
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
            }}
          >
            <Zap size={14} />
            <span>Imediato</span>
          </button>

          <button
            type="button"
            onClick={() => setReleaseType('days_after')}
            data-testid="lesson-drip-days-after"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 6px',
              borderRadius: '8px',
              border:
                releaseType === 'days_after'
                  ? '1.5px solid #eab308'
                  : isLightBg
                  ? '1px solid #cbd5e1'
                  : '1px solid rgba(255,255,255,0.1)',
              backgroundColor:
                releaseType === 'days_after'
                  ? isLightBg
                    ? '#fef9c3'
                    : 'rgba(234, 179, 8, 0.15)'
                  : isLightBg
                  ? '#ffffff'
                  : 'rgba(30, 41, 59, 0.5)',
              color: releaseType === 'days_after' ? '#eab308' : textColor,
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
            }}
          >
            <Clock size={14} />
            <span>Após X Dias (Garantia)</span>
          </button>

          <button
            type="button"
            onClick={() => setReleaseType('specific_date')}
            data-testid="lesson-drip-specific-date"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 6px',
              borderRadius: '8px',
              border:
                releaseType === 'specific_date'
                  ? '1.5px solid #eab308'
                  : isLightBg
                  ? '1px solid #cbd5e1'
                  : '1px solid rgba(255,255,255,0.1)',
              backgroundColor:
                releaseType === 'specific_date'
                  ? isLightBg
                    ? '#fef9c3'
                    : 'rgba(234, 179, 8, 0.15)'
                  : isLightBg
                  ? '#ffffff'
                  : 'rgba(30, 41, 59, 0.5)',
              color: releaseType === 'specific_date' ? '#eab308' : textColor,
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
            }}
          >
            <Calendar size={14} />
            <span>Data Fixa</span>
          </button>
        </div>

        {releaseType === 'days_after' && (
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: textColor }}>
              Liberar quantos dias após a entrada do aluno?
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="number"
                min={1}
                max={365}
                value={releaseDays}
                onChange={(e) => setReleaseDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="form-control-modern"
                data-testid="lesson-drip-days-input"
                style={{ width: '95px' }}
              />
              <span style={{ fontSize: '12px', color: subTextColor }}>dia(s)</span>
              {[
                { label: '7 dias (Garantia)', val: 7 },
                { label: '14 dias', val: 14 },
                { label: '30 dias', val: 30 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setReleaseDays(preset.val)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 9px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: Number(releaseDays) === preset.val ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.14)',
                    backgroundColor: Number(releaseDays) === preset.val ? 'rgba(234, 179, 8, 0.18)' : 'rgba(255,255,255,0.05)',
                    color: Number(releaseDays) === preset.val ? '#facc15' : subTextColor,
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {releaseType === 'specific_date' && (
          <div style={{ marginTop: '6px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
              Data e Hora de Liberação:
            </label>
            <input
              type="datetime-local"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="form-control-modern"
              data-testid="lesson-drip-date-input"
              style={{ maxWidth: '240px' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
