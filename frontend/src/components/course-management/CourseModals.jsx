import React, { useState } from 'react';
import { Upload, X, Image, Globe, ListOrdered, Sparkles, Loader2 } from 'lucide-react';
import { UploadProgressModal, FileDeleteConfirmModal } from '../common/FeedbackModals';
import ExpandableTextarea from '../common/ExpandableTextarea';
import ConfirmGenerateAiMetadataModal from '../course-classroom/ConfirmGenerateAiMetadataModal';
import AgentFlowKbSelector from './AgentFlowKbSelector';
import { useToast } from '../../context/ToastContext';

export function CourseFormModal({
  isOpen,
  onClose,
  editingCourse,
  title,
  setTitle,
  description,
  setDescription,
  thumbnailUrl,
  setThumbnailUrl,
  coverImageUrl = '',
  setCoverImageUrl,
  salesPageUrl = '',
  setSalesPageUrl,
  orderIndex = 0,
  setOrderIndex,
  agentflowKbId = null,
  setAgentflowKbId,
  agentflowKbName = '',
  setAgentflowKbName,
  bgColor = '#090d16',
  uploading,
  saving,
  onUploadThumbnail,
  onUploadCoverImage,
  onSaveCourse
}) {
  const [showThumbnailDeleteConfirm, setShowThumbnailDeleteConfirm] = useState(false);
  const [showCoverDeleteConfirm, setShowCoverDeleteConfirm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiConfirmModal, setShowAiConfirmModal] = useState(false);
  const { addToast } = useToast();

  const handleGenerateAiDescription = async () => {
    if (!editingCourse?.id) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/courses/${editingCourse.id}/generate-ai-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Falha ao gerar descrição com IA.');
      }

      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
        addToast('Descrição gerada com IA a partir dos módulos com sucesso!', 'success');
        setShowAiConfirmModal(false);
      } else {
        throw new Error('Nenhuma descrição foi retornada pela IA.');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao gerar descrição com IA.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  if (!isOpen) return null;

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const modalBg = isLightBg ? '#ffffff' : (bgColor || '#090d16');
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const modalBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.14)';

  return (
    <div className={`modal-overlay ${!isLightBg ? 'classroom-dark-theme' : ''}`} role="dialog" aria-modal="true" data-testid="course-modal">
      <div
        className={`modal-content ${!isLightBg ? 'classroom-dark-theme' : ''}`}
        style={{
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: modalBg,
          color: textColor,
          border: modalBorder
        }}
      >
        <div className="modal-header">
          <h3 style={{ color: textColor }}>{editingCourse ? 'Editar Curso' : 'Criar Novo Curso'}</h3>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            data-testid="close-course-modal-btn"
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSaveCourse} className="modal-form">
          <div className="form-group">
            <label htmlFor="course-title">Título do Curso *</label>
            <input
              id="course-title"
              type="text"
              required
              placeholder="Ex: Formação em Tráfego Direto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="course-title-input"
            />
          </div>

          <div className="form-group">
            <ExpandableTextarea
              id="course-description"
              label="Descrição"
              placeholder="Descrição do conteúdo e objetivos do curso..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              testId="course-description-input"
              textColor={textColor}
              extraActions={
                editingCourse?.id ? (
                  <button
                    type="button"
                    onClick={() => setShowAiConfirmModal(true)}
                    disabled={aiLoading || saving}
                    data-testid="generate-course-ai-description-btn"
                    title="Analisar módulos do curso e gerar descrição automaticamente com IA"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.22) 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.45)',
                      color: '#c084fc',
                      cursor: aiLoading || saving ? 'not-allowed' : 'pointer',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      opacity: aiLoading || saving ? 0.6 : 1
                    }}
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Gerando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        <span>Gerar com IA</span>
                      </>
                    )}
                  </button>
                ) : null
              }
            />
          </div>

          {/* Upload de Capa Principal (Card do Curso) */}
          <div className="form-group">
            <label>Imagem de Capa do Card (Thumbnail do Curso)</label>
            <div className="thumbnail-size-notice" style={{ marginBottom: '10px' }}>
              <strong>Dimensões recomendadas:</strong> 1280 × 720 pixels (Proporção 16:9).<br />
              <strong>Formatos aceitos:</strong> JPG, PNG, WEBP (Até 5 MB).
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="primary-btn" style={{ cursor: 'pointer', padding: '8px 14px', fontSize: '13px' }}>
                <Upload size={16} />
                <span>{uploading ? 'Enviando imagem...' : 'Escolher do Computador'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onUploadThumbnail}
                  style={{ display: 'none' }}
                  disabled={uploading}
                  data-testid="upload-thumbnail-input"
                />
              </label>

              {thumbnailUrl && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setShowThumbnailDeleteConfirm(true)}
                  style={{ padding: '8px 12px', fontSize: '12px', color: '#ef4444' }}
                  data-testid="remove-course-thumbnail-btn"
                >
                  <X size={14} /> Remover Capa
                </button>
              )}
            </div>

            {thumbnailUrl && (
              <div className="thumbnail-preview-box" style={{ marginTop: '12px' }}>
                <img src={thumbnailUrl} alt="Pré-visualização da Capa" data-testid="thumbnail-preview-img" />
              </div>
            )}
          </div>

          {/* Imagem de Banner Hero do Topo (Opcional - Estilo Netflix) */}
          {setCoverImageUrl && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Image size={15} style={{ color: '#2563eb' }} />
                <span>Banner Hero de Fundo do Curso (Estilo Netflix - Opcional)</span>
              </label>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
                Imagem panorâmica exibida no topo da sala de aula com degradê cinemático. Se não informada, usará a capa principal.
              </p>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                {onUploadCoverImage && (
                  <label className="secondary-btn" style={{ cursor: 'pointer', padding: '7px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={14} />
                    <span>Enviar Banner do PC</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={onUploadCoverImage}
                      style={{ display: 'none' }}
                      disabled={uploading}
                      data-testid="upload-cover-input"
                    />
                  </label>
                )}

                {coverImageUrl && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowCoverDeleteConfirm(true)}
                    style={{ padding: '7px 10px', fontSize: '12px', color: '#ef4444' }}
                    data-testid="remove-course-cover-btn"
                  >
                    <X size={14} /> Remover Banner
                  </button>
                )}
              </div>

              {coverImageUrl && (
                <div className="thumbnail-preview-box" style={{ marginTop: '8px', maxHeight: '130px', overflow: 'hidden' }}>
                  <img src={coverImageUrl} alt="Pré-visualização do Banner Hero" style={{ width: '100%', objectFit: 'cover' }} data-testid="cover-preview-img" />
                </div>
              )}
            </div>
          )}

          {/* Link da Página de Vendas / Mais Informações */}
          <div className="form-group">
            <label htmlFor="course-sales-page-url" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={15} style={{ color: '#3b82f6' }} />
              <span>Link da Página de Vendas / Mais Informações (Opcional)</span>
            </label>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
              Página para onde alunos que ainda não possuem acesso ao curso serão redirecionados ao clicar em "Ver Mais Informações".
            </p>
            <input
              id="course-sales-page-url"
              type="url"
              placeholder="Ex: https://seusite.com/curso-bussola"
              value={salesPageUrl}
              onChange={(e) => setSalesPageUrl && setSalesPageUrl(e.target.value)}
              data-testid="course-sales-page-url-input"
            />
          </div>

          {/* Ordem de Posição do Curso */}
          <div className="form-group">
            <label htmlFor="course-order-index" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ListOrdered size={15} style={{ color: '#eab308' }} />
              <span>Ordem de Posição / Exibição</span>
            </label>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
              Define a ordem do curso na vitrine (ordem crescente: 1 aparece antes de 2, 3...).
            </p>
            <input
              id="course-order-index"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={orderIndex}
              onChange={(e) => setOrderIndex && setOrderIndex(e.target.value)}
              data-testid="course-order-index-input"
            />
          </div>

          {/* Integração AgentFlow - Base de Conhecimento RAG */}
          <AgentFlowKbSelector
            selectedKbId={agentflowKbId}
            selectedKbName={agentflowKbName}
            onChangeKb={(id, name) => {
              if (setAgentflowKbId) setAgentflowKbId(id);
              if (setAgentflowKbName) setAgentflowKbName(name);
            }}
            courseTitle={title}
            isLightBg={isLightBg}
          />

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={saving || uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={saving || uploading}
              data-testid="submit-course-btn"
            >
              {saving ? 'Salvando...' : (editingCourse ? 'Salvar Alterações' : 'Criar Curso')}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Progresso de Upload */}
      <UploadProgressModal
        isOpen={uploading}
        title="Enviando imagem do curso..."
        subtitle="Aguarde o envio seguro para o Backblaze B2 ser concluído."
      />

      {/* Modal de Confirmação de Remoção da Capa */}
      <FileDeleteConfirmModal
        isOpen={showThumbnailDeleteConfirm}
        title="Remover Capa do Curso?"
        message="Tem certeza que deseja remover a imagem de capa deste curso?"
        onConfirm={() => {
          setThumbnailUrl('');
          setShowThumbnailDeleteConfirm(false);
        }}
        onCancel={() => setShowThumbnailDeleteConfirm(false)}
      />

      {/* Modal de Confirmação de Remoção do Banner Hero */}
      <FileDeleteConfirmModal
        isOpen={showCoverDeleteConfirm}
        title="Remover Banner Hero?"
        message="Tem certeza que deseja remover a imagem de banner hero deste curso?"
        onConfirm={() => {
          if (setCoverImageUrl) setCoverImageUrl('');
          setShowCoverDeleteConfirm(false);
        }}
        onCancel={() => setShowCoverDeleteConfirm(false)}
      />

      {/* Modal de Confirmação para Geração de Descrição com IA */}
      <ConfirmGenerateAiMetadataModal
        isOpen={showAiConfirmModal}
        onClose={() => !aiLoading && setShowAiConfirmModal(false)}
        onConfirm={handleGenerateAiDescription}
        loading={aiLoading}
        isLightBg={isLightBg}
        title="Gerar Descrição do Curso com IA?"
        message="A Inteligência Artificial analisará os títulos e descrições de todos os módulos e aulas deste curso para estruturar uma descrição pedagógica completa, clara e didática. A descrição atual será substituída. Deseja continuar?"
      />
    </div>
  );
}

export function CourseDeleteModal({
  isOpen,
  courseToDelete,
  onClose,
  onConfirmDelete,
  bgColor = '#090d16'
}) {
  if (!isOpen || !courseToDelete) return null;

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const modalBg = isLightBg ? '#ffffff' : (bgColor || '#090d16');
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#cbd5e1';
  const modalBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.14)';

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" data-testid="delete-course-modal">
      <div
        className={`modal-content ${!isLightBg ? 'classroom-dark-theme' : ''}`}
        style={{
          maxWidth: '420px',
          textAlign: 'center',
          backgroundColor: modalBg,
          color: textColor,
          border: modalBorder
        }}
      >
        <h3 style={{ marginBottom: '10px', color: textColor }}>Excluir Curso?</h3>
        <p style={{ fontSize: '13.5px', color: subTextColor, marginBottom: '20px' }}>
          Tem certeza que deseja excluir o curso <strong style={{ color: textColor }}>"{courseToDelete.title}"</strong> e todos os seus módulos e aulas? Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button
            type="button"
            className="secondary-btn"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="primary-btn btn-danger"
            onClick={onConfirmDelete}
            data-testid="confirm-delete-course-btn"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
