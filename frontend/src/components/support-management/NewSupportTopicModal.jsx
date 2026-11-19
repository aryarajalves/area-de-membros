import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  SupportTopicContextFields,
  SupportTopicMediaUploader,
} from './SupportTopicContextAndMediaFields';

export default function NewSupportTopicModal({
  isOpen,
  onClose,
  courses = [],
  onTopicCreated,
}) {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  const eligibleCourses = courses.filter((c) => {
    if (c.item_type === 'tool') return true;
    if (!Array.isArray(c.modules)) return true;
    return c.modules.some((m) => Array.isArray(m.lessons) && m.lessons.length > 0);
  });

  // Sincroniza o curso selecionado quando o modal é aberto ou quando a lista de cursos for carregada via API
  useEffect(() => {
    if (isOpen) {
      if (eligibleCourses.length > 0) {
        const exists = eligibleCourses.some((c) => String(c.id) === String(selectedCourseId));
        if (!selectedCourseId || !exists) {
          setSelectedCourseId(eligibleCourses[0].id);
          setSelectedModuleId('');
          setSelectedLessonId('');
        }
      } else {
        setSelectedCourseId('');
        setSelectedModuleId('');
        setSelectedLessonId('');
      }
    }
  }, [isOpen, eligibleCourses, selectedCourseId]);

  if (!isOpen) return null;

  const effectiveCourseId = selectedCourseId || (eligibleCourses.length > 0 ? eligibleCourses[0].id : '');
  const chosenCourse = eligibleCourses.find((c) => String(c.id) === String(effectiveCourseId));
  const isToolApp = chosenCourse?.item_type === 'tool';

  const handleCourseChange = (e) => {
    setSelectedCourseId(e.target.value);
    setSelectedModuleId('');
    setSelectedLessonId('');
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        addToast('Selecione um arquivo de imagem válido (PNG, JPG, WEBP).', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        addToast('Cada imagem deve ter no máximo 10 MB.', 'error');
        return;
      }
    }

    setUploadingImage(true);
    const token = localStorage.getItem('auth_token');
    const uploaded = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/v1/support/upload-image', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Falha no upload da imagem.');
        if (data.image_url) uploaded.push(data.image_url);
      }
      if (uploaded.length > 0) {
        setImageUrls((prev) => [...prev, ...uploaded]);
        addToast(
          uploaded.length > 1 ? `${uploaded.length} imagens anexadas com sucesso!` : 'Imagem anexada com sucesso!',
          'success'
        );
      }
    } catch (err) {
      addToast(err.message || 'Erro ao enviar imagem.', 'error');
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!effectiveCourseId) {
      addToast('Selecione um curso para a sua dúvida.', 'error');
      return;
    }
    if (chosenCourse?.is_support_locked) {
      addToast(chosenCourse.support_locked_reason || 'O suporte deste curso está temporariamente fechado.', 'error');
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
          module_id: selectedModuleId ? Number(selectedModuleId) : null,
          lesson_id: selectedLessonId ? Number(selectedLessonId) : null,
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrls[0] || null,
          image_urls: imageUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao publicar dúvida.');

      addToast('Dúvida publicada com sucesso na comunidade!', 'success');
      addToast('⚡ +5 XP ganhos! (Criação de tópico)', 'success');
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app:check-level-up', { detail: { xpAlreadyToasted: 5 } }));
      if (onTopicCreated) onTopicCreated(data);
      setTitle('');
      setContent('');
      setImageUrls([]);
      setSelectedModuleId('');
      setSelectedLessonId('');
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
        overflowY: 'auto',
      }}
      data-testid="new-support-topic-modal"
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '88vh',
          margin: 'auto',
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
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            flexShrink: 0,
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

        {/* Formulário com rolagem interna para não estourar topo/rodapé da tela */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Dropdown de Curso */}
          <div>
            <label
              htmlFor="support-course-select"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}
            >
              Curso Relacionado <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="support-course-select"
              value={effectiveCourseId}
              onChange={handleCourseChange}
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
              {eligibleCourses.length === 0 ? (
                <option value="" disabled>Nenhum curso disponível com acesso liberado</option>
              ) : (
                eligibleCourses.map((c) => (
                  <option key={c.id} value={c.id} style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                    {c.is_support_locked ? `🔒 ${c.title} (Suporte Fechado)` : c.title}
                  </option>
                ))
              )}
            </select>
            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Você só pode abrir dúvidas nos cursos aos quais possui acesso ativo.
            </span>
          </div>

          {/* Seletores Opcionais de Módulo e Aula (ocultos quando o item selecionado for um App/Ferramenta) */}
          {!isToolApp && (
            <SupportTopicContextFields
              modules={chosenCourse?.modules || []}
              selectedModuleId={selectedModuleId}
              onModuleChange={setSelectedModuleId}
              selectedLessonId={selectedLessonId}
              onLessonChange={setSelectedLessonId}
            />
          )}

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
              rows={4}
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

          {/* Upload de Múltiplas Imagens / Prints */}
          <SupportTopicMediaUploader
            imageUrls={imageUrls}
            uploadingImage={uploadingImage}
            onUploadImages={handleImageUpload}
            onRemoveImage={handleRemoveImage}
          />

          {/* Rodapé com Botões */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '4px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              flexShrink: 0,
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
