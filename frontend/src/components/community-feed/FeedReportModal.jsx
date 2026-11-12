import React, { useState } from 'react';
import { reportFeedPost } from './communityFeedApi';
import './community-feed-modals.css';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam ou autopromoção excessiva' },
  { id: 'ofensivo', label: 'Discurso ofensivo, ódio ou assédio' },
  { id: 'conteudo_inapropriado', label: 'Conteúdo impróprio, pirataria ou ilegal' },
  { id: 'outro', label: 'Outro motivo' },
];

export default function FeedReportModal({ isOpen, onClose, postId, onReportSuccess }) {
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postId || loading) return;

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await reportFeedPost(postId, { reason, description });
      setSuccessMsg(res.message || 'Denúncia enviada com sucesso para nossa moderação.');
      if (onReportSuccess) {
        onReportSuccess(res);
      }
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 1600);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao enviar denúncia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feed-report-modal-backdrop" data-testid="feed-report-modal">
      <div className="feed-report-modal-panel">
        <div className="feed-report-modal-header">
          <div className="feed-report-header-title">
            <span className="feed-report-header-icon">⚠️</span>
            <h3>Denunciar Publicação</h3>
          </div>
          <button
            type="button"
            className="feed-report-close-x"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {successMsg ? (
          <div className="feed-report-success-state">
            <div className="feed-report-success-icon">✓</div>
            <p className="feed-report-success-text">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feed-report-form">
            <p className="feed-report-subtitle">
              Selecione o motivo da denúncia. Nossa equipe irá analisar a publicação e tomar as medidas necessárias.
            </p>

            {errorMsg && <div className="feed-report-error-alert">{errorMsg}</div>}

            <div className="feed-report-reasons-group">
              {REPORT_REASONS.map((r) => (
                <label key={r.id} className="feed-report-radio-label">
                  <input
                    type="radio"
                    name="report_reason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={loading}
                  />
                  <span className="feed-report-radio-custom" />
                  <span className="feed-report-radio-text">{r.label}</span>
                </label>
              ))}
            </div>

            <div className="feed-report-textarea-group">
              <label htmlFor="feed-report-desc">Detalhes adicionais (opcional):</label>
              <textarea
                id="feed-report-desc"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explique brevemente por que esta publicação viola as regras da comunidade..."
                disabled={loading}
              />
            </div>

            <div className="feed-report-modal-footer">
              <button
                type="button"
                className="feed-report-btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="feed-report-btn-submit"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Denúncia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
