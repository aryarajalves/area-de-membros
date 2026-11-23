import React, { useState } from 'react';
import {
  Trash2,
  Filter,
  Search,
  X,
  RotateCcw,
  Calendar,
  Phone,
  ArrowUpDown,
} from 'lucide-react';
import { MONTH_OPTIONS, SORT_OPTIONS } from './userFilterUtils';

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

export default function UserTableFiltersBar({
  userSearchTerm = '',
  setUserSearchTerm,
  userRoleFilter,
  setUserRoleFilter,
  userDdiFilter = 'all',
  setUserDdiFilter,
  userDddFilter = '',
  setUserDddFilter,
  userMonthFilter = 'all',
  setUserMonthFilter,
  userDateFilter = '',
  setUserDateFilter,
  userSortOrder = 'newest',
  setUserSortOrder,
  handleClearUserFilters,
  selectedUserIds = [],
  setSelectedUserIds,
  handleBulkDeleteUsers,
  setUsersPage,
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const hasActiveFilters = Boolean(
    (userSearchTerm && userSearchTerm.trim()) ||
    (userRoleFilter && userRoleFilter !== 'all') ||
    (userDdiFilter && userDdiFilter !== 'all') ||
    (userDddFilter && userDddFilter.trim()) ||
    (userMonthFilter && userMonthFilter !== 'all') ||
    (userDateFilter && userDateFilter.trim()) ||
    (userSortOrder && userSortOrder !== 'newest')
  );

  const resetPagination = () => {
    setUsersPage(1);
    setSelectedUserIds([]);
  };

  return (
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
              resetPagination();
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

      {/* Linha 2: Filtros de Perfil, DDI, DDD, Mês, Data Específica e Ordenação */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div className="table-filter-group" style={{ margin: 0 }}>
          <Filter size={14} color="#64748b" />
          <label htmlFor="user-role-filter" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Perfil:</label>
          <select
            id="user-role-filter"
            value={userRoleFilter}
            onChange={(e) => {
              setUserRoleFilter(e.target.value);
              resetPagination();
            }}
            data-testid="filter-user-role-select"
            style={{ fontSize: '12.5px', padding: '5px 8px' }}
          >
            <option value="all">Todos os perfis</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Administrador (Admin)</option>
            <option value="aluno">Aluno</option>
            <option value="aluno_interno">Aluno Interno</option>
          </select>
        </div>

        <div className="table-filter-group" style={{ margin: 0 }}>
          <Phone size={14} color="#64748b" />
          <label htmlFor="user-ddi-filter" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>DDI:</label>
          <select
            id="user-ddi-filter"
            value={userDdiFilter}
            onChange={(e) => {
              if (setUserDdiFilter) setUserDdiFilter(e.target.value);
              resetPagination();
            }}
            data-testid="filter-user-ddi-select"
            style={{ fontSize: '12.5px', padding: '5px 8px' }}
          >
            {DDI_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

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
              resetPagination();
            }}
            data-testid="filter-user-ddd-input"
            style={{ width: '70px', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', color: '#334155', outline: 'none' }}
          />
        </div>

        <div className="table-filter-group" style={{ margin: 0 }}>
          <Calendar size={14} color="#64748b" />
          <label htmlFor="user-month-filter" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Criado em:</label>
          <select
            id="user-month-filter"
            value={userMonthFilter}
            onChange={(e) => {
              if (setUserMonthFilter) setUserMonthFilter(e.target.value);
              resetPagination();
            }}
            data-testid="filter-user-month-select"
            style={{ fontSize: '12.5px', padding: '5px 8px' }}
          >
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="table-filter-group" style={{ margin: 0 }}>
          <Calendar size={14} color="#64748b" />
          <label htmlFor="user-date-filter" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Data:</label>
          <input
            id="user-date-filter"
            type="date"
            value={userDateFilter}
            onChange={(e) => {
              if (setUserDateFilter) setUserDateFilter(e.target.value);
              resetPagination();
            }}
            data-testid="filter-user-date-input"
            style={{
              fontSize: '12.5px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              color: '#f8fafc',
              colorScheme: 'dark',
              outline: 'none',
            }}
          />
        </div>

        <div className="table-filter-group" style={{ margin: 0 }}>
          <ArrowUpDown size={14} color="#64748b" />
          <label htmlFor="user-sort-order" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Ordenar:</label>
          <select
            id="user-sort-order"
            value={userSortOrder}
            onChange={(e) => {
              if (setUserSortOrder) setUserSortOrder(e.target.value);
              resetPagination();
            }}
            data-testid="sort-user-order-select"
            style={{ fontSize: '12.5px', padding: '5px 8px' }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

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
                if (setUserDateFilter) setUserDateFilter('');
                if (setUserSortOrder) setUserSortOrder('newest');
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
  );
}
