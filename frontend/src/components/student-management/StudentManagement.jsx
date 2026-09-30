import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, BookOpen, CheckCircle, TrendingUp, X } from 'lucide-react';
import StudentCard from './StudentCard';
import StudentImportModal from './StudentImportModal';
import StudentHeaderActions from './StudentHeaderActions';
import { useToast } from '../../context/ToastContext';

export default function StudentManagement({ bgColor = '#090d16' }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { addToast } = useToast();

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (appliedSearch.trim()) {
        params.append('search', appliedSearch.trim());
      }

      const res = await fetch(`/api/v1/students?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('Falha ao carregar alunos');
      }

      const data = await res.json();
      setStudents(data.items || []);
      setTotalStudents(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err) {
      addToast(err.message || 'Erro ao carregar lista de alunos', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedSearch, addToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    setAppliedSearch('');
    setPage(1);
  };

  const handleExport = async (format) => {
    setIsExportDropdownOpen(false);
    setExporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/students/export?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Falha ao exportar alunos.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alunos_area_de_membros_${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast(`Exportação ${format.toUpperCase()} realizada com sucesso!`, 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao exportar lista de alunos.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Cálculo de estatísticas rápidas
  const activeStudentsCount = students.filter((s) => s.is_active).length;
  const overallAvgProgress =
    students.length > 0
      ? Math.round(students.reduce((acc, s) => acc + (s.overall_progress_percent || 0), 0) / students.length)
      : 0;

  return (
    <div
      className="student-management-page"
      style={{
        padding: '28px 36px',
        backgroundColor: bgColor,
        minHeight: '100vh',
        color: textColor,
      }}
      data-testid="student-management-page"
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700 }}>Alunos e Progresso</h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.92rem', color: subTextColor }}>
            Acompanhe os alunos cadastrados na plataforma, cursos aos quais têm acesso e o progresso das aulas.
          </p>
        </div>

        <StudentHeaderActions
          textColor={textColor}
          isLightBg={isLightBg}
          exporting={exporting}
          isExportDropdownOpen={isExportDropdownOpen}
          setIsExportDropdownOpen={setIsExportDropdownOpen}
          onExport={handleExport}
          onOpenImport={() => setIsImportModalOpen(true)}
        />
      </div>

      {/* Cards de Métricas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total de Alunos', value: totalStudents, icon: Users, color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)' },
          { label: 'Alunos Ativos', value: activeStudentsCount, icon: CheckCircle, color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
          { label: 'Progresso Médio', value: `${overallAvgProgress}%`, icon: TrendingUp, color: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)' },
        ].map((item, idx) => (
          <div key={idx} style={{ backgroundColor: cardBg, border: cardBorder, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <item.icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: subTextColor }}>{item.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: item.label === 'Progresso Médio' ? '#c084fc' : textColor }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de Filtros e Busca */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', maxWidth: '460px' }}>
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
                border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                color: textColor,
                fontSize: '0.9rem',
                outline: 'none',
              }}
              data-testid="student-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
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
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            data-testid="submit-student-search-btn"
          >
            Buscar
          </button>
        </form>

        <button
          type="button"
          onClick={fetchStudents}
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

      {/* Listagem de Alunos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: subTextColor }} data-testid="students-loading">
          <RefreshCw size={28} className="spin" style={{ marginBottom: '10px', display: 'inline-block' }} />
          <div>Carregando alunos e dados de progresso...</div>
        </div>
      ) : students.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: cardBg,
            border: cardBorder,
            borderRadius: '12px',
            color: subTextColor,
          }}
          data-testid="no-students-message"
        >
          <Users size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px 0', color: textColor, fontSize: '1.15rem' }}>
            Nenhum aluno encontrado
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>
            {appliedSearch
              ? `Não foram encontrados alunos correspondentes a "${appliedSearch}".`
              : 'Nenhum aluno com este perfil foi cadastrado na plataforma ainda.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="students-list">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} isLightBg={isLightBg} />
          ))}
        </div>
      )}

      {/* Paginação e Seletor de Quantidade */}
      {!loading && totalStudents > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '0.85rem',
            color: subTextColor,
          }}
          data-testid="students-pagination-bar"
        >
          {/* Contador de alunos exibidos */}
          <div>
            Exibindo <strong>{(page - 1) * limit + 1}–{Math.min(page * limit, totalStudents)}</strong> de{' '}
            <strong>{totalStudents}</strong> {totalStudents === 1 ? 'aluno' : 'alunos'}
          </div>

          {/* Seletor de quantidade por página e botões de navegação */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="students-per-page-select" style={{ fontSize: '0.82rem', color: subTextColor }}>
                Exibir:
              </label>
              <select
                id="students-per-page-select"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.06)',
                  color: textColor,
                  border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                data-testid="students-per-page-select"
              >
                <option value={20} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>20 por vez</option>
                <option value={50} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>50 por vez</option>
                <option value={100} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>100 por vez</option>
                <option value={200} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>200 por vez</option>
              </select>
            </div>

            {/* Controles de página */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'transparent',
                  color: textColor,
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.35 : 1,
                  transition: 'all 0.2s ease',
                }}
                data-testid="prev-students-page-btn"
              >
                Anterior
              </button>
              <span style={{ fontSize: '0.84rem', color: subTextColor, padding: '0 4px' }}>
                Página <strong>{page}</strong> de <strong>{totalPages}</strong>
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'transparent',
                  color: textColor,
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.35 : 1,
                  transition: 'all 0.2s ease',
                }}
                data-testid="next-students-page-btn"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação de Alunos */}
      <StudentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchStudents}
      />
    </div>
  );
}
