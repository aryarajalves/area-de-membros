import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export default function EventAccessRuleSelector({
  targetType,
  onChangeTargetType,
  courseId,
  onChangeCourseId,
  courseIds = [],
  onChangeCourseIds,
  courses = [],
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Normaliza a lista de IDs selecionados (compatível com prop legada courseId ou array courseIds)
  const selectedIds = React.useMemo(() => {
    if (Array.isArray(courseIds) && courseIds.length > 0) {
      return courseIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id) && id > 0);
    }
    if (courseId) {
      const parsed = Number(courseId);
      return !Number.isNaN(parsed) && parsed > 0 ? [parsed] : [];
    }
    return [];
  }, [courseIds, courseId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateSelection = (nextIds) => {
    if (onChangeCourseIds) {
      onChangeCourseIds(nextIds);
    }
    if (onChangeCourseId) {
      onChangeCourseId(nextIds.length > 0 ? String(nextIds[0]) : '');
    }
  };

  const toggleCourse = (id) => {
    const numId = Number(id);
    const exists = selectedIds.includes(numId);
    const nextIds = exists
      ? selectedIds.filter((item) => item !== numId)
      : [...selectedIds, numId];
    updateSelection(nextIds);
  };

  const handleSelectAll = () => {
    const allIds = courses.map((c) => Number(c.id));
    if (selectedIds.length === allIds.length) {
      updateSelection([]);
    } else {
      updateSelection(allIds);
    }
  };

  const selectedCourses = courses.filter((c) => selectedIds.includes(Number(c.id)));

  return (
    <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '10px' }}>
        Quem pode acessar este evento?
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#cbd5e1' }}>
          <input
            type="radio"
            name="target_type"
            checked={targetType === 'all'}
            onChange={() => onChangeTargetType('all')}
          />
          <span>🌐 <strong>Liberado para Todos os Alunos</strong> da plataforma</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#cbd5e1' }}>
          <input
            type="radio"
            name="target_type"
            checked={targetType === 'course'}
            onChange={() => onChangeTargetType('course')}
          />
          <span>🔒 <strong>Exclusivo para Alunos de Cursos Específicos</strong> (Upsell para os demais)</span>
        </label>
      </div>

      {targetType === 'course' && (
        <div style={{ marginTop: '12px' }} ref={dropdownRef}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#93c5fd', margin: 0 }}>
              Selecione o(s) Curso(s) Necessário(s) *
            </label>
            {selectedIds.length > 0 && (
              <span
                data-testid="event-selected-courses-count"
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#60a5fa',
                  background: 'rgba(59, 130, 246, 0.16)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  padding: '1px 8px',
                  borderRadius: '999px'
                }}
              >
                {selectedIds.length} {selectedIds.length === 1 ? 'curso selecionado' : 'cursos selecionados'}
              </span>
            )}
          </div>

          {/* Botão Trigger do Dropdown Multi-Select */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              data-testid="event-course-multiselect-trigger"
              onClick={() => setDropdownOpen((prev) => !prev)}
              style={{
                width: '100%',
                minHeight: '42px',
                padding: '7px 12px',
                borderRadius: '8px',
                background: '#0f172a',
                border: dropdownOpen
                  ? '1px solid #3b82f6'
                  : '1px solid rgba(59, 130, 246, 0.4)',
                color: '#fff',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', flex: 1 }}>
                {selectedCourses.length === 0 ? (
                  <span style={{ color: '#94a3b8' }}>Selecione um ou mais cursos...</span>
                ) : (
                  selectedCourses.map((c) => (
                    <span
                      key={c.id}
                      data-testid={`event-selected-course-chip-${c.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCourse(c.id);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.22)',
                        border: '1px solid rgba(96, 165, 250, 0.45)',
                        color: '#e0f2fe',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                      title="Clique para remover este curso"
                    >
                      <span>{c.title}</span>
                      <X size={12} />
                    </span>
                  ))
                )}
              </div>
              <ChevronDown
                size={16}
                style={{
                  color: '#94a3b8',
                  flexShrink: 0,
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.18s ease'
                }}
              />
            </button>

            {/* Menu Dropdown com Checkboxes */}
            {dropdownOpen && (
              <div
                data-testid="event-course-multiselect-menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: '#0f172a',
                  border: '1px solid rgba(59, 130, 246, 0.45)',
                  borderRadius: '8px',
                  boxShadow: '0 14px 28px rgba(0, 0, 0, 0.65)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  padding: '6px'
                }}
              >
                {courses.length > 1 && (
                  <button
                    type="button"
                    data-testid="event-course-select-all-btn"
                    onClick={handleSelectAll}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      marginBottom: '4px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: 'none',
                      color: '#93c5fd',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>
                      {selectedIds.length === courses.length ? 'Desmarcar todos os cursos' : 'Selecionar todos os cursos'}
                    </span>
                    <span>({courses.length})</span>
                  </button>
                )}

                {courses.map((c) => {
                  const isChecked = selectedIds.includes(Number(c.id));
                  return (
                    <div
                      key={c.id}
                      role="option"
                      aria-selected={isChecked}
                      data-testid={`event-course-option-${c.id}`}
                      onClick={() => toggleCourse(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isChecked ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
                        color: isChecked ? '#ffffff' : '#cbd5e1',
                        fontSize: '0.86rem',
                        fontWeight: isChecked ? 600 : 400,
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '17px',
                          height: '17px',
                          borderRadius: '4px',
                          border: isChecked ? '1.5px solid #3b82f6' : '1.5px solid #64748b',
                          background: isChecked ? '#2563eb' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isChecked && <Check size={12} color="#ffffff" strokeWidth={3} />}
                      </div>
                      <span style={{ flex: 1 }}>{c.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginTop: '5px' }}>
            Alunos matriculados em <strong>qualquer um</strong> dos cursos marcados terão acesso liberado ao evento.
          </span>
        </div>
      )}
    </div>
  );
}
