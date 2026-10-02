import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  bgColor = '#090d16'
}) {
  if (!isOpen) return null;

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const modalBg = isLightBg ? '#ffffff' : (bgColor === '#000000' ? '#0f172a' : bgColor);
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';

  return (
    <div className="custom-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div className="table-card" style={{ maxWidth: '420px', width: '90%', padding: '26px 24px', borderRadius: '14px', backgroundColor: modalBg, border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.14)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: isLightBg ? '#fee2e2' : 'rgba(239, 68, 68, 0.16)', border: isLightBg ? 'none' : '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={26} />
        </div>
        <h3 style={{ fontSize: '17.5px', fontWeight: 700, color: textColor, marginBottom: '8px' }}>
          {title}
        </h3>
        <p style={{ fontSize: '13.5px', color: subTextColor, lineHeight: '1.5', marginBottom: '22px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            className="secondary-btn"
            style={!isLightBg ? { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.16)' } : undefined}
            onClick={onCancel}
            disabled={loading}
            data-testid="cancel-delete-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="primary-btn"
            style={{ backgroundColor: '#ef4444' }}
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-delete-btn"
          >
            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </div>
  );
}
