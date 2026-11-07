import React, { useState } from 'react';
import { Sparkles, Search, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function KnowledgeBaseSimulatorCard({
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
  isLightBg
}) {
  const [simQuery, setSimQuery] = useState('');
  const [simSearching, setSimSearching] = useState(false);
  const [simResults, setSimResults] = useState(null);
  const { addToast } = useToast();

  const handleSimulateSearch = async (e) => {
    if (e) e.preventDefault();
    if (!simQuery.trim()) return;

    try {
      setSimSearching(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch('/api/v1/tutor-ia/knowledge-base/simulate-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ query: simQuery.trim(), limit: 4 })
      });
      if (!res.ok) throw new Error('Falha ao simular busca no RAG.');
      const json = await res.json();
      setSimResults(json.results || []);
    } catch (err) {
      addToast(err.message || 'Erro ao simular busca.', 'error');
    } finally {
      setSimSearching(false);
    }
  };

  return (
    <div style={{ padding: '20px 22px', borderRadius: '12px', backgroundColor: cardBg, border: cardBorder }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Sparkles size={18} color="#0d9488" />
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textColor }}>
          Simulador de Busca Semântica (Auditoria do RAG)
        </h4>
      </div>
      <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: subTextColor }}>
        Digite uma dúvida para testar quais fragmentos de aulas e minutagens o RAG vetorial recupera em primeiro lugar.
      </p>

      <form onSubmit={handleSimulateSearch} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={simQuery}
          onChange={(e) => setSimQuery(e.target.value)}
          placeholder="Ex: O que o professor fala sobre ciclos ou trânsitos planetários?"
          data-testid="input-simulate-query"
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: cardBorder,
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
            color: textColor,
            fontSize: '13.5px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={simSearching || !simQuery.trim()}
          data-testid="btn-simulate-search"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            borderRadius: '8px',
            backgroundColor: '#0d9488',
            color: '#fff',
            fontWeight: 600,
            fontSize: '13px',
            border: 'none',
            cursor: simSearching ? 'not-allowed' : 'pointer'
          }}
        >
          {simSearching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          <span>Testar Busca</span>
        </button>
      </form>

      {/* Resultados da Simulação */}
      {simResults && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: subTextColor }}>
            {simResults.length} trechos mais relevantes encontrados:
          </span>
          {simResults.length === 0 ? (
            <span style={{ fontSize: '12.5px', color: subTextColor }}>
              Nenhum trecho com similaridade suficiente encontrado.
            </span>
          ) : (
            simResults.map((r, i) => (
              <div
                key={i}
                data-testid={`sim-result-${i}`}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${cardBorder}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0d9488' }}>
                    📚 {r.course_title} • {r.lesson_title} ({r.start_time_str} a {r.end_time_str})
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      padding: '2px 7px',
                      borderRadius: '4px'
                    }}
                  >
                    {Math.round(r.similarity * 100)}% de similaridade
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: textColor, lineHeight: 1.5 }}>
                  "{r.content}"
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
