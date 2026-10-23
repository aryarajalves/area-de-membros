import React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteAvatarConfirmModal({
  isOpen,
  loading = false,
  onConfirm,
  onClose,
  avatarUrl,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      data-testid="delete-avatar-confirm-modal"
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 24px rgba(239, 68, 68, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          position: 'relative',
        }}
      >
        {/* Cabeçalho com Ícone e Miniatura */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <Trash2 size={22} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: '0 0 2px 0' }}>
              Remover Foto de Perfil?
            </h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Confirmação de exclusão de avatar
            </span>
          </div>

          {avatarUrl && (
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                flexShrink: 0,
              }}
            >
              <img
                src={avatarUrl}
                alt="Miniatura atual"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>

        {/* Mensagem explicativa */}
        <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 22px 0' }}>
          Tem certeza de que deseja remover sua foto de perfil atual? Seu perfil passará a exibir o avatar padrão com suas iniciais.
        </p>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '9px 18px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            data-testid="cancel-delete-avatar-btn"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '9px 18px',
              backgroundColor: '#dc2626',
              border: '1px solid #b91c1c',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading ? 0.75 : 1,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
              transition: 'all 0.15s ease',
            }}
            data-testid="confirm-delete-avatar-btn"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Removendo...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Sim, Remover</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
