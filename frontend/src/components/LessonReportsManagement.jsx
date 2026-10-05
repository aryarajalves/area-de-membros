import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, Search, Filter, RefreshCw, Trash2,
  Video, Volume2, FileText, HelpCircle, Layers, Check, RotateCcw,
  Calendar, User, Mail, BookOpen
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { FileDeleteConfirmModal, ActionConfirmModal } from './common/FeedbackModals';

export function formatToBrasilia(dateString) {
  if (!dateString) return '';
  const isoString = dateString.endsWith('Z') || dateString.includes('+')
    ? dateString
    : `${dateString}Z`;

  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export const getRoleBadge = (role) => {
  if (role === 'superadmin') return { label: 'Super Admin', bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' };
  if (role === 'admin') return { label: 'Admin', bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
  if (role === 'aluno') return { label: 'Aluno', bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' };
  return { label: 'Usuário', bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
};

const ISSUE_TYPE_CONFIG = {
  video: { label: 'Vídeo / Reprodução', icon: Video, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  audio: { label: 'Áudio / Som', icon: Volume2, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  material: { label: 'Material / Anexo', icon: FileText, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  content: { label: 'Conteúdo da Aula', icon: HelpCircle, color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  other: { label: 'Outro Problema', icon: AlertTriangle, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' }
};

export default function LessonReportsManagement({ onUpdateSummary, bgColor = '#090d16', currentUser }) {
  const isManager = currentUser ? ['superadmin', 'admin'].includes(currentUser.role) : true;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, id: null, title: '' });
  const [resolveModalState, setResolveModalState] = useState({ isOpen: false, report: null });
  const { addToast } = useToast();

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const textColor = isLightBg ? '#1e293b' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';
  const innerBg = isLightBg ? '#f8fafc' : 'rgba(15, 23, 42, 0.6)';
  const innerBorder = isLightBg ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)';

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/courses/reports', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data || []);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao carregar relatos.');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao carregar lista de relatos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter(r => r.status === 'open').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    return { total, pending, resolved };
  }, [reports]);

  // Alternar status (open <-> resolved)
  const handleToggleStatus = async (report) => {
    const newStatus = report.status === 'open' ? 'resolved' : 'open';
    setActionLoadingId(report.id);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/reports/${report.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: newStatus } : r));
        addToast(newStatus === 'resolved' ? 'Relato marcado como resolvido!' : 'Relato reaberto.', 'success');
        if (onUpdateSummary) onUpdateSummary();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Falha ao atualizar status.');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao alterar status.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Excluir relato
  const handleConfirmDelete = async () => {
    const reportId = deleteModalState.id;
    if (!reportId) return;

    setActionLoadingId(reportId);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/reports/${reportId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        addToast('Relato excluído com sucesso.', 'success');
        if (onUpdateSummary) onUpdateSummary();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Falha ao excluir relato.');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao excluir relato.', 'error');
    } finally {
      setActionLoadingId(null);
      setDeleteModalState({ isOpen: false, id: null, title: '' });
    }
  };

  // Relatos filtrados
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch =
        searchTerm === '' ||
        (r.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.lesson_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.course_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || r.issue_type === filterType;
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [reports, searchTerm, filterType, filterStatus]);

  return (
    <div
      className={!isLightBg ? 'classroom-dark-theme' : ''}
      style={{
        padding: '24px 32px',
        backgroundColor: bgColor,
        color: textColor,
        minHeight: '100vh',
        boxSizing: 'border-box',
        '--classroom-modal-bg': bgColor
      }}
      data-testid="lesson-reports-management"
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: textColor, margin: '0 0 6px 0' }}>
            Relatos de Problemas nas Aulas
          </h1>
          <p style={{ fontSize: '13.5px', color: subTextColor, margin: 0 }}>
            Gerencie os chamados e notificações enviados pelos alunos sobre falhas em vídeos, áudios e materiais.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { fetchReports(); if (onUpdateSummary) onUpdateSummary(); }}
          className="secondary-btn"
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
          data-testid="refresh-reports-btn"
        >
          <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Cards de Métricas / Notificações */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="table-card" style={{ padding: '16px', borderRadius: '10px', backgroundColor: cardBg, border: cardBorder }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: subTextColor, textTransform: 'uppercase' }}>Total de Relatos</span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: textColor, marginTop: '6px' }} data-testid="stat-total-reports">{stats.total}</div>
        </div>

        <div
          className="table-card"
          style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: isLightBg ? '#fef2f2' : 'rgba(239, 68, 68, 0.1)',
            border: isLightBg ? '1px solid #fecaca' : '1px solid rgba(239, 68, 68, 0.28)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: isLightBg ? '#991b1b' : '#fca5a5', textTransform: 'uppercase' }}>Pendentes / Em Aberto</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: isLightBg ? '#b91c1c' : '#f87171', marginTop: '6px' }} data-testid="stat-pending-reports">{stats.pending}</div>
        </div>

        <div
          className="table-card"
          style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: isLightBg ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)',
            border: isLightBg ? '1px solid #bbf7d0' : '1px solid rgba(16, 185, 129, 0.28)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: isLightBg ? '#166534' : '#6ee7b7', textTransform: 'uppercase' }}>Resolvidos</span>
            <CheckCircle2 size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: isLightBg ? '#15803d' : '#4ade80', marginTop: '6px' }} data-testid="stat-resolved-reports">{stats.resolved}</div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="table-card" style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: cardBg, border: cardBorder, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por aluno, e-mail, aula ou problema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control-modern"
              style={{ paddingLeft: '36px', fontSize: '13px' }}
              data-testid="search-reports-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-control-modern"
              style={{ fontSize: '13px', width: 'auto', minWidth: '160px' }}
              data-testid="filter-issue-type"
            >
              <option value="all">Todos os Tipos</option>
              <option value="video">Vídeo / Reprodução</option>
              <option value="audio">Áudio / Som</option>
              <option value="material">Material / Anexo</option>
              <option value="content">Conteúdo</option>
              <option value="other">Outro</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-control-modern"
              style={{ fontSize: '13px', width: 'auto', minWidth: '140px' }}
              data-testid="filter-status"
            >
              <option value="all">Todos os Status</option>
              <option value="open">Em Aberto</option>
              <option value="resolved">Resolvido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listagem de Relatos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: subTextColor }}>
          <RefreshCw size={28} className="spin-animation" style={{ margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontSize: '14px' }}>Carregando relatos das aulas...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="table-card" style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: cardBg, borderRadius: '10px', border: cardBorder, color: subTextColor }} data-testid="empty-reports-state">
          <CheckCircle2 size={42} color="#10b981" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: textColor, margin: '0 0 4px 0' }}>
            Nenhum problema encontrado
          </h3>
          <p style={{ fontSize: '13px', margin: 0, color: subTextColor }}>
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'Nenhum chamado corresponde aos filtros selecionados.'
              : 'Nenhum aluno reportou falhas nas aulas até o momento.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} data-testid="reports-list">
          {filteredReports.map((report) => {
            const config = ISSUE_TYPE_CONFIG[report.issue_type] || ISSUE_TYPE_CONFIG.other;
            const Icon = config.icon;
            const isOpen = report.status === 'open';

            return (
              <div
                key={report.id}
                className="table-card"
                style={{ padding: '20px', borderRadius: '10px', backgroundColor: cardBg, border: isOpen ? (isLightBg ? '1px solid #fecaca' : '1px solid rgba(239, 68, 68, 0.3)') : cardBorder, borderLeft: isOpen ? '4px solid #ef4444' : '4px solid #10b981', transition: 'all 0.15s ease' }}
                data-testid={`report-card-${report.id}`}
              >
                {/* Linha Superior: Tipo de Problema, Status e Data */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: config.bg, color: config.color, border: `1px solid ${config.border}`, padding: '3px 9px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600 }}>
                      <Icon size={13} />
                      <span>{config.label}</span>
                    </span>

                    <span
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: isOpen ? '#fef2f2' : '#ecfdf5', color: isOpen ? '#b91c1c' : '#047857', border: isOpen ? '1px solid #fca5a5' : '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600 }}
                      data-testid={`report-status-${report.id}`}
                    >
                      {isOpen ? 'Em Aberto' : 'Resolvido'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: subTextColor, fontSize: '12px' }}>
                    <Calendar size={13} />
                    <span>{formatToBrasilia(report.created_at)}</span>
                  </div>
                </div>

                {/* Curso e Aula */}
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {report.course_title ? `${report.course_title} > ` : ''}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>
                    {report.lesson_title || `Aula #${report.lesson_id}`}
                  </span>
                </div>

                {/* Descrição do Relato */}
                <div
                  style={{ padding: '12px 14px', backgroundColor: innerBg, border: innerBorder, borderRadius: '6px', fontSize: '13px', color: textColor, lineHeight: 1.5, marginBottom: '14px', whiteSpace: 'pre-wrap' }}
                  data-testid={`report-description-${report.id}`}
                >
                  {report.description}
                </div>

                {/* Linha Inferior: Aluno e Ações */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: innerBorder, paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: isLightBg ? '#eff6ff' : 'rgba(37, 99, 235, 0.2)', color: isLightBg ? '#2563eb' : '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                      {(report.user_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
                          {report.user_name || 'Usuário'}
                        </span>
                        {(() => {
                          const badge = getRoleBadge(report.user_role);
                          return (
                            <span
                              style={{ fontSize: '11px', fontWeight: 600, padding: '1px 8px', borderRadius: '12px', backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}
                              data-testid={`user-role-badge-${report.id}`}
                            >
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                      {report.user_email && (
                        <div style={{ fontSize: '11px', color: subTextColor }}>
                          {report.user_email}
                        </div>
                      )}
                    </div>
                  </div>

                  {isManager && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => (isOpen ? setResolveModalState({ isOpen: true, report }) : handleToggleStatus(report))}
                        disabled={actionLoadingId === report.id}
                        className={isOpen ? 'primary-btn' : 'secondary-btn'}
                        style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: isOpen ? '#16a34a' : 'transparent', borderColor: isOpen ? '#16a34a' : '#cbd5e1' }}
                        data-testid={`toggle-status-btn-${report.id}`}
                      >
                        {isOpen ? (
                          <>
                            <Check size={14} />
                            <span>Marcar como Resolvido</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw size={14} />
                            <span>Reabrir Chamado</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteModalState({ isOpen: true, id: report.id, title: `Relato #${report.id}` })}
                        className="table-action-btn btn-danger"
                        title="Excluir relato"
                        style={{ padding: '6px' }}
                        data-testid={`delete-report-btn-${report.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Resolução */}
      <ActionConfirmModal
        isOpen={resolveModalState.isOpen}
        title="Marcar como Resolvido?"
        message={`Deseja realmente marcar como resolvido o relato da aula "${resolveModalState.report?.lesson_title || 'Aula'}" enviado por ${resolveModalState.report?.user_name || 'Usuário'}?`}
        confirmLabel="Confirmar Resolução"
        confirmColor="#16a34a"
        onConfirm={async () => {
          const rep = resolveModalState.report;
          setResolveModalState({ isOpen: false, report: null });
          if (rep) await handleToggleStatus(rep);
        }}
        onCancel={() => setResolveModalState({ isOpen: false, report: null })}
      />

      {/* Modal de Confirmação de Exclusão */}
      <FileDeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Excluir Relato?"
        message="Deseja realmente excluir este relato? O histórico deste chamado será apagado permanentemente."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, id: null, title: '' })}
      />
    </div>
  );
}
