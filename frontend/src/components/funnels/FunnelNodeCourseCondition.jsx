import React, { useState, useEffect } from 'react';
import { GraduationCap, Trash2, Copy } from 'lucide-react';

export default function FunnelNodeCourseCondition({
  node,
  isSelected,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  isTargetActive = false,
}) {
  const data = node.data || {};
  const selectedCourseId = data.course_id || 'any';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      setLoading(true);
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
        if (isMounted) setLoading(false);
      }
    };
    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCourseChange = (e) => {
    const val = e.target.value;
    if (val === 'any') {
      onUpdateData(node.id, {
        ...data,
        course_id: 'any',
        course_title: 'Qualquer Curso Ativo',
      });
    } else {
      const found = courses.find((c) => String(c.id) === String(val));
      onUpdateData(node.id, {
        ...data,
        course_id: parseInt(val, 10),
        course_title: found?.title || `Curso #${val}`,
      });
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '320px',
        backgroundColor: '#0a1926',
        border: isSelected ? '2px solid #06b6d4' : '1px solid rgba(6, 182, 212, 0.45)',
        borderRadius: '14px',
        boxShadow: isSelected ? '0 10px 30px rgba(6, 182, 212, 0.35)' : '0 10px 25px rgba(0, 0, 0, 0.7)',
        color: '#f8fafc',
        padding: '12px 14px',
        userSelect: 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid={`funnel-node-course-condition-${node.id}`}
    >
      {/* Port de Entrada (Esquerda) */}
      <div
        onMouseUp={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'input');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'input');
        }}
        style={{
          position: 'absolute',
          left: '-8px',
          top: '50%',
          transform: isTargetActive ? 'translateY(-50%) scale(1.4)' : 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#06b6d4',
          border: '2px solid #0f172a',
          boxShadow: isTargetActive ? '0 0 14px #22d3ee' : '0 0 8px #06b6d4',
          cursor: 'pointer',
          zIndex: 10,
        }}
        title="Entrada do nó"
        data-testid={`node-input-handle-${node.id}`}
      />

      {/* Port de Saída SIM (Superior - top 35%) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output_yes');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output_yes');
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '35%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #10b981',
          cursor: 'grab',
          zIndex: 10,
        }}
        title="Saída SIM: Aluno possui acesso ao curso"
        data-testid={`node-output-handle-yes-${node.id}`}
      />
      <span
        style={{
          position: 'absolute',
          right: '12px',
          top: '35%',
          transform: 'translateY(-50%)',
          fontSize: '9px',
          fontWeight: 800,
          color: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.18)',
          border: '1px solid rgba(16, 185, 129, 0.5)',
          padding: '2px 5px',
          borderRadius: '4px',
          pointerEvents: 'none',
        }}
      >
        SIM: POSSUI
      </span>

      {/* Port de Saída NÃO (Inferior - top 65%) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output_no');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output_no');
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '65%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #ef4444',
          cursor: 'grab',
          zIndex: 10,
        }}
        title="Saída NÃO: Aluno NÃO possui o curso"
        data-testid={`node-output-handle-no-${node.id}`}
      />
      <span
        style={{
          position: 'absolute',
          right: '12px',
          top: '65%',
          transform: 'translateY(-50%)',
          fontSize: '9px',
          fontWeight: 800,
          color: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.18)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          padding: '2px 5px',
          borderRadius: '4px',
          pointerEvents: 'none',
        }}
      >
        NÃO POSSUI
      </span>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4' }}>
          <GraduationCap size={15} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em' }}>
            POSSUI CURSO?
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button
            onClick={() => onDuplicateNode(node.id)}
            title="Duplicar"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
          >
            <Copy size={12} />
          </button>
          <button
            onClick={() => onDeleteNode(node.id)}
            title="Excluir"
            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Seleção de Curso */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          Verificar matrícula do aluno em:
        </span>
        <select
          value={selectedCourseId}
          onChange={handleCourseChange}
          style={{
            width: '100%',
            backgroundColor: '#020617',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '6px',
            color: '#f8fafc',
            padding: '7px 8px',
            fontSize: '0.78rem',
            outline: 'none',
          }}
          data-testid={`course-condition-select-${node.id}`}
        >
          <option value="any">Qualquer Curso Ativo</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        {loading && <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Carregando cursos...</span>}
      </div>
    </div>
  );
}
