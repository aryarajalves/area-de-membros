import React from 'react';
import { AlertTriangle, Copy, Trash2 } from 'lucide-react';

export default function FunnelNodeConfirmModal({
  config,
  onClose,
  onConfirm,
}) {
  if (!config || !config.node) return null;

  const isDelete = config.type === 'delete';
  const node = config.node;

  const getNodeTypeName = (type) => {
    switch (type) {
      case 'trigger':
      case 'trigger_course_interest':
        return 'Gatilho Inicial';
      case 'message':
        return 'Mensagem';
      case 'delay':
        return 'Tempo de Espera (Delay)';
      case 'tag':
        return 'Atribuição de Tag';
      case 'audio':
        return 'Áudio';
      case 'media':
        return 'Mídia / Imagem';
      default:
        return 'Nó do Funil';
    }
  };

  const nodeTitle =
    node.data?.title ||
    node.data?.tag_name ||
    getNodeTypeName(node.type);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '20px',
      }}
      data-testid="funnel-node-confirm-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#0f172a',
          border: isDelete
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid rgba(168, 85, 247, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
          padding: '26px',
          color: '#f8fafc',
          textAlign: 'center',
        }}
        data-testid={`funnel-node-${config.type}-modal`}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: isDelete
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(168, 85, 247, 0.18)',
            color: isDelete ? '#f87171' : '#c084fc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            border: isDelete
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : '1px solid rgba(168, 85, 247, 0.35)',
          }}
        >
          {isDelete ? <AlertTriangle size={24} /> : <Copy size={24} />}
        </div>

        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 700 }}>
          {isDelete ? 'Excluir Este Nó?' : 'Duplicar Este Nó?'}
        </h3>

        <p style={{ margin: '0 0 22px 0', fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
          {isDelete ? (
            <>
              Tem certeza que deseja apagar o nó de <strong>"{nodeTitle}"</strong>? Todas as conexões vinculadas a este nó serão removidas do fluxo.
            </>
          ) : (
            <>
              Deseja criar uma cópia deste nó de <strong>"{nodeTitle}"</strong> no fluxo com as mesmas configurações?
            </>
          )}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="cancel-node-action-btn"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 22px',
              borderRadius: '8px',
              backgroundColor: isDelete ? '#ef4444' : undefined,
              background: isDelete ? undefined : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isDelete
                ? '0 4px 15px rgba(239, 68, 68, 0.35)'
                : '0 4px 15px rgba(99, 102, 241, 0.35)',
            }}
            data-testid="confirm-node-action-btn"
          >
            {isDelete ? (
              <>
                <Trash2 size={16} />
                <span>Sim, Excluir Nó</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Sim, Duplicar Nó</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
