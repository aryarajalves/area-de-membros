import React, { useState, useEffect } from 'react';
import { MessageSquare, Globe, GraduationCap } from 'lucide-react';
import FunnelNodeSenderSelect from './FunnelNodeSenderSelect';

export default function FunnelNodeMessageDestination({
  destinationType = 'dm',
  courseId = null,
  onSelectDestination,
  onSelectCourse,
  senderId = null,
  onSelectSender,
  availableSenders = [],
  nodeId,
  propCourses = null,
}) {
  const [internalCourses, setInternalCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const courses = propCourses && propCourses.length > 0 ? propCourses : internalCourses;

  useEffect(() => {
    if (propCourses && propCourses.length > 0) return;
    let isMounted = true;
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const res = await fetch('/api/v1/courses', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const list = await res.json();
          if (isMounted) setInternalCourses(Array.isArray(list) ? list : []);
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
  }, [propCourses ? propCourses.length : 0]);

  const handleCourseChange = (e) => {
    const val = e.target.value;
    const selectedCourseId = val ? parseInt(val, 10) : null;
    const found = courses.find((c) => c.id === selectedCourseId);
    onSelectCourse(selectedCourseId, found ? found.title : '');
  };

  return (
    <div style={{ marginBottom: '10px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#94a3b8',
          marginBottom: '5px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Destino do Disparo
      </label>

      {/* Tabs / Pílulas de seleção de destino */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px',
          backgroundColor: '#020617',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => onSelectDestination('dm')}
          data-testid={`dest-tab-dm-${nodeId}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '5px 4px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.68rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: destinationType === 'dm' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: destinationType === 'dm' ? '#38bdf8' : '#94a3b8',
            transition: 'all 0.15s ease',
          }}
          title="Disparo direto no chat privado do aluno"
        >
          <MessageSquare size={11} />
          <span>DM Aluno</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectDestination('community_general')}
          data-testid={`dest-tab-community-general-${nodeId}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '5px 4px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.68rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: destinationType === 'community_general' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: destinationType === 'community_general' ? '#34d399' : '#94a3b8',
            transition: 'all 0.15s ease',
          }}
          title="Disparo público no canal geral da comunidade"
        >
          <Globe size={11} />
          <span>Geral</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectDestination('community_course')}
          data-testid={`dest-tab-community-course-${nodeId}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '5px 4px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.68rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: destinationType === 'community_course' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
            color: destinationType === 'community_course' ? '#c084fc' : '#94a3b8',
            transition: 'all 0.15s ease',
          }}
          title="Disparo público no grupo/canal de um curso específico"
        >
          <GraduationCap size={11} />
          <span>Curso</span>
        </button>
      </div>

      {/* Conteúdo específico conforme o destino */}
      {destinationType === 'dm' && (
        <FunnelNodeSenderSelect
          value={senderId}
          onChange={onSelectSender}
          availableSenders={availableSenders}
          nodeId={nodeId}
          accentColor="#38bdf8"
        />
      )}

      {destinationType === 'community_general' && (
        <div
          data-testid={`info-community-general-${nodeId}`}
          style={{
            padding: '6px 8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Globe size={12} color="#34d399" />
          <span style={{ fontSize: '0.68rem', color: '#a7f3d0' }}>
            A mensagem será publicada no canal <strong>Geral</strong> da Comunidade.
          </span>
        </div>
      )}

      {destinationType === 'community_course' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.68rem', color: '#c084fc', fontWeight: 600 }}>
            Selecione o Grupo do Curso:
          </label>
          <select
            value={courseId || ''}
            onChange={handleCourseChange}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            disabled={loadingCourses}
            data-testid={`select-community-course-${nodeId}`}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: '#020617',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '0.75rem',
              outline: 'none',
              cursor: loadingCourses ? 'wait' : 'pointer',
            }}
          >
            <option value="">
              {loadingCourses ? '-- Carregando cursos... --' : '-- Escolha o curso --'}
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
