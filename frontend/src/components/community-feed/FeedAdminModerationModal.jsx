import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Check, X, Loader2, AlertTriangle, Scale, CheckCircle2 } from 'lucide-react';
import { fetchAdminFeedReports, moderateFeedReport } from './communityFeedApi';
import { fetchPendingStrikeAppeals, judgeStrikeAppeal, applyAdminStrike } from './communityStrikesApi';
import './community-feed-modals.css';
import './community-feed-appeals.css';

export default function FeedAdminModerationModal({ isOpen, onClose, onPostDeleted }) {
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'appeals'
  const [reports, setReports] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'reports') {
        loadReports();
      } else {
        loadAppeals();
      }
    }
  }, [isOpen, activeTab]);

  const loadReports = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchAdminFeedReports('pending');
      setReports(res.reports || []);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao buscar denúncias.');
    } finally {
      setLoading(false);
    }
  };

  const loadAppeals = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchPendingStrikeAppeals('pending');
      setAppeals(res || []);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao buscar recursos de strikes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId, action, postId) => {
    setActionInProgress(reportId);
    try {
      await moderateFeedReport(reportId, action);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (action === 'delete_post' && onPostDeleted) {
        onPostDeleted(postId);
      }
    } catch (err) {
      alert(err.message || 'Erro ao executar ação de moderação.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApplyStrike = async (report) => {
    if (!report.post_author_id) {
      alert('Autor do post não identificado para aplicar strike.');
      return;
    }
    const reason = prompt('Motivo do Strike a ser aplicado ao aluno:', report.reason || 'Violação das regras');
    if (!reason) return;

    setActionInProgress(report.id);
    try {
      await applyAdminStrike({
        userId: report.post_author_id,
        reason: reason.trim(),
        description: `Aplicado via denúncia #${report.id}. Post: ${report.post_content?.slice(0, 80)}`,
        postId: report.post_id,
      });
      alert('Strike formal aplicado com sucesso ao aluno!');
      await handleAction(report.id, 'resolve', report.post_id);
    } catch (err) {
      alert(err.message || 'Erro ao aplicar strike.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleJudgeAppeal = async (strikeId, action) => {
    setActionInProgress(strikeId);
    try {
      await judgeStrikeAppeal(strikeId, action);
      setAppeals((prev) => prev.filter((a) => a.id !== strikeId));
      alert(action === 'approve' ? 'Recurso aprovado e strike revogado!' : 'Recurso indeferido e strike mantido.');
    } catch (err) {
      alert(err.message || 'Erro ao julgar recurso.');
    } finally {
      setActionInProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="feed-report-modal-backdrop" data-testid="feed-admin-moderation-modal">
      <div className="feed-admin-mod-panel">
        <div className="feed-report-modal-header">
          <div className="feed-report-header-title">
            <ShieldAlert size={20} className="text-warning" />
            <h3>Painel de Moderação da Comunidade</h3>
          </div>
          <button type="button" className="feed-report-close-x" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {/* Abas: Denúncias vs Recursos de Strikes */}
        <div style={{ display: 'flex', gap: '8px', padding: '10px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            type="button"
            className={`feed-filter-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
            data-testid="mod-tab-reports"
          >
            <ShieldAlert size={15} />
            <span>Denúncias Pendentes ({reports.length})</span>
          </button>
          <button
            type="button"
            className={`feed-filter-tab ${activeTab === 'appeals' ? 'active' : ''}`}
            onClick={() => setActiveTab('appeals')}
            data-testid="mod-tab-appeals"
          >
            <Scale size={15} />
            <span>Recursos de Strikes ({appeals.length})</span>
          </button>
        </div>

        <div className="feed-admin-mod-body">
          {loading ? (
            <div className="feed-mod-loading">
              <Loader2 size={24} className="feed-spinner" />
              <span>Carregando dados da moderação...</span>
            </div>
          ) : errorMsg ? (
            <div className="feed-report-error-alert">{errorMsg}</div>
          ) : activeTab === 'reports' ? (
            reports.length === 0 ? (
              <div className="feed-mod-empty">
                <span>🎉</span>
                <p>Nenhuma denúncia pendente! A comunidade está segura e em ordem.</p>
              </div>
            ) : (
              <div className="feed-mod-list">
                {reports.map((r) => {
                  const busy = actionInProgress === r.id;
                  return (
                    <div key={r.id} className="feed-mod-card" data-testid={`mod-report-card-${r.id}`}>
                      <div className="feed-mod-card-header">
                        <span className="feed-mod-reason-badge">Motivo: {r.reason}</span>
                        <span className="feed-mod-reporter">Por: {r.reporter_name}</span>
                      </div>

                      {r.description && <p className="feed-mod-desc">"{r.description}"</p>}

                      <div className="feed-mod-post-preview">
                        <strong>Publicação denunciada:</strong>
                        <p>{r.post_content}</p>
                      </div>

                      <div className="feed-mod-actions">
                        <button
                          type="button"
                          className="feed-mod-btn-dismiss"
                          onClick={() => handleAction(r.id, 'dismiss', r.post_id)}
                          disabled={busy}
                        >
                          <X size={13} /> Descartar
                        </button>
                        <button
                          type="button"
                          className="feed-mod-btn-resolve"
                          onClick={() => handleAction(r.id, 'resolve', r.post_id)}
                          disabled={busy}
                        >
                          <Check size={13} /> Resolver
                        </button>
                        <button
                          type="button"
                          className="feed-mod-btn-delete"
                          onClick={() => handleAction(r.id, 'delete_post', r.post_id)}
                          disabled={busy}
                        >
                          <Trash2 size={13} /> Excluir Post
                        </button>
                        {r.post_author_id && (
                          <button
                            type="button"
                            className="feed-mod-btn-delete"
                            style={{ background: 'rgba(249, 115, 22, 0.2)', borderColor: '#f97316', color: '#fb923c' }}
                            onClick={() => handleApplyStrike(r)}
                            disabled={busy}
                            title="Aplica 1 strike formal ao autor do post"
                          >
                            <AlertTriangle size={13} /> Aplicar Strike
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            appeals.length === 0 ? (
              <div className="feed-mod-empty">
                <span>⚖️</span>
                <p>Nenhum recurso de strike pendente para análise.</p>
              </div>
            ) : (
              <div className="feed-mod-list">
                {appeals.map((a) => {
                  const busy = actionInProgress === a.id;
                  return (
                    <div key={a.id} className="feed-mod-card" data-testid={`mod-appeal-card-${a.id}`}>
                      <div className="feed-mod-card-header">
                        <span className="feed-mod-reason-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                          Strike #{a.strike_number}: {a.reason}
                        </span>
                        <span className="feed-mod-reporter">Aluno: {a.user_name}</span>
                      </div>

                      <div className="feed-mod-post-preview" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                        <strong style={{ color: '#93c5fd' }}>Defesa / Justificativa enviada pelo aluno:</strong>
                        <p>"{a.appeal_reason}"</p>
                      </div>

                      <div className="feed-mod-actions">
                        <button
                          type="button"
                          className="feed-mod-btn-resolve"
                          style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981', color: '#34d399' }}
                          onClick={() => handleJudgeAppeal(a.id, 'approve')}
                          disabled={busy}
                          data-testid={`mod-approve-appeal-btn-${a.id}`}
                        >
                          <CheckCircle2 size={14} /> Aprovar Recurso (Revogar Strike)
                        </button>
                        <button
                          type="button"
                          className="feed-mod-btn-delete"
                          onClick={() => handleJudgeAppeal(a.id, 'reject')}
                          disabled={busy}
                          data-testid={`mod-reject-appeal-btn-${a.id}`}
                        >
                          <X size={14} /> Indeferir Recurso
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        <div className="feed-report-modal-footer">
          <button type="button" className="feed-report-btn-cancel" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

