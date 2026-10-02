import React from 'react';
import { Trash2, Edit2, KeyRound, Filter, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';

export default function UserTableTab({
  currentUser,
  filteredUsers,
  paginatedUsers,
  userRoleFilter,
  setUserRoleFilter,
  selectedUserIds,
  setSelectedUserIds,
  selectableUserIds,
  isAllUsersSelected,
  toggleSelectAllUsers,
  toggleSelectUser,
  handleBulkDeleteUsers,
  handleOpenEdit,
  handleRequestPasswordReset,
  handleDeleteUser,
  usersPage,
  setUsersPage,
  totalUserPages,
  pageSize,
}) {
  const getWhatsAppUrl = (rawPhone) => {
    if (!rawPhone) return '#';
    const digits = rawPhone.replace(/\D/g, '');
    const fullDigits = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${fullDigits}`;
  };

  return (
    <div className="table-card" data-testid="users-table-view">
      {/* Toolbar de Filtro e Ações em Massa */}
      <div className="table-toolbar">
        <div className="table-filter-group">
          <Filter size={15} color="#64748b" />
          <label htmlFor="user-role-filter" style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            Filtrar por perfil:
          </label>
          <select
            id="user-role-filter"
            value={userRoleFilter}
            onChange={(e) => {
              setUserRoleFilter(e.target.value);
              setUsersPage(1);
              setSelectedUserIds([]);
            }}
            data-testid="filter-user-role-select"
          >
            <option value="all">Todos os perfis</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Administrador (Admin)</option>
            <option value="aluno">Aluno</option>
          </select>
        </div>

        <div className="bulk-actions-group">
          {selectedUserIds.length > 0 && (
            <>
              <span className="selected-count-badge" data-testid="selected-users-count">
                {selectedUserIds.length} selecionado(s)
              </span>
              <button
                type="button"
                onClick={handleBulkDeleteUsers}
                className="table-action-btn btn-danger"
                data-testid="bulk-delete-users-btn"
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
                checked={isAllUsersSelected}
                onChange={toggleSelectAllUsers}
                disabled={selectableUserIds.length === 0}
                title="Selecionar todos os usuários da página"
                data-testid="select-all-users-checkbox"
              />
            </th>
            <th>Nome</th>
            <th>E-mail</th>
            <th>WhatsApp</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Cadastrado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty-table-state">
                Nenhum usuário encontrado com os filtros selecionados.
              </td>
            </tr>
          ) : (
            paginatedUsers.map((u) => {
              const isSuperAdmin = u.role === 'superadmin';
              const isSelf = currentUser?.id === u.id;
              const isSelected = selectedUserIds.includes(u.id);

              return (
                <tr key={u.id} data-testid={`user-row-${u.id}`}>
                  <td style={{ textAlign: 'center' }}>
                    {!isSuperAdmin && !isSelf && (
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectUser(u.id)}
                        data-testid={`select-user-checkbox-${u.id}`}
                      />
                    )}
                  </td>
                  <td className="font-semibold">{u.name}</td>
                  <td className="text-secondary">{u.email}</td>
                  <td>
                    {u.phone ? (
                      <a
                        href={getWhatsAppUrl(u.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#22c55e',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                        title="Abrir conversa no WhatsApp"
                        data-testid={`user-whatsapp-link-${u.id}`}
                      >
                        <MessageCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{u.phone}</span>
                      </a>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '13px' }} data-testid={`user-no-whatsapp-${u.id}`}>
                        —
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${u.role}`} data-testid={`badge-role-${u.id}`}>
                      {u.role === 'superadmin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : u.role === 'aluno' ? 'Aluno' : 'Usuário'}
                    </span>
                  </td>
                  <td>
                    <span className="status-indicator">
                      <span className="dot dot-active"></span>
                      Ativo
                    </span>
                  </td>
                  <td className="text-secondary">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    {isSuperAdmin ? (
                      <span className="text-muted" title="O Super Admin é protegido de edição">Protegido</span>
                    ) : (
                      <div className="table-actions-group">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="table-action-btn btn-secondary"
                          title="Alterar perfil"
                          data-testid={`edit-user-btn-${u.id}`}
                        >
                          <Edit2 size={13} />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestPasswordReset(u)}
                          className="table-action-btn btn-reset"
                          title="Redefinir senha"
                          data-testid={`reset-pass-btn-${u.id}`}
                        >
                          <KeyRound size={13} />
                          <span>Redefinir Senha</span>
                        </button>
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="table-action-btn btn-danger"
                            title="Excluir usuário"
                            data-testid={`delete-user-btn-${u.id}`}
                          >
                            <Trash2 size={13} />
                            <span>Excluir</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Rodapé com Paginação de Usuários (20 por página) */}
      <div className="table-pagination-footer" data-testid="users-pagination">
        <span>
          Mostrando {filteredUsers.length === 0 ? 0 : (usersPage - 1) * pageSize + 1} a {Math.min(usersPage * pageSize, filteredUsers.length)} de {filteredUsers.length} usuários
        </span>
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setUsersPage((prev) => Math.max(prev - 1, 1))}
            disabled={usersPage <= 1}
            data-testid="users-prev-page-btn"
          >
            <ChevronLeft size={16} />
            <span>Anterior</span>
          </button>
          <span className="pagination-page-indicator">
            Página {usersPage} de {totalUserPages}
          </span>
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setUsersPage((prev) => Math.min(prev + 1, totalUserPages))}
            disabled={usersPage >= totalUserPages}
            data-testid="users-next-page-btn"
          >
            <span>Próximo</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
