import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Link2,
  Compass,
  BookOpen,
  PlayCircle,
  Search,
  ChevronRight,
  Loader2,
  Layers,
} from 'lucide-react';

const SYSTEM_TABS = [
  { id: 'home', label: 'Início', desc: 'Tela inicial com tutoriais e boas-vindas' },
  { id: 'courses', label: 'Cursos', desc: 'Vitrine geral de cursos e módulos' },
  { id: 'support', label: 'Suporte', desc: 'Central de dúvidas e chamados da comunidade' },
  { id: 'ranking', label: 'Ranking & Conquistas', desc: 'Gamificação, níveis e pontuação de alunos' },
  { id: 'testimonials', label: 'Depoimentos', desc: 'Mural de depoimentos e avaliações' },
  { id: 'introductions', label: 'Apresente-se', desc: 'Apresentação e networking entre alunos' },
  { id: 'chat', label: 'Chat da Comunidade', desc: 'Canais de conversa em tempo real' },
  { id: 'lesson-reports', label: 'Relatos de Aulas', desc: 'Feedbacks e relatos de aulas' },
  { id: 'students', label: 'Alunos', desc: 'Painel de gestão de alunos matriculados' },
  { id: 'funnels', label: 'Funis de Mensagens', desc: 'Disparos e automações de mensagens' },
  { id: 'settings', label: 'Configurações', desc: 'Perfil, marca e preferências da plataforma' },
];

export default function ChatInternalLinkModal({ isOpen = true, onSelectLink, onClose }) {
  if (!isOpen) return null;
  const [activeTab, setActiveTab] = useState('tabs'); // 'tabs' | 'courses' | 'lessons'
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState(null);
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  // Buscar lista de cursos
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      const token = getAuthToken();
      try {
        const res = await fetch('/api/v1/courses', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : data.items || []);
        }
      } catch (err) {
        console.error('Erro ao buscar cursos para links:', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Buscar módulos e aulas quando um curso for selecionado na aba de aulas
  const handleSelectCourseForLessons = async (course) => {
    setSelectedCourseForLessons(course);
    setLoadingModules(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/courses/${course.id}/modules`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setModules(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar módulos da aula:', err);
    } finally {
      setLoadingModules(false);
    }
  };

  const filteredTabs = useMemo(() => {
    if (!searchTerm.trim()) return SYSTEM_TABS;
    const term = searchTerm.toLowerCase();
    return SYSTEM_TABS.filter(
      (t) => t.label.toLowerCase().includes(term) || t.desc.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;
    const term = searchTerm.toLowerCase();
    return courses.filter((c) => (c.title || '').toLowerCase().includes(term));
  }, [courses, searchTerm]);

  return (
    <div
      className="chat-internal-link-backdrop"
      data-testid="chat-internal-link-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        className="chat-internal-link-panel"
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.15)',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={18} color="#38bdf8" />
            <span style={{ fontSize: '0.925rem', fontWeight: 600, color: '#f8fafc' }}>
              Compartilhar Link no Chat
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-internal-link-modal"
            title="Fechar"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas Superiores de Filtro */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px 12px 0 12px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('tabs');
              setSelectedCourseForLessons(null);
            }}
            data-testid="tab-system-modules"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'tabs' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'tabs' ? '#38bdf8' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Layers size={15} />
            <span>Abas / Módulos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('courses');
              setSelectedCourseForLessons(null);
            }}
            data-testid="tab-system-courses"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'courses' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'courses' ? '#38bdf8' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <BookOpen size={15} />
            <span>Cursos ({courses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            data-testid="tab-system-lessons"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'lessons' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'lessons' ? '#38bdf8' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <PlayCircle size={15} />
            <span>Aulas Específicas</span>
          </button>
        </div>

        {/* Busca */}
        <div style={{ padding: '12px 16px 8px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
              padding: '8px 12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar aba, curso ou título..."
              data-testid="internal-link-search-input"
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '0.85rem',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo da Lista */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* 1. ABAS DO SISTEMA */}
          {activeTab === 'tabs' &&
            filteredTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  onSelectLink({
                    label: `📍 ${tab.label}`,
                    url: `internal://tab/${tab.id}`,
                  })
                }
                data-testid={`select-tab-${tab.id}`}
                style={itemButtonStyle()}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={iconBadgeStyle('#38bdf8')}>
                    <Compass size={16} color="#38bdf8" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                      {tab.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{tab.desc}</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#64748b" />
              </button>
            ))}

          {/* 2. CURSOS */}
          {activeTab === 'courses' && (
            <>
              {loadingCourses ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : filteredCourses.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Nenhum curso encontrado.
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() =>
                      onSelectLink({
                        label: `📚 ${course.title}`,
                        url: `internal://course/${course.id}`,
                      })
                    }
                    data-testid={`select-course-${course.id}`}
                    style={itemButtonStyle()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={iconBadgeStyle('#a855f7')}>
                        <BookOpen size={16} color="#a855f7" />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc' }}>
                          {course.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Curso • Clique para marcar e enviar
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} color="#64748b" />
                  </button>
                ))
              )}
            </>
          )}

          {/* 3. AULAS ESPECÍFICAS */}
          {activeTab === 'lessons' && (
            <>
              {!selectedCourseForLessons ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                    Selecione um curso para listar as aulas:
                  </div>
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => handleSelectCourseForLessons(course)}
                      data-testid={`choose-course-for-lessons-${course.id}`}
                      style={itemButtonStyle()}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen size={16} color="#38bdf8" />
                        <span style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: 500 }}>
                          {course.title}
                        </span>
                      </div>
                      <ChevronRight size={16} color="#64748b" />
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedCourseForLessons(null)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.8125rem', cursor: 'pointer', padding: 0 }}
                    >
                      ← Escolher outro curso
                    </button>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {selectedCourseForLessons.title}
                    </span>
                  </div>

                  {loadingModules ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : modules.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                      Este curso ainda não possui módulos ou aulas.
                    </div>
                  ) : (
                    modules.map((mod) => (
                      <div key={mod.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', padding: '4px 6px' }}>
                          {mod.title}
                        </div>
                        {(mod.lessons || []).map((lesson) => (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() =>
                              onSelectLink({
                                label: `🎥 ${lesson.title}`,
                                url: `internal://lesson/${selectedCourseForLessons.id}/${lesson.id}?course=${encodeURIComponent(selectedCourseForLessons.title)}&module=${encodeURIComponent(mod.title)}`,
                                courseTitle: selectedCourseForLessons.title,
                                moduleTitle: mod.title,
                                lessonTitle: lesson.title,
                              })
                            }
                            data-testid={`select-lesson-${lesson.id}`}
                            style={{ ...itemButtonStyle(), padding: '8px 12px' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <PlayCircle size={15} color="#22c55e" />
                              <span style={{ fontSize: '0.85rem', color: '#f8fafc', textAlign: 'left' }}>
                                {lesson.title}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                              {lesson.duration || ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function itemButtonStyle() {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s ease',
  };
}

function iconBadgeStyle(color) {
  return {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: `${color}1a`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}
