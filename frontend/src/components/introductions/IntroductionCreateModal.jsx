import React, { useState } from 'react';
import { X, Handshake, Sparkles, Send } from 'lucide-react';

export default function IntroductionCreateModal({
  isOpen,
  onClose,
  onCreate,
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent || submitting) return;

    setSubmitting(true);
    try {
      await onCreate({ title: cleanTitle, content: cleanContent });
      setTitle('');
      setContent('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="intro-modal-backdrop" data-testid="intro-create-modal-backdrop">
      <div className="intro-create-modal-card" data-testid="intro-create-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="intro-create-header">
          <div className="create-header-left">
            <div className="create-icon-badge">
              <Handshake size={20} />
            </div>
            <div>
              <h3>Criar Apresentação</h3>
              <p>Apresente-se para os outros membros e comece a criar conexões.</p>
            </div>
          </div>

          <button
            type="button"
            className="intro-close-modal-btn"
            onClick={onClose}
            data-testid="close-create-modal-btn"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="intro-create-form">
          <div className="form-group">
            <label htmlFor="intro-post-title-input">
              Título da Apresentação
            </label>
            <input
              id="intro-post-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Chegando na comunidade! Me chamo Rogério Bertuci..."
              maxLength={255}
              required
              data-testid="intro-post-title-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="intro-post-content-input">
              Conte sobre você
            </label>
            <textarea
              id="intro-post-content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Fale sobre sua história, sua profissão ou área de atuação, projetos em andamento, o que te trouxe até aqui e o que você busca na comunidade..."
              rows={8}
              required
              data-testid="intro-post-content-input"
            />
          </div>

          <div className="intro-create-tip-box">
            <Sparkles size={16} className="tip-icon" />
            <span>
              <strong>Dica de ouro:</strong> Apresentações detalhadas geram mais respostas, conexões e parcerias com outros alunos!
            </span>
          </div>

          <div className="intro-create-footer-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={submitting}
              data-testid="cancel-create-post-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="introductions-cta-btn"
              disabled={!title.trim() || !content.trim() || submitting}
              data-testid="submit-create-post-btn"
            >
              <Send size={15} />
              <span>{submitting ? 'Publicando...' : 'Publicar Apresentação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
