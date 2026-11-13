import React, { useState } from 'react';
import {
  Trash2,
  Edit2,
  KeyRound,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Search,
  X,
  RotateCcw,
  Calendar,
  Phone,
} from 'lucide-react';
import OnlineStatusBadge, { OnlineStatusDot } from '../common/OnlineStatusBadge';
import { MONTH_OPTIONS } from './userFilterUtils';

const DDI_OPTIONS = [
  { value: 'all', label: 'Todos os DDIs' },
  { value: '+55', label: '🇧🇷 +55 (Brasil)' },
  { value: '+1', label: '🇺🇸 +1 (EUA / Canadá)' },
  { value: '+351', label: '🇵🇹 +351 (Portugal)' },
  { value: '+34', label: '🇪🇸 +34 (Espanha)' },
  { value: '+44', label: '🇬🇧 +44 (Reino Unido)' },
  { value: '+244', label: '🇦🇴 +244 (Angola)' },
  { value: '+258', label: '🇲🇿 +258 (Moçambique)' },
  { value: '+54', label: '🇦🇷 +54 (Argentina)' },
  { value: '+595', label: '🇵🇾 +595 (Paraguai)' },
  { value: '+598', label: '🇺🇾 +598 (Uruguai)' },
];

export default function UserTableTab({
  currentUser,
  filteredUsers,
  paginatedUsers,
  userRoleFilter,
  setUserRoleFilter,
  userSearchTerm = '',
  setUserSearchTerm,
  userDdiFilter = 'all',
  setUserDdiFilter,
  userDddFilter = '',
  setUserDddFilter,
  userMonthFilter = 'all',
  setUserMonthFilter,
  handleClearUserFilters,
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

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const hasActiveFilters = Boolean(
    (userSearchTerm && userSearchTerm.trim()) ||
    (userRoleFilter && userRoleFilter !== 'all') ||
    (userDdiFilter && userDdiFilter !== 'all') ||
    (userDddFilter && userDddFilter.trim()) ||
    (userMonthFilter && userMonthFilter !== 'all')
  );

  return (
    <div className="table-card" data-testid="users-table-view">
      {/* Toolbar com Barra de Busca e Filtros Avançados */}
      <div className="table-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch', padding: '14px 16px' }}>
        {/* Linha 1: Campo de Busca Unificada (Nome, E-mail ou Telefone) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              backgroundColor: isSearchFocused ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.55)',
              border: isSearchFocused ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isSearchFocused ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none',
              borderRadius: '8px',
              padding: '2px 12px',
              transition: 'all 0.2s ease',
            }}
          >
            <Search size={15} color={isSearchFocused ? '#38bdf8' : '#94a3b8'} style={{ marginRight: '8px', flexShrink: 0, transition: 'color 0.2s ease' }} />
            <input
              type="text"
              placeholder="Buscar usuário por nome, e-mail ou telefone..."
              value={userSearchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onChange={(e) => {
                if (setUserSearchTerm) setUserSearchTerm(e.target.value);
                setUsersPage(1);
                setSelectedUserIds([]);
              }}
              data-testid="search-user-input"
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                color: '#f8fafc',
                padding: '6px 0',
              }}
            />
            {userSearchTerm && (
              <button
                type="button"
                onClick={() => {
                  if (setUserSearchTerm) setUserSearchTerm('');
                  setUsersPage(1);
                }}
                data-testid="clear-user-search-btn"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '4px' }}
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Ações em Massa quando houver seleção */}
          {selectedUserIds.length > 0 && (
            <div className="bulk-actions-group" style={{ flexShrink: 0 }}>
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
            </div>
          )}
        </div>

        {/* Linha 2: Filtros de Perfil, DDI, DDD e Mês de Criação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Filtro por Perfil */}
          <div className="table-filter-group" style={{ margin: 0 }}>
            <Filter size={14} color="#64748b" />
            <label htmlFor="user-role-filter" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Perfil:</label>
            <select
              id="user-role-filter"
              value={userRoleFilter}
              onChange={(e) => {
                setUserRoleFilter(e.target.value);
                setUsersPage(1);
                setSelectedUserIds([]);
              }}
              data-testid="filter-user-role-select"
              style={{ fontSize: '12.5px', padding: '5px 8px' }}
            >
              <option value="all">Todos os perfis</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Administrador (Admin)</option>
              <option value="aluno">Aluno</option>
            </select>
          </div>

          {/* Filtro por DDI */}
          <div className="table-filter-group" style={{ margin: 0 }}>
            <Phone size={14} color="#64748b" />
            <label htmlFor="user-ddi-filter" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>DDI:</label>
            <select
              id="user-ddi-filter"
              value={userDdiFilter}
              onChange={(e) => {
                if (setUserDdiFilter) setUserDdiFilter(e.target.value);
                setUsersPage(1);
                setSelectedUserIds([]);
              }}
              data-testid="filter-user-ddi-select"
              style={{ fontSize: '12.5px', padding: '5px 8px' }}
            >
              {DDI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Filtro por DDD */}
          <div className="table-filter-group" style={{ margin: 0 }}>
            <label htmlFor="user-ddd-filter" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>DDD:</label>
            <input
              id="user-ddd-filter"
              type="text"
              placeholder="Ex: 85"
              maxLength={3}
              value={userDddFilter}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '').slice(0, 3);
                if (setUserDddFilter) setUserDddFilter(clean);
                setUsersPage(1);
                setSelectedUserIds([]);
              }}
              data-testid="filter-user-ddd-input"
              style={{ width: '70px', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', color: '#334155', outline: 'none' }}
            />
          </div>

          {/* Filtro por Mês de Criação */}
          <div className="table-filter-group" style={{ margin: 0 }}>
            <Calendar size={14} color="#64748b" />
            <label htmlFor="user-month-filter" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Criado em:</label>
            <select
              id="user-month-filter"
              value={userMonthFilter}
              onChange={(e) => {
                if (setUserMonthFilter) setUserMonthFilter(e.target.value);
                setUsersPage(1);
                setSelectedUserIds([]);
              }}
              data-testid="filter-user-month-select"
              style={{ fontSize: '12.5px', padding: '5px 8px' }}
            >
              {MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Botão para Limpar Filtros se houver filtro ativo */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                if (handleClearUserFilters) {
                  handleClearUserFilters();
                } else {
                  setUserRoleFilter('all');
                  if (setUserSearchTerm) setUserSearchTerm('');
                  if (setUserDdiFilter) setUserDdiFilter('all');
                  if (setUserDddFilter) setUserDddFilter('');
                  if (setUserMonthFilter) setUserMonthFilter('all');
                  setUsersPage(1);
                }
              }}
              className="table-action-btn btn-secondary"
              data-testid="clear-user-filters-btn"
              title="Limpar todos os filtros"
              style={{ height: '32px', padding: '4px 8px', fontSize: '12px' }}
            >
              <RotateCcw size={12} />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      <div className="users-table-wrapper">
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
              <th className="table-actions-header">Ações</th>
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
                    <td className="font-semibold">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ position: 'relative', width: '28px', height: '28px', flexShrink: 0 }}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1e293b', color: '#93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                              {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <OnlineStatusDot isOnline={u.is_online} size={9} />
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
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
                      <OnlineStatusBadge isOnline={u.is_online} lastSeenAt={u.last_seen_at} size="sm" />
                    </td>
                    <td className="text-secondary">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="table-actions-cell">
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
                            <span>Redefinir</span>
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
      </div>

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
