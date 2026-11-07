import React, { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Trash2, CheckCircle2, Clock, Check, XCircle, Search, MessageSquare } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = [
  { id: 'all', label: 'Todos os Status' },
  { id: 'new', label: '🟡 Novo', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'analyzing', label: '🔵 Em Análise', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { id: 'implemented', label: '🟢 Implementado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { id: 'dismissed', label: '⚪ Descartado', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
];

export default function TutorSuggestionsList({
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)'
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all'
        ? '/api/v1/tutor-ia/suggestions'
        : `/api/v1/tutor-ia/suggestions?status_filter=${statusFilter}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/v1/tutor-ia/suggestions/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
        addToast('Status da sugestão atualizado!', 'success');
      }
    } catch (err) {
      addToast('Erro ao atualizar status da sugestão.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza de que deseja remover esta sugestão?')) return;
    try {
      const res = await fetch(`/api/v1/tutor-ia/suggestions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        addToast('Sugestão removida com sucesso!', 'info');
      }
    } catch (err) {
      addToast('Erro ao remover sugestão.', 'error');
    }
  };

  const filtered = suggestions.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.suggestion_text.toLowerCase().includes(term) ||
      s.student_name.toLowerCase().includes(term) ||
      (s.course_title && s.course_title.toLowerCase().includes(term)) ||
      (s.lesson_title && s.lesson_title.toLowerCase().includes(term))
    );
  });

  return (
    <div
      data-testid="tutor-suggestions-list"
      style={{
        padding: '24px',
        borderRadius: '12px',
        backgroundColor: cardBg,
        border: cardBorder,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#eab308'
            }}
          >
            <Lightbulb size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: textColor }}>
              Sugestões e Feedbacks Coletados pelo Tutor IA
            </h3>
            <span style={{ fontSize: '12.5px', color: subTextColor }}>
              Ideias, sugestões de melhorias e pontos apontados pelos alunos durante o chat
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={loading}
          data-testid="btn-refresh-suggestions"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
            border: cardBorder,
            color: textColor,
            fontSize: '12px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStatusFilter(opt.id)}
              data-testid={`filter-status-${opt.id}`}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === opt.id
                  ? (isLightBg ? '#e0e7ff' : 'rgba(124, 58, 237, 0.25)')
                  : (isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)'),
                color: statusFilter === opt.id ? (isLightBg ? '#4338ca' : '#c084fc') : subTextColor,
                border: statusFilter === opt.id
                  ? '1px solid rgba(124, 58, 237, 0.4)'
                  : cardBorder
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', minWidth: '220px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por texto, aluno, curso..."
            data-testid="input-search-suggestions"
            style={{
              width: '100%',
              padding: '6px 12px',
              borderRadius: '6px',
              border: cardBorder,
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.3)',
              color: textColor,
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Lista de Sugestões */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: subTextColor, fontSize: '13px' }}>
          <span>Carregando sugestões...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-testid="empty-suggestions-state"
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            border: cardBorder
          }}
        >
          <Lightbulb size={32} color={subTextColor} style={{ opacity: 0.4, margin: '0 auto 8px auto' }} />
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: textColor }}>
            Nenhuma sugestão encontrada para este filtro.
          </p>
          <span style={{ fontSize: '12px', color: subTextColor }}>
            Quando os alunos sugerirem melhorias no chat do Tutor IA, elas aparecerão listadas aqui.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((sugg) => (
            <div
              key={sugg.id}
              data-testid={`suggestion-item-${sugg.id}`}
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                border: cardBorder,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: textColor }}>
                    {sugg.student_name}
                  </span>
                  <span style={{ fontSize: '11px', color: subTextColor }}>
                    ({sugg.student_email})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Seletor de Status */}
                  <select
                    value={sugg.status}
                    onChange={(e) => handleUpdateStatus(sugg.id, e.target.value)}
                    data-testid={`select-status-${sugg.id}`}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      backgroundColor: isLightBg ? '#f1f5f9' : '#1e293b',
                      color: textColor,
                      border: cardBorder,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="new">🟡 Novo</option>
                    <option value="analyzing">🔵 Em Análise</option>
                    <option value="implemented">🟢 Implementado</option>
                    <option value="dismissed">⚪ Descartado</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleDelete(sugg.id)}
                    title="Excluir sugestão"
                    data-testid={`btn-delete-sugg-${sugg.id}`}
                    style={{
                      padding: '4px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      opacity: 0.7
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Texto da sugestão */}
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: isLightBg ? '#1e293b' : '#f1f5f9',
                  lineHeight: 1.5,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                  border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                "{sugg.suggestion_text}"
              </p>

              {/* Rodapé: Contexto de Aula / Curso */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: subTextColor, flexWrap: 'wrap' }}>
                {sugg.course_title && (
                  <span>📚 Curso: <strong>{sugg.course_title}</strong></span>
                )}
                {sugg.lesson_title && (
                  <span>🎬 Aula: <strong>{sugg.lesson_title}</strong></span>
                )}
                {sugg.created_at && (
                  <span style={{ marginLeft: 'auto' }}>
                    {new Date(sugg.created_at).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
