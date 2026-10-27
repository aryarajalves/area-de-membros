import React from 'react';
import { AlertTriangle, FolderX } from 'lucide-react';

export default function FunnelDeleteFolderConfirmModal({
  isOpen,
  folderName = '',
  funnelsCount = 0,
  onClose,
  onConfirm,
  deleting = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '20px',
      }}
      data-testid="delete-folder-confirm-modal"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '24px',
          color: '#f8fafc',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FolderX size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f87171' }}>
              Excluir Pasta de Funis
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Esta ação removerá apenas a pasta organizadora.
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 16px 0' }}>
          Tem certeza que deseja excluir a pasta <strong style={{ color: '#ffffff' }}>"{folderName}"</strong>?
        </p>

        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <AlertTriangle size={18} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: '#34d399', lineHeight: 1.4 }}>
            <strong>Proteção de Funis:</strong> {funnelsCount > 0 ? (
              <span>
                Os <strong>{funnelsCount} funil(s)</strong> vinculados a esta pasta <strong>NÃO serão apagados</strong>. Eles continuarão funcionando normalmente e serão movidos para a seção <strong>Sem Pasta</strong>.
              </span>
            ) : (
              <span>Esta pasta não possui funis associados. Nenhuma automação será impactada.</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              cursor: deleting ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            data-testid="confirm-delete-folder-btn"
          >
            {deleting ? 'Excluindo...' : 'Sim, Excluir Pasta'}
          </button>
        </div>
      </div>
    </div>
  );
}
