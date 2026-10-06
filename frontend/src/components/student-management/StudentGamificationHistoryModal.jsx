import React, { useState, useEffect } from 'react';
import {
  Trophy, X, Award, CheckCircle, MessageCircle,
  ThumbsUp, MessageSquare, Sparkles, Clock, AlertCircle, Loader2
} from 'lucide-react';
import { formatBrasiliaDateTime } from './studentDateUtils';

export default function StudentGamificationHistoryModal({ isOpen, onClose, student, isLightBg }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !student?.id) {
      setData(null);
      setError(null);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      try {
        const res = await fetch(`/api/v1/students/${student.id}/gamification-history`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Erro ao carregar histórico de pontos do aluno.');
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, student?.id]);

  if (!isOpen) return null;

  const modalBg = isLightBg ? '#ffffff' : '#0d131f';
  const modalBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const itemBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const itemBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)';

  const getActionIcon = (action) => {
    switch (action) {
      case 'support_solution':
        return <Award size={16} color="#f59e0b" />;
      case 'lesson_completed':
        return <CheckCircle size={16} color="#10b981" />;
      case 'support_reply':
        return <MessageCircle size={16} color="#38bdf8" />;
      case 'support_like':
        return <ThumbsUp size={16} color="#ec4899" />;
      case 'chat_message':
        return <MessageSquare size={16} color="#a855f7" />;
      default:
        return <Sparkles size={16} color="#eab308" />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      data-testid="student-gamification-modal-backdrop"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: modalBg,
          border: modalBorder,
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="student-gamification-modal"
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: modalBorder,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Trophy size={20} color="#eab308" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: textColor }}>
                Histórico de Pontos e Conquistas
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: subTextColor }}>
                {student?.name} • {student?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: subTextColor,
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            data-testid="close-gamification-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px', color: subTextColor }}>
              <Loader2 size={22} className="animate-spin" />
              <span style={{ fontSize: '14px' }}>Carregando histórico de pontos...</span>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Cards de Métricas: Total de Pontos, Posição e Insígnia */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: itemBg, border: itemBorder, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Total de Pontos</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#eab308', marginTop: '4px' }} data-testid="modal-total-points">
                    {data.total_points} pts
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: itemBg, border: itemBorder, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Posição</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }} data-testid="modal-current-rank">
                    #{data.current_rank}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: itemBg, border: itemBorder, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: subTextColor, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Insígnia</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: textColor, marginTop: '7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} data-testid="modal-badge">
                    {data.badge}
                  </div>
                </div>
              </div>

              {/* Lista Cronológica de Conquistas */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: 600, color: textColor }}>
                  Linha do Tempo de Pontuações
                </h4>

                {data.history && data.history.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} data-testid="gamification-history-list">
                    {data.history.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: itemBg,
                          border: itemBorder,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                        data-testid={`history-item-${item.id}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: isLightBg ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {getActionIcon(item.action)}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: textColor }}>
                              {item.description || item.action}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: subTextColor, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Clock size={11} /> {formatBrasiliaDateTime(item.created_at)}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#10b981',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          +{item.points} pts
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '24px',
                      borderRadius: '10px',
                      backgroundColor: itemBg,
                      border: itemBorder,
                      textAlign: 'center',
                      color: subTextColor,
                      fontSize: '0.84rem'
                    }}
                    data-testid="gamification-history-empty"
                  >
                    Nenhum ponto registrado para este aluno ainda.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Rodapé do Modal */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: modalBorder,
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
            style={{ padding: '8px 18px', fontSize: '13px' }}
            data-testid="modal-gamification-close-footer-btn"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
