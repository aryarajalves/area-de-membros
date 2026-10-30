import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Filter,
  Zap,
  Sparkles,
  FileText,
  ListChecks,
  Image as ImageIcon,
  AlertTriangle,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import BatchVideoOptimizationModal from './BatchVideoOptimizationModal';

export function isClientBadLessonTitle(title, importIdentifier = '', hasDescription = false) {
  const t = (title || '').trim();
  if (t.length < 8) return true;

  // UUID ou hash longo (ex: 2a8bcc96-3336-462f-a0a0-cacde04f86b9)
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(t)) {
    return true;
  }
  if (/^[0-9a-fA-F_-]{16,}$/.test(t)) {
    return true;
  }

  // Extensão de arquivo ou prefixo bruto de gravação
  if (/\.(mp4|mov|mkv|webm|avi)$/i.test(t)) return true;
  if (/(^vid_|^img_|^mvi_|whatsapp video|screen recording|_1080p|_720p)/i.test(t)) return true;
  if (t.includes('_') && !t.includes(' ')) return true;

  // Genérico demais ("Aula 1", "Vídeo 02", "Sem título")
  if (/^(aula|video|vídeo|lesson|parte|modulo|módulo|sem t[íi]tulo)\s*[-#:]?\s*\d*$/i.test(t)) {
    return true;
  }

  if (importIdentifier && !hasDescription) {
    const rawBase = importIdentifier.replace(/\.[^/.]+$/, '').trim().toLowerCase();
    const rawClean = rawBase.replace(/^[\d\s._-]+/, '').trim();
    const tClean = t.toLowerCase().replace(/^[\d\s._-]+/, '').trim();
    if (rawClean && tClean === rawClean && !t.includes(':') && t.length < 28) {
      return true;
    }
  }

  return false;
}

export function buildClientLessonAudit(lesson, serverEntry = null) {
  const isVideo = (lesson?.content_type || 'video') === 'video';
  const vUrl = lesson?.video_url || lesson?.videos?.[0]?.video_url || '';
  const cleanUrl = vUrl.split('?')[0].toLowerCase();
  const isRawExt = /\.(mov|mkv|avi|webm)$/i.test(cleanUrl);

  const descText = (lesson?.description || '').trim();
  const missingDescription = serverEntry?.missing_description ?? descText.length < 25;
  const missingThumbnail = serverEntry?.missing_thumbnail ?? !Boolean((lesson?.thumbnail_url || '').trim());

  const unoptimizedVideo =
    serverEntry?.unoptimized_video ??
    (isVideo && Boolean(vUrl) && (isRawExt || lesson?.is_optimized === false));

  const hasLocalChapters =
    Array.isArray(lesson?.chapters) && lesson.chapters.length > 0
      ? true
      : Boolean(lesson?.transcription?.chapters && lesson.transcription.chapters !== '[]');

  const missingChapters =
    serverEntry?.missing_chapters ??
    (isVideo ? !hasLocalChapters && lesson?.has_chapters !== true : false);

  const badTitle =
    serverEntry?.bad_title ??
    isClientBadLessonTitle(lesson?.title, lesson?.import_identifier, !missingDescription);

  const anyIssue = Boolean(
    unoptimizedVideo ||
      missingDescription ||
      missingChapters ||
      missingThumbnail ||
      badTitle
  );

  return {
    lesson_id: lesson?.id,
    unoptimized_video: Boolean(unoptimizedVideo),
    missing_description: Boolean(missingDescription),
    missing_chapters: Boolean(missingChapters),
    missing_thumbnail: Boolean(missingThumbnail),
    bad_title: Boolean(badTitle),
    any_issue: anyIssue,
    size_mb: serverEntry?.size_mb || 0,
    format: serverEntry?.format || (isRawExt ? cleanUrl.split('.').pop().toUpperCase() : '')
  };
}

export function useSuperAdminLessonAudit(courseId, modules = [], currentUser = null) {
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const [activeFilter, setActiveFilter] = useState('all');
  const [serverLessonsMap, setServerLessonsMap] = useState({});

  const fetchServerAudit = useCallback(async () => {
    if (!isSuperAdmin || !courseId) return;
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch(`/api/v1/courses/${courseId}/superadmin-audit`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.lessons) {
          setServerLessonsMap(data.lessons);
        }
      }
    } catch {
      // Fallback silencioso para auditoria client-side
    }
  }, [isSuperAdmin, courseId]);

  useEffect(() => {
    if (isSuperAdmin && courseId) {
      fetchServerAudit();
    }
  }, [isSuperAdmin, courseId, modules, fetchServerAudit]);

  useEffect(() => {
    if (!isSuperAdmin) return undefined;
    const onUpdated = () => fetchServerAudit();
    window.addEventListener('lesson-title-updated', onUpdated);
    return () => window.removeEventListener('lesson-title-updated', onUpdated);
  }, [isSuperAdmin, fetchServerAudit]);

  const { auditByLessonId, counts, filteredFlatLessons, unoptimizedItems } = useMemo(() => {
    const map = {};
    const totals = {
      all: 0,
      any_issue: 0,
      unoptimized_video: 0,
      bad_title: 0,
      missing_description: 0,
      missing_chapters: 0,
      missing_thumbnail: 0
    };
    const matchingList = [];
    const unoptList = [];

    if (!isSuperAdmin) {
      return {
        auditByLessonId: map,
        counts: totals,
        filteredFlatLessons: matchingList,
        unoptimizedItems: unoptList
      };
    }

    for (const mod of modules || []) {
      for (const lesson of mod.lessons || []) {
        totals.all += 1;
        const srv = serverLessonsMap[String(lesson.id)] || serverLessonsMap[lesson.id] || null;
        const audit = buildClientLessonAudit(lesson, srv);
        map[lesson.id] = audit;

        if (audit.any_issue) totals.any_issue += 1;
        if (audit.unoptimized_video) {
          totals.unoptimized_video += 1;
          unoptList.push({ mod, lesson, audit });
        }
        if (audit.bad_title) totals.bad_title += 1;
        if (audit.missing_description) totals.missing_description += 1;
        if (audit.missing_chapters) totals.missing_chapters += 1;
        if (audit.missing_thumbnail) totals.missing_thumbnail += 1;

        if (activeFilter !== 'all' && audit[activeFilter]) {
          matchingList.push({ mod, lesson, audit });
        }
      }
    }

    return {
      auditByLessonId: map,
      counts: totals,
      filteredFlatLessons: matchingList,
      unoptimizedItems: unoptList
    };
  }, [isSuperAdmin, modules, serverLessonsMap, activeFilter]);

  const matchesFilter = useCallback(
    (lesson) => {
      if (!isSuperAdmin || activeFilter === 'all') return true;
      const audit = auditByLessonId[lesson?.id];
      return Boolean(audit && audit[activeFilter]);
    },
    [isSuperAdmin, activeFilter, auditByLessonId]
  );

  return {
    isSuperAdmin,
    activeFilter,
    setActiveFilter,
    auditByLessonId,
    counts,
    filteredFlatLessons,
    unoptimizedItems,
    matchesFilter,
    refreshAudit: fetchServerAudit
  };
}

const FILTER_BUTTONS = [
  {
    key: 'unoptimized_video',
    label: 'Sem Otimização',
    icon: Zap,
    color: '#facc15',
    bgActive: 'rgba(234, 179, 8, 0.22)',
    borderActive: 'rgba(234, 179, 8, 0.6)'
  },
  {
    key: 'bad_title',
    label: 'Sem Nome IA',
    icon: Sparkles,
    color: '#c084fc',
    bgActive: 'rgba(192, 132, 252, 0.22)',
    borderActive: 'rgba(192, 132, 252, 0.6)'
  },
  {
    key: 'missing_description',
    label: 'Sem Descrição IA',
    icon: FileText,
    color: '#38bdf8',
    bgActive: 'rgba(56, 189, 248, 0.22)',
    borderActive: 'rgba(56, 189, 248, 0.6)'
  },
  {
    key: 'missing_chapters',
    label: 'Sem Capítulos IA',
    icon: ListChecks,
    color: '#fb923c',
    bgActive: 'rgba(251, 146, 60, 0.22)',
    borderActive: 'rgba(251, 146, 60, 0.6)'
  },
  {
    key: 'missing_thumbnail',
    label: 'Sem Thumbnail',
    icon: ImageIcon,
    color: '#f472b6',
    bgActive: 'rgba(244, 114, 182, 0.22)',
    borderActive: 'rgba(244, 114, 182, 0.6)'
  },
  {
    key: 'any_issue',
    label: 'Qualquer Pendência',
    icon: AlertTriangle,
    color: '#f87171',
    bgActive: 'rgba(248, 113, 113, 0.22)',
    borderActive: 'rgba(248, 113, 113, 0.6)'
  }
];

export default function SuperAdminLessonAuditFilterBar({
  isSuperAdmin,
  activeFilter,
  onSelectFilter,
  counts,
  filteredFlatLessons = [],
  unoptimizedItems = [],
  onRefreshAudit,
  activeLessonId,
  onSelectLesson
}) {
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  if (!isSuperAdmin) return null;

  const handleJumpToNext = () => {
    if (!filteredFlatLessons.length || !onSelectLesson) return;
    const currentIdx = filteredFlatLessons.findIndex((item) => item.lesson.id === activeLessonId);
    const nextItem =
      currentIdx >= 0 && currentIdx + 1 < filteredFlatLessons.length
        ? filteredFlatLessons[currentIdx + 1]
        : filteredFlatLessons[0];
    if (nextItem) {
      onSelectLesson(nextItem.lesson);
    }
  };

  return (
    <>
      <div
        data-testid="superadmin-lesson-audit-filter-bar"
        style={{
          padding: '12px',
          borderRadius: '14px',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.85) 0%, rgba(9, 13, 24, 0.92) 100%)',
          border: '1px solid rgba(234, 179, 8, 0.28)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {/* Cabeçalho do Filtro Super Admin */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={13} color="#facc15" />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#facc15'
              }}
            >
              Filtros Super Admin
            </span>
          </div>

          {activeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectFilter('all')}
              data-testid="superadmin-filter-reset-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              <RotateCcw size={11} />
              <span>Mostrar Todas ({counts.all})</span>
            </button>
          )}
        </div>

        {/* Botão de Fila de Otimização Automática 1 a 1 */}
        {counts?.unoptimized_video > 0 && (
          <button
            type="button"
            onClick={() => setBatchModalOpen(true)}
            data-testid="superadmin-open-batch-opt-modal-btn"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              border: '1px solid rgba(234, 179, 8, 0.65)',
              background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
              color: '#0f172a',
              boxShadow: '0 3px 12px rgba(234, 179, 8, 0.25)'
            }}
          >
            <Zap size={14} />
            <span>Otimizar Aulas em Fila ({counts.unoptimized_video})</span>
          </button>
        )}

        {/* Grade de Botões de Filtro */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}
        >
          {FILTER_BUTTONS.map((btn) => {
            const isActive = activeFilter === btn.key;
            const count = counts?.[btn.key] ?? 0;
            const Icon = btn.icon;

            return (
              <button
                key={btn.key}
                type="button"
                data-testid={`superadmin-filter-btn-${btn.key}`}
                onClick={() => onSelectFilter(isActive ? 'all' : btn.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 9px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                  backgroundColor: isActive ? btn.bgActive : 'rgba(30, 41, 59, 0.65)',
                  color: isActive ? '#ffffff' : '#cbd5e1',
                  border: isActive
                    ? `1px solid ${btn.borderActive}`
                    : '1px solid rgba(148, 163, 184, 0.18)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={12} color={btn.color} />
                <span>{btn.label}</span>
                <span
                  data-testid={`superadmin-filter-count-${btn.key}`}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '999px',
                    backgroundColor: count > 0 ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.06)',
                    color: count > 0 ? btn.color : '#64748b'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Resumo do Filtro Ativo + Botão de Pular para Próxima Aula Pendente */}
        {activeFilter !== 'all' && (
          <div
            data-testid="superadmin-filter-active-summary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(148, 163, 184, 0.14)',
              fontSize: '11.5px',
              color: '#cbd5e1'
            }}
          >
            <span>
              {filteredFlatLessons.length === 0
                ? '🎉 Nenhuma aula pendente neste filtro!'
                : `${filteredFlatLessons.length} aula(s) encontrada(s)`}
            </span>

            {filteredFlatLessons.length > 0 && (
              <button
                type="button"
                onClick={handleJumpToNext}
                data-testid="superadmin-jump-next-filtered-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 9px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: 'rgba(234, 179, 8, 0.2)',
                  color: '#facc15',
                  border: '1px solid rgba(234, 179, 8, 0.45)'
                }}
              >
                <span>Próxima Pendente</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Popup Modal de Fila de Otimização de 1 em 1 */}
      <BatchVideoOptimizationModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        unoptimizedItems={unoptimizedItems}
        onQueueUpdated={onRefreshAudit}
      />
    </>
  );
}
