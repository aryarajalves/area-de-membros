import React from 'react';
import { Trash2, Copy, Clock, AlertTriangle, CheckCircle2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function InviteTableTab({
  filteredInvites,
  paginatedInvites,
  inviteStatusFilter,
  setInviteStatusFilter,
  selectedInviteIds,
  setSelectedInviteIds,
  paginatedInviteIds,
  isAllInvitesSelected,
  toggleSelectAllInvites,
  toggleSelectInvite,
  handleBulkDeleteInvites,
  handleDeleteInvite,
  copyToClipboard,
  invitesPage,
  setInvitesPage,
  totalInvitePages,
  pageSize,
}) {
  return (
    <div className="table-card" data-testid="invites-table-view">
      {/* Toolbar de Filtro e Ações em Massa */}
      <div className="table-toolbar">
        <div className="table-filter-group">
          <Filter size={15} color="#64748b" />
          <label htmlFor="invite-status-filter" style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            Filtrar por status:
          </label>
          <select
            id="invite-status-filter"
            value={inviteStatusFilter}
            onChange={(e) => {
              setInviteStatusFilter(e.target.value);
              setInvitesPage(1);
              setSelectedInviteIds([]);
            }}
            data-testid="filter-invite-status-select"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente (Válido)</option>
            <option value="used">Conta Criada (Utilizado)</option>
            <option value="expired">Expirado</option>
          </select>
        </div>

        <div className="bulk-actions-group">
          {selectedInviteIds.length > 0 && (
            <>
              <span className="selected-count-badge" data-testid="selected-invites-count">
                {selectedInviteIds.length} convite(s) selecionado(s)
              </span>
              <button
                type="button"
                onClick={handleBulkDeleteInvites}
                className="table-action-btn btn-danger"
                data-testid="bulk-delete-invites-btn"
              >
                <Trash2 size={14} />
                <span>Excluir Selecionados</span>
              </button>
            </>
          )}
        </div>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>
              <input
                type="checkbox"
                className="table-checkbox"
                checked={isAllInvitesSelected}
                onChange={toggleSelectAllInvites}
                disabled={paginatedInviteIds.length === 0}
                title="Selecionar todos os convites da página"
                data-testid="select-all-invites-checkbox"
              />
            </th>
            <th>Perfil Convidado</th>
            <th>Status do Convite</th>
            <th>Tempo Restante</th>
            <th>Usado Por</th>
            <th>Criado Em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginatedInvites.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty-table-state">
                Nenhum convite encontrado com os filtros selecionados.
              </td>
            </tr>
          ) : (
            paginatedInvites.map((inv) => {
              const inviteUrl = `${window.location.origin}/register?token=${inv.token}`;
              const isSelected = selectedInviteIds.includes(inv.id);

              return (
                <tr key={inv.id} data-testid={`invite-row-${inv.id}`}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="table-checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectInvite(inv.id)}
                      data-testid={`select-invite-checkbox-${inv.id}`}
                    />
                  </td>
                  <td>
                    <span className={`badge badge-${inv.role}`}>
                      {inv.role === 'admin' ? 'Admin' : inv.role === 'aluno' ? 'Aluno' : 'Usuário'}
                    </span>
                  </td>
                  <td>
                    {inv.is_used ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        Conta Criada
                      </span>
                    ) : inv.is_expired ? (
                      <span className="badge badge-expired">
                        <AlertTriangle size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        Expirado
                      </span>
                    ) : (
                      <span className="badge badge-pending">
                        <Clock size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="text-secondary">
                    <span className={inv.is_expired ? 'text-danger' : ''}>
                      {inv.time_remaining || '—'}
                    </span>
                  </td>
                  <td>
                    {inv.is_used ? (
                      <span className="font-semibold text-primary">{inv.used_by_email || 'Usuário registrado'}</span>
                    ) : (
                      <span className="text-muted">Ainda não utilizado</span>
                    )}
                  </td>
                  <td className="text-secondary">
                    {new Date(inv.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div className="table-actions-group">
                      {!inv.is_used && !inv.is_expired && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(inviteUrl)}
                          className="table-action-btn"
                          title="Copiar link do convite"
                          data-testid={`copy-row-invite-${inv.id}`}
                        >
                          <Copy size={14} />
                          <span>Copiar Link</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteInvite(inv.id)}
                        className="table-action-btn btn-danger"
                        title="Excluir convite"
                        data-testid={`delete-invite-btn-${inv.id}`}
                      >
                        <Trash2 size={13} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Rodapé com Paginação de Convites (20 por página) */}
      <div className="table-pagination-footer" data-testid="invites-pagination">
        <span>
          Mostrando {filteredInvites.length === 0 ? 0 : (invitesPage - 1) * pageSize + 1} a {Math.min(invitesPage * pageSize, filteredInvites.length)} de {filteredInvites.length} convites
        </span>
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setInvitesPage((prev) => Math.max(prev - 1, 1))}
            disabled={invitesPage <= 1}
            data-testid="invites-prev-page-btn"
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>
          <span className="pagination-page-indicator">
            Página {invitesPage} de {totalInvitePages}
          </span>
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setInvitesPage((prev) => Math.min(prev + 1, totalInvitePages))}
            disabled={invitesPage >= totalInvitePages}
            data-testid="invites-next-page-btn"
          >
            <span>Próximo</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
