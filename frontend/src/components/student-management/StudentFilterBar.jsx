import React from 'react';
import { Search, RefreshCw, X, BookOpen, ArrowUpDown, Calendar, Filter } from 'lucide-react';

export default function StudentFilterBar({
  search,
  setSearch,
  onSearchSubmit,
  onClearSearch,
  orderBy,
  setOrderBy,
  selectedCourseId,
  setSelectedCourseId,
  courses = [],
  selectedMonth,
  setSelectedMonth,
  selectedDate,
  setSelectedDate,
  onResetFilters,
  hasActiveFilters,
  isLightBg,
  textColor,
  subTextColor,
  loading,
  onRefresh,
}) {
  const inputBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.05)';
  const inputBorder = isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)';
  const filterSectionBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.025)';
  const filterSectionBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.07)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        marginBottom: '24px',
      }}
      data-testid="student-filter-bar"
    >
      {/* Linha 1: Campo de Busca Principal e Botão de Atualizar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <form
          onSubmit={onSearchSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: '1',
            maxWidth: '520px',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                color: subTextColor,
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar aluno por nome ou e-mail..."
              style={{
                width: '100%',
                padding: '10px 38px 10px 38px',
                borderRadius: '8px',
                border: inputBorder,
                backgroundColor: inputBg,
                color: textColor,
                fontSize: '0.9rem',
                outline: 'none',
              }}
              data-testid="student-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={onClearSearch}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: subTextColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                data-testid="clear-student-search-btn"
                title="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.2s ease',
            }}
            data-testid="submit-student-search-btn"
          >
            Buscar
          </button>
        </form>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            borderRadius: '8px',
            border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'transparent',
            color: textColor,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.88rem',
            opacity: loading ? 0.6 : 1,
          }}
          data-testid="refresh-students-btn"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Linha 2: Barra de Filtros e Ordenação Avançada */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: filterSectionBg,
          border: filterSectionBorder,
          borderRadius: '10px',
        }}
        data-testid="advanced-filters-row"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: subTextColor, fontSize: '0.85rem' }}>
          <Filter size={15} />
          <span style={{ fontWeight: 600 }}>Filtros:</span>
        </div>

        {/* 1. Ordenação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpDown size={15} style={{ color: '#3b82f6' }} />
          <select
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '7px',
              backgroundColor: inputBg,
              border: inputBorder,
              color: textColor,
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
            data-testid="order-by-select"
            aria-label="Ordenar alunos por"
          >
            <option value="recent" style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
              Mais recentes (Cadastro)
            </option>
            <option value="progress_desc" style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
              🎯 Mais perto de terminar o curso
            </option>
            <option value="renewal_asc" style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
              ⏳ Quase precisando renovar
            </option>
            <option value="name_asc" style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
              🔤 Ordem alfabética (A-Z)
            </option>
            <option value="name_desc" style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
              🔤 Ordem alfabética (Z-A)
            </option>
            <option value="oldest" style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
              Mais antigos (Cadastro)
            </option>
          </select>
        </div>

        {/* 2. Filtro por Curso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={15} style={{ color: '#a855f7' }} />
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '7px',
              backgroundColor: inputBg,
              border: inputBorder,
              color: textColor,
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '220px',
            }}
            data-testid="filter-course-select"
            aria-label="Filtrar por curso"
          >
            <option value="" style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
              Todos os Cursos
            </option>
            {courses.map((course) => (
              <option
                key={course.id}
                value={course.id}
                style={{ backgroundColor: '#090d16', color: '#f8fafc' }}
              >
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Filtro por Mês */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={15} style={{ color: '#10b981' }} />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              if (e.target.value) setSelectedDate(''); // desmarca data específica para evitar conflito
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '7px',
              backgroundColor: inputBg,
              border: inputBorder,
              color: textColor,
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
            data-testid="filter-month-input"
            aria-label="Filtrar por mês"
            title="Filtrar alunos cadastrados no mês"
          />
        </div>

        {/* 4. Filtro por Data Específica */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={15} style={{ color: '#f59e0b' }} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              if (e.target.value) setSelectedMonth(''); // desmarca mês para focar na data específica
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '7px',
              backgroundColor: inputBg,
              border: inputBorder,
              color: textColor,
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
            data-testid="filter-date-input"
            aria-label="Filtrar por data específica"
            title="Filtrar alunos cadastrados no dia exato"
          />
        </div>

        {/* 5. Botão Limpar Filtros */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '7px',
              border: 'none',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
            data-testid="reset-filters-btn"
          >
            <X size={14} />
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>
    </div>
  );
}
