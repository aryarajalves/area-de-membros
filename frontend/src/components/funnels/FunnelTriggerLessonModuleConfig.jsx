import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, CheckCircle2, GitFork, Layers } from 'lucide-react';

export default function FunnelTriggerLessonModuleConfig({
  nodeId,
  data,
  courses = [],
  loadingCourses = false,
  onUpdateData,
}) {
  const activeOptions = Array.isArray(data.active_options)
    ? data.active_options
    : ['lesson']; // ['lesson', 'module']

  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Busca aulas do curso selecionado se houver course_id
  useEffect(() => {
    if (!data.course_id) {
      setLessons([]);
      return;
    }
    let isMounted = true;
    const fetchLessons = async () => {
      setLoadingLessons(true);
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        const res = await fetch(`/api/v1/courses/${data.course_id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const courseData = await res.json();
          const allLessons = [];
          if (Array.isArray(courseData.modules)) {
            courseData.modules.forEach((mod) => {
              if (Array.isArray(mod.lessons)) {
                mod.lessons.forEach((l) => allLessons.push({ ...l, moduleTitle: mod.title }));
              }
            });
          }
          if (isMounted) setLessons(allLessons);
        }
      } catch (err) {
        console.error('Erro ao buscar aulas:', err);
      } finally {
        if (isMounted) setLoadingLessons(false);
      }
    };
    fetchLessons();
    return () => {
      isMounted = false;
    };
  }, [data.course_id]);

  const handleToggleOption = (opt) => {
    let next;
    if (activeOptions.includes(opt)) {
      if (activeOptions.length > 1) {
        next = activeOptions.filter((o) => o !== opt);
      } else {
        next = activeOptions;
      }
    } else {
      next = [...activeOptions, opt];
    }
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'lesson_module_activity',
      active_options: next,
    });
  };

  const handleSelectCourse = (e) => {
    const val = e.target.value;
    const selectedCourseId = val ? parseInt(val, 10) : null;
    const found = courses.find((c) => c.id === selectedCourseId);
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'lesson_module_activity',
      course_id: selectedCourseId,
      course_title: found ? found.title : 'Todos os Cursos',
      lesson_id: null,
    });
  };

  const handleSelectLesson = (e) => {
    const val = e.target.value;
    const selectedLessonId = val ? parseInt(val, 10) : null;
    const found = lessons.find((l) => l.id === selectedLessonId);
    onUpdateData(nodeId, {
      ...data,
      trigger_event: 'lesson_module_activity',
      lesson_id: selectedLessonId,
      lesson_title: found ? found.title : 'Qualquer Aula',
    });
  };

  return (
    <>
      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        Dispara quando o aluno concluir uma aula ou finalizar um módulo. Marque uma ou ambas as opções para criar saídas ramificadas:
      </p>

      {/* Opções de Ativação com Portas Múltiplas */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Eventos de Conteúdo:</span>
          <span style={{ fontSize: '0.65rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <GitFork size={10} />
            <span>2 saídas independentes</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <button
            type="button"
            onClick={() => handleToggleOption('lesson')}
            style={{
              padding: '7px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeOptions.includes('lesson') ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: activeOptions.includes('lesson') ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.03)',
              color: activeOptions.includes('lesson') ? '#bae6fd' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
            data-testid={`trigger-opt-lesson-btn-${nodeId}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <GraduationCap size={12} />
              <span>Aula Concluída</span>
            </span>
            {activeOptions.includes('lesson') && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleToggleOption('module')}
            style={{
              padding: '7px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeOptions.includes('module') ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: activeOptions.includes('module') ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.03)',
              color: activeOptions.includes('module') ? '#bae6fd' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
            data-testid={`trigger-opt-module-btn-${nodeId}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Layers size={12} />
              <span>Módulo Concluído</span>
            </span>
            {activeOptions.includes('module') && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
            )}
          </button>
        </div>
      </div>

      {/* Seletor de Curso */}
      <div style={{ marginBottom: '8px' }}>
        <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
          Curso:
        </label>
        <select
          value={data.course_id || ''}
          onChange={handleSelectCourse}
          disabled={loadingCourses}
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: '6px',
            backgroundColor: '#0a0703',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#e0f2fe',
            fontSize: '0.76rem',
            outline: 'none',
            cursor: 'pointer',
          }}
          data-testid={`trigger-course-select-${nodeId}`}
        >
          <option value="">🌟 Todos os Cursos (Qualquer um)</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Seletor de Aula Específica (se ativada a opção aula e curso selecionado) */}
      {activeOptions.includes('lesson') && data.course_id && (
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            Aula Específica:
          </label>
          <select
            value={data.lesson_id || ''}
            onChange={handleSelectLesson}
            disabled={loadingLessons}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: '#0a0703',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#e0f2fe',
              fontSize: '0.76rem',
              outline: 'none',
              cursor: 'pointer',
            }}
            data-testid={`trigger-lesson-select-${nodeId}`}
          >
            <option value="">🎯 Qualquer Aula do Curso</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.moduleTitle ? `[${l.moduleTitle}] ` : ''}{l.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Resumo */}
      <div
        style={{
          padding: '8px 10px',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          borderLeft: '3px solid #38bdf8',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
        }}
      >
        <CheckCircle2 size={13} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '0.7rem', color: '#bae6fd', lineHeight: 1.35 }}>
          Conecte a saída de Aula ou de Módulo para criar jornadas separadas conforme o aluno progride.
        </span>
      </div>
    </>
  );
}
