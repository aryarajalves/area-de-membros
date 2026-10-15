import React from 'react';
import { Users, User, MessageCircle, Handshake, Sparkles, Briefcase } from 'lucide-react';

export default function IntroductionBanner({ onOpenCreateModal }) {
  return (
    <div className="introductions-banner-card" data-testid="introductions-banner">
      {/* Coluna da Esquerda: Textos, Tópicos e Botão de Ação */}
      <div className="introductions-banner-left">
        <div className="introductions-badge-welcome">
          <Users size={15} />
          <span>Boas-vindas</span>
        </div>

        <h1 className="introductions-banner-title">Apresente-se</h1>
        <p className="introductions-banner-subtitle">
          Apresente-se para a comunidade! Dizer quem você é e o que você faz é a melhor forma de gerar novas conexões, trocar experiências e abrir portas para parcerias.
        </p>

        <ul className="introductions-banner-checklist">
          <li>
            <User size={16} className="checklist-icon" />
            <span>Conte quem você é</span>
          </li>
          <li>
            <Briefcase size={16} className="checklist-icon" />
            <span>Mostre o que você faz</span>
          </li>
          <li>
            <Handshake size={16} className="checklist-icon" />
            <span>Gere novas conexões e parcerias</span>
          </li>
          <li>
            <MessageCircle size={16} className="checklist-icon" />
            <span>Interaja com outros membros</span>
          </li>
        </ul>

        <button
          type="button"
          className="introductions-cta-btn"
          onClick={onOpenCreateModal}
          data-testid="banner-open-create-btn"
        >
          <Handshake size={18} />
          <span>Quero me apresentar</span>
        </button>
      </div>

      {/* Coluna da Direita: 3 Cards Ilustrativos em Destaque */}
      <div className="introductions-banner-right" aria-hidden="true">
        <div className="intro-preview-card card-first">
          <div className="intro-card-header">
            <div className="intro-card-icon-box">
              <Handshake size={18} />
            </div>
            <span className="intro-card-tag tag-conexao">CONEXÃO</span>
          </div>
          <h4>Primeira conexão</h4>
          <div className="intro-card-divider" />
          <div className="intro-card-footer">
            <Users size={16} />
            <p>Encontre pessoas com interesses e objetivos em comum.</p>
          </div>
        </div>

        <div className="intro-preview-card card-center">
          <div className="intro-card-header">
            <div className="intro-card-icon-box">
              <User size={18} />
            </div>
            <span className="intro-card-tag tag-novo">NOVO</span>
          </div>
          <h4>Sua apresentação</h4>
          <div className="intro-card-divider" />
          <div className="intro-card-footer">
            <Sparkles size={16} />
            <p>Diga seu nome, o que você faz e como pode somar na comunidade.</p>
          </div>
        </div>

        <div className="intro-preview-card card-third">
          <div className="intro-card-header">
            <div className="intro-card-icon-box">
              <Users size={18} />
            </div>
            <span className="intro-card-tag tag-comunidade">COMUNIDADE</span>
          </div>
          <h4>Bem-vindo</h4>
          <div className="intro-card-divider" />
          <div className="intro-card-footer">
            <Sparkles size={16} />
            <p>Esse é o melhor ponto de partida para fazer networking ativo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
