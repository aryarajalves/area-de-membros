import React, { useState, useEffect } from 'react';
import { Database, X, Clock, Hash, Loader2, Sparkles, FileText } from 'lucide-react';

export default function KnowledgeChunksModal({
  isOpen,
  onClose,
  lesson,
  isLightBg = false,
  onQaGenerated
}) {
  const [loading, setLoading] = useState(true);
  const [generatingQa, setGeneratingQa] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [chunkTab, setChunkTab] = useState('transcript'); // 'transcript' | 'qa'

  useEffect(() => {
    if (isOpen && lesson?.lesson_id) {
      fetchChunks();
    }
  }, [isOpen, lesson?.lesson_id]);

  const fetchChunks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch(`/api/v1/tutor-ia/knowledge-base/lessons/${lesson.lesson_id}/chunks`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setChunks(data);
      }
    } catch (err) {
      console.error('Erro ao buscar chunks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQa = async () => {
    try {
      setGeneratingQa(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch(`/api/v1/tutor-ia/knowledge-base/lessons/${lesson.lesson_id}/generate-qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        await fetchChunks();
        setChunkTab('qa');
        onQaGenerated?.();
      }
    } catch (err) {
      console.error('Erro ao gerar Q&A:', err);
    } finally {
      setGeneratingQa(false);
    }
  };

  if (!isOpen) return null;

  const bgModal = isLightBg ? '#ffffff' : '#0f172a';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      data-testid="knowledge-chunks-modal"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          backgroundColor: bgModal,
          borderRadius: '14px',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0d9488 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textColor }}>
                Fragmentos Vetoriais (RAG): {lesson?.lesson_title}
              </h3>
              <span style={{ fontSize: '12px', color: subTextColor }}>
                {lesson?.course_title} • {lesson?.module_title}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-chunks-modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: subTextColor,
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas do Modal: Transcrição vs Q&A */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${borderColor}`, padding: '0 20px', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setChunkTab('transcript')}
            data-testid="tab-chunk-transcript"
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: chunkTab === 'transcript' ? '2px solid #0d9488' : '2px solid transparent',
              color: chunkTab === 'transcript' ? textColor : subTextColor,
              fontSize: '13px',
              fontWeight: chunkTab === 'transcript' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            Fragmentos da Transcrição ({chunks.filter((c) => c.chunk_type !== 'qa_pair').length})
          </button>
          <button
            type="button"
            onClick={() => setChunkTab('qa')}
            data-testid="tab-chunk-qa"
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: chunkTab === 'qa' ? '2px solid #a855f7' : '2px solid transparent',
              color: chunkTab === 'qa' ? textColor : subTextColor,
              fontSize: '13px',
              fontWeight: chunkTab === 'qa' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            Perguntas & Respostas IA (Q&A) ({chunks.filter((c) => c.chunk_type === 'qa_pair').length})
          </button>
        </div>

        {/* Corpo com Lista de Chunks */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: subTextColor }}>
              <Loader2 size={22} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
              <span style={{ fontSize: '13px' }}>Carregando fragmentos vetoriais...</span>
            </div>
          ) : chunkTab === 'qa' && chunks.filter((c) => c.chunk_type === 'qa_pair').length === 0 ? (
            <div
              data-testid="qa-empty-state"
              style={{
                textAlign: 'center',
                padding: '36px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                borderRadius: '12px',
                backgroundColor: isLightBg ? '#f5f3ff' : 'rgba(168, 85, 247, 0.06)',
                border: isLightBg ? '1px dashed #ddd6fe' : '1px dashed rgba(168, 85, 247, 0.3)'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a855f7'
                }}
              >
                <Sparkles size={24} />
              </div>

              <div style={{ maxWidth: '400px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: textColor }}>
                  Nenhum par de Perguntas & Respostas gerado ainda
                </h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: subTextColor, lineHeight: 1.5 }}>
                  A inteligência artificial analisa a transcrição completa desta aula e cria automaticamente 5 perguntas frequentes com respostas explicativas e minutagens para busca semântica.
                </p>
              </div>

              <button
                type="button"
                disabled={generatingQa}
                onClick={handleGenerateQa}
                data-testid="btn-generate-qa-modal-empty"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: 'none',
                  cursor: generatingQa ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
                }}
              >
                {generatingQa ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{generatingQa ? 'Gerando 5 Perguntas & Respostas...' : '⚡ Gerar 5 Perguntas & Respostas com IA Agora'}</span>
              </button>
            </div>
          ) : chunks.filter((c) => chunkTab === 'qa' ? c.chunk_type === 'qa_pair' : c.chunk_type !== 'qa_pair').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: subTextColor, fontSize: '13px' }}>
              Nenhum fragmento de transcrição encontrado. Re-indexe para processar.
            </div>
          ) : (
            <>
              {chunkTab === 'qa' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '12px', color: subTextColor, fontWeight: 600 }}>
                    5 perguntas e respostas pedagógicas cadastradas
                  </span>
                  <button
                    type="button"
                    disabled={generatingQa}
                    onClick={handleGenerateQa}
                    data-testid="btn-regenerate-qa-modal"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(168, 85, 247, 0.12)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      color: '#c084fc',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: generatingQa ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {generatingQa ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>{generatingQa ? 'Gerando...' : 'Re-gerar 5 Perguntas com IA'}</span>
                  </button>
                </div>
              )}
              {chunks
                .filter((c) => (chunkTab === 'qa' ? c.chunk_type === 'qa_pair' : c.chunk_type !== 'qa_pair'))
                .map((c, i) => (
                <div
                  key={c.id || i}
                  data-testid={`chunk-item-${i}`}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${borderColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          backgroundColor: c.chunk_type === 'qa_pair' ? '#7c3aed' : '#0d9488',
                          color: '#fff',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {c.chunk_type === 'qa_pair' ? `Q&A #${i + 1}` : `Chunk #${c.chunk_index + 1}`}
                      </span>
                      <span style={{ color: subTextColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {c.start_time_str} até {c.end_time_str}
                      </span>
                    </div>
                    <span style={{ color: subTextColor }}>
                      ~{c.token_count} palavras/tokens
                    </span>
                  </div>

                  {c.chunk_type === 'qa_pair' && c.question_text ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: textColor }}>
                        ❓ {c.question_text}
                      </span>
                      <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.5, color: subTextColor }}>
                        💡 {c.answer_text}
                      </p>
                    </div>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: isLightBg ? '#334155' : '#cbd5e1',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {c.content}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Rodapé */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(0,0,0,0.2)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '7px',
              backgroundColor: '#0d9488',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
