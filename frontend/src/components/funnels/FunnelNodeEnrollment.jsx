import React, { useState, useEffect } from 'react';
import { Gift, Copy, Trash2, BookOpen, Clock, CheckCircle2 } from 'lucide-react';

const DURATION_OPTIONS = [
  { value: 'lifetime', label: 'Vitalício (Sem expiração)' },
  { value: '1_month', label: '1 Mês (30 dias)' },
  { value: '3_months', label: '3 Meses (90 dias)' },
  { value: '6_months', label: '6 Meses (180 dias)' },
  { value: '1_year', label: '1 Ano (365 dias)' },
  { value: '2_years', label: '2 Anos (730 dias)' },
];

export default function FunnelNodeEnrollment({
  node,
  isSelected,
  courses: propCourses,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  isTargetActive = false,
}) {
  const data = node.data || {};
  const [courses, setCourses] = useState(propCourses || []);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (propCourses && propCourses.length > 0) {
      setCourses(propCourses);
      return;
    }
    let isMounted = true;
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/v1/courses', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const list = await res.json();
          if (isMounted) setCourses(Array.isArray(list) ? list : []);
        }
      } catch {
        /* fallback silencioso */
      } finally {
        if (isMounted) setLoadingCourses(false);
      }
    };
    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, [propCourses]);

  const handleCourseChange = (e) => {
    const val = e.target.value;
    const selectedCourseId = val ? parseInt(val, 10) : null;
    const found = courses.find((c) => c.id === selectedCourseId);
    onUpdateData(node.id, {
      ...data,
      course_id: selectedCourseId,
      course_title: found ? found.title : '',
    });
  };

  const handleDurationChange = (e) => {
    onUpdateData(node.id, {
      ...data,
      access_duration: e.target.value,
    });
  };

  const selectedTitle = data.course_title || (courses.find((c) => c.id === data.course_id)?.title) || 'Nenhum selecionado';
  const accessDuration = data.access_duration || 'lifetime';
  const durationLabel = DURATION_OPTIONS.find((d) => d.value === accessDuration)?.label || accessDuration;

  return (
    <div
      style={{
        position: 'relative',
        width: '310px',
        backgroundColor: '#061a12',
        border: isSelected ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.45)',
        borderRadius: '14px',
        boxShadow: isSelected
          ? '0 10px 30px rgba(16, 185, 129, 0.45)'
          : '0 10px 25px rgba(0, 0, 0, 0.7)',
        color: '#f8fafc',
        padding: '14px',
        userSelect: 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid={`funnel-node-enrollment-${node.id}`}
    >
      {/* Port de Entrada */}
      <div
        data-testid={`node-input-handle-${node.id}`}
        onClick={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'input');
        }}
        style={{
          position: 'absolute',
          left: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: isTargetActive ? '#34d399' : '#059669',
          border: '2px solid #0f172a',
          boxShadow: isTargetActive ? '0 0 12px #34d399' : '0 0 8px rgba(16, 185, 129, 0.6)',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Conectar entrada deste nó"
      />

      {/* Port de Saída */}
      <div
        data-testid={`node-output-handle-${node.id}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #10b981',
          cursor: 'grab',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Clique ou arraste para conectar ao próximo passo"
      />

      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          borderBottom: '1px solid rgba(16, 185, 129, 0.35)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}
          >
            <Gift size={14} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.04em' }}>
            MATRÍCULA AUTOMÁTICA
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#10b981',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '10px',
              padding: '2px 6px',
            }}
          >
            AÇÃO
          </span>
          {onDuplicateNode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateNode(node.id);
              }}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
              title="Duplicar nó"
            >
              <Copy size={13} />
            </button>
          )}
          {onDeleteNode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(node.id);
              }}
              style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
              title="Excluir nó"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        Libera acesso imediato a um curso bônus ou ferramenta como recompensa.
      </p>

      {/* Seletor de Curso */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <BookOpen size={12} color="#10b981" />
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Curso a Liberar:</label>
        </div>
        <select
          value={data.course_id || ''}
          onChange={handleCourseChange}
          disabled={loadingCourses}
          data-testid={`enrollment-course-select-${node.id}`}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            backgroundColor: '#020d08',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#a7f3d0',
            fontSize: '0.75rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">Selecione um curso...</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Duração do Acesso */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <Clock size={12} color="#10b981" />
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Tempo de Acesso:</label>
        </div>
        <select
          value={accessDuration}
          onChange={handleDurationChange}
          data-testid={`enrollment-duration-select-${node.id}`}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            backgroundColor: '#020d08',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#a7f3d0',
            fontSize: '0.75rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Resumo */}
      <div
        style={{
          padding: '6px 8px',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderLeft: '3px solid #10b981',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <CheckCircle2 size={12} color="#34d399" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.68rem', color: '#a7f3d0' }}>
          Libera: <strong>{selectedTitle}</strong> ({durationLabel})
        </span>
      </div>
    </div>
  );
}
