import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import './community-feed-modals.css';

export default function FeedCreatePollModal({ isOpen, onClose, onSavePoll, initialQuestion = '', initialOptions = ['', ''] }) {
  const [question, setQuestion] = useState(initialQuestion);
  const [options, setOptions] = useState(initialOptions.length >= 2 ? initialOptions : ['', '']);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleOptionChange = (index, value) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setErrorMsg('Informe a pergunta da enquete.');
      return;
    }
    const filledOptions = options.map((o) => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) {
      setErrorMsg('A enquete precisa de no mínimo 2 opções preenchidas.');
      return;
    }

    onSavePoll({
      question: question.trim(),
      options: filledOptions,
    });
    onClose();
  };

  return (
    <div className="feed-report-modal-backdrop" data-testid="feed-create-poll-modal">
      <div className="feed-report-modal-panel feed-poll-modal-panel">
        <div className="feed-report-modal-header">
          <div className="feed-report-header-title">
            <span className="feed-report-header-icon">📊</span>
            <h3>Criar Enquete</h3>
          </div>
          <button type="button" className="feed-report-close-x" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <form onSubmit={handleConfirm} className="feed-report-form">
          {errorMsg && <div className="feed-report-error-alert">{errorMsg}</div>}

          <div className="feed-poll-form-group">
            <label htmlFor="poll-question-input">Pergunta da Enquete:</label>
            <input
              id="poll-question-input"
              type="text"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Ex: Qual tema vocês querem na próxima mentoria?"
              maxLength={200}
              className="feed-poll-text-input"
              data-testid="poll-question-input"
            />
          </div>

          <div className="feed-poll-form-group">
            <label>Opções de Resposta (mínimo 2, máx 5):</label>
            <div className="feed-poll-options-inputs">
              {options.map((opt, idx) => (
                <div key={idx} className="feed-poll-opt-input-row">
                  <span className="feed-poll-opt-idx">{idx + 1}</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      handleOptionChange(idx, e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder={`Opção ${idx + 1}`}
                    maxLength={100}
                    className="feed-poll-text-input"
                    data-testid={`poll-option-input-${idx}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className="feed-poll-remove-opt-btn"
                      onClick={() => handleRemoveOption(idx)}
                      title="Remover opção"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 5 && (
              <button
                type="button"
                className="feed-poll-add-opt-btn"
                onClick={handleAddOption}
                data-testid="poll-add-opt-btn"
              >
                <Plus size={15} /> Adicionar Opção
              </button>
            )}
          </div>

          <div className="feed-report-modal-footer">
            <button type="button" className="feed-report-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="feed-poll-btn-submit" data-testid="poll-confirm-btn">
              Anexar Enquete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
