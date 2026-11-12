import React, { useState } from 'react';
import { voteFeedPoll } from './communityFeedApi';

export default function FeedPollWidget({
  postId,
  question,
  options = [],
  myVote = null,
  totalVotes = 0,
  onVoteSuccess,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(null);

  if (!question || !options || options.length === 0) {
    return null;
  }

  const hasVoted = myVote !== null && myVote !== undefined;

  const handleVote = async (optionId) => {
    if (hasVoted || submitting) return;
    try {
      setSubmitting(true);
      setSelectedOpt(optionId);
      const updatedPost = await voteFeedPoll(postId, optionId);
      if (onVoteSuccess) {
        onVoteSuccess(updatedPost);
      }
    } catch (err) {
      alert(err.message || 'Erro ao registrar voto na enquete.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feed-poll-container" data-testid="feed-poll-widget">
      <div className="feed-poll-header">
        <span className="feed-poll-icon">📊</span>
        <h4 className="feed-poll-question">{question}</h4>
      </div>

      <div className="feed-poll-options">
        {options.map((opt) => {
          const isMyChoice = myVote === opt.id || selectedOpt === opt.id;
          const percent = opt.percent !== undefined ? opt.percent : 0;

          if (hasVoted) {
            return (
              <div
                key={opt.id}
                className={`feed-poll-result-bar ${isMyChoice ? 'voted' : ''}`}
                data-testid={`poll-result-${opt.id}`}
              >
                <div
                  className="feed-poll-fill"
                  style={{ width: `${percent}%` }}
                />
                <div className="feed-poll-result-content">
                  <span className="feed-poll-opt-text">
                    {opt.text}
                    {isMyChoice && <span className="feed-poll-my-badge">Seu voto ✓</span>}
                  </span>
                  <span className="feed-poll-opt-pct">{percent}%</span>
                </div>
              </div>
            );
          }

          return (
            <button
              key={opt.id}
              type="button"
              className="feed-poll-vote-btn"
              onClick={() => handleVote(opt.id)}
              disabled={submitting}
              data-testid={`poll-vote-btn-${opt.id}`}
            >
              <span className="feed-poll-radio-circle" />
              <span className="feed-poll-vote-text">{opt.text}</span>
            </button>
          );
        })}
      </div>

      <div className="feed-poll-footer">
        <span className="feed-poll-total-text">
          {totalVotes} {totalVotes === 1 ? 'voto registrado' : 'votos registrados'}
        </span>
        {hasVoted && <span className="feed-poll-closed-badge">Voto computado</span>}
      </div>
    </div>
  );
}
