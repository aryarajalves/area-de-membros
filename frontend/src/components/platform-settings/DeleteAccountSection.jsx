import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { handleSessionExpired } from '../../services/authInterceptor';

export default function DeleteAccountSection({
  cardBorder,
  textColor,
  subTextColor,
  isLightBg,
}) {
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/auth/me', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        addToast(data.detail || 'Não foi possível excluir sua conta.', 'error');
        setDeleting(false);
        return;
      }

      addToast(
        data.message || 'Conta excluída e dados pessoais anonimizados com sucesso.',
        'success'
      );
      setModalOpen(false);
      handleSessionExpired();
    } catch {
      addToast('Erro de conexão ao tentar excluir a conta.', 'error');
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        style={{
          borderTop: cardBorder,
          paddingTop: '20px',
          marginTop: '26px',
        }}
        data-testid="delete-account-section"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            padding: '16px 18px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            backgroundColor: isLightBg ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.08)',
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Trash2 size={16} color="#ef4444" />
              <h4 style={{ fontSize: '14.5px', fontWeight: 600, margin: 0, color: '#f87171' }}>
                Excluir Minha Conta
              </h4>
            </div>
            <p style={{ fontSize: '12.5px', color: subTextColor, margin: 0, lineHeight: 1.45 }}>
              Seus dados pessoais serão anonimizados conforme a LGPD e seu acesso será encerrado permanentemente. Suas contribuições na comunidade permanecerão exibidas como &ldquo;Usuário excluído&rdquo;.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            data-testid="btn-open-delete-account-modal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.14)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={15} />
            <span>Deletar Conta</span>
          </button>
        </div>
      </div>

      {modalOpen && (
        <div
          data-testid="delete-account-confirm-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: isLightBg ? '#ffffff' : '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
              color: textColor,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <h3
                id="delete-account-modal-title"
                style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: textColor }}
              >
                Confirmar Exclusão da Conta
              </h3>
            </div>

            <p style={{ fontSize: '13.5px', color: subTextColor, lineHeight: 1.55, margin: '0 0 22px 0' }}>
              Tem certeza que deseja deletar sua conta? Esta ação é <strong style={{ color: '#f87171' }}>irreversível</strong>: seus dados pessoais (nome, e-mail, telefone, data de nascimento e foto) serão anonimizados e sua sessão será encerrada imediatamente.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setModalOpen(false)}
                data-testid="btn-cancel-delete-account"
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: cardBorder,
                  backgroundColor: 'transparent',
                  color: textColor,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                data-testid="btn-confirm-delete-account"
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                }}
              >
                {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
