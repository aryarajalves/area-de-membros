import React, { useState, useEffect } from 'react';
import { X, Brain, Sparkles, CheckCircle2, AlertCircle, Loader2, Layers, BookOpen } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function BatchMindmapModal({
  isOpen,
  onClose,
  courseId,
  module = null,
  modules = [],
  onSuccess,
  isLightBg = false
}) {
  const { addToast } = useToast();
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overview, setOverview] = useState(null);
  const [selectedScope, setSelectedScope] = useState(module?.id ? String(module.id) : 'course');
  const [processing, setProcessing] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  useEffect(() => {
    if (module?.id) {
      setSelectedScope(String(module.id));
    } else {
      setSelectedScope('course');
    }
  }, [module?.id]);

  useEffect(() => {
    if (!isOpen || !courseId) return;
    setBatchResult(null);
    setLoadingOverview(true);
    const token = localStorage.getItem('auth_token');

    fetch(`/api/v1/courses/${courseId}/mindmaps/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setOverview(data);
      })
      .catch(() => {
        addToast('Não foi possível carregar o resumo de mapas mentais do curso.', 'error');
      })
      .finally(() => setLoadingOverview(false));
  }, [isOpen, courseId]);

  if (!isOpen) return null;

  const currentModOverview = selectedScope !== 'course' && overview?.modules
    ? overview.modules.find((m) => String(m.id) === selectedScope)
    : null;

  const totalLessons = currentModOverview ? currentModOverview.total_lessons : (overview?.total_lessons || 0);
  const withTranscription = currentModOverview ? currentModOverview.lessons_with_transcription : (overview?.lessons_with_transcription || 0);
  const withMindmap = currentModOverview ? currentModOverview.lessons_with_mindmap : (overview?.lessons_with_mindmap || 0);
  const pendingMindmap = Math.max(0, withTranscription - withMindmap);

  const handleStartBatch = async () => {
    if (processing) return;
    setProcessing(true);
    setBatchResult(null);
    const token = localStorage.getItem('auth_token');

    try {
      const url = selectedScope === 'course'
        ? `/api/v1/courses/${courseId}/mindmaps`
        : `/api/v1/courses/${courseId}/modules/${selectedScope}/mindmaps`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Falha ao processar mapas mentais em lote.');
      }

      setBatchResult(data);
      addToast(data.message || 'Geração em lote concluída!', 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      addToast(err.message || 'Erro durante a geração em lote.', 'error');
    } finally {
      setProcessing(false);
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
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      data-testid="batch-mindmap-modal"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(168, 85, 247, 0.15)',
          borderRadius: '14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(168, 85, 247, 0.5)'
            }}>
              <Brain size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                Gerador de Mapas Mentais (IA)
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                Gere documentos HTML interativos com Mermaid para os materiais da aula
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: processing ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
            data-testid="close-batch-mindmap-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <div style={{ padding: '22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Seletor de Escopo */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Escopo de Geração:
            </label>
            <select
              value={selectedScope}
              onChange={(e) => { setSelectedScope(e.target.value); setBatchResult(null); }}
              disabled={processing}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none'
              }}
              data-testid="scope-select"
            >
              <option value="course" style={{ background: '#0f172a' }}>
                🎓 Todo o Curso ({overview?.total_lessons || 0} aulas)
              </option>
              {(overview?.modules || modules || []).map((m) => (
                <option key={m.id} value={String(m.id)} style={{ background: '#0f172a' }}>
                  📁 {m.title} ({m.total_lessons || (m.lessons?.length || 0)} aulas)
                </option>
              ))}
            </select>
          </div>

          {/* Cards de Métricas */}
          {loadingOverview ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
              <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              Calculando aulas com transcrição...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Aulas</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>{totalLessons}</div>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 600 }}>Transcritas</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>{withTranscription}</div>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: '#c084fc', textTransform: 'uppercase', fontWeight: 600 }}>Com Mapa</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#c084fc', marginTop: '2px' }}>{withMindmap}</div>
              </div>
            </div>
          )}

          {/* Dica / Informação */}
          <div style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            fontSize: '12.5px',
            color: '#e2e8f0',
            lineHeight: 1.45
          }}>
            💡 <strong>Como funciona:</strong> A IA analisa a transcrição de cada aula, estrutura um mapa mental abrangente com Mermaid.js e anexa um documento HTML estilizado em <em>Dark Premium</em> ao material complementar da aula.
          </div>

          {/* Resultado do Lote */}
          {batchResult && (
            <div style={{
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ade80',
              fontSize: '13px'
            }} data-testid="batch-result-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <CheckCircle2 size={16} />
                <span>Processamento Concluído</span>
              </div>
              <div style={{ marginTop: '6px', color: '#e2e8f0', fontSize: '12px' }}>
                • <strong>{batchResult.total_created || 0}</strong> novo(s) mapa(s) gerado(s)<br />
                • <strong>{batchResult.total_skipped || 0}</strong> aula(s) já possuíam mapa<br />
                {batchResult.total_failed > 0 && (
                  <span style={{ color: '#f87171' }}>• {batchResult.total_failed} aula(s) falharam<br /></span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div
          style={{
            padding: '16px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="secondary-btn"
            style={{ padding: '9px 18px', fontSize: '13px' }}
            data-testid="cancel-batch-mindmap-btn"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleStartBatch}
            disabled={processing || loadingOverview || withTranscription === 0}
            className="primary-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              fontSize: '13px',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              boxShadow: '0 2px 10px rgba(168, 85, 247, 0.35)',
              cursor: processing || withTranscription === 0 ? 'not-allowed' : 'pointer'
            }}
            data-testid="start-batch-mindmap-btn"
          >
            {processing ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Gerando Mapas Mentais...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Iniciar Geração com IA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
