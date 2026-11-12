import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, Search, RefreshCw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { FileDeleteConfirmModal, ActionConfirmModal } from './common/FeedbackModals';
import {
  LessonReportCard,
  LessonReportsPagination,
  formatToBrasilia,
  getRoleBadge,
  ISSUE_TYPE_CONFIG
} from './lesson-reports';

export { formatToBrasilia, getRoleBadge, ISSUE_TYPE_CONFIG };

const ITEMS_PER_PAGE = 20;

export default function LessonReportsManagement({ onUpdateSummary, bgColor = '#090d16', currentUser, onNavigateTab }) {
  const isManager = currentUser ? ['superadmin', 'admin'].includes(currentUser.role) : true;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Resetar página ao alterar filtros ou busca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus]);

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
        addToast(
          newStatus === 'resolved'
            ? 'Relato marcado como resolvido! Notificação enviada ao aluno na DM.'
            : 'Relato reaberto.',
          'success'
        );
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

  // Link para acessar a aula que gerou o relato
  const handleOpenLesson = (report) => {
    if (!report.lesson_id) return;
    if (onNavigateTab) {
      onNavigateTab('courses');
    } else {
      window.dispatchEvent(new CustomEvent('app:navigate_tab', { detail: { tab: 'courses' } }));
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open_course_lesson', {
        detail: {
          courseId: report.course_id,
          moduleId: report.module_id,
          lessonId: report.lesson_id
        }
      }));
    }, 150);
  };

  // Entrar em contato na DM com o autor do relato
  const handleOpenDm = (report) => {
    if (!report.user_id) return;
    window.dispatchEvent(new CustomEvent('open_direct_message', {
      detail: {
        contact: {
          id: report.user_id,
          name: report.user_name,
          email: report.user_email,
          role: report.user_role
        }
      }
    }));
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

  // Relatos paginados (20 por página)
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

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
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} data-testid="reports-list">
            {paginatedReports.map((report) => (
              <LessonReportCard
                key={report.id}
                report={report}
                isManager={isManager}
                isLightBg={isLightBg}
                textColor={textColor}
                subTextColor={subTextColor}
                cardBg={cardBg}
                cardBorder={cardBorder}
                innerBg={innerBg}
                innerBorder={innerBorder}
                actionLoadingId={actionLoadingId}
                onOpenLesson={handleOpenLesson}
                onOpenDm={handleOpenDm}
                onRequestResolve={(rep) => setResolveModalState({ isOpen: true, report: rep })}
                onToggleStatus={handleToggleStatus}
                onRequestDelete={(rep) => setDeleteModalState({ isOpen: true, id: rep.id, title: `Relato #${rep.id}` })}
              />
            ))}
          </div>

          {/* Paginação (20 por página) */}
          <LessonReportsPagination
            currentPage={currentPage}
            totalItems={filteredReports.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            isLightBg={isLightBg}
          />
        </>
      )}

      {/* Modal de Confirmação de Resolução */}
      <ActionConfirmModal
        isOpen={resolveModalState.isOpen}
        title="Marcar como Resolvido?"
        message={`Deseja realmente marcar como resolvido o relato da aula "${resolveModalState.report?.lesson_title || 'Aula'}" enviado por ${resolveModalState.report?.user_name || 'Usuário'}? Uma notificação será enviada automaticamente para o aluno informando a resolução.`}
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
