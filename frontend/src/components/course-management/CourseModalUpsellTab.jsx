import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit3, Sparkles, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';
import { fetchCourseUpsellOffers, createCourseUpsellOffer, updateCourseUpsellOffer, deleteCourseUpsellOffer } from './courseUpsellApi';
import CourseUpsellFormModal from './CourseUpsellFormModal';

export default function CourseModalUpsellTab({
  editingCourse,
  availableCourses = [],
  isLightBg = false,
  addToast = () => {}
}) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const eligibleTargetCourses = availableCourses.filter(
    (c) => c.id !== editingCourse?.id
  );

  const loadOffers = useCallback(async () => {
    if (!editingCourse?.id) return;
    setLoading(true);
    try {
      const data = await fetchCourseUpsellOffers(editingCourse.id);
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Erro ao carregar anúncios.', 'error');
    } finally {
      setLoading(false);
    }
  }, [editingCourse?.id, addToast]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (offer) => {
    setEditingOffer(offer);
    setModalOpen(true);
  };

  const handleSaveOffer = async (payload) => {
    if (!payload.target_course_id) {
      addToast('Selecione o curso ou ferramenta a ser promovido.', 'error');
      return;
    }
    if (!payload.title.trim()) {
      addToast('O título do anúncio é obrigatório.', 'error');
      return;
    }
    if (!payload.media_url.trim()) {
      addToast('Informe a URL da imagem ou do vídeo promocional.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingOffer) {
        await updateCourseUpsellOffer(editingOffer.id, payload);
        addToast('Anúncio atualizado com sucesso!', 'success');
      } else {
        await createCourseUpsellOffer(editingCourse.id, payload);
        addToast('Anúncio de upsell criado com sucesso!', 'success');
      }
      setModalOpen(false);
      loadOffers();
    } catch (err) {
      addToast(err.message || 'Erro ao salvar anúncio.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOffer = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteCourseUpsellOffer(deleteConfirmId);
      addToast('Anúncio excluído com sucesso!', 'success');
      setDeleteConfirmId(null);
      loadOffers();
    } catch (err) {
      addToast(err.message || 'Erro ao excluir anúncio.', 'error');
    }
  };

  if (!editingCourse?.id) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }} data-testid="upsell-new-course-warning">
        <AlertCircle size={36} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ color: isLightBg ? '#0f172a' : '#f8fafc', marginBottom: '8px' }}>Salve o curso primeiro</h4>
        <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto' }}>
          Para configurar anúncios e ofertas de Upsell no meio do curso, salve as informações gerais do curso primeiro e depois edite-o.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="course-modal-upsell-tab" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14.5px', color: isLightBg ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#38bdf8" />
            Anúncios & Upsell por Progresso
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
            Exiba ofertas de outros cursos ou ferramentas quando o aluno atingir certas porcentagens de conclusão.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          data-testid="add-upsell-offer-btn"
          style={{
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
          }}
        >
          <Plus size={14} /> Novo Anúncio
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
          Carregando anúncios de upsell...
        </div>
      ) : offers.length === 0 ? (
        <div
          data-testid="upsell-empty-state"
          style={{
            padding: '28px 16px',
            textAlign: 'center',
            background: isLightBg ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)',
            border: `1px dashed ${isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)'}`,
            borderRadius: '12px',
            color: '#94a3b8'
          }}
        >
          <p style={{ margin: 0, fontSize: '13px' }}>
            Nenhum anúncio configurado neste curso.
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: '#64748b' }}>
            Dica: Adicione ofertas aos 35%, 50% ou 75% do curso para impulsionar novos cursos ou ferramentas!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} data-testid="upsell-offers-list">
          {(Array.isArray(offers) ? offers : []).map((offer) => (
            <div
              key={offer.id}
              data-testid={`upsell-offer-card-${offer.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: isLightBg ? '#ffffff' : '#141e33',
                border: `1.5px solid ${isLightBg ? '#e2e8f0' : '#334155'}`,
                borderRadius: '12px',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.18)',
                    color: '#38bdf8',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    border: '1.5px solid rgba(56, 189, 248, 0.4)'
                  }}
                >
                  🎯 {offer.progress_pct}%
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {offer.title}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: offer.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)', color: offer.is_active ? '#34d399' : '#94a3b8', border: `1px solid ${offer.is_active ? 'rgba(16, 185, 129, 0.4)' : '#475569'}` }}>
                      {offer.is_active ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span>Promove: <strong style={{ color: '#38bdf8' }}>{offer.target_course_title}</strong></span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {offer.media_type === 'video' ? <Video size={13} color="#38bdf8" /> : <ImageIcon size={13} color="#38bdf8" />}
                      <span style={{ color: '#e2e8f0' }}>{offer.media_type === 'video' ? 'Vídeo Promocional' : 'Imagem / Banner'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(offer)}
                  data-testid={`edit-offer-btn-${offer.id}`}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px'
                  }}
                >
                  <Edit3 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(offer.id)}
                  data-testid={`delete-offer-btn-${offer.id}`}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    borderRadius: '6px',
                    color: '#fb7185',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Oferta de Upsell */}
      <CourseUpsellFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingOffer={editingOffer}
        eligibleTargetCourses={eligibleTargetCourses}
        onSaveOffer={handleSaveOffer}
        saving={saving}
        addToast={addToast}
      />

      {/* Popup de Confirmação de Exclusão (Regra de Popups) */}
      {deleteConfirmId && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="upsell-delete-confirm-modal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10002,
            background: 'rgba(0, 0, 0, 0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
              border: '1.5px solid rgba(244, 63, 94, 0.5)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              color: '#f8fafc',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 25px rgba(244, 63, 94, 0.15)'
            }}
          >
            <AlertCircle size={36} color="#fb7185" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: '0 0 8px', fontSize: '15px' }}>Excluir este anúncio?</h4>
            <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#94a3b8' }}>
              Esta ação removerá permanentemente este anúncio de upsell do curso.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                data-testid="cancel-delete-upsell-btn"
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e2e8f0',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteOffer}
                data-testid="confirm-delete-upsell-btn"
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  background: '#e11d48',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
