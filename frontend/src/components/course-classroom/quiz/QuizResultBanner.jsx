import React from 'react';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function QuizResultBanner({
  submissionResult,
  passingScore,
  onRetry,
  isLightBg,
  textColor,
  subTextColor,
  borderColor
}) {
  if (!submissionResult) return null;

  return (
    <div
      data-testid="quiz-result-banner"
      style={{
        marginBottom: '28px',
        padding: '24px',
        borderRadius: '14px',
        border: submissionResult.passed ? '1.5px solid #10b981' : '1.5px solid #f59e0b',
        backgroundColor: submissionResult.passed
          ? (isLightBg ? '#ecfdf5' : 'rgba(16, 185, 129, 0.12)')
          : (isLightBg ? '#fffbeb' : 'rgba(245, 158, 11, 0.12)'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {submissionResult.passed ? (
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={26} color="#10b981" />
          </div>
        ) : (
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={26} color="#f59e0b" />
          </div>
        )}

        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: textColor }}>
            {submissionResult.passed ? 'Parabéns! Você foi Aprovado no Quiz 🎉' : 'Quase lá! Tente Novamente'}
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: subTextColor }}>
            Você acertou <strong>{submissionResult.correct_answers}</strong> de <strong>{submissionResult.total_questions}</strong> perguntas ({submissionResult.score}%).
            {submissionResult.total_points ? (
              <span> Pontuação: <strong>{submissionResult.earned_points || 0}</strong> de <strong>{submissionResult.total_points}</strong> pontos.</span>
            ) : null}
            {submissionResult.passed ? ' Aula concluída com sucesso!' : ` Necessário no mínimo ${passingScore}% para aprovação.`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        data-testid="retry-quiz-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12.5px',
          fontWeight: 700,
          cursor: 'pointer',
          border: `1px solid ${borderColor}`,
          backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
          color: textColor
        }}
      >
        <RefreshCw size={14} />
        <span>Refazer Quiz</span>
      </button>
    </div>
  );
}
