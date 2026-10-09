import React, { useState, useEffect, useRef } from 'react';
import { Database, Plus, Check, Loader2, AlertCircle, ChevronDown, Sparkles, X, CheckCircle2 } from 'lucide-react';
import AgentFlowCreateKbModal from './AgentFlowCreateKbModal';

export default function AgentFlowKbSelector({
  selectedKbId,
  selectedKbName,
  onChangeKb,
  courseTitle = '',
  isLightBg = false
}) {
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef(null);

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
  const cardBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const dropdownBg = isLightBg ? '#ffffff' : '#0b1120';
  const triggerBg = isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.7)';

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchBases = async () => {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      try {
        // 1. Verifica status da configuração
        const statusRes = await fetch('/api/v1/agentflow/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (isMounted) setConfigured(Boolean(statusData.configured));
          if (!statusData.configured) {
            setLoading(false);
            return;
          }
        }

        // 2. Busca bases disponíveis
        const res = await fetch('/api/v1/agentflow/knowledge-bases', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setBases(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        // Silencioso se não configurado
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBases();
    return () => { isMounted = false; };
  }, []);

  const handleSelectOption = (kb) => {
    if (!kb) {
      onChangeKb(null, null);
    } else {
      onChangeKb(kb.id, kb.name);
    }
    setIsOpen(false);
  };

  const handleCreatedKb = (created) => {
    setBases((prev) => [...prev, created]);
    onChangeKb(created.id, created.name);
  };

  const activeKb = bases.find((b) => String(b.id) === String(selectedKbId));
  const activeLabel = activeKb ? activeKb.name : (selectedKbName || null);

  return (
    <div
      className="form-group"
      data-testid="agentflow-kb-selector-container"
      style={{
        marginTop: '14px',
        padding: '14px',
        borderRadius: '10px',
        backgroundColor: cardBg,
        border: `1px solid ${borderColor}`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label
          htmlFor="agentflow-kb-select-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: textColor,
            margin: 0
          }}
        >
          <Database size={15} style={{ color: '#818cf8' }} />
          <span>Base de Conhecimento AgentFlow (IA RAG)</span>
        </label>

        {configured && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            data-testid="btn-open-create-kb-modal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#818cf8',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={12} />
            <span>Criar Nova Base</span>
          </button>
        )}
      </div>

      <p style={{ fontSize: '12px', color: subTextColor, margin: '0 0 10px 0', lineHeight: 1.45 }}>
        Aulas transcritas deste curso serão automaticamente enviadas para esta base no AgentFlow, alimentando o robô de dúvidas.
      </p>

      {!configured ? (
        <div
          data-testid="agentflow-not-configured-notice"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: '8px',
            color: '#eab308',
            fontSize: '12px',
            lineHeight: 1.45
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Chave do AgentFlow não detectada no <code>.env</code>. Adicione <code>AGENTFLOW_API_KEY</code> para vincular bases ao robô de atendimento.
          </span>
        </div>
      ) : (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
          {/* Dropdown Trigger Premium */}
          <button
            id="agentflow-kb-select-btn"
            type="button"
            data-testid="agentflow-kb-select"
            onClick={() => !loading && setIsOpen((prev) => !prev)}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: triggerBg,
              border: isOpen ? '1px solid #818cf8' : `1px solid ${borderColor}`,
              boxShadow: isOpen ? '0 0 0 2px rgba(99, 102, 241, 0.25), 0 4px 12px rgba(0,0,0,0.3)' : 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              outline: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, overflow: 'hidden' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: activeLabel ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Database size={15} style={{ color: activeLabel ? '#818cf8' : '#94a3b8' }} />
              </div>
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: activeLabel ? 600 : 400,
                  color: activeLabel ? textColor : '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {activeLabel || '-- Nenhuma (Não sincronizar com AgentFlow) --'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" style={{ color: '#818cf8' }} />
              ) : (
                <ChevronDown
                  size={16}
                  style={{
                    color: '#818cf8',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              )}
            </div>
          </button>

          {/* Menu Suspenso Customizado com Design Premium Glassmorphism */}
          {isOpen && (
            <div
              data-testid="agentflow-kb-dropdown-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                backgroundColor: dropdownBg,
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '12px',
                boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.85), 0 0 20px rgba(99, 102, 241, 0.12)',
                zIndex: 1100,
                padding: '6px',
                maxHeight: '240px',
                overflowY: 'auto'
              }}
            >
              {/* Opção: Desvincular / Nenhuma */}
              <button
                type="button"
                data-testid="agentflow-kb-option-none"
                onClick={() => handleSelectOption(null)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  backgroundColor: !selectedKbId ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                  marginBottom: '4px'
                }}
                onMouseEnter={(e) => {
                  if (selectedKbId) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (selectedKbId) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <X size={14} style={{ color: '#94a3b8' }} />
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    -- Nenhuma (Não sincronizar com AgentFlow) --
                  </span>
                </div>
                {!selectedKbId && <Check size={14} style={{ color: '#818cf8' }} />}
              </button>

              {/* Divisor sutil */}
              {bases.length > 0 && (
                <div
                  style={{
                    height: '1px',
                    backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                    margin: '4px 6px'
                  }}
                />
              )}

              {/* Opções das Bases: APENAS o nome de cada base */}
              {bases.map((kb) => {
                const isSelected = String(kb.id) === String(selectedKbId);
                return (
                  <button
                    key={kb.id}
                    type="button"
                    data-testid={`agentflow-kb-option-${kb.id}`}
                    onClick={() => handleSelectOption(kb)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                      border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s ease',
                      marginBottom: '2px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <Sparkles size={13} style={{ color: isSelected ? '#818cf8' : '#64748b', flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? '#818cf8' : textColor,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {kb.name}
                      </span>
                    </div>

                    {isSelected && <Check size={14} style={{ color: '#818cf8', flexShrink: 0 }} />}
                  </button>
                );
              })}

              {bases.length === 0 && (
                <div
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: subTextColor
                  }}
                >
                  Nenhuma base cadastrada. Clique em "+ Criar Nova Base".
                </div>
              )}
            </div>
          )}

          {/* Feedback Visual Compacto quando Base está Ativa */}
          {activeLabel && (
            <div
              data-testid="agentflow-kb-active-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '8px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                color: '#818cf8',
                fontSize: '11.5px',
                fontWeight: 500
              }}
            >
              <CheckCircle2 size={13} />
              <span>
                Sincronização ativa: Transcrições alimentarão a base <strong>{activeLabel}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mini-Modal Centralizado de Criação de Base no AgentFlow */}
      <AgentFlowCreateKbModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        courseTitle={courseTitle}
        isLightBg={isLightBg}
        onCreated={handleCreatedKb}
      />
    </div>
  );
}
