import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  Loader2,
  Zap,
  CheckSquare,
  Square,
  ChevronsUpDown,
  ListFilter
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import KnowledgeChunksModal from './KnowledgeChunksModal';
import KnowledgeBaseSimulatorCard from './KnowledgeBaseSimulatorCard';
import KnowledgeBaseCourseCard from './KnowledgeBaseCourseCard';
import KnowledgeBaseMetricsCards from './KnowledgeBaseMetricsCards';
import KnowledgeBaseBulkActionBar from './KnowledgeBaseBulkActionBar';
import KnowledgeBatchProgressModal from './KnowledgeBatchProgressModal';
import { useKnowledgeBatchIndex } from '../../hooks/useKnowledgeBatchIndex';

export default function PlatformKnowledgeBaseTab({
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)'
}) {
  const [loading, setLoading] = useState(true);
  const [indexingLessonId, setIndexingLessonId] = useState(null);
  const [generatingQaLessonId, setGeneratingQaLessonId] = useState(null);
  const [data, setData] = useState({ metrics: {}, lessons: [], tree: [] });

  // Seleção múltipla
  const [selectedLessonIds, setSelectedLessonIds] = useState([]);

  // Estado de expansão dos cursos
  const [expandedCourses, setExpandedCourses] = useState({});

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'indexed' | 'pending'

  // Modal de Chunks
  const [selectedLessonForChunks, setSelectedLessonForChunks] = useState(null);

  const { addToast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/tutor-ia/knowledge-base', { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Inicializa todos os cursos como expandidos por padrão
        const initExpanded = {};
        (json.tree || []).forEach((c) => {
          initExpanded[c.course_id] = true;
        });
        setExpandedCourses(initExpanded);
      }
    } catch (err) {
      console.error('Erro ao carregar base de conhecimento:', err);
      addToast('Falha ao carregar itens da base de conhecimento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const getAllLessonsFromTree = (treeData) => {
    const list = [];
    (treeData || []).forEach((c) => {
      c.modules?.forEach((m) => {
        m.lessons?.forEach((l) => {
          list.push(l);
        });
      });
    });
    return list;
  };

  const {
    isModalOpen: isBatchProgressOpen,
    isRunning: isBatchProgressRunning,
    isCompleted: isBatchProgressCompleted,
    isCancelled: isBatchProgressCancelled,
    total: batchTotal,
    currentStep: batchCurrentStep,
    currentLessonTitle: batchCurrentLessonTitle,
    progressPct: batchProgressPct,
    logs: batchLogs,
    stats: batchStats,
    startBatchIndex,
    cancelBatchIndex,
    closeModal: closeBatchProgressModal
  } = useKnowledgeBatchIndex(getAuthHeaders, ({ successCount, chunksCount, isCancelled }) => {
    if (!isCancelled) {
      addToast(`${successCount} aulas indexadas no RAG com sucesso! (${chunksCount} fragmentos salvos).`, 'success');
      setSelectedLessonIds([]);
    } else {
      addToast(`Sincronização interrompida. ${successCount} aulas foram indexadas.`, 'warning');
    }
    fetchOverview();
  });

  const handleIndexAll = () => {
    const all = getAllLessonsFromTree(data.tree);
    const lessonsToIndex = all.filter((l) => l.has_audio_transcription);
    if (lessonsToIndex.length === 0) {
      addToast('Nenhuma aula com transcrição de áudio encontrada para indexar.', 'warning');
      return;
    }
    startBatchIndex(lessonsToIndex);
  };

  const handleIndexSingleLesson = async (lessonId) => {
    try {
      setIndexingLessonId(lessonId);
      const res = await fetch(`/api/v1/tutor-ia/knowledge-base/lessons/${lessonId}/index`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Falha ao indexar aula.');
      }
      const result = await res.json();
      addToast(`Aula indexada com sucesso! ${result.chunks_count} fragmentos criados.`, 'success');
      await fetchOverview();
    } catch (err) {
      addToast(err.message || 'Erro ao indexar aula.', 'error');
    } finally {
      setIndexingLessonId(null);
    }
  };

  const handleGenerateSingleLessonQa = async (lessonId) => {
    try {
      setGeneratingQaLessonId(lessonId);
      const res = await fetch(`/api/v1/tutor-ia/knowledge-base/lessons/${lessonId}/generate-qa`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Falha ao gerar perguntas e respostas.');
      }
      const result = await res.json();
      addToast(result.message || '5 perguntas e respostas pedagógicas geradas com sucesso!', 'success');
      await fetchOverview();
    } catch (err) {
      addToast(err.message || 'Erro ao gerar perguntas e respostas.', 'error');
    } finally {
      setGeneratingQaLessonId(null);
    }
  };

  // Sincronização em Lote de Aulas Selecionadas com Popup de Progresso em Tempo Real
  const handleIndexSelected = () => {
    if (selectedLessonIds.length === 0) return;
    const all = getAllLessonsFromTree(data.tree);
    const selectedLessons = selectedLessonIds
      .map((id) => all.find((l) => l.lesson_id === id))
      .filter(Boolean);
    startBatchIndex(selectedLessons);
  };

  // Handlers de Seleção com Checkboxes
  const handleToggleLesson = (lessonId) => {
    setSelectedLessonIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  const handleToggleModule = (moduleLessons, isAllSelected) => {
    const ids = moduleLessons.map((l) => l.lesson_id);
    if (isAllSelected) {
      setSelectedLessonIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedLessonIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleToggleCourse = (courseLessons, isAllSelected) => {
    const ids = courseLessons.map((l) => l.lesson_id);
    if (isAllSelected) {
      setSelectedLessonIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedLessonIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleExpandAll = () => {
    const next = {};
    (data.tree || []).forEach((c) => {
      next[c.course_id] = true;
    });
    setExpandedCourses(next);
  };

  const handleCollapseAll = () => {
    const next = {};
    (data.tree || []).forEach((c) => {
      next[c.course_id] = false;
    });
    setExpandedCourses(next);
  };

  // Filtragem da árvore por Curso > Módulo > Aula
  const filteredTree = (data.tree || [])
    .map((course) => {
      const filteredModules = (course.modules || [])
        .map((mod) => {
          const filteredModLessons = (mod.lessons || []).filter((l) => {
            const matchSearch =
              l.lesson_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              course.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              mod.module_title.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchSearch) return false;
            if (filterStatus === 'indexed') return l.is_indexed;
            if (filterStatus === 'pending') return !l.is_indexed;
            return true;
          });
          return { ...mod, lessons: filteredModLessons };
        })
        .filter((mod) => mod.lessons.length > 0);

      return { ...course, modules: filteredModules };
    })
    .filter((course) => course.modules.length > 0);

  const metrics = data.metrics || {};

  return (
    <div
      data-testid="platform-knowledge-base-tab"
      style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1100px', margin: '0 auto' }}
    >
      {/* Cards de Métricas do RAG */}
      <KnowledgeBaseMetricsCards
        metrics={metrics}
        cardBg={cardBg}
        cardBorder={cardBorder}
        textColor={textColor}
        subTextColor={subTextColor}
      />

      {/* Barra de Ação em Lote Global */}
      <div
        style={{
          padding: '18px 22px',
          borderRadius: '12px',
          backgroundColor: cardBg,
          border: cardBorder,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textColor }}>
            Sincronização em Lote da Base de Conhecimento
          </h4>
          <span style={{ fontSize: '12.5px', color: subTextColor }}>
            Indexa automaticamente todas as aulas com transcrição e gera 5 Q&A com IA
          </span>
        </div>

        <button
          type="button"
          disabled={isBatchProgressRunning}
          onClick={handleIndexAll}
          data-testid="btn-index-all-rag"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0d9488 0%, #2563eb 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13.5px',
            border: 'none',
            cursor: isBatchProgressRunning ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)'
          }}
        >
          {isBatchProgressRunning ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          <span>{isBatchProgressRunning ? 'Sincronizando Aulas...' : '⚡ Indexar Todas as Aulas no RAG'}</span>
        </button>
      </div>

      {/* Caixa do Simulador de Busca Semântica */}
      <KnowledgeBaseSimulatorCard
        cardBg={cardBg}
        cardBorder={cardBorder}
        textColor={textColor}
        subTextColor={subTextColor}
        isLightBg={isLightBg}
      />

      {/* Barra Flutuante de Ação para Itens Selecionados */}
      <KnowledgeBaseBulkActionBar
        selectedCount={selectedLessonIds.length}
        onClear={() => setSelectedLessonIds([])}
        onBatchIndex={handleIndexSelected}
        isBatchRunning={isBatchProgressRunning}
        isLightBg={isLightBg}
        textColor={textColor}
        subTextColor={subTextColor}
      />

      {/* Árvore Hierárquica da Base de Conhecimento (Cursos > Módulos > Aulas) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: textColor }}>
              Base de Conhecimento Estruturada por Curso
            </h4>
            <span style={{ fontSize: '12px', color: subTextColor }}>
              Navegue pelos cursos e módulos para gerenciar fragmentos e Q&A sintético
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExpandAll}
              data-testid="btn-expand-all"
              style={{
                background: 'transparent',
                border: cardBorder,
                borderRadius: '7px',
                padding: '6px 10px',
                color: subTextColor,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Expandir Todos
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              data-testid="btn-collapse-all"
              style={{
                background: 'transparent',
                border: cardBorder,
                borderRadius: '7px',
                padding: '6px 10px',
                color: subTextColor,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Recolher Todos
            </button>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por aula ou curso..."
              data-testid="input-filter-knowledge-base"
              style={{
                padding: '7px 12px',
                borderRadius: '7px',
                border: cardBorder,
                backgroundColor: isLightBg ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
                color: textColor,
                fontSize: '12.5px',
                outline: 'none'
              }}
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '7px',
                border: cardBorder,
                backgroundColor: isLightBg ? '#f8fafc' : '#1e293b',
                color: textColor,
                fontSize: '12.5px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">Todas as Aulas</option>
              <option value="indexed">Apenas Indexadas</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: subTextColor }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
            <span>Carregando árvore da base de conhecimento...</span>
          </div>
        ) : filteredTree.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', borderRadius: '12px', backgroundColor: cardBg, border: cardBorder, color: subTextColor, fontSize: '13.5px' }}>
            Nenhuma aula ou curso encontrado com os filtros selecionados.
          </div>
        ) : (
          filteredTree.map((course) => (
            <KnowledgeBaseCourseCard
              key={course.course_id}
              course={course}
              selectedLessonIds={selectedLessonIds}
              onToggleLesson={handleToggleLesson}
              onToggleModule={handleToggleModule}
              onToggleCourse={handleToggleCourse}
              indexingLessonId={indexingLessonId}
              onIndexSingleLesson={handleIndexSingleLesson}
              onGenerateQa={handleGenerateSingleLessonQa}
              generatingQaLessonId={generatingQaLessonId}
              onOpenChunksModal={setSelectedLessonForChunks}
              isLightBg={isLightBg}
              textColor={textColor}
              subTextColor={subTextColor}
              cardBg={cardBg}
              cardBorder={cardBorder}
              isExpanded={expandedCourses[course.course_id] ?? true}
              onToggleExpand={() =>
                setExpandedCourses((prev) => ({ ...prev, [course.course_id]: !prev[course.course_id] }))
              }
            />
          ))
        )}
      </div>

      {/* Modal de Inspeção de Chunks e Perguntas & Respostas */}
      <KnowledgeChunksModal
        isOpen={Boolean(selectedLessonForChunks)}
        onClose={() => setSelectedLessonForChunks(null)}
        lesson={selectedLessonForChunks}
        isLightBg={isLightBg}
        onQaGenerated={fetchOverview}
      />

      {/* Modal de Progresso em Tempo Real da Indexação em Lote */}
      <KnowledgeBatchProgressModal
        isOpen={isBatchProgressOpen}
        isRunning={isBatchProgressRunning}
        isCompleted={isBatchProgressCompleted}
        isCancelled={isBatchProgressCancelled}
        total={batchTotal}
        currentStep={batchCurrentStep}
        currentLessonTitle={batchCurrentLessonTitle}
        progressPct={batchProgressPct}
        logs={batchLogs}
        stats={batchStats}
        onCancel={cancelBatchIndex}
        onClose={closeBatchProgressModal}
        isLightBg={isLightBg}
      />
    </div>
  );
}
