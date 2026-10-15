import React, { useState } from 'react';
import { Check, X, Tag, GitFork, Search } from 'lucide-react';

export default function FunnelNodeTagConditionSection({
  data = {},
  tags = [],
  loadingTags = false,
  onUpdateData,
  nodeId,
}) {
  const conditionMode = data.condition_mode || 'has_tags';
  const conditionOperator = data.condition_operator || 'AND';
  const [searchQuery, setSearchQuery] = useState('');

  // Normaliza IDs de tags para checagem (compatível com condition_tag_ids e tag_ids legados)
  const conditionTagIds = Array.isArray(data.condition_tag_ids)
    ? data.condition_tag_ids
    : Array.isArray(data.tag_ids)
    ? data.tag_ids
    : data.tag_id
    ? [data.tag_id]
    : [];

  const handleModeChange = (mode) => {
    onUpdateData(nodeId, {
      ...data,
      has_condition: true,
      condition_mode: mode,
    });
  };

  const handleOperatorChange = (operator) => {
    onUpdateData(nodeId, {
      ...data,
      has_condition: true,
      condition_operator: operator,
    });
  };

  const handleAddConditionTagId = (tagIdToAdd) => {
    const numericId = parseInt(tagIdToAdd, 10);
    if (!numericId || conditionTagIds.includes(numericId)) return;
    const nextIds = [...conditionTagIds, numericId];
    onUpdateData(nodeId, {
      ...data,
      has_condition: true,
      condition_tag_ids: nextIds,
      tag_ids: nextIds,
    });
    setSearchQuery('');
  };

  const handleRemoveConditionTagId = (tagIdToRemove) => {
    const nextIds = conditionTagIds.filter((id) => id !== tagIdToRemove);
    onUpdateData(nodeId, {
      ...data,
      has_condition: true,
      condition_tag_ids: nextIds,
      tag_ids: nextIds,
    });
  };

  const selectedConditionTags = conditionTagIds.map((id) => {
    const found = tags.find((t) => t.id === id);
    return found || { id, name: `Tag #${id}`, color: '#10b981' };
  });

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredTags = trimmedQuery
    ? tags.filter((t) => t.name.toLowerCase().includes(trimmedQuery) && !conditionTagIds.includes(t.id))
    : [];

  const availableTags = tags.filter((t) => !conditionTagIds.includes(t.id));

  // Explicação dinâmica da regra
  const getRuleExplanation = () => {
    if (selectedConditionTags.length === 0) {
      return 'Selecione uma ou mais etiquetas abaixo para avaliar o lead.';
    }
    const names = selectedConditionTags.map((t) => `"${t.name}"`).join(conditionOperator === 'AND' ? ' E ' : ' OU ');
    if (conditionMode === 'has_tags') {
      return conditionOperator === 'AND' && selectedConditionTags.length > 1
        ? `Se o aluno possuir TODAS as etiquetas (${names})`
        : `Se o aluno possuir a(s) etiqueta(s) (${names})`;
    }
    return conditionOperator === 'AND' && selectedConditionTags.length > 1
      ? `Se o aluno NÃO possuir NENHUMA das etiquetas (${names})`
      : `Se o aluno NÃO possuir a(s) etiqueta(s) (${names})`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      data-testid={`funnel-node-tag-condition-box-${nodeId}`}
    >
      {/* Descrição curta da Bifurcação */}
      <p style={{ fontSize: '0.73rem', color: '#cbd5e1', margin: '0 0 4px 0', lineHeight: 1.4 }}>
        Avalia se o contato possui etiquetas específicas e direciona o fluxo pela saída <strong>SIM</strong> ou <strong>NÃO</strong>.
      </p>

      {/* Seletor de Modo: Possui vs NÃO Possui */}
      <div>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
          Critério de Avaliação:
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => handleModeChange('has_tags')}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '6px',
              border: conditionMode === 'has_tags' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: conditionMode === 'has_tags' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.03)',
              color: conditionMode === 'has_tags' ? '#ffffff' : '#94a3b8',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            data-testid={`condition-mode-has-${nodeId}`}
          >
            Possui etiqueta(s)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('not_has_tags')}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '6px',
              border: conditionMode === 'not_has_tags' ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: conditionMode === 'not_has_tags' ? 'rgba(244, 63, 94, 0.22)' : 'rgba(255, 255, 255, 0.03)',
              color: conditionMode === 'not_has_tags' ? '#ffffff' : '#94a3b8',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            data-testid={`condition-mode-nothas-${nodeId}`}
          >
            NÃO possui
          </button>
        </div>
      </div>

      {/* Operador Lógico AND / OR (quando houver 2 ou mais etiquetas) */}
      {conditionTagIds.length >= 2 && (
        <div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
            Operador Lógico para Múltiplas Etiquetas:
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleOperatorChange('AND')}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '5px',
                border: conditionOperator === 'AND' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: conditionOperator === 'AND' ? 'rgba(16, 185, 129, 0.28)' : 'rgba(255, 255, 255, 0.03)',
                color: conditionOperator === 'AND' ? '#ffffff' : '#94a3b8',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
              data-testid={`condition-operator-and-${nodeId}`}
            >
              AND (Todas)
            </button>
            <button
              type="button"
              onClick={() => handleOperatorChange('OR')}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '5px',
                border: conditionOperator === 'OR' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: conditionOperator === 'OR' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                color: conditionOperator === 'OR' ? '#ffffff' : '#94a3b8',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
              data-testid={`condition-operator-or-${nodeId}`}
            >
              OR (Pelo menos 1)
            </button>
          </div>
        </div>
      )}

      {/* Campo de Busca de Tags para a Condição */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label style={{ fontSize: '0.70rem', color: '#94a3b8', fontWeight: 600 }}>
            Etiquetas para testar:
          </label>
          <span style={{ fontSize: '0.66rem', color: '#10b981', fontWeight: 700 }}>
            {selectedConditionTags.length} selecionada{selectedConditionTags.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ position: 'relative', marginBottom: '6px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar etiqueta para verificar..."
            disabled={loadingTags}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '6px 26px 6px 9px',
              borderRadius: '6px',
              backgroundColor: '#0a0514',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              color: '#f8fafc',
              fontSize: '0.76rem',
              outline: 'none',
            }}
          />
          <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }}>
            <Search size={12} />
          </div>
        </div>

        {/* Resultados da busca */}
        {trimmedQuery.length > 0 && (
          <div
            style={{
              maxHeight: '110px',
              overflowY: 'auto',
              backgroundColor: '#0d071a',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '6px',
              marginBottom: '6px',
              padding: '3px',
            }}
          >
            {filteredTags.length > 0 ? (
              filteredTags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleAddConditionTagId(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#f8fafc',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: t.color || '#10b981' }} />
                    <span>{t.name}</span>
                  </span>
                  <span style={{ fontSize: '0.66rem', color: '#10b981' }}>+ Adicionar</span>
                </button>
              ))
            ) : (
              <div style={{ padding: '5px 7px', fontSize: '0.70rem', color: '#94a3b8', fontStyle: 'italic' }}>
                Nenhuma etiqueta encontrada.
              </div>
            )}
          </div>
        )}

        {/* Dropdown de tags existentes (quando não estiver pesquisando) */}
        {!trimmedQuery && (
          <select
            value=""
            onChange={(e) => handleAddConditionTagId(e.target.value)}
            disabled={loadingTags}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: '#0a0514',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#f8fafc',
              fontSize: '0.76rem',
              outline: 'none',
              cursor: 'pointer',
              marginBottom: '6px',
            }}
            data-testid={`condition-add-tag-select-${nodeId}`}
          >
            <option value="">+ Selecionar etiqueta existente...</option>
            {availableTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Badges das tags selecionadas para checagem */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '5px',
          marginBottom: '6px',
          minHeight: selectedConditionTags.length > 0 ? 'auto' : '24px',
        }}
      >
        {selectedConditionTags.length === 0 ? (
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic' }}>
            Nenhuma etiqueta adicionada para verificar.
          </span>
        ) : (
          selectedConditionTags.map((tag) => (
            <span
              key={tag.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.70rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                color: tag.color || '#10b981',
                border: `1px solid ${tag.color || '#10b981'}`,
                boxShadow: `0 0 6px rgba(16, 185, 129, 0.25)`,
              }}
              data-testid={`condition-tag-item-${tag.id}`}
            >
              <Tag size={10} />
              <span>{tag.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveConditionTagId(tag.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tag.color || '#10b981',
                  cursor: 'pointer',
                  padding: '0 2px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.8,
                }}
                data-testid={`condition-remove-tag-${tag.id}`}
                title="Remover da verificação"
              >
                <X size={10} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Card Visual de Bifurcação das Saídas (SIM vs NÃO) */}
      <div
        style={{
          padding: '8px',
          backgroundColor: 'rgba(16, 185, 129, 0.07)',
          borderLeft: '3px solid #10b981',
          borderRadius: '0 6px 6px 0',
          fontSize: '0.69rem',
          lineHeight: 1.35,
          color: '#e2e8f0',
        }}
      >
        <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '3px' }}>
          {getRuleExplanation()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '1px 4px',
                borderRadius: '3px',
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                border: '1px solid #10b981',
              }}
            >
              SIM
            </span>
            <span style={{ color: '#a7f3d0' }}>Segue pela saída verde superior</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '1px 4px',
                borderRadius: '3px',
                backgroundColor: 'rgba(244, 63, 94, 0.25)',
                color: '#f43f5e',
                border: '1px solid #f43f5e',
              }}
            >
              NÃO
            </span>
            <span style={{ color: '#fecdd3' }}>Segue pela saída vermelha inferior</span>
          </div>
        </div>
      </div>
    </div>
  );
}
