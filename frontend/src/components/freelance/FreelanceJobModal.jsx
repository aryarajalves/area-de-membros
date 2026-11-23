import React, { useState, useEffect } from 'react';
import { X, Loader2, Briefcase } from 'lucide-react';
import { FREELANCE_CATEGORIES } from './freelanceApi';

export default function FreelanceJobModal({
  isOpen,
  editingJob = null,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(FREELANCE_CATEGORIES[0]);
  const [budgetType, setBudgetType] = useState('negotiable');
  const [budgetValue, setBudgetValue] = useState('');
  const [deadline, setDeadline] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingJob) {
      setTitle(editingJob.title || '');
      setCategory(editingJob.category || FREELANCE_CATEGORIES[0]);
      setBudgetType(editingJob.budget_type || 'negotiable');
      setBudgetValue(editingJob.budget_value || '');
      setDeadline(editingJob.deadline || '');
      setContactWhatsapp(editingJob.contact_whatsapp || '');
      setDescription(editingJob.description || '');
    } else {
      setTitle('');
      setCategory(FREELANCE_CATEGORIES[0]);
      setBudgetType('negotiable');
      setBudgetValue('');
      setDeadline('');
      setContactWhatsapp('');
      setDescription('');
    }
  }, [isOpen, editingJob]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || submitting) return;
    onSubmit({
      title: title.trim(),
      category,
      budget_type: budgetType,
      budget_value: budgetType === 'negotiable' ? null : (budgetValue.trim() || null),
      deadline: deadline.trim() || null,
      contact_whatsapp: contactWhatsapp.trim() || null,
      description: description.trim(),
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    color: '#f8fafc',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: '6px',
  };

  return (
    <div
      data-testid="freelance-job-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        data-testid="freelance-job-modal"
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          backgroundColor: '#0c1322',
          border: '1px solid rgba(56, 189, 248, 0.24)',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0f172a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={18} color="#38bdf8" />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              {editingJob ? 'Editar Oportunidade' : 'Publicar Vaga / Serviço'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-freelance-modal-btn"
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label htmlFor="freelance-title" style={labelStyle}>Título da Oportunidade *</label>
            <input
              id="freelance-title"
              data-testid="freelance-title-input"
              type="text"
              required
              minLength={3}
              maxLength={160}
              placeholder="Ex: Preciso de Editor de Vídeo para Reels"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label htmlFor="freelance-category" style={labelStyle}>Categoria / Área *</label>
              <select
                id="freelance-category"
                data-testid="freelance-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
              >
                {FREELANCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="freelance-budget-type" style={labelStyle}>Orçamento</label>
              <select
                id="freelance-budget-type"
                data-testid="freelance-budget-type-select"
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
                style={inputStyle}
              >
                <option value="negotiable">A combinar</option>
                <option value="fixed">Valor Fixo</option>
                <option value="hourly">Por Hora</option>
              </select>
            </div>
          </div>

          {budgetType !== 'negotiable' && (
            <div>
              <label htmlFor="freelance-budget-value" style={labelStyle}>
                Valor ({budgetType === 'hourly' ? 'por hora' : 'do projeto'})
              </label>
              <input
                id="freelance-budget-value"
                data-testid="freelance-budget-value-input"
                type="text"
                maxLength={60}
                placeholder={budgetType === 'hourly' ? 'Ex: R$ 80/h' : 'Ex: R$ 500,00'}
                value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label htmlFor="freelance-deadline" style={labelStyle}>Prazo / Urgência</label>
              <input
                id="freelance-deadline"
                data-testid="freelance-deadline-input"
                type="text"
                maxLength={100}
                placeholder="Ex: 7 dias / Urgente"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="freelance-whatsapp" style={labelStyle}>WhatsApp (opcional)</label>
              <input
                id="freelance-whatsapp"
                data-testid="freelance-whatsapp-input"
                type="text"
                maxLength={30}
                placeholder="Ex: 5585999999999"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label htmlFor="freelance-description" style={labelStyle}>Descrição do Projeto / Demanda *</label>
            <textarea
              id="freelance-description"
              data-testid="freelance-description-input"
              required
              minLength={10}
              maxLength={4000}
              rows={4}
              placeholder="Descreva o que você precisa, referências, ferramentas desejadas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              data-testid="cancel-freelance-modal-btn"
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                backgroundColor: 'transparent',
                color: '#cbd5e1',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || title.trim().length < 3 || description.trim().length < 10}
              data-testid="submit-freelance-modal-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              <span>{editingJob ? 'Salvar Alterações' : 'Publicar Vaga'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
