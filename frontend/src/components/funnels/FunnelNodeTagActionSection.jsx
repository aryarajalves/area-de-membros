import React, { useState } from 'react';
import { Tag, Plus, X, CheckCircle2, Search, Sparkles } from 'lucide-react';
import FunnelNodeTagConditionSection from './FunnelNodeTagConditionSection';

export default function FunnelNodeTagActionSection({
  data = {},
  tags = [],
  loadingTags = false,
  nodeId,
  onUpdateData,
  onOpenCreateTagModal,
}) {
  const tagAction = data.tag_action || (data.has_condition ? 'condition' : 'add');
  const [searchQuery, setSearchQuery] = useState('');

  // Normaliza IDs selecionados (suporte retrocompatível com tag_id único)
  const selectedTagIds = Array.isArray(data.tag_ids)
    ? data.tag_ids
    : data.tag_id
    ? [data.tag_id]
    : [];

  const handleTagActionChange = (action) => {
    onUpdateData(nodeId, { ...data, tag_action: action });
  };

  const handleAddTagId = (tagIdToAdd) => {
    if (!tagIdToAdd) return;
    const numericId = parseInt(tagIdToAdd, 10);
    if (selectedTagIds.includes(numericId)) return;

    const nextTagIds = [...selectedTagIds, numericId];
    const firstTag = tags.find((t) => t.id === nextTagIds[0]);

    onUpdateData(nodeId, {
      ...data,
      tag_ids: nextTagIds,
      tag_id: nextTagIds[0] || null,
      tag_name: firstTag ? firstTag.name : '',
      tag_color: firstTag ? firstTag.color : '#a855f7',
    });
    setSearchQuery('');
  };

  const handleRemoveTagId = (tagIdToRemove) => {
    const nextTagIds = selectedTagIds.filter((id) => id !== tagIdToRemove);
    const firstTag = tags.find((t) => t.id === nextTagIds[0]);

    onUpdateData(nodeId, {
      ...data,
      tag_ids: nextTagIds,
      tag_id: nextTagIds.length > 0 ? nextTagIds[0] : null,
      tag_name: firstTag ? firstTag.name : '',
      tag_color: firstTag ? firstTag.color : '#a855f7',
    });
  };

  // Mapeia objetos das tags selecionadas
  const selectedTags = selectedTagIds.map((id) => {
    const found = tags.find((t) => t.id === id);
    if (found) return found;
    return {
      id,
      name: id === data.tag_id && data.tag_name ? data.tag_name : `Tag #${id}`,
      color: id === data.tag_id && data.tag_color ? data.tag_color : '#a855f7',
    };
  });

  // Filtra as tags conforme o usuário digita
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredTags = trimmedQuery
    ? tags.filter((t) => t.name.toLowerCase().includes(trimmedQuery))
    : [];

  const exactMatchExists = tags.some((t) => t.name.toLowerCase() === trimmedQuery);

  // Resumo dinâmico
  const getSummaryText = () => {
    if (selectedTags.length === 0) {
      return tagAction === 'remove'
        ? 'Selecione uma ou mais etiquetas para serem removidas do aluno.'
        : 'Selecione uma ou mais etiquetas para serem aplicadas ao aluno.';
    }
    const names = selectedTags.map((t) => `"${t.name}"`).join(', ');
    if (tagAction === 'remove') {
      return selectedTags.length === 1
        ? `A tag ${names} será removida do aluno ao passar por aqui.`
        : `As tags ${names} serão removidas do aluno ao passar por aqui.`;
    }
    return selectedTags.length === 1
      ? `O aluno receberá a tag ${names} ao passar por aqui.`
      : `O aluno receberá as tags ${names} ao passar por aqui.`;
  };

  return (
    <div>
      {/* Abas de Ação: Adicionar vs Remover vs Verificar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        <button
          type="button"
          onClick={() => handleTagActionChange('add')}
          style={{
            flex: 1,
            padding: '6px 4px',
            borderRadius: '6px',
            border: tagAction === 'add' ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: tagAction === 'add' ? 'rgba(168, 85, 247, 0.28)' : 'rgba(255, 255, 255, 0.03)',
            color: tagAction === 'add' ? '#ffffff' : '#94a3b8',
            fontSize: '0.69rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          data-testid={`funnel-node-tag-action-add-${nodeId}`}
        >
          + Adicionar
        </button>
        <button
          type="button"
          onClick={() => handleTagActionChange('remove')}
          style={{
            flex: 1,
            padding: '6px 4px',
            borderRadius: '6px',
            border: tagAction === 'remove' ? '1px solid #fb7185' : '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: tagAction === 'remove' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255, 255, 255, 0.03)',
            color: tagAction === 'remove' ? '#ffffff' : '#94a3b8',
            fontSize: '0.69rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          data-testid={`funnel-node-tag-action-remove-${nodeId}`}
        >
          - Remover
        </button>
        <button
          type="button"
          onClick={() => handleTagActionChange('condition')}
          style={{
            flex: 1,
            padding: '6px 4px',
            borderRadius: '6px',
            border: tagAction === 'condition' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: tagAction === 'condition' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.03)',
            color: tagAction === 'condition' ? '#ffffff' : '#94a3b8',
            fontSize: '0.69rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          data-testid={`funnel-node-tag-action-condition-${nodeId}`}
        >
          🝡 Verificar
        </button>
      </div>

      {tagAction === 'condition' ? (
        <FunnelNodeTagConditionSection
          data={data}
          tags={tags}
          loadingTags={loadingTags}
          onUpdateData={onUpdateData}
          nodeId={nodeId}
        />
      ) : (
        <>
          {/* Descrição da Ação */}
          <p style={{ fontSize: '0.73rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>
            {tagAction === 'remove'
              ? 'Remove as etiquetas selecionadas do contato quando ele atingir este ponto.'
              : 'Aplica as etiquetas selecionadas ao contato quando ele atingir este ponto.'}
          </p>

      {/* Campo de Digitação e Filtragem em Tempo Real */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
            {tagAction === 'remove' ? 'Buscar e vincular etiquetas para remover:' : 'Buscar e vincular etiquetas:'}
          </label>
          <span style={{ fontSize: '0.68rem', color: '#c084fc', fontWeight: 700 }}>
            {selectedTags.length} selecionada{selectedTags.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Input de Digitação */}
        <div style={{ position: 'relative', marginBottom: '6px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (searchQuery.trim()) {
                  if (onOpenCreateTagModal) onOpenCreateTagModal(searchQuery.trim());
                }
              }
            }}
            placeholder="Digite para buscar ou criar etiqueta..."
            disabled={loadingTags}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '7px 28px 7px 10px',
              borderRadius: '6px',
              backgroundColor: '#0a0514',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              color: '#f8fafc',
              fontSize: '0.78rem',
              outline: 'none',
            }}
            data-testid={`funnel-node-tag-search-input-${nodeId}`}
          />
          <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#a855f7' }}>
            <Search size={13} />
          </div>
        </div>

        {/* Resultados da Busca em Tempo Real quando usuário digita */}
        {trimmedQuery.length > 0 && (
          <div
            style={{
              maxHeight: '130px',
              overflowY: 'auto',
              backgroundColor: '#0d071a',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '6px',
              marginBottom: '6px',
              padding: '4px',
            }}
            data-testid={`funnel-node-tag-filtered-list-${nodeId}`}
          >
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleAddTagId(tag.id)}
                    disabled={isSelected}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                      color: isSelected ? '#64748b' : '#f8fafc',
                      fontSize: '0.74rem',
                      cursor: isSelected ? 'default' : 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s ease',
                    }}
                    data-testid={`funnel-node-tag-filter-item-${tag.id}`}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: tag.color || '#a855f7',
                        }}
                      />
                      <span>{tag.name}</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', color: isSelected ? '#a855f7' : '#94a3b8' }}>
                      {isSelected ? '✓ Adicionada' : '+ Adicionar'}
                    </span>
                  </button>
                );
              })
            ) : (
              <div style={{ padding: '6px 8px', fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                Nenhuma etiqueta existente com "{searchQuery}".
              </div>
            )}
          </div>
        )}

        {/* Dropdown com todas as tags (quando não estiver pesquisando) */}
        {!trimmedQuery && (
          <select
            value=""
            onChange={(e) => handleAddTagId(e.target.value)}
            disabled={loadingTags}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              backgroundColor: '#0a0514',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#f8fafc',
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer',
              marginBottom: '6px',
            }}
            data-testid={`funnel-node-tag-select-${nodeId}`}
          >
            <option value="">+ Selecionar etiqueta existente...</option>
            {tags.map((tag) => {
              const isAlreadyAdded = selectedTagIds.includes(tag.id);
              return (
                <option key={tag.id} value={tag.id} disabled={isAlreadyAdded}>
                  {tag.name} {isAlreadyAdded ? '✓' : ''}
                </option>
              );
            })}
          </select>
        )}

        {/* Botão de Criar Nova Etiqueta com Escolha de Cor */}
        <button
          type="button"
          onClick={() => onOpenCreateTagModal && onOpenCreateTagModal(trimmedQuery ? searchQuery.trim() : '')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(168, 85, 247, 0.18)',
            border: '1px dashed #c084fc',
            color: '#e9d5ff',
            cursor: 'pointer',
            fontSize: '0.74rem',
            fontWeight: 700,
            transition: 'background 0.15s ease',
          }}
          data-testid={`funnel-node-open-create-tag-modal-btn-${nodeId}`}
        >
          <Sparkles size={13} color="#c084fc" />
          <span>
            {trimmedQuery && !exactMatchExists
              ? `+ Criar nova etiqueta "${searchQuery.trim()}" (com cor)`
              : '+ Criar nova etiqueta (com cor)'}
          </span>
        </button>
      </div>

      {/* Lista de Badges das Tags Selecionadas */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '10px',
          minHeight: selectedTags.length > 0 ? 'auto' : '28px',
        }}
        data-testid={`funnel-node-tag-badge-${nodeId}`}
      >
        {selectedTags.length === 0 ? (
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>
            Nenhuma etiqueta vinculada a este nó.
          </span>
        ) : (
          selectedTags.map((t) => (
            <span
              key={t.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.73rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: `${t.color || '#a855f7'}20`,
                color: t.color || '#c084fc',
                border: `1px solid ${t.color || '#a855f7'}`,
                boxShadow: `0 0 6px ${t.color || '#a855f7'}30`,
              }}
              data-testid={`funnel-node-selected-tag-${t.id}`}
            >
              <Tag size={11} />
              <span>{t.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveTagId(t.id)}
                title={`Remover "${t.name}"`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: t.color || '#c084fc',
                  cursor: 'pointer',
                  padding: '0 2px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.8,
                }}
                data-testid={`funnel-node-remove-selected-tag-${t.id}`}
              >
                <X size={11} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Resumo Dinâmico */}
      <div
        style={{
          padding: '8px 10px',
          backgroundColor: tagAction === 'remove' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(168, 85, 247, 0.08)',
          borderLeft: tagAction === 'remove' ? '3px solid #f43f5e' : '3px solid #a855f7',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
        }}
        data-testid={`funnel-node-tag-summary-${nodeId}`}
      >
        <CheckCircle2
          size={13}
          color={tagAction === 'remove' ? '#fb7185' : '#c084fc'}
          style={{ flexShrink: 0, marginTop: '2px' }}
        />
        <span style={{ fontSize: '0.7rem', color: tagAction === 'remove' ? '#fecdd3' : '#e9d5ff', lineHeight: 1.35 }}>
          {getSummaryText()}
        </span>
      </div>
        </>
      )}
    </div>
  );
}
