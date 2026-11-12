import React from 'react';
import { BarChart2, X, Tag } from 'lucide-react';
import { FEED_CATEGORIES } from './FeedCategoryPills';

export default function FeedPostExtrasBar({
  category,
  onCategoryChange,
  pollData,
  onOpenPollModal,
  onRemovePoll,
}) {
  return (
    <div className="feed-create-extras-bar" data-testid="feed-create-extras-bar">
      <div className="feed-category-selector-wrapper">
        <Tag size={13} className="feed-category-icon" />
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="feed-category-select"
          data-testid="feed-category-select"
          aria-label="Categoria da publicação"
        >
          {FEED_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id === 'todas' ? 'geral' : c.id}>
              {c.icon} {c.label === 'Tudo' ? 'Geral' : c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="feed-poll-attachment-wrapper">
        {pollData ? (
          <div className="feed-poll-attached-badge" data-testid="feed-poll-attached-badge">
            <span className="feed-poll-badge-text">
              📊 {pollData.question.slice(0, 24)}... ({pollData.options.length} opções)
            </span>
            <button
              type="button"
              className="feed-poll-remove-badge-btn"
              onClick={onRemovePoll}
              title="Remover enquete"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="feed-attach-poll-btn"
            onClick={onOpenPollModal}
            data-testid="feed-open-poll-modal-btn"
          >
            <BarChart2 size={15} />
            <span>Enquete</span>
          </button>
        )}
      </div>
    </div>
  );
}
