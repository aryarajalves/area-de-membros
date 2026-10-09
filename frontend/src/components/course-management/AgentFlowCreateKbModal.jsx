import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AgentFlowCreateKbModal({
  isOpen,
  onClose,
  courseTitle = '',
  isLightBg = false,
  onCreated
}) {
  const [newKbName, setNewKbName] = useState(
    courseTitle ? `Base: ${courseTitle}` : 'Nova Base de Conhecimento'
  );
  const [creating, setCreating] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';

  const handleCreateKb = async (e) => {
    e.preventDefault();
    if (!newKbName.trim()) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/agentflow/knowledge-bases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newKbName.trim(),
          description: `Base criada automaticamente para o curso '${courseTitle || 'Treinamento'}'`
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Falha ao criar base no AgentFlow.');
      }

      const created = await res.json();
      onCreated(created);
      onClose();
      addToast(`Base de Conhecimento '${created.name}' criada no AgentFlow!`, 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao criar base no AgentFlow.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="custom-modal-overlay"
      data-testid="create-kb-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="table-card"
        style={{
          width: '90%',
          maxWidth: '420px',
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: isLightBg ? '#ffffff' : '#0a0f1d',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700, color: textColor }}>
          Criar Base no AgentFlow
        </h4>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: subTextColor }}>
          Digite o nome da nova base de conhecimento onde as aulas deste treinamento serão salvas:
        </p>

        <form onSubmit={handleCreateKb}>
          <input
            type="text"
            required
            autoFocus
            placeholder="Ex: Base Curso de Astrologia"
            value={newKbName}
            onChange={(e) => setNewKbName(e.target.value)}
            data-testid="input-new-kb-name"
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${borderColor}`,
              color: textColor,
              fontSize: '13px',
              marginBottom: '18px',
              boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={creating}
              style={{ fontSize: '12.5px', padding: '6px 14px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={creating || !newKbName.trim()}
              data-testid="btn-confirm-create-kb"
              style={{
                fontSize: '12.5px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              <span>{creating ? 'Criando...' : 'Criar e Vincular'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
