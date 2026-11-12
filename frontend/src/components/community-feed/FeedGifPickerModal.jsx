import React from 'react';

const CURATED_GIFS = [
  { id: '1', title: 'Palmas', url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif' },
  { id: '2', title: 'Vitória / Foguete', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { id: '3', title: 'Sucesso', url: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif' },
  { id: '4', title: 'Comemoração', url: 'https://media.giphy.com/media/DhstvI3CH03yOTXRdC/giphy.gif' },
  { id: '5', title: 'Sensacional', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
  { id: '6', title: 'Top / Joinha', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
];

export default function FeedGifPickerModal({ isOpen, onClose, onSelectGif }) {
  if (!isOpen) return null;

  return (
    <div className="feed-report-modal-backdrop" data-testid="feed-gif-picker-modal">
      <div className="feed-gif-modal-panel">
        <div className="feed-gif-modal-header">
          <div className="feed-gif-header-title">
            <span>👾</span>
            <h4>Escolha um GIF</h4>
          </div>
          <button type="button" className="feed-report-close-x" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="feed-gif-grid">
          {CURATED_GIFS.map((g) => (
            <button
              key={g.id}
              type="button"
              className="feed-gif-item-btn"
              onClick={() => {
                onSelectGif(g.url);
                onClose();
              }}
              data-testid={`gif-item-${g.id}`}
            >
              <img src={g.url} alt={g.title} loading="lazy" />
              <span className="feed-gif-item-title">{g.title}</span>
            </button>
          ))}
        </div>

        <div className="feed-gif-modal-footer">
          <button type="button" className="feed-report-btn-cancel" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
