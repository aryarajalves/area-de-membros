import React from 'react';
import {
  X,
  ShieldCheck,
  Ban,
  AlertTriangle,
  Scale,
  CheckCircle2,
  HeartHandshake,
  MessageSquareX,
  Flag,
} from 'lucide-react';
import './community-feed-guidelines.css';

export default function FeedCommunityGuidelinesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="feed-guidelines-backdrop"
      data-testid="feed-guidelines-modal"
      onClick={(e) => {
        // Regra UX: não fecha ao clicar no fundo
        e.stopPropagation();
      }}
    >
      <div className="feed-guidelines-panel" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className="feed-guidelines-header">
          <div className="feed-guidelines-header-badge">
            <ShieldCheck size={18} className="feed-guidelines-badge-icon" />
            <span>Conduta & Moderação</span>
          </div>
          <button
            type="button"
            className="feed-guidelines-close-btn"
            onClick={onClose}
            title="Fechar diretrizes"
            data-testid="feed-guidelines-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <div className="feed-guidelines-title-section">
          <h2 className="feed-guidelines-title" data-testid="feed-guidelines-title">
            Diretrizes e Regras da Comunidade
          </h2>
          <p className="feed-guidelines-subtitle">
            Um ambiente seguro, profissional e focado no crescimento de todos os alunos.
          </p>
        </div>

        {/* Corpo com Scroll */}
        <div className="feed-guidelines-body">
          {/* Introdução Positiva */}
          <div className="feed-guidelines-intro-card">
            <HeartHandshake size={24} className="feed-guidelines-intro-icon" />
            <div>
              <strong>Espaço de Conexão e Aprendizado</strong>
              <p>
                O Feed da Comunidade foi criado para compartilhar aprendizados, tirar dúvidas sobre o
                conteúdo, celebrar vitórias e fortalecer o networking entre colegas e instrutores.
              </p>
            </div>
          </div>

          {/* O que é Estritamente Proibido */}
          <div className="feed-guidelines-section">
            <div className="feed-guidelines-section-title forbidden">
              <Ban size={18} />
              <span>O que é ESTRITAMENTE PROIBIDO publicar:</span>
            </div>

            <div className="feed-guidelines-grid">
              <div className="feed-guidelines-item" data-testid="guideline-item-politics">
                <div className="feed-guidelines-item-icon politics">🏛️</div>
                <div className="feed-guidelines-item-text">
                  <strong>Política e Polarização Ideológica</strong>
                  <p>
                    Proibido debates políticos, propaganda eleitoral, ativismo partidário ou provocações
                    ideológicas. O foco deve ser 100% no aprendizado.
                  </p>
                </div>
              </div>

              <div className="feed-guidelines-item" data-testid="guideline-item-hate">
                <div className="feed-guidelines-item-icon hate">🚫</div>
                <div className="feed-guidelines-item-text">
                  <strong>Preconceito e Discurso de Ódio</strong>
                  <p>
                    Tolerância zero para racismo, homofobia, machismo, capacitismo, intolerância religiosa,
                    xenofobia ou qualquer discriminação.
                  </p>
                </div>
              </div>

              <div className="feed-guidelines-item" data-testid="guideline-item-harassment">
                <div className="feed-guidelines-item-icon harassment">⚠️</div>
                <div className="feed-guidelines-item-text">
                  <strong>Xingamentos, Ofensas e Assédio</strong>
                  <p>
                    Proibido agressões verbais, insultos, calúnias, deboches tóxicos ou cyberbullying
                    contra outros alunos, moderadores ou professores.
                  </p>
                </div>
              </div>

              <div className="feed-guidelines-item" data-testid="guideline-item-spam">
                <div className="feed-guidelines-item-icon spam">📢</div>
                <div className="feed-guidelines-item-text">
                  <strong>Spam, Pirataria e Vendas Não Autorizadas</strong>
                  <p>
                    Proibido divulgar links afiliados externos não autorizados, autopromoção excessiva,
                    produtos concorrentes, pirataria de cursos ou golpes.
                  </p>
                </div>
              </div>

              <div className="feed-guidelines-item" data-testid="guideline-item-sensitive">
                <div className="feed-guidelines-item-icon sensitive">🔞</div>
                <div className="feed-guidelines-item-text">
                  <strong>Conteúdo Explícito ou Sensível</strong>
                  <p>
                    Proibida pornografia, nudez, violência gráfica ou qualquer mídia ilícita. Mantenha as
                    publicações profissionais.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sistema de Moderação Ativa */}
          <div className="feed-guidelines-mod-card" data-testid="feed-guidelines-mod-card">
            <div className="feed-guidelines-mod-header">
              <Scale size={20} className="feed-guidelines-mod-icon" />
              <strong>Sistema Ativo de Moderação e Consequências</strong>
            </div>
            <p>
              Nossa comunidade possui um <strong>sistema contínuo de moderação</strong> e ferramentas de
              denúncia acessíveis a todos os alunos em cada postagem.
            </p>
            <ul className="feed-guidelines-mod-list">
              <li>
                <CheckCircle2 size={15} color="#10b981" />
                <span>
                  <strong>Denúncias da Comunidade:</strong> Qualquer aluno pode denunciar postagens ou
                  comentários abusivos com 1 clique no menu de opções.
                </span>
              </li>
              <li>
                <CheckCircle2 size={15} color="#10b981" />
                <span>
                  <strong>Remoção Sumária:</strong> Conteúdos que violem estas diretrizes são removidos e
                  o autor notificado.
                </span>
              </li>
              <li>
                <AlertTriangle size={15} color="#ef4444" />
                <span>
                  <strong>Suspensão ou Banimento:</strong> Reincidências ou violações graves acarretam a
                  suspensão imediata ou cancelamento definitivo do acesso à plataforma.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Rodapé com 1 botão de confirmação */}
        <div className="feed-guidelines-footer">
          <button
            type="button"
            className="feed-guidelines-confirm-btn"
            onClick={onClose}
            data-testid="feed-guidelines-confirm-btn"
          >
            <CheckCircle2 size={17} />
            <span>Entendi e Concordo com as Regras</span>
          </button>
        </div>
      </div>
    </div>
  );
}
