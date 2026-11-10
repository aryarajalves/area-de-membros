import React, { useEffect, useState } from 'react';
import { X, BarChart2, Eye, Zap, TrendingUp, Heart, MessageCircle, Bookmark, Loader2, Users } from 'lucide-react';
import { fetchFeedPostInsights } from './communityFeedApi';
import './community-feed-insights.css';

export default function FeedPostInsightsModal({ isOpen, postId, onClose }) {
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && postId) {
      setIsLoading(true);
      setError(null);
      fetchFeedPostInsights(postId)
        .then((data) => setInsights(data))
        .catch((err) => setError(err.message || 'Erro ao carregar insights.'))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, postId]);

  if (!isOpen) return null;

  const totalInteractions = insights?.total_interactions || 0;
  const likesPct = totalInteractions > 0 ? ((insights.likes_count / totalInteractions) * 100).toFixed(0) : 0;
  const commentsPct = totalInteractions > 0 ? ((insights.comments_count / totalInteractions) * 100).toFixed(0) : 0;
  const bookmarksPct = totalInteractions > 0 ? ((insights.bookmarks_count / totalInteractions) * 100).toFixed(0) : 0;

  return (
    <div
      className="feed-modal-backdrop"
      data-testid="feed-post-insights-modal"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="feed-insights-modal-container"
        data-testid="feed-insights-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="feed-insights-header">
          <div className="feed-insights-title-row">
            <BarChart2 size={20} color="#38bdf8" />
            <h3 className="feed-insights-title">Insights da Publicação</h3>
          </div>
          <button
            type="button"
            className="feed-likes-modal-close-btn"
            onClick={onClose}
            title="Fechar"
            data-testid="feed-insights-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="feed-insights-body">
          {isLoading ? (
            <div className="feed-likes-loading" data-testid="feed-insights-loading">
              <Loader2 size={24} className="feed-spinner" />
              <span>Calculando métricas e alcance...</span>
            </div>
          ) : error ? (
            <div className="feed-likes-empty" data-testid="feed-insights-error">
              <p>{error}</p>
            </div>
          ) : !insights ? (
            <div className="feed-likes-empty">
              <p>Nenhuma métrica disponível.</p>
            </div>
          ) : (
            <>
              {/* KPIs principais */}
              <div className="feed-insights-kpis">
                <div className="feed-insights-kpi-card" data-testid="kpi-views">
                  <div className="feed-insights-kpi-icon reach">
                    <Eye size={18} />
                  </div>
                  <span className="feed-insights-kpi-value">{insights.views_count}</span>
                  <span className="feed-insights-kpi-label">Alcance / Vistas</span>
                </div>

                <div className="feed-insights-kpi-card" data-testid="kpi-interactions">
                  <div className="feed-insights-kpi-icon interactions">
                    <Zap size={18} />
                  </div>
                  <span className="feed-insights-kpi-value">{insights.total_interactions}</span>
                  <span className="feed-insights-kpi-label">Interações</span>
                </div>

                <div className="feed-insights-kpi-card" data-testid="kpi-rate">
                  <div className="feed-insights-kpi-icon rate">
                    <TrendingUp size={18} />
                  </div>
                  <span className="feed-insights-kpi-value">{insights.engagement_rate}%</span>
                  <span className="feed-insights-kpi-label">Engajamento</span>
                </div>
              </div>

              {/* Detalhamento de Ações */}
              <div className="feed-insights-section">
                <div className="feed-insights-section-title">
                  <span>Atividade na Publicação</span>
                </div>

                <div className="feed-insights-breakdown-grid">
                  <div className="feed-insights-breakdown-item" data-testid="stat-likes">
                    <Heart size={16} color="#ec4899" />
                    <div className="feed-insights-breakdown-info">
                      <span className="feed-insights-breakdown-count">{insights.likes_count}</span>
                      <span className="feed-insights-breakdown-name">Curtidas</span>
                    </div>
                  </div>

                  <div className="feed-insights-breakdown-item" data-testid="stat-comments">
                    <MessageCircle size={16} color="#38bdf8" />
                    <div className="feed-insights-breakdown-info">
                      <span className="feed-insights-breakdown-count">{insights.comments_count}</span>
                      <span className="feed-insights-breakdown-name">Comentários</span>
                    </div>
                  </div>

                  <div className="feed-insights-breakdown-item" data-testid="stat-bookmarks">
                    <Bookmark size={16} color="#f59e0b" />
                    <div className="feed-insights-breakdown-info">
                      <span className="feed-insights-breakdown-count">{insights.bookmarks_count}</span>
                      <span className="feed-insights-breakdown-name">Salvos</span>
                    </div>
                  </div>
                </div>

                {/* Barra proporcional de interações */}
                {totalInteractions > 0 && (
                  <div className="feed-insights-bar-container" title={`Curtidas: ${likesPct}%, Comentários: ${commentsPct}%, Salvos: ${bookmarksPct}%`}>
                    <div className="feed-insights-bar-segment likes" style={{ width: `${likesPct}%` }} />
                    <div className="feed-insights-bar-segment comments" style={{ width: `${commentsPct}%` }} />
                    <div className="feed-insights-bar-segment bookmarks" style={{ width: `${bookmarksPct}%` }} />
                  </div>
                )}
              </div>

              {/* Visualizadores Recentes */}
              <div className="feed-insights-section">
                <div className="feed-insights-section-title">
                  <Users size={15} color="#38bdf8" />
                  <span>Visto Recentemente Por ({insights.recent_viewers?.length || 0})</span>
                </div>

                {(!insights.recent_viewers || insights.recent_viewers.length === 0) ? (
                  <div className="feed-likes-empty" style={{ padding: '16px 0' }}>
                    <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Nenhum membro identificado ainda.</p>
                  </div>
                ) : (
                  <div className="feed-insights-viewers-list" data-testid="feed-insights-viewers-list">
                    {insights.recent_viewers.map((viewer) => {
                      const initial = viewer.name ? viewer.name.charAt(0).toUpperCase() : 'M';
                      return (
                        <div key={viewer.user_id} className="feed-insights-viewer-item">
                          <div className="feed-insights-viewer-user">
                            <div className="feed-user-avatar" style={{ width: 32, height: 32, fontSize: '0.85rem' }}>
                              {viewer.avatar_url ? (
                                <img src={viewer.avatar_url} alt={viewer.name} />
                              ) : (
                                <span>{initial}</span>
                              )}
                            </div>
                            <div>
                              <span className="feed-insights-viewer-name">{viewer.name}</span>
                              {viewer.role === 'superadmin' && (
                                <span className="feed-role-badge superadmin" style={{ marginLeft: 6, fontSize: '0.65rem' }}>Super Admin</span>
                              )}
                              {viewer.role === 'admin' && (
                                <span className="feed-role-badge admin" style={{ marginLeft: 6, fontSize: '0.65rem' }}>Admin</span>
                              )}
                            </div>
                          </div>
                          <span className="feed-insights-viewer-time">
                            {new Date(viewer.viewed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
