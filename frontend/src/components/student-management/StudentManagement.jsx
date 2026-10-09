import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, BookOpen, CheckCircle, TrendingUp, X, AlertTriangle, UploadCloud } from 'lucide-react';
import StudentCard from './StudentCard';
import StudentImportModal from './StudentImportModal';
import StudentHeaderActions from './StudentHeaderActions';
import StudentFilterBar from './StudentFilterBar';
import StudentPaginationBar from './StudentPaginationBar';
import StudentTagsModal from './StudentTagsModal';
import ChatBroadcastModal from './ChatBroadcastModal';
import ChatBroadcastHistoryModal from './ChatBroadcastHistoryModal';
import { useToast } from '../../context/ToastContext';

export default function StudentManagement({ bgColor = '#090d16' }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [orderBy, setOrderBy] = useState('recent');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [tags, setTags] = useState([]);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isBroadcastHistoryOpen, setIsBroadcastHistoryOpen] = useState(false);
  const { addToast } = useToast();

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';

  // Carregar lista de cursos e etiquetas
  const fetchTagsList = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/students/tags', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setTags(Array.isArray(data) ? data : []);
      }
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    const fetchCoursesList = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/v1/courses', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : []);
        }
      } catch {
        // silencioso
      }
    };
    fetchCoursesList();
    fetchTagsList();
  }, [fetchTagsList]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        order_by: orderBy,
      });
      if (appliedSearch.trim()) {
        params.append('search', appliedSearch.trim());
      }
      if (selectedCourseId) {
        params.append('course_id', selectedCourseId);
      }
      if (selectedMonth) {
        params.append('registration_month', selectedMonth);
      }
      if (selectedDate) {
        params.append('registration_date', selectedDate);
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
      const msg = err.message || 'Erro ao carregar lista de alunos';
      setLoadError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedSearch, orderBy, selectedCourseId, selectedMonth, selectedDate, addToast]);

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

  const handleResetFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setOrderBy('recent');
    setSelectedCourseId('');
    setSelectedMonth('');
    setSelectedDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    appliedSearch ||
    search ||
    orderBy !== 'recent' ||
    selectedCourseId ||
    selectedMonth ||
    selectedDate
  );

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
          onOpenBroadcast={() => setIsBroadcastModalOpen(true)}
          onOpenTags={() => setIsTagsModalOpen(true)}
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

      {/* Barra de Filtros, Busca e Ordenação */}
      <StudentFilterBar
        search={search}
        setSearch={setSearch}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        orderBy={orderBy}
        setOrderBy={(newOrder) => {
          setOrderBy(newOrder);
          setPage(1);
        }}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={(newCourseId) => {
          setSelectedCourseId(newCourseId);
          setPage(1);
        }}
        courses={courses}
        selectedMonth={selectedMonth}
        setSelectedMonth={(newMonth) => {
          setSelectedMonth(newMonth);
          setPage(1);
        }}
        selectedDate={selectedDate}
        setSelectedDate={(newDate) => {
          setSelectedDate(newDate);
          setPage(1);
        }}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        isLightBg={isLightBg}
        textColor={textColor}
        subTextColor={subTextColor}
        loading={loading}
        onRefresh={fetchStudents}
      />

      {/* Listagem de Alunos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: subTextColor }} data-testid="students-loading">
          <RefreshCw size={28} className="spin" style={{ marginBottom: '10px', display: 'inline-block' }} />
          <div>Carregando alunos e dados de progresso...</div>
        </div>
      ) : loadError ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            color: '#f87171',
          }}
          data-testid="students-load-error"
        >
          <AlertTriangle size={36} style={{ marginBottom: '10px', opacity: 0.8 }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: textColor }}>Erro ao carregar dados</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: subTextColor }}>{loadError}</p>
          <button
            type="button"
            onClick={fetchStudents}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} /> Tentar Novamente
          </button>
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
          <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem' }}>
            {appliedSearch
              ? `Não foram encontrados alunos correspondentes a "${appliedSearch}".`
              : 'Nenhum aluno com este perfil foi cadastrado na plataforma ainda.'}
          </p>
          {!appliedSearch && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="empty-import-students-btn"
            >
              <UploadCloud size={16} /> Importar Alunos (CSV / Excel)
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="students-list">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              isLightBg={isLightBg}
              onRefreshStudents={fetchStudents}
            />
          ))}
        </div>
      )}

      {/* Paginação e Seletor de Quantidade */}
      {!loading && (
        <StudentPaginationBar
          page={page}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
          totalStudents={totalStudents}
          totalPages={totalPages}
          isLightBg={isLightBg}
          textColor={textColor}
          subTextColor={subTextColor}
        />
      )}

      {/* Modal de Importação de Alunos */}
      <StudentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchStudents}
      />

      {/* Modal de Gerenciamento de Etiquetas */}
      <StudentTagsModal
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        onTagsUpdated={() => {
          fetchTagsList();
          fetchStudents();
        }}
      />

      {/* Modal de Disparo em Massa */}
      <ChatBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        courses={courses}
        tags={tags}
        onOpenHistory={() => setIsBroadcastHistoryOpen(true)}
      />

      {/* Modal de Histórico de Disparos */}
      <ChatBroadcastHistoryModal
        isOpen={isBroadcastHistoryOpen}
        onClose={() => setIsBroadcastHistoryOpen(false)}
      />
    </div>
  );
}
