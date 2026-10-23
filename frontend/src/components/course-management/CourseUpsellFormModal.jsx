import React, { useState, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Video, Percent, X } from 'lucide-react';
import CourseUpsellMediaUploader from './CourseUpsellMediaUploader';

export default function CourseUpsellFormModal({
  isOpen,
  onClose,
  editingOffer,
  eligibleTargetCourses = [],
  onSaveOffer,
  saving,
  addToast = () => {}
}) {
  const [progressPct, setProgressPct] = useState(35);
  const [targetCourseId, setTargetCourseId] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('Quero Conhecer');
  const [buttonUrl, setButtonUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showInSidebar, setShowInSidebar] = useState(false);

  useEffect(() => {
    if (editingOffer) {
      setProgressPct(editingOffer.progress_pct);
      setTargetCourseId(String(editingOffer.target_course_id));
      setMediaType(editingOffer.media_type);
      setMediaUrl(editingOffer.media_url);
      setTitle(editingOffer.title);
      setDescription(editingOffer.description || '');
      setButtonText(editingOffer.button_text || 'Quero Conhecer');
      setButtonUrl(editingOffer.button_url || '');
      setIsActive(editingOffer.is_active);
      setShowInSidebar(Boolean(editingOffer.show_in_sidebar));
    } else {
      setProgressPct(35);
      setTargetCourseId(eligibleTargetCourses[0]?.id ? String(eligibleTargetCourses[0].id) : '');
      setMediaType('image');
      setMediaUrl('');
      setTitle('');
      setDescription('');
      setButtonText('Quero Conhecer');
      setButtonUrl('');
      setIsActive(true);
      setShowInSidebar(false);
    }
  }, [editingOffer, eligibleTargetCourses, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!targetCourseId) {
      addToast('Selecione o produto ou curso promovido.', 'error');
      return;
    }
    if (!title.trim()) {
      addToast('O título do anúncio é obrigatório.', 'error');
      return;
    }
    if (!mediaUrl.trim()) {
      addToast('Por favor, faça upload da imagem/vídeo ou informe o link da mídia.', 'error');
      return;
    }
    onSaveOffer({
      target_course_id: Number(targetCourseId),
      progress_pct: Number(progressPct),
      media_type: mediaType,
      media_url: mediaUrl.trim(),
      title: title.trim(),
      description: description.trim() || null,
      button_text: buttonText.trim() || 'Quero Conhecer',
      button_url: buttonUrl.trim() || null,
      is_active: isActive,
      show_in_sidebar: showInSidebar
    });
  };

  // Estilos padronizados de alto contraste para inputs fáceis de visualizar
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    background: '#1e293b',
    border: '1.5px solid #475569',
    color: '#ffffff',
    fontSize: '13.5px',
    fontWeight: 500,
    outline: 'none',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px'
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="upsell-form-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        background: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="custom-scrollbar"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '16px',
          padding: '24px',
          color: '#f8fafc',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.15)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 transparent'
        }}
      >
        {/* Cabeçalho do Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <Sparkles size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
                {editingOffer ? 'Editar Anúncio de Upsell' : 'Criar Novo Anúncio de Upsell'}
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Configure quando e qual oferta será apresentada ao aluno
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-upsell-modal-btn"
            aria-label="Fechar"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card do Marco de Porcentagem com Alto Contraste */}
          <div style={{ background: '#141e33', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ ...labelStyle, margin: 0 }}>
                <Percent size={14} color="#38bdf8" />
                Porcentagem de Disparo
              </label>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '3px 10px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                {progressPct}% do Curso
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={progressPct}
              onChange={(e) => setProgressPct(Number(e.target.value))}
              data-testid="upsell-progress-slider"
              style={{ width: '100%', height: '6px', accentColor: '#38bdf8', cursor: 'pointer', margin: '8px 0' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '4px' }}>
              <span style={{ color: '#64748b' }}>1%</span>
              <button type="button" onClick={() => setProgressPct(35)} style={{ border: 'none', background: progressPct === 35 ? '#0284c7' : 'rgba(56, 189, 248, 0.12)', color: progressPct === 35 ? '#fff' : '#38bdf8', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>35%</button>
              <button type="button" onClick={() => setProgressPct(50)} style={{ border: 'none', background: progressPct === 50 ? '#0284c7' : 'rgba(56, 189, 248, 0.12)', color: progressPct === 50 ? '#fff' : '#38bdf8', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>50%</button>
              <button type="button" onClick={() => setProgressPct(75)} style={{ border: 'none', background: progressPct === 75 ? '#0284c7' : 'rgba(56, 189, 248, 0.12)', color: progressPct === 75 ? '#fff' : '#38bdf8', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>75%</button>
              <span style={{ color: '#64748b' }}>100%</span>
            </div>
          </div>

          {/* Curso/Ferramenta Alvo */}
          <div>
            <label style={labelStyle}>Produto / Curso Promovido *</label>
            <select
              value={targetCourseId}
              onChange={(e) => setTargetCourseId(e.target.value)}
              data-testid="upsell-target-course-select"
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>Selecione o produto...</option>
              {eligibleTargetCourses.map((c) => (
                <option key={c.id} value={c.id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                  {c.title} ({c.item_type === 'tool' ? 'Ferramenta' : 'Curso'})
                </option>
              ))}
            </select>
          </div>

          {/* Formato do Anúncio (Cards Selecionáveis de Alto Contraste) */}
          <div>
            <label style={labelStyle}>Formato do Anúncio *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label
                data-testid="upsell-media-image-label"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: mediaType === 'image' ? 'rgba(56, 189, 248, 0.18)' : '#1e293b',
                  border: `1.5px solid ${mediaType === 'image' ? '#38bdf8' : '#475569'}`,
                  color: mediaType === 'image' ? '#ffffff' : '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="mediaType"
                  value="image"
                  checked={mediaType === 'image'}
                  onChange={() => setMediaType('image')}
                  data-testid="upsell-media-image-radio"
                  style={{ accentColor: '#38bdf8' }}
                />
                <ImageIcon size={16} color={mediaType === 'image' ? '#38bdf8' : '#94a3b8'} />
                <span>Imagem / Banner</span>
              </label>

              <label
                data-testid="upsell-media-video-label"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: mediaType === 'video' ? 'rgba(56, 189, 248, 0.18)' : '#1e293b',
                  border: `1.5px solid ${mediaType === 'video' ? '#38bdf8' : '#475569'}`,
                  color: mediaType === 'video' ? '#ffffff' : '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="mediaType"
                  value="video"
                  checked={mediaType === 'video'}
                  onChange={() => setMediaType('video')}
                  data-testid="upsell-media-video-radio"
                  style={{ accentColor: '#38bdf8' }}
                />
                <Video size={16} color={mediaType === 'video' ? '#38bdf8' : '#94a3b8'} />
                <span>Vídeo Promocional</span>
              </label>
            </div>
          </div>

          {/* Upload e Mídia da Oferta */}
          <div>
            <label style={labelStyle}>
              {mediaType === 'video' ? 'Vídeo Promocional (Upload ou Link) *' : 'Imagem / Banner (Upload ou Link) *'}
            </label>
            <CourseUpsellMediaUploader
              mediaType={mediaType}
              mediaUrl={mediaUrl}
              onMediaChange={setMediaUrl}
              addToast={addToast}
            />
          </div>

          {/* Título da Oferta */}
          <div>
            <label style={labelStyle}>Título da Oferta *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Domine o Próximo Nível no Treinamento Avançado!"
              data-testid="upsell-title-input"
              style={inputStyle}
            />
          </div>

          {/* Descrição */}
          <div>
            <label style={labelStyle}>Texto Persuasivo / Descrição</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique os benefícios de adquirir este novo produto..."
              data-testid="upsell-desc-input"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Texto do Botão e Link de Destino */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Texto do Botão *</label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Quero Conhecer"
                data-testid="upsell-btn-text-input"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Link do Checkout / Destino</label>
              <input
                type="text"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="Página de vendas do curso (padrão)"
                data-testid="upsell-btn-url-input"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Switch de Ativo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: '#141e33',
              border: '1px solid #334155',
              borderRadius: '8px'
            }}
          >
            <input
              type="checkbox"
              id="upsellIsActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              data-testid="upsell-is-active-checkbox"
              style={{ width: '16px', height: '16px', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
            <label htmlFor="upsellIsActive" style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', cursor: 'pointer', margin: 0 }}>
              Anúncio ativo para exibição aos alunos
            </label>
          </div>

          {/* Switch de Barra Lateral (Card de Próximo Nível) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              background: '#141e33',
              border: showInSidebar ? '1.5px solid rgba(56, 189, 248, 0.4)' : '1px solid #334155',
              borderRadius: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <input
              type="checkbox"
              id="upsellShowInSidebar"
              checked={showInSidebar}
              onChange={(e) => setShowInSidebar(e.target.checked)}
              data-testid="upsell-show-in-sidebar-checkbox"
              style={{ width: '16px', height: '16px', accentColor: '#38bdf8', cursor: 'pointer', marginTop: '2px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label htmlFor="upsellShowInSidebar" style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', cursor: 'pointer', margin: 0 }}>
                Exibir também como Card de Próximo Nível na barra lateral da sala de aula
              </label>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                Exibe um card de destaque fixo acima dos módulos no lado direito da tela, convidando o aluno para este próximo passo.
              </span>
            </div>
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              data-testid="cancel-upsell-form-btn"
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1.5px solid #475569',
                color: '#e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              data-testid="save-upsell-form-btn"
              style={{
                padding: '9px 22px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: saving ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              {saving ? 'Salvando...' : 'Salvar Anúncio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
