import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { appealStrike } from './communityStrikesApi';
import './community-feed-appeals.css';

export default function FeedUserStrikesModal({
  isOpen,
  strikesStatus,
  onClose,
  onStrikeAppealed,
}) {
  const { addToast } = useToast();
  const [appealingStrikeId, setAppealingStrikeId] = useState(null);
  const [appealReason, setAppealReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !strikesStatus) return null;

  const { strikes_count, is_banned, strikes = [] } = strikesStatus;

  const handleStartAppeal = (strikeId) => {
    setAppealingStrikeId(strikeId);
    setAppealReason('');
  };

  const handleCancelAppeal = () => {
    setAppealingStrikeId(null);
    setAppealReason('');
  };

  const handleSubmitAppeal = async (strikeId) => {
    if (!appealReason.trim() || appealReason.trim().length < 5) {
      addToast('Por favor, escreva uma justificativa com no mínimo 5 caracteres.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedStrike = await appealStrike(strikeId, appealReason.trim());
      addToast('Recurso enviado com sucesso! A moderação analisará seu pedido.', 'success');
      handleCancelAppeal();
      if (onStrikeAppealed) {
        onStrikeAppealed(updatedStrike);
      }
    } catch (err) {
      addToast(err.message || 'Erro ao enviar recurso.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="feed-strikes-modal-backdrop"
      data-testid="feed-user-strikes-modal"
      onClick={(e) => {
        // Regra UX: não fecha ao clicar no fundo
        e.stopPropagation();
      }}
    >
      <div className="feed-strikes-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="feed-strikes-modal-header">
          <div className="feed-strikes-modal-badge">
            <ShieldAlert size={16} />
            <span>Sistema de 3 Strikes</span>
          </div>
          <button
            type="button"
            className="feed-strikes-modal-close-btn"
            onClick={onClose}
            title="Fechar"
            data-testid="feed-strikes-modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Título e Barra de Progresso de Strikes */}
        <div className="feed-strikes-modal-title-wrap">
          <h2 className="feed-strikes-modal-title" data-testid="feed-strikes-modal-title">
            {is_banned
              ? 'Conta Banida da Comunidade'
              : `Você possui ${strikes_count} de 3 Strikes`}
          </h2>
          <p className="feed-strikes-modal-subtitle">
            {is_banned
              ? 'Você atingiu 3 advertências ativas e foi banido. Abaixo você pode enviar recurso para cada strike recebido.'
              : 'O sistema aplica até 3 advertências graduais. Ao acumular o 3º strike, o banimento é automático.'}
          </p>

          {/* Medidor visual de 3 Strikes estilo YouTube */}
          <div className="feed-strikes-meter" data-testid="feed-strikes-meter">
            {[1, 2, 3].map((num) => {
              const isFilled = strikes_count >= num;
              const isThird = num === 3;
              return (
                <div
                  key={num}
                  className={`feed-strikes-step ${isFilled ? (isThird ? 'banned' : 'active') : ''}`}
                >
                  <div className="feed-strikes-step-circle">
                    {isFilled ? (
                      isThird ? <Ban size={16} /> : <AlertTriangle size={16} />
                    ) : (
                      <span>{num}</span>
                    )}
                  </div>
                  <span className="feed-strikes-step-label">
                    {num === 1 ? '1º Advertência' : num === 2 ? '2º Alerta Crítico' : '3º Banimento'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista de Strikes */}
        <div className="feed-strikes-modal-body">
          <h3 className="feed-strikes-section-title">Histórico de Infrações ({strikes.length})</h3>

          {strikes.length === 0 ? (
            <div className="feed-strikes-empty">
              <CheckCircle2 size={36} color="#10b981" />
              <p>Você não possui nenhum strike ativo no momento. Parabéns por manter a boa convivência!</p>
            </div>
          ) : (
            <div className="feed-strikes-list">
              {strikes.map((s) => {
                const isThisAppealing = appealingStrikeId === s.id;
                const canAppeal = s.appeal_status === 'none';

                return (
                  <div
                    key={s.id}
                    className="feed-strike-item"
                    data-testid={`feed-strike-item-${s.id}`}
                  >
                    <div className="feed-strike-item-top">
                      <div className="feed-strike-item-badge">
                        <AlertTriangle size={14} />
                        <span>Strike #{s.strike_number}</span>
                      </div>
                      <span className="feed-strike-item-date">
                        {new Date(s.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="feed-strike-item-reason">
                      <strong>Motivo:</strong> <span>{s.reason}</span>
                    </div>

                    {s.description && (
                      <p className="feed-strike-item-desc">{s.description}</p>
                    )}

                    {/* Status do Recurso */}
                    <div className="feed-strike-appeal-status-row">
                      {s.appeal_status === 'pending' && (
                        <div className="feed-strike-status-pill pending">
                          <Clock size={13} />
                          <span>Recurso em Análise pela Moderação</span>
                        </div>
                      )}
                      {s.appeal_status === 'approved' && (
                        <div className="feed-strike-status-pill approved">
                          <CheckCircle2 size={13} />
                          <span>Recurso Aceito (Strike Revogado)</span>
                        </div>
                      )}
                      {s.appeal_status === 'rejected' && (
                        <div className="feed-strike-status-pill rejected">
                          <X size={13} />
                          <span>Recurso Indeferido pela Moderação</span>
                        </div>
                      )}

                      {canAppeal && !isThisAppealing && (
                        <button
                          type="button"
                          className="feed-strike-open-appeal-btn"
                          onClick={() => handleStartAppeal(s.id)}
                          data-testid={`feed-strike-appeal-btn-${s.id}`}
                        >
                          <HelpCircle size={14} />
                          <span>Recorrer deste Strike</span>
                        </button>
                      )}
                    </div>

                    {/* Formulário de Envio de Recurso */}
                    {isThisAppealing && (
                      <div className="feed-strike-appeal-form" data-testid={`feed-appeal-form-${s.id}`}>
                        <label className="feed-strike-appeal-label">
                          Sua Justificativa / Defesa:
                        </label>
                        <textarea
                          className="feed-strike-appeal-textarea"
                          rows={3}
                          value={appealReason}
                          onChange={(e) => setAppealReason(e.target.value)}
                          placeholder="Explique detalhadamente por que este strike foi aplicado indevidamente ou contexto da mensagem..."
                          disabled={isSubmitting}
                          data-testid={`feed-appeal-textarea-${s.id}`}
                        />
                        <div className="feed-strike-appeal-actions">
                          <button
                            type="button"
                            className="feed-strike-cancel-appeal-btn"
                            onClick={handleCancelAppeal}
                            disabled={isSubmitting}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="feed-strike-submit-appeal-btn"
                            onClick={() => handleSubmitAppeal(s.id)}
                            disabled={isSubmitting || !appealReason.trim()}
                            data-testid={`feed-appeal-submit-btn-${s.id}`}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 size={14} className="feed-spinner" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Send size={14} />
                                Enviar Recurso à Moderação
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
