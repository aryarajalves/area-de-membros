import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, BookOpen, Clock, Loader2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function StudentAccessHistoryModal({ isOpen, onClose, student, course, isLightBg }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const modalBg = isLightBg ? '#ffffff' : '#0f172a';
  const modalBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const itemBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.035)';
  const itemBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';

  useEffect(() => {
    if (isOpen && student && course) {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      fetch(`/api/v1/students/${student.id}/courses/${course.course_id}/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => {
          if (!res.ok) throw new Error('Falha ao carregar histórico de aulas.');
          return res.json();
        })
        .then((data) => setHistory(Array.isArray(data) ? data : []))
        .catch((err) => {
          addToast(err.message, 'error');
          setHistory([]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, student, course, addToast]);

  if (!isOpen || !student || !course) return null;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      const datePart = d.toLocaleDateString('pt-BR');
      const timePart = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `${datePart} às ${timePart}`;
    } catch {
      return '—';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      data-testid="student-history-modal-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          backgroundColor: modalBg,
          border: modalBorder,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: textColor,
          padding: '24px',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-history-modal-title"
        data-testid="student-history-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <History size={22} />
          </div>
          <div>
            <h2 id="student-history-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              Histórico de Acesso ao Curso
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: subTextColor }}>
              Aluno: <strong style={{ color: textColor }}>{student.name}</strong> • Curso:{' '}
              <strong style={{ color: '#60a5fa' }}>{course.course_title}</strong>
            </p>
          </div>
        </div>

        {/* Lista Cronológica de Aulas */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px 0', color: subTextColor }}>
              <Loader2 size={24} className="animate-spin" style={{ marginRight: '8px' }} />
              Carregando histórico de aulas...
            </div>
          ) : history.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 16px',
                backgroundColor: itemBg,
                border: itemBorder,
                borderRadius: '10px',
                color: subTextColor,
                fontSize: '0.88rem',
              }}
              data-testid="empty-history-notice"
            >
              <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>O aluno ainda não possui aulas concluídas registradas neste curso.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: itemBg,
                    border: itemBorder,
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                  data-testid={`history-item-${item.lesson_id}`}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div
                      style={{
                        marginTop: '2px',
                        color: '#34d399',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: textColor }}>
                        {item.lesson_title}
                      </div>
                      {item.module_title && (
                        <div style={{ fontSize: '0.78rem', color: subTextColor, marginTop: '2px' }}>
                          Módulo: {item.module_title}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#34d399',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={12} />
                        <span>Assistiu a aula completa em {formatDateTime(item.completed_at || item.updated_at)}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Concluída
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé com 1 botão para fechar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 22px',
              backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
              color: textColor,
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            data-testid="close-history-modal-btn"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
