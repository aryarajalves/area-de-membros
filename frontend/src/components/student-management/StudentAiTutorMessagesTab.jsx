import React, { useState, useEffect } from 'react';
import { MessageSquare, Coins, BookOpen, ThumbsUp, ThumbsDown, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StudentAiTutorMessagesTab({
  studentId,
  isLightBg = false
}) {
  const [loading, setLoading] = useState(true);
  const [messagesData, setMessagesData] = useState({
    financial_summary: { total_spent_brl: 0.0, total_spent_this_month_brl: 0.0, total_questions: 0 },
    items: [],
    pagination: { total_items: 0, total_pages: 1, current_page: 1 }
  });
  const [page, setPage] = useState(1);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchStudentMessages = async (p = 1) => {
    if (!studentId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/tutor-ia/admin/messages?student_id=${studentId}&page=${p}&limit=10`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        setMessagesData(json);
        setPage(json.pagination.current_page);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens do aluno:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentMessages(page);
  }, [studentId, page]);

  const { financial_summary, items, pagination } = messagesData;

  return (
    <div
      data-testid="student-ai-tutor-messages-tab"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      {/* Mini Cards Financeiros do Aluno */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div
          style={{
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '11px', color: isLightBg ? '#64748b' : '#94a3b8' }}>Total Gasto</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>
            R$ {financial_summary.total_spent_brl.toFixed(4).replace('.', ',')}
          </span>
        </div>

        <div
          style={{
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '11px', color: isLightBg ? '#64748b' : '#94a3b8' }}>Gasto no Mês</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#3b82f6' }}>
            R$ {financial_summary.total_spent_this_month_brl.toFixed(4).replace('.', ',')}
          </span>
        </div>

        <div
          style={{
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '11px', color: isLightBg ? '#64748b' : '#94a3b8' }}>Dúvidas Enviadas</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#a855f7' }}>
            {financial_summary.total_questions}
          </span>
        </div>
      </div>

      {/* Lista de Mensagens */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: isLightBg ? '#64748b' : '#94a3b8' }}>
            <Loader2 size={18} className="animate-spin inline-block" />
            <span style={{ marginLeft: '8px', fontSize: '12.5px' }}>Carregando histórico do aluno...</span>
          </div>
        ) : items.length === 0 ? (
          <div
            data-testid="student-messages-empty"
            style={{
              padding: '30px 20px',
              textAlign: 'center',
              color: isLightBg ? '#64748b' : '#94a3b8',
              fontSize: '13px'
            }}
          >
            Este aluno ainda não enviou dúvidas para o Tutor IA.
          </div>
        ) : (
          items.map((m) => (
            <div
              key={m.id}
              data-testid={`student-msg-${m.id}`}
              style={{
                backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.07)'}`,
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ fontWeight: 700, color: m.role === 'user' ? '#3b82f6' : '#a855f7' }}>
                  {m.role === 'user' ? 'Pergunta do Aluno' : 'Resposta do Tutor IA'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {m.cost_brl > 0 && (
                    <span style={{ color: '#10b981', fontWeight: 700 }}>
                      R$ {m.cost_brl.toFixed(4)}
                    </span>
                  )}
                  {m.feedback_rating && (
                    <span style={{ color: m.feedback_rating === 'like' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {m.feedback_rating === 'like' ? '👍 Útil' : '👎 Negativo'}
                    </span>
                  )}
                  <span style={{ color: isLightBg ? '#94a3b8' : '#64748b' }}>
                    {m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : ''}
                  </span>
                </div>
              </div>

              {(m.course_title || m.lesson_title) && (
                <div style={{ fontSize: '11px', color: '#a855f7', fontWeight: 600 }}>
                  📚 {m.course_title} {m.lesson_title ? `• Aula: ${m.lesson_title}` : ''}
                </div>
              )}

              <div
                style={{
                  fontSize: '12.5px',
                  color: isLightBg ? '#0f172a' : '#f1f5f9',
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      {pagination.total_pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: isLightBg ? '#64748b' : '#94a3b8' }}>
          <span>Página {pagination.current_page} de {pagination.total_pages}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                border: `1px solid ${isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)'}`,
                color: isLightBg ? '#475569' : '#e2e8f0',
                cursor: page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= pagination.total_pages || loading}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                border: `1px solid ${isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)'}`,
                color: isLightBg ? '#475569' : '#e2e8f0',
                cursor: page >= pagination.total_pages ? 'not-allowed' : 'pointer'
              }}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
