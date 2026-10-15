import React, { useState, useEffect, useMemo } from 'react';
import { History, X, Search, AlertCircle, Loader2, MousePointerClick, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchCourseSalesClicks } from './courseSalesApi';
import { groupClicksByLead } from './courseSalesGroupingUtils';
import CourseSalesLeadItem from './CourseSalesLeadItem';

const ITEMS_PER_PAGE = 6;

/**
 * Converte timestamp UTC para o Horário de Brasília (America/Sao_Paulo)
 * Formato: DD/MM/AAAA às HH:mm:ss
 */
export function formatToBrasiliaWithSeconds(dateString) {
  if (!dateString) return '';
  const isoString = dateString.endsWith('Z') || dateString.includes('+')
    ? dateString
    : `${dateString}Z`;

  const date = new Date(isoString);
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);

  const timeFormatted = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);

  return `${dateFormatted} às ${timeFormatted}`;
}

export function getRoleBadgeStyle(role) {
  if (role === 'superadmin') {
    return { label: 'Super Admin', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.35)' };
  }
  if (role === 'admin') {
    return { label: 'Admin', bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.35)' };
  }
  return { label: 'Aluno', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)' };
}

export default function CourseSalesHistoryModal({
  isOpen,
  course,
  onClose,
  isLightBg = false
}) {
  const [loading, setLoading] = useState(false);
  const [clicks, setClicks] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isOpen || !course?.id) {
      setClicks([]);
      setError(null);
      setSearch('');
      setCurrentPage(1);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchCourseSalesClicks(course.id)
      .then((data) => {
        if (isMounted) {
          setClicks(data.clicks || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Erro ao carregar o histórico de cliques.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, course?.id]);

  // Agrupa os cliques por lead/contato e ordena pelo mais recente
  const groupedLeads = useMemo(() => {
    return groupClicksByLead(clicks);
  }, [clicks]);

  // Filtra contatos pelo termo de busca
  const filteredLeads = useMemo(() => {
    if (!search.trim()) return groupedLeads;
    const term = search.toLowerCase();
    return groupedLeads.filter((lead) => {
      const userName = lead.user?.name?.toLowerCase() || '';
      const userEmail = lead.user?.email?.toLowerCase() || '';
      return userName.includes(term) || userEmail.includes(term);
    });
  }, [groupedLeads, search]);

  // Total de páginas e corte dos itens paginados
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / ITEMS_PER_PAGE));

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeads.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  if (!isOpen || !course) return null;

  const modalBg = isLightBg ? '#ffffff' : '#0f172a';
  const modalBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const cardItemBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const cardItemBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)';

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const showingStart = filteredLeads.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + ITEMS_PER_PAGE, filteredLeads.length);

  return (
    <div
      className="modal-backdrop-dark"
      data-testid="course-sales-history-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal-panel-modern"
        data-testid="course-sales-history-modal"
        style={{
          backgroundColor: modalBg,
          border: modalBorder,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: modalBorder,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <History size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: textColor }}>
                Histórico de Interesse
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: subTextColor }}>
                {course.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="table-action-btn"
            title="Fechar modal"
            data-testid="close-sales-history-btn"
            style={{
              padding: '6px',
              borderRadius: '8px',
              color: subTextColor,
              backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra Informativa e de Busca */}
        <div style={{ padding: '16px 24px 10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#38bdf8'
              }}
              data-testid="total-clicks-badge"
            >
              <MousePointerClick size={14} />
              <span>
                {clicks.length} {clicks.length === 1 ? 'clique registrado' : 'cliques registrados'} ({groupedLeads.length} {groupedLeads.length === 1 ? 'contato' : 'contatos'})
              </span>
            </div>

            <span style={{ fontSize: '12px', color: subTextColor }}>
              Horários no padrão oficial de Brasília (UTC-3)
            </span>
          </div>

          {clicks.length > 0 && (
            <div style={{ position: 'relative' }}>
              <Search size={15} color={subTextColor} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail do contato..."
                value={search}
                onChange={handleSearchChange}
                className="form-control-modern"
                data-testid="search-sales-clicks-input"
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  fontSize: '13px',
                  backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)',
                  color: textColor,
                  borderRadius: '10px'
                }}
              />
            </div>
          )}
        </div>

        {/* Conteúdo com Scroll */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 24px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
          data-testid="sales-clicks-container"
        >
          {loading ? (
            <div style={{ padding: '50px 0', textAlign: 'center', color: subTextColor, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <Loader2 size={32} className="spin-animation" color="#38bdf8" />
              <span style={{ fontSize: '13.5px' }}>Carregando histórico de cliques...</span>
            </div>
          ) : error ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#f87171', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={32} />
              <span style={{ fontSize: '13.5px' }}>{error}</span>
            </div>
          ) : clicks.length === 0 ? (
            <div
              style={{
                padding: '45px 20px',
                textAlign: 'center',
                backgroundColor: cardItemBg,
                borderRadius: '12px',
                border: cardItemBorder,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
              data-testid="empty-clicks-message"
            >
              <History size={40} color={subTextColor} style={{ opacity: 0.5 }} />
              <h4 style={{ margin: 0, fontSize: '15px', color: textColor, fontWeight: 600 }}>
                Nenhum clique de interesse registrado
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: subTextColor, maxWidth: '420px', lineHeight: '1.5' }}>
                Quando alunos sem acesso clicarem no card ou no botão deste produto para visualizar a página de vendas, os acessos serão registrados aqui automaticamente com data e horário de Brasília.
              </p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: subTextColor, fontSize: '13px' }}>
              Nenhum contato encontrado para "{search}".
            </div>
          ) : (
            paginatedLeads.map((lead) => (
              <CourseSalesLeadItem
                key={lead.userId}
                lead={lead}
                isLightBg={isLightBg}
                textColor={textColor}
                subTextColor={subTextColor}
                cardItemBg={cardItemBg}
                cardItemBorder={cardItemBorder}
              />
            ))
          )}
        </div>

        {/* Barra de Paginação (se houver mais de uma página ou múltiplos leads) */}
        {filteredLeads.length > 0 && totalPages > 1 && (
          <div
            data-testid="sales-history-pagination"
            style={{
              padding: '8px 24px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: isLightBg ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.04)',
              fontSize: '12.5px',
              color: subTextColor
            }}
          >
            <span>
              Mostrando {showingStart}–{showingEnd} de {filteredLeads.length} {filteredLeads.length === 1 ? 'contato' : 'contatos'}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                data-testid="pagination-prev-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                  border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentPage === 1 ? (isLightBg ? '#cbd5e1' : '#475569') : textColor,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                <ChevronLeft size={14} />
                <span>Anterior</span>
              </button>

              <span style={{ fontWeight: 600, color: textColor, padding: '0 4px' }} data-testid="pagination-current-page">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                data-testid="pagination-next-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                  border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentPage === totalPages ? (isLightBg ? '#cbd5e1' : '#475569') : textColor,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                <span>Próxima</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Rodapé do Modal */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: modalBorder,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
            data-testid="close-sales-history-footer-btn"
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
