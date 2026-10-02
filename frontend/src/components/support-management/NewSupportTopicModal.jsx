import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Upload, Loader2, BookOpen } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function NewSupportTopicModal({
  isOpen,
  onClose,
  courses = [],
  onTopicCreated,
}) {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  // Sincroniza o curso selecionado quando o modal é aberto ou quando a lista de cursos for carregada via API
  useEffect(() => {
    if (isOpen) {
      if (courses && courses.length > 0) {
        const exists = courses.some((c) => String(c.id) === String(selectedCourseId));
        if (!selectedCourseId || !exists) {
          setSelectedCourseId(courses[0].id);
        }
      } else {
        setSelectedCourseId('');
      }
    }
  }, [isOpen, courses, selectedCourseId]);

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida tipo
    if (!file.type.startsWith('image/')) {
      addToast('Selecione um arquivo de imagem válido (PNG, JPG, WEBP).', 'error');
      return;
    }

    // Valida tamanho (até 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      addToast('A imagem deve ter no máximo 10 MB.', 'error');
      return;
    }

    setUploadingImage(true);
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/support/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Falha no upload da imagem.');
      setImageUrl(data.image_url);
      addToast('Imagem anexada com sucesso!', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao enviar imagem.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const effectiveCourseId = selectedCourseId || (courses.length > 0 ? courses[0].id : null);
    if (!effectiveCourseId) {
      addToast('Selecione um curso para a sua dúvida.', 'error');
      return;
    }
    if (!title.trim()) {
      addToast('Informe o título da sua dúvida.', 'error');
      return;
    }
    if (!content.trim()) {
      addToast('Descreva a sua dúvida com detalhes.', 'error');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch('/api/v1/support/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: Number(effectiveCourseId),
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao publicar dúvida.');

      addToast('Dúvida publicada com sucesso na comunidade!', 'success');
      if (onTopicCreated) onTopicCreated(data);
      setTitle('');
      setContent('');
      setImageUrl('');
      onClose();
    } catch (err) {
      addToast(err.message || 'Erro ao publicar dúvida.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      data-testid="new-support-topic-modal"
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Nova Publicação / Dúvida
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Tire sua dúvida com os instrutores e a comunidade.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
            data-testid="close-new-topic-modal-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Dropdown de Curso (Apenas cursos aos quais o aluno tem acesso) */}
          <div>
            <label
              htmlFor="support-course-select"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}
            >
              Curso Relacionado <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="support-course-select"
                value={selectedCourseId || (courses.length > 0 ? courses[0].id : '')}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                data-testid="support-course-select"
              >
                {courses.length === 0 ? (
                  <option value="" disabled>Nenhum curso disponível com acesso liberado</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.id} style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                      {c.title}
                    </option>
                  ))
                )}
              </select>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Você só pode abrir dúvidas nos cursos aos quais possui acesso ativo.
            </span>
          </div>

          {/* Título da Dúvida */}
          <div>
            <label
              htmlFor="support-title-input"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}
            >
              Título da Dúvida <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="support-title-input"
              type="text"
              placeholder="Ex: Dúvida sobre conexão do webhook no n8n"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                fontSize: '14px',
                outline: 'none',
              }}
              data-testid="support-title-input"
            />
          </div>

          {/* Descrição Detalhada */}
          <div>
            <label
              htmlFor="support-content-input"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}
            >
              Descrição Completa da Dúvida <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              id="support-content-input"
              rows={5}
              placeholder="Descreva o que aconteceu, passos que você seguiu ou erros exibidos..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                lineHeight: '1.5',
              }}
              data-testid="support-content-input"
            />
          </div>

          {/* Anexo de Imagem (Opcional) */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>
              Anexar Imagem ou Print (Opcional)
            </label>

            {imageUrl ? (
              <div
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <img
                  src={imageUrl}
                  alt="Anexo da dúvida"
                  style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(239, 68, 68, 0.85)',
                    border: 'none',
                    borderRadius: '50%',
                    color: '#fff',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  data-testid="remove-image-btn"
                  title="Remover imagem"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px dashed rgba(255, 255, 255, 0.25)',
                  backgroundColor: 'rgba(30, 41, 59, 0.3)',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  color: '#94a3b8',
                  fontSize: '13px',
                }}
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                  data-testid="support-image-file-input"
                />
                {uploadingImage ? (
                  <>
                    <Loader2 size={18} className="spin-animation" color="#38bdf8" />
                    <span>Enviando imagem...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} color="#38bdf8" />
                    <span>Clique para enviar um print ou imagem (PNG, JPG, WEBP até 10 MB)</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Rodapé com Botões */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '10px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="pagination-btn"
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
              data-testid="cancel-new-topic-btn"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting || uploadingImage || courses.length === 0}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: submitting || courses.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              }}
              data-testid="submit-new-topic-btn"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>Publicando...</span>
                </>
              ) : (
                <span>Publicar Dúvida</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
