import React from 'react';
import { Search, X, Filter, BookOpen, ArrowUpDown } from 'lucide-react';

export default function ChatDmContactFilters({
  searchTerm,
  setSearchTerm,
  selectedRole,
  onRoleChange,
  selectedCourseId,
  onCourseChange,
  orderBy,
  onOrderChange,
  courses = [],
}) {
  return (
    <div
      style={{
        padding: '12px 16px 8px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0c1322',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
      data-testid="dm-contact-filters-bar"
    >
      {/* Campo de Busca */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#1e293b',
          borderRadius: '10px',
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Search size={16} color="#94a3b8" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="dm-search-contact-input"
          autoFocus
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#f8fafc',
            fontSize: '0.85rem',
            width: '100%',
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            aria-label="Limpar busca"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Linha de Filtros: Perfil, Curso e Ordenação */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {/* 1. Filtro por Perfil */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Filter size={13} style={{ color: '#38bdf8' }} />
          <select
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
            data-testid="filter-role-select"
            aria-label="Filtrar por perfil"
            style={{
              backgroundColor: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '0.75rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Todos os perfis</option>
            <option value="admin">Administradores</option>
            <option value="aluno">Alunos</option>
            <option value="superadmin">Super Admins</option>
          </select>
        </div>

        {/* 2. Filtro por Curso */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <BookOpen size={13} style={{ color: '#a855f7' }} />
          <select
            value={selectedCourseId}
            onChange={(e) => onCourseChange(e.target.value)}
            data-testid="filter-course-select"
            aria-label="Filtrar por curso"
            style={{
              backgroundColor: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '0.75rem',
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '160px',
            }}
          >
            <option value="">Todos os Cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Filtro por Ordenação */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ArrowUpDown size={13} style={{ color: '#f59e0b' }} />
          <select
            value={orderBy}
            onChange={(e) => onOrderChange(e.target.value)}
            data-testid="filter-order-select"
            aria-label="Ordenar contatos"
            style={{
              backgroundColor: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '0.75rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="name_asc">🔤 Ordem A-Z</option>
            <option value="name_desc">🔤 Ordem Z-A</option>
            <option value="level_desc">🏆 Maiores Níveis (RPG)</option>
            <option value="recent">📅 Mais Recentes</option>
            <option value="oldest">📅 Mais Antigos</option>
          </select>
        </div>
      </div>
    </div>
  );
}
