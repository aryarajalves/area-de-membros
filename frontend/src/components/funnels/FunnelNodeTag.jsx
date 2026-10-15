import React, { useState, useEffect } from 'react';
import { Tag, Copy, Trash2, GitFork } from 'lucide-react';
import FunnelNodeTagActionSection from './FunnelNodeTagActionSection';
import FunnelCreateTagModal from './FunnelCreateTagModal';

export default function FunnelNodeTag({
  node,
  isSelected,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  isTargetActive = false,
}) {
  const data = node.data || {};
  const tagAction = data.tag_action || (data.has_condition ? 'condition' : 'add');
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialName, setCreateModalInitialName] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/v1/students/tags', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const list = await res.json();
          if (isMounted) setTags(Array.isArray(list) ? list : []);
        }
      } catch {
        /* fallback silencioso */
      } finally {
        if (isMounted) setLoadingTags(false);
      }
    };
    fetchTags();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenCreateModal = (initialName = '') => {
    setCreateModalInitialName(initialName);
    setIsCreateModalOpen(true);
  };

  // Ao criar tag pelo modal, adiciona à lista e seleciona no nó
  const handleTagCreated = (newTag) => {
    setTags((prev) => [...prev, newTag]);
    const currentTagIds = Array.isArray(data.tag_ids)
      ? data.tag_ids
      : data.tag_id
      ? [data.tag_id]
      : [];

    if (!currentTagIds.includes(newTag.id)) {
      const nextTagIds = [...currentTagIds, newTag.id];
      onUpdateData(node.id, {
        ...data,
        tag_ids: nextTagIds,
        tag_id: nextTagIds[0] || null,
        tag_name: newTag.name,
        tag_color: newTag.color || '#a855f7',
      });
    }
    setCreateModalInitialName('');
  };

  return (
    <>
      <div
        style={{
          position: 'relative',
          width: '300px',
          backgroundColor: '#150c26',
          border: isSelected ? '2px solid #a855f7' : '1px solid rgba(168, 85, 247, 0.45)',
          borderRadius: '14px',
          boxShadow: isSelected
            ? '0 10px 30px rgba(168, 85, 247, 0.35)'
            : '0 10px 25px rgba(0, 0, 0, 0.7)',
          color: '#f8fafc',
          padding: '14px',
          userSelect: 'none',
          transition: 'border 0.2s ease, box-shadow 0.2s ease',
        }}
        data-testid={`funnel-node-tag-${node.id}`}
      >
        {/* Port de Entrada (Input Handle - Esquerda) */}
        <div
          onMouseUp={(e) => {
            e.stopPropagation();
            if (onConnectTarget) onConnectTarget(node.id, 'input');
          }}
          style={{
            position: 'absolute',
            left: '-8px',
            top: '50%',
            transform: isTargetActive ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%)',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#a855f7',
            border: '2px solid #0f172a',
            boxShadow: isTargetActive ? '0 0 14px #c084fc' : '0 0 8px #a855f7',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.15s ease',
          }}
          title="Conecte a saída de outro nó aqui"
          data-testid={`node-input-handle-${node.id}`}
        />

        {/* Ports de Saída (Output Handles - Direita) */}
        {tagAction === 'condition' ? (
          <>
            {/* Saída SIM / Atendida (Verde esmeralda - top: 35%) */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                if (onStartConnect) onStartConnect(node.id, e, node, 'output_yes');
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onStartConnect) onStartConnect(node.id, e, node, 'output_yes');
              }}
              style={{
                position: 'absolute',
                right: '-8px',
                top: '35%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                border: '2px solid #0f172a',
                boxShadow: '0 0 10px #10b981',
                cursor: 'grab',
                zIndex: 10,
                transition: 'all 0.15s ease',
              }}
              title="Saída SIM: Conecte o fluxo caso o lead atenda à condição"
              data-testid={`node-output-handle-yes-${node.id}`}
            />
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '35%',
                transform: 'translateY(-50%)',
                fontSize: '9px',
                fontWeight: 800,
                color: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                borderRadius: '4px',
                padding: '1px 5px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
              }}
            >
              SIM
            </span>

            {/* Saída NÃO / Não Atendida (Vermelha - top: 65%) */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                if (onStartConnect) onStartConnect(node.id, e, node, 'output_no');
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onStartConnect) onStartConnect(node.id, e, node, 'output_no');
              }}
              style={{
                position: 'absolute',
                right: '-8px',
                top: '65%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#f43f5e',
                border: '2px solid #0f172a',
                boxShadow: '0 0 10px #f43f5e',
                cursor: 'grab',
                zIndex: 10,
                transition: 'all 0.15s ease',
              }}
              title="Saída NÃO: Conecte o fluxo caso o lead NÃO atenda à condição"
              data-testid={`node-output-handle-no-${node.id}`}
            />
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '65%',
                transform: 'translateY(-50%)',
                fontSize: '9px',
                fontWeight: 800,
                color: '#f43f5e',
                backgroundColor: 'rgba(244, 63, 94, 0.18)',
                border: '1px solid rgba(244, 63, 94, 0.5)',
                borderRadius: '4px',
                padding: '1px 5px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
              }}
            >
              NÃO
            </span>
          </>
        ) : (
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              if (onStartConnect) onStartConnect(node.id, e, node, 'output');
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onStartConnect) onStartConnect(node.id, e, node, 'output');
            }}
            style={{
              position: 'absolute',
              right: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: tagAction === 'remove' ? '#fb7185' : '#a855f7',
              border: '2px solid #0f172a',
              boxShadow: tagAction === 'remove' ? '0 0 8px #fb7185' : '0 0 8px #a855f7',
              cursor: 'grab',
              zIndex: 10,
              transition: 'all 0.15s ease',
            }}
            title="Clique ou arraste para conectar ao próximo passo do funil"
            data-testid={`node-output-handle-${node.id}`}
          />
        )}

        {/* Header do Nó */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
            borderBottom:
              tagAction === 'condition'
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : tagAction === 'remove'
                ? '1px solid rgba(244, 63, 94, 0.3)'
                : '1px solid rgba(168, 85, 247, 0.25)',
            paddingBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                backgroundColor:
                  tagAction === 'condition'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : tagAction === 'remove'
                    ? 'rgba(244, 63, 94, 0.2)'
                    : 'rgba(168, 85, 247, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color:
                  tagAction === 'condition'
                    ? '#10b981'
                    : tagAction === 'remove'
                    ? '#fb7185'
                    : '#c084fc',
              }}
            >
              {tagAction === 'condition' ? <GitFork size={14} /> : <Tag size={14} />}
            </div>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color:
                  tagAction === 'condition'
                    ? '#10b981'
                    : tagAction === 'remove'
                    ? '#fb7185'
                    : '#c084fc',
                letterSpacing: '0.04em',
              }}
            >
              {tagAction === 'condition'
                ? 'VERIFICAR TAG'
                : tagAction === 'remove'
                ? 'REMOVER TAG'
                : 'ADICIONAR TAG'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color:
                  tagAction === 'condition'
                    ? '#10b981'
                    : tagAction === 'remove'
                    ? '#fb7185'
                    : '#c084fc',
                backgroundColor:
                  tagAction === 'condition'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : tagAction === 'remove'
                    ? 'rgba(244, 63, 94, 0.15)'
                    : 'rgba(168, 85, 247, 0.15)',
                border:
                  tagAction === 'condition'
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : tagAction === 'remove'
                    ? '1px solid rgba(244, 63, 94, 0.35)'
                    : '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '10px',
                padding: '2px 6px',
              }}
            >
              {tagAction === 'condition' ? 'BIFURCAÇÃO' : 'AÇÃO'}
            </span>

            <button
              onClick={() => onDuplicateNode && onDuplicateNode(node.id)}
              title="Duplicar nó"
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
            >
              <Copy size={13} />
            </button>
            <button
              onClick={() => onDeleteNode && onDeleteNode(node.id)}
              title="Excluir nó"
              style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Seção da Ação de Tags (Múltiplas Etiquetas, Busca com Filtro, Criação ou Condição com 3 abas) */}
        <FunnelNodeTagActionSection
          data={data}
          tags={tags}
          loadingTags={loadingTags}
          nodeId={node.id}
          onUpdateData={onUpdateData}
          onOpenCreateTagModal={handleOpenCreateModal}
        />
      </div>

      {/* Modal Popup para Criar Etiqueta com Escolha de Cor */}
      <FunnelCreateTagModal
        isOpen={isCreateModalOpen}
        initialName={createModalInitialName}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateModalInitialName('');
        }}
        onTagCreated={handleTagCreated}
      />
    </>
  );
}
