import React, { useState, useEffect } from 'react';
import { CheckCircle2, Star, Flag, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function LessonActionToolbar({
  courseId,
  lessonId,
  isCompleted = false,
  onToggleComplete,
  currentUser
}) {
  const { addToast } = useToast();
  const [ratingData, setRatingData] = useState({ user_rating: 0, average_rating: 0, total_ratings: 0 });
  const [hoverRating, setHoverRating] = useState(0);
  const [savingRating, setSavingRating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportIssueType, setReportIssueType] = useState('video');
  const [reportDescription, setReportDescription] = useState('');
  const [sendingReport, setSendingReport] = useState(false);
  const [togglingProgress, setTogglingProgress] = useState(false);

  // Busca avaliação da aula
  useEffect(() => {
    if (!courseId || !lessonId) return;

    const fetchRating = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/rating`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setRatingData(data);
        }
      } catch (err) {
        console.error('Erro ao buscar avaliação da aula:', err);
      }
    };

    fetchRating();
  }, [courseId, lessonId]);

  // Alterna status de aula assistida
  const handleToggleComplete = async () => {
    if (togglingProgress) return;
    setTogglingProgress(true);
    try {
      const nextStatus = !isCompleted;
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ is_completed: nextStatus })
      });

      if (res.ok) {
        if (onToggleComplete) onToggleComplete(lessonId, nextStatus);
        addToast(
          nextStatus ? 'Aula marcada como concluída! Parabéns!' : 'Aula marcada como não assistida.',
          'success'
        );
      } else {
        addToast('Não foi possível atualizar o progresso da aula.', 'error');
      }
    } catch (err) {
      console.error('Erro ao alternar progresso:', err);
      addToast('Erro ao atualizar o progresso.', 'error');
    } finally {
      setTogglingProgress(false);
    }
  };

  // Salva avaliação por estrelas
  const handleRate = async (stars) => {
    if (savingRating) return;
    const newRating = ratingData.user_rating === stars ? 0 : stars;
    setSavingRating(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ rating: newRating })
      });

      if (res.ok) {
        const data = await res.json();
        setRatingData(data);
        addToast(
          newRating > 0 ? `Avaliação de ${newRating} estrelas registrada!` : 'Avaliação removida.',
          'success'
        );
      } else {
        addToast('Erro ao salvar avaliação.', 'error');
      }
    } catch (err) {
      console.error('Erro ao avaliar aula:', err);
      addToast('Erro de conexão ao avaliar.', 'error');
    } finally {
      setSavingRating(false);
    }
  };

  // Envia reporte de problema
  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportDescription.trim()) {
      addToast('Por favor, descreva o problema encontrado.', 'error');
      return;
    }

    setSendingReport(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          issue_type: reportIssueType,
          description: reportDescription.trim()
        })
      });

      if (res.ok) {
        addToast('Problema reportado com sucesso! A equipe irá analisar.', 'success');
        setShowReportModal(false);
        setReportDescription('');
      } else {
        const errorData = await res.json().catch(() => ({}));
        addToast(errorData.detail || 'Erro ao enviar relato.', 'error');
      }
    } catch (err) {
      console.error('Erro ao reportar problema:', err);
      addToast('Erro de conexão ao enviar relato.', 'error');
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '18px 0',
        backgroundColor: 'transparent',
        borderTop: '1px dashed rgba(148, 163, 184, 0.2)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
        marginTop: '24px',
        marginBottom: '20px'
      }}
      data-testid="lesson-action-toolbar"
    >
      {/* 1. Avaliação de 0 a 5 Estrelas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            padding: '5px 12px'
          }}
          data-testid="star-rating-container"
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoverRating || ratingData.user_rating) >= star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={savingRating}
                title={`Avaliar com ${star} estrela${star > 1 ? 's' : ''}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  lineHeight: 0
                }}
                data-testid={`star-btn-${star}`}
              >
                <Star
                  size={17}
                  color={isFilled ? '#eab308' : '#64748b'}
                  fill={isFilled ? '#eab308' : 'none'}
                  style={{ transition: 'all 0.1s ease' }}
                />
              </button>
            );
          })}
        </div>

        {ratingData.total_ratings > 0 ? (
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }} data-testid="lesson-rating-stats">
            {ratingData.average_rating} ({ratingData.total_ratings} {ratingData.total_ratings === 1 ? 'avaliação' : 'avaliações'})
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Avaliar aula
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* 2. Botão de Relatar Problema */}
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '999px',
            fontSize: '12.5px',
            fontWeight: 600,
            color: '#94a3b8',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            cursor: 'pointer'
          }}
          data-testid="open-report-issue-btn"
          title="Relatar algum problema nesta aula"
        >
          <Flag size={13} color="#ef4444" />
          <span>Relatar Problema</span>
        </button>

        {/* 3. Botão de Conclusão da Aula (Pílula Verde Estilo Referência) */}
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={togglingProgress}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: togglingProgress ? 'wait' : 'pointer',
            border: isCompleted ? '1px solid rgba(34, 197, 94, 0.6)' : '1px solid rgba(34, 197, 94, 0.4)',
            backgroundColor: isCompleted ? 'rgba(34, 197, 94, 0.22)' : 'rgba(34, 197, 94, 0.14)',
            color: '#4ade80',
            transition: 'all 0.15s ease'
          }}
          data-testid="toggle-lesson-complete-btn"
        >
          <span>{isCompleted ? 'Aula Concluída' : 'Marcar como Assistida'}</span>
          <CheckCircle2
            size={15}
            color="#4ade80"
            style={{ transition: 'color 0.15s ease' }}
          />
        </button>
      </div>

      {/* Modal de Relato de Problema */}
      {showReportModal && (
        <div
          className="custom-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200
          }}
          data-testid="lesson-report-modal"
        >
          <div
            className="table-card"
            style={{
              maxWidth: '460px',
              width: '90%',
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: '#ffffff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                  Relatar Problema na Aula
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="table-action-btn"
                style={{ border: 'none', background: 'transparent' }}
                data-testid="close-report-modal-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendReport}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Qual tipo de problema você encontrou?
                </label>
                <select
                  value={reportIssueType}
                  onChange={(e) => setReportIssueType(e.target.value)}
                  className="form-control-modern"
                  style={{ fontSize: '12.5px', padding: '8px 10px' }}
                  data-testid="report-issue-type-select"
                >
                  <option value="video">Vídeo não carrega / trava</option>
                  <option value="audio">Áudio baixo / com ruído</option>
                  <option value="material">Material ou anexo com erro / link quebrado</option>
                  <option value="content">Dúvida ou erro no conteúdo apresentado</option>
                  <option value="other">Outro problema</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Descrição detalhada *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explique o que aconteceu, tempo do vídeo onde ocorre a falha, etc..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="form-control-modern"
                  style={{ fontSize: '12.5px', padding: '8px 10px', resize: 'vertical' }}
                  data-testid="report-description-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowReportModal(false)}
                  disabled={sendingReport}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  style={{ backgroundColor: '#ef4444' }}
                  disabled={sendingReport}
                  data-testid="submit-report-btn"
                >
                  {sendingReport ? 'Enviando...' : 'Enviar Relato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
