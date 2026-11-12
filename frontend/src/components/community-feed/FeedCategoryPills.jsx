import React from 'react';

export const FEED_CATEGORIES = [
  { id: 'todas', label: 'Tudo', icon: '🌐' },
  { id: 'vitoria', label: 'Vitórias', icon: '🏆', color: '#10b981' },
  { id: 'duvida', label: 'Dúvidas', icon: '❓', color: '#f59e0b' },
  { id: 'dica', label: 'Dicas', icon: '💡', color: '#6366f1' },
  { id: 'aviso', label: 'Avisos', icon: '📢', color: '#ec4899' },
  { id: 'networking', label: 'Networking', icon: '🤝', color: '#06b6d4' },
];

export default function FeedCategoryPills({ selectedCategory = 'todas', onSelectCategory }) {
  return (
    <div className="feed-category-pills-container" data-testid="feed-category-pills">
      <div className="feed-category-pills-scroll">
        {FEED_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`feed-category-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
              data-testid={`category-pill-${cat.id}`}
            >
              <span className="feed-category-pill-icon">{cat.icon}</span>
              <span className="feed-category-pill-label">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
