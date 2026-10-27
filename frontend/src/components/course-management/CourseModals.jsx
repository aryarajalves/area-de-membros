import React, { useState } from 'react';
import { UploadProgressModal, FileDeleteConfirmModal } from '../common/FeedbackModals';
import ConfirmGenerateAiMetadataModal from '../course-classroom/ConfirmGenerateAiMetadataModal';
import CourseModalTabs from './CourseModalTabs';
import CourseModalInfoTab from './CourseModalInfoTab';
import CourseModalMediaTab from './CourseModalMediaTab';
import CourseModalAccessTab from './CourseModalAccessTab';
import CourseModalAiTab from './CourseModalAiTab';
import CourseModalUpsellTab from './CourseModalUpsellTab';
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
  coverImagePosition = 50,
  setCoverImagePosition,
  salesPageUrl = '',
  setSalesPageUrl,
  orderIndex = 0,
  setOrderIndex,
  agentflowKbId = null,
  setAgentflowKbId,
  agentflowKbName = '',
  setAgentflowKbName,
  itemType = 'course',
  setItemType,
  toolUrl = '',
  setToolUrl,
  bundledCourseIds = [],
  setBundledCourseIds,
  bundleTitle = '',
  setBundleTitle,
  availableCourses = [],
  bgColor = '#090d16',
  uploading,
  saving,
  onUploadThumbnail,
  onUploadCoverImage,
  onSaveCourse
}) {
  const [activeTab, setActiveTab] = useState('info');
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

  const handleSubmit = (e) => {
    if (!title || !title.trim()) {
      setActiveTab('info');
    }
    if (onSaveCourse) {
      onSaveCourse(e);
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
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: modalBg,
          color: textColor,
          border: modalBorder
        }}
      >
        <div className="modal-header">
          <h3 style={{ color: textColor }}>
            {editingCourse ? (itemType === 'tool' ? 'Editar Ferramenta' : 'Editar Curso') : (itemType === 'tool' ? 'Criar Nova Ferramenta' : 'Criar Novo Curso')}
          </h3>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            data-testid="close-course-modal-btn"
          >
            &times;
          </button>
        </div>

        {/* Barra de Abas do Modal */}
        <CourseModalTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isLightBg={isLightBg}
        />

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Aba 1: Dados Gerais */}
          <div style={{ display: activeTab === 'info' ? 'block' : 'none' }}>
            <CourseModalInfoTab
              itemType={itemType}
              setItemType={setItemType}
              toolUrl={toolUrl}
              setToolUrl={setToolUrl}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              editingCourse={editingCourse}
              textColor={textColor}
              isLightBg={isLightBg}
              aiLoading={aiLoading}
              saving={saving}
              onOpenAiConfirm={() => setShowAiConfirmModal(true)}
            />
          </div>

          {/* Aba 2: Capas & Mídia */}
          <div style={{ display: activeTab === 'media' ? 'block' : 'none' }}>
            <CourseModalMediaTab
              thumbnailUrl={thumbnailUrl}
              coverImageUrl={coverImageUrl}
              coverImagePosition={coverImagePosition}
              setCoverImagePosition={setCoverImagePosition}
              setCoverImageUrl={setCoverImageUrl}
              uploading={uploading}
              onUploadThumbnail={onUploadThumbnail}
              onUploadCoverImage={onUploadCoverImage}
              onPromptDeleteThumbnail={() => setShowThumbnailDeleteConfirm(true)}
              onPromptDeleteCover={() => setShowCoverDeleteConfirm(true)}
            />
          </div>

          {/* Aba 3: Vendas & Vitrine */}
          <div style={{ display: activeTab === 'sales_access' ? 'block' : 'none' }}>
            <CourseModalAccessTab
              salesPageUrl={salesPageUrl}
              setSalesPageUrl={setSalesPageUrl}
              orderIndex={orderIndex}
              setOrderIndex={setOrderIndex}
              setBundledCourseIds={setBundledCourseIds}
              bundledCourseIds={bundledCourseIds}
              bundleTitle={bundleTitle}
              setBundleTitle={setBundleTitle}
              availableCourses={availableCourses}
              editingCourse={editingCourse}
              isLightBg={isLightBg}
            />
          </div>

          {/* Aba 4: Anúncios & Upsell */}
          <div style={{ display: activeTab === 'upsell' ? 'block' : 'none' }}>
            <CourseModalUpsellTab
              editingCourse={editingCourse}
              availableCourses={availableCourses}
              isLightBg={isLightBg}
              addToast={addToast}
            />
          </div>

          {/* Aba 5: Inteligência Artificial */}
          <div style={{ display: activeTab === 'ai' ? 'block' : 'none' }}>
            <CourseModalAiTab
              agentflowKbId={agentflowKbId}
              setAgentflowKbId={setAgentflowKbId}
              agentflowKbName={agentflowKbName}
              setAgentflowKbName={setAgentflowKbName}
              title={title}
              isLightBg={isLightBg}
            />
          </div>

          {activeTab !== 'upsell' && (
            <div className="modal-actions" style={{ marginTop: '20px' }}>
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
                {saving ? 'Salvando...' : (editingCourse ? 'Salvar Alterações' : (itemType === 'tool' ? 'Criar Ferramenta' : 'Criar Curso'))}
              </button>
            </div>
          )}
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
