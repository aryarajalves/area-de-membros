import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, RefreshCw, ChevronLeft, ChevronRight, BookOpen, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function TutorConversationsTab({
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)'
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    items: [],
    pagination: { total_items: 0, total_pages: 1, current_page: 1, limit: 15 }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [coursesList, setCoursesList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchConversations = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCourseId) params.append('course_id', selectedCourseId);

      const res = await fetch(`/api/v1/tutor-ia/admin/messages?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setCurrentPage(json.pagination?.current_page || 1);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico de conversas do Tutor IA:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/v1/courses', { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setCoursesList(Array.isArray(json) ? json : json.items || []);
      }
    } catch (err) {
      console.error('Erro ao carregar lista de cursos:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchConversations(currentPage);
  }, [currentPage, selectedCourseId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchConversations(1);
  };

  const { items = [], pagination = { total_items: 0, total_pages: 1, current_page: 1 } } = data;

  return (
    <div
      data-testid="tutor-conversations-tab"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* 1. Header com Título e Botão de Atualizar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} color="#a855f7" />
            <span>Histórico de Conversas com Alunos</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: subTextColor }}>
            Audite as dúvidas enviadas e as respostas didáticas geradas pelo Tutor IA em cada aula.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchConversations(currentPage)}
          data-testid="btn-refresh-conversations"
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)'}`,
            color: textColor,
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* 2. Barra de Busca e Filtro por Curso */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={15} color={subTextColor} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por pergunta, resposta ou aluno..."
            data-testid="input-search-conversations"
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: '8px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)'}`,
              color: textColor,
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        <select
          value={selectedCourseId}
          onChange={(e) => { setSelectedCourseId(e.target.value); setCurrentPage(1); }}
          data-testid="select-filter-course"
          style={{
            padding: '9px 12px',
            borderRadius: '8px',
            backgroundColor: isLightBg ? '#ffffff' : '#1f2937',
            border: `1px solid ${isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)'}`,
            color: textColor,
            fontSize: '13px',
            outline: 'none',
            minWidth: '160px'
          }}
        >
          <option value="">Todos os Cursos</option>
          {coursesList.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        <button
          type="submit"
          data-testid="btn-submit-search"
          style={{
            padding: '9px 16px',
            borderRadius: '8px',
            backgroundColor: '#7c3aed',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Filtrar
        </button>
      </form>

      {/* 3. Listagem de Mensagens */}
      <div
        data-testid="conversations-list-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: subTextColor, fontSize: '13px' }}>
            Carregando conversas...
          </div>
        ) : items.length === 0 ? (
          <div
            data-testid="tutor-conversations-empty"
            style={{
              backgroundColor: cardBg,
              border: cardBorder,
              borderRadius: '12px',
              padding: '36px 20px',
              textAlign: 'center',
              color: subTextColor,
              fontSize: '13.5px'
            }}
          >
            Nenhuma conversa encontrada com os filtros selecionados.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              data-testid={`conversation-item-${item.id}`}
              style={{
                backgroundColor: cardBg,
                border: cardBorder,
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Header do Card: Aluno, Curso, Aula, Custo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: item.role === 'user' ? '#3b82f6' : '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    {item.role === 'user' ? 'U' : 'IA'}
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: textColor }}>
                      {item.role === 'user' ? item.student_name : 'Tutor IA 24h'}
                    </span>
                    <span style={{ fontSize: '11px', color: subTextColor, marginLeft: '6px' }}>
                      ({item.student_email})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.cost_brl > 0 && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      R$ {item.cost_brl.toFixed(4)}
                    </span>
                  )}

                  {item.feedback_rating && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: item.feedback_rating === 'like' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: item.feedback_rating === 'like' ? '#10b981' : '#ef4444',
                        border: `1px solid ${item.feedback_rating === 'like' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      {item.feedback_rating === 'like' ? <ThumbsUp size={11} /> : <ThumbsDown size={11} />}
                      <span>{item.feedback_rating === 'like' ? 'Útil' : 'Negativo'}</span>
                    </span>
                  )}

                  <span style={{ fontSize: '11px', color: subTextColor }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : ''}
                  </span>
                </div>
              </div>

              {/* Tags de Curso / Módulo / Aula */}
              {(item.course_title || item.lesson_title) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#a855f7', fontWeight: 600 }}>
                  <BookOpen size={12} />
                  <span>
                    {item.course_title} {item.module_title ? `• ${item.module_title}` : ''} {item.lesson_title ? `• Aula: ${item.lesson_title}` : ''}
                  </span>
                </div>
              )}

              {/* Conteúdo da Mensagem */}
              <div
                style={{
                  backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: textColor,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)'}`
                }}
              >
                {item.content}
              </div>

              {item.feedback_text && (
                <div style={{ fontSize: '11.5px', color: '#ef4444', fontStyle: 'italic', paddingLeft: '4px' }}>
                  Motivo da avaliação: "{item.feedback_text}"
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 4. Controles de Paginação */}
      {pagination.total_pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
          <span style={{ fontSize: '12px', color: subTextColor }}>
            Página {pagination.current_page} de {pagination.total_pages} ({pagination.total_items} mensagens)
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              data-testid="btn-prev-page"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)'}`,
                color: textColor,
                fontSize: '12px',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              disabled={currentPage >= pagination.total_pages || loading}
              onClick={() => setCurrentPage((p) => p + 1)}
              data-testid="btn-next-page"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)'}`,
                color: textColor,
                fontSize: '12px',
                cursor: currentPage >= pagination.total_pages ? 'not-allowed' : 'pointer'
              }}
            >
              <span>Próxima</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
