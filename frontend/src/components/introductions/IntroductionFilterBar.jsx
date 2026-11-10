import React from 'react';
import { Search, Plus, Filter, X } from 'lucide-react';

export default function IntroductionFilterBar({
  searchTerm,
  onSearchChange,
  selectedNiche,
  onNicheChange,
  availableNiches = [],
  totalCount = 0,
  onOpenCreateModal,
}) {
  return (
    <div className="intro-filter-bar-container" data-testid="intro-filter-bar">
      <div className="intro-filter-left">
        <h2 className="section-title">Apresente-se</h2>
        <span className="section-subtitle-badge" data-testid="intro-posts-count-badge">
          {totalCount} {totalCount === 1 ? 'apresentação' : 'apresentações'}
        </span>
      </div>

      <div className="intro-filter-center">
        {/* Input de Busca */}
        <div className="intro-search-input-wrapper">
          <Search size={15} className="intro-search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, nicho, cidade ou palavra-chave..."
            className="intro-search-input"
            data-testid="intro-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="intro-clear-search-btn"
              onClick={() => onSearchChange('')}
              title="Limpar busca"
              aria-label="Limpar busca"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtro por Nicho se houver */}
        {availableNiches.length > 0 && (
          <div className="intro-niche-select-wrapper">
            <Filter size={14} className="intro-filter-icon" />
            <select
              value={selectedNiche}
              onChange={(e) => onNicheChange(e.target.value)}
              className="intro-niche-select"
              data-testid="intro-niche-select"
            >
              <option value="">Todas as áreas / nichos</option>
              {availableNiches.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="intro-filter-right">
        <button
          type="button"
          className="intro-new-post-btn"
          onClick={onOpenCreateModal}
          data-testid="intro-new-post-btn"
        >
          <Plus size={16} />
          <span>Novo post</span>
        </button>
      </div>
    </div>
  );
}
