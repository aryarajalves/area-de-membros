import React from 'react';
import { Compass, Sparkles } from 'lucide-react';

export default function IntroCreateMatchmakingTab({
  seeking,
  setSeeking,
  offering,
  setOffering,
}) {
  return (
    <div className="intro-tab-pane" data-testid="pane-matchmaking">
      <p className="intro-tab-desc">
        Diga o que você está procurando e como pode ajudar. Parcerias de sucesso nascem aqui!
      </p>

      <div className="form-group">
        <label htmlFor="intro-seeking-input">
          <Compass size={14} /> O que busco na comunidade
        </label>
        <textarea
          id="intro-seeking-input"
          value={seeking}
          onChange={(e) => setSeeking(e.target.value)}
          placeholder="Ex: Busco sócios, fornecedores de tráfego, parcerias em lançamentos ou dicas sobre escala..."
          rows={3}
          data-testid="intro-seeking-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="intro-offering-input">
          <Sparkles size={14} /> Como posso ajudar / O que domino
        </label>
        <textarea
          id="intro-offering-input"
          value={offering}
          onChange={(e) => setOffering(e.target.value)}
          placeholder="Ex: Domino criação de páginas, copywriting, gestão financeira ou programação..."
          rows={3}
          data-testid="intro-offering-input"
        />
      </div>
    </div>
  );
}
