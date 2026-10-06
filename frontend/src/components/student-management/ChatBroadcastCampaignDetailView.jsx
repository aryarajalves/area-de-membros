import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, CheckCheck, Clock } from 'lucide-react';
import { formatBrasiliaDateTime } from './studentDateUtils';
import HistoryPaginationBar from '../common/HistoryPaginationBar';

const PAGE_SIZE = 20;

export default function ChatBroadcastCampaignDetailView({ campaignDetails, formatDuration }) {
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [searchRecipient, setSearchRecipient] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [recipientFilter, searchRecipient]);

  const filteredRecipients = (campaignDetails?.recipients || []).filter((r) => {
    if (recipientFilter === 'read' && !r.is_read) return false;
    if (recipientFilter === 'unread' && r.is_read) return false;
    if (searchRecipient.trim()) {
      const term = searchRecipient.toLowerCase();
      const name = (r.recipient_name || '').toLowerCase();
      const email = (r.recipient_email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    }
    return true;
  });

  const paginatedRecipients = filteredRecipients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} data-testid="campaign-detail-view">
      {/* Resumo da Campanha */}
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Disparado em:</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
            {formatBrasiliaDateTime(campaignDetails.created_at)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tempo de Execução:</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#a78bfa' }}>
            {formatDuration(campaignDetails.duration_seconds)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Entregues / Total:</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#34d399' }}>
            {campaignDetails.sent_count} de {campaignDetails.total_recipients} alunos
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Taxa de Leitura:</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8' }}>
            {campaignDetails.read_count} leram ({campaignDetails.read_percentage}%)
          </div>
        </div>
      </div>

      {/* Mensagem Enviada */}
      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '14px 16px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Texto Disparado:</div>
        <div style={{ fontSize: '0.88rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {campaignDetails.message}
        </div>
      </div>

      {/* Filtros de Destinatários e Busca */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: `Todos (${campaignDetails.recipients.length})` },
            { id: 'read', label: `Leram (${campaignDetails.read_count})` },
            { id: 'unread', label: `Não leram (${campaignDetails.recipients.length - campaignDetails.read_count})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRecipientFilter(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: recipientFilter === tab.id ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: recipientFilter === tab.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: recipientFilter === tab.id ? '#c4b5fd' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid={`filter-recipient-${tab.id}-btn`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar aluno..."
            value={searchRecipient}
            onChange={(e) => setSearchRecipient(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px 6px 32px',
              borderRadius: '6px',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '0.82rem',
              outline: 'none',
            }}
            data-testid="search-recipient-input"
          />
        </div>
      </div>

      {/* Tabela de Destinatários */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredRecipients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '0.85rem' }}>
            Nenhum aluno encontrado com os filtros aplicados.
          </div>
        ) : (
          paginatedRecipients.map((rec) => (
            <div
              key={rec.id}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
              data-testid={`recipient-row-${rec.recipient_id}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {(rec.recipient_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                    {rec.recipient_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {rec.recipient_email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Status de Entrega */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: rec.status === 'sent' ? '#34d399' : '#f87171',
                  }}
                >
                  <CheckCircle2 size={13} />
                  {rec.status === 'sent' ? 'Entregue' : 'Falha'}
                </span>

                {/* Status de Visualização */}
                {rec.is_read ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                    title={rec.read_at ? `Visualizado em ${formatBrasiliaDateTime(rec.read_at)}` : 'Visualizado'}
                    data-testid={`recipient-read-${rec.recipient_id}`}
                  >
                    <CheckCheck size={13} />
                    {rec.read_at ? `Visto: ${formatBrasiliaDateTime(rec.read_at)}` : 'Visualizado'}
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                    }}
                    data-testid={`recipient-unread-${rec.recipient_id}`}
                  >
                    <Clock size={12} />
                    Não lido ainda
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <HistoryPaginationBar
        currentPage={currentPage}
        totalItems={filteredRecipients.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        itemName="alunos"
        testIdPrefix="campaign-recipients"
      />
    </div>
  );
}
