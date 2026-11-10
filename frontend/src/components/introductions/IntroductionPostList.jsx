import React, { useState, useMemo } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import IntroductionFilterBar from './IntroductionFilterBar';
import IntroductionPostCard from './IntroductionPostCard';

export default function IntroductionPostList({
  posts = [],
  loading,
  currentUser,
  onSelectPost,
  onOpenCreateModal,
  onToggleLike,
  onOpenDm,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');

  // Extrai lista única de nichos cadastrados nos posts
  const availableNiches = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => {
      if (p.niche && p.niche.trim()) set.add(p.niche.trim());
    });
    return Array.from(set).sort();
  }, [posts]);

  // Filtra posts no client-side para busca instantânea e fluida
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (selectedNiche && (p.niche || '').trim().toLowerCase() !== selectedNiche.trim().toLowerCase()) {
        return false;
      }
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const inTitle = (p.title || '').toLowerCase().includes(term);
      const inContent = (p.content || '').toLowerCase().includes(term);
      const inAuthor = (p.user_name || '').toLowerCase().includes(term);
      const inNiche = (p.niche || '').toLowerCase().includes(term);
      const inLocation = (p.location || '').toLowerCase().includes(term);
      const inSeeking = (p.seeking || '').toLowerCase().includes(term);
      const inOffering = (p.offering || '').toLowerCase().includes(term);

      return inTitle || inContent || inAuthor || inNiche || inLocation || inSeeking || inOffering;
    });
  }, [posts, searchTerm, selectedNiche]);

  return (
    <div className="introductions-posts-section" data-testid="introductions-posts-section">
      {/* Barra de Filtros e Busca */}
      <IntroductionFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedNiche={selectedNiche}
        onNicheChange={setSelectedNiche}
        availableNiches={availableNiches}
        totalCount={filteredPosts.length}
        onOpenCreateModal={onOpenCreateModal}
      />

      {/* Lista de Apresentações em Sequência */}
      {loading ? (
        <div className="intro-loading-state" data-testid="intro-loading-state">
          <div className="spinner" />
          <p>Carregando apresentações da comunidade...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="intro-empty-state" data-testid="intro-empty-state">
          <div className="empty-icon-box">
            <Sparkles size={28} />
          </div>
          {searchTerm || selectedNiche ? (
            <>
              <h3>Nenhuma apresentação encontrada</h3>
              <p>Tente ajustar os filtros ou o termo de busca para encontrar outros membros.</p>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedNiche('');
                }}
              >
                Limpar Filtros
              </button>
            </>
          ) : (
            <>
              <h3>Ninguém se apresentou ainda</h3>
              <p>Seja o primeiro a compartilhar quem você é, seus objetivos e conectar-se com outros membros!</p>
              <button
                type="button"
                className="introductions-cta-btn"
                onClick={onOpenCreateModal}
              >
                <Plus size={16} />
                <span>Criar primeira apresentação</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="introductions-list-container">
          {filteredPosts.map((post) => (
            <IntroductionPostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onSelectPost={onSelectPost}
              onToggleLike={onToggleLike}
              onOpenDm={onOpenDm}
            />
          ))}
        </div>
      )}
    </div>
  );
}
