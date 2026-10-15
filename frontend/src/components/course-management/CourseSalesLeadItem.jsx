import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, MousePointerClick } from 'lucide-react';
import { formatToBrasiliaWithSeconds, getRoleBadgeStyle } from './CourseSalesHistoryModal';

export default function CourseSalesLeadItem({
  lead,
  isLightBg = false,
  textColor,
  subTextColor,
  cardItemBg,
  cardItemBorder
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const roleBadge = getRoleBadgeStyle(lead.user?.role);
  const userInitial = lead.user?.name ? lead.user.name.charAt(0).toUpperCase() : '?';

  return (
    <div
      data-testid={`sales-lead-card-${lead.userId}`}
      style={{
        backgroundColor: cardItemBg,
        border: cardItemBorder,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: isExpanded ? '0 4px 16px rgba(0, 0, 0, 0.2)' : 'none'
      }}
    >
      {/* Linha Principal do Contato (Clicável para expandir) */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        data-testid={`sales-lead-row-${lead.userId}`}
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: isExpanded
            ? (isLightBg ? 'rgba(56, 189, 248, 0.06)' : 'rgba(56, 189, 248, 0.04)')
            : 'transparent'
        }}
      >
        {/* Identificação do Usuário */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
          {lead.user?.avatar_url ? (
            <img
              src={lead.user.avatar_url}
              alt={lead.user.name}
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '15px',
                flexShrink: 0
              }}
            >
              {userInitial}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: textColor }}>
                {lead.user?.name || 'Usuário Não Identificado'}
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '10px',
                  backgroundColor: roleBadge.bg,
                  color: roleBadge.text,
                  border: `1px solid ${roleBadge.border}`
                }}
              >
                {roleBadge.label}
              </span>
            </div>
            <span style={{ fontSize: '12.5px', color: subTextColor }}>
              {lead.user?.email || 'Sem e-mail cadastrado'}
            </span>
          </div>
        </div>

        {/* Informações de Cliques e Horário de Brasília */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Badge de quantidade de cliques */}
          <div
            data-testid={`lead-clicks-count-${lead.userId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: lead.totalClicks > 1 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              border: lead.totalClicks > 1 ? '1px solid rgba(56, 189, 248, 0.4)' : cardItemBorder,
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              color: lead.totalClicks > 1 ? '#38bdf8' : subTextColor
            }}
          >
            <MousePointerClick size={13} />
            <span>{lead.totalClicks} {lead.totalClicks === 1 ? 'clique' : 'cliques'}</span>
          </div>

          {/* Último clique no Horário de Brasília */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
              border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              color: textColor
            }}
          >
            <Clock size={13} color="#38bdf8" />
            <span data-testid={`lead-last-click-${lead.userId}`}>
              {formatToBrasiliaWithSeconds(lead.lastClickAt)}
            </span>
          </div>

          {/* Indicador de expansão Chevron */}
          <div
            style={{
              color: subTextColor,
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Sub-painel expansível com todas as vezes que o aluno clicou */}
      {isExpanded && (
        <div
          data-testid={`sales-lead-expanded-list-${lead.userId}`}
          style={{
            padding: '12px 18px 16px',
            backgroundColor: isLightBg ? 'rgba(241, 245, 249, 0.6)' : 'rgba(0, 0, 0, 0.25)',
            borderTop: isLightBg ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: subTextColor, marginBottom: '2px' }}>
            Histórico completo de cliques deste lead ({lead.totalClicks}):
          </div>

          {lead.clicks.map((clickItem, index) => {
            const isMostRecent = index === 0;
            const clickNumber = lead.clicks.length - index;

            return (
              <div
                key={clickItem.id || index}
                data-testid={`lead-click-detail-${clickItem.id || index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: isMostRecent
                    ? (isLightBg ? '#ffffff' : 'rgba(56, 189, 248, 0.08)')
                    : (isLightBg ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.02)'),
                  border: isMostRecent
                    ? '1px solid rgba(56, 189, 248, 0.3)'
                    : (isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.04)')
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: isMostRecent ? '#38bdf8' : 'rgba(148, 163, 184, 0.2)',
                      color: isMostRecent ? '#0f172a' : subTextColor,
                      padding: '2px 6px',
                      borderRadius: '6px'
                    }}
                  >
                    #{clickNumber}
                  </span>
                  <span style={{ fontSize: '12.5px', color: textColor, fontWeight: isMostRecent ? 600 : 400 }}>
                    Clique na página de vendas
                  </span>
                  {isMostRecent && (
                    <span style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 600 }}>
                      (Último clique)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: subTextColor }}>
                  <Clock size={12} color="#38bdf8" />
                  <span>{formatToBrasiliaWithSeconds(clickItem.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
