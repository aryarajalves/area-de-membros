import React, { useState, useEffect } from 'react';
import { X, Loader2, BookOpen, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import SupportReplyItem from './SupportReplyItem';
import SupportReplyForm from './SupportReplyForm';
import DeleteSupportConfirmModal from './DeleteSupportConfirmModal';
import SupportTopicOriginalPost from './SupportTopicOriginalPost';
import SupportImageLightboxModal from './SupportImageLightboxModal';

export default function SupportTopicDetailModal({
  isOpen,
  onClose,
  topicId,
  currentUser,
  onTopicDeleted,
  onReplyAdded,
  onRequestDeleteTopic,
  onTopicUpdated,
}) {
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyImageUrl, setReplyImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState(null);
  const [deletingReply, setDeletingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const { addToast } = useToast();

  const fetchTopicDetail = async () => {
    if (!topicId) return;
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/support/topics/${topicId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao carregar dúvida.');
      setTopic(data);
    } catch (err) {
      addToast(err.message || 'Erro ao carregar detalhes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && topicId) {
      fetchTopicDetail();
    } else {
      setTopic(null);
      setReplyContent('');
      setReplyImageUrl('');
      setReplyToDelete(null);
      setLightboxImage(null);
    }
  }, [isOpen, topicId]);

  if (!isOpen) return null;

  const handleToggleLike = async () => {
    if (!topic) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/support/topics/${topic.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTopic((prev) => ({
          ...prev,
          liked_by_me: data.liked,
          likes_count: data.likes_count,
        }));
        if (onTopicUpdated) {
          onTopicUpdated({ id: topic.id, liked_by_me: data.liked, likes_count: data.likes_count });
        }
      }
    } catch {
      // Ignora erro
    }
  };

  const handleToggleStatus = async () => {
    if (!topic) return;
    setUpdatingStatus(true);
    const token = localStorage.getItem('auth_token');
    const newStatus = topic.status === 'resolved' ? 'open' : 'resolved';
    try {
      const res = await fetch(`/api/v1/support/topics/${topic.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao alterar status.');
      setTopic((prev) => ({
        ...prev,
        status: data.status,
        has_solution: data.has_solution,
      }));
      addToast(
        data.status === 'resolved'
          ? 'Dúvida marcada como resolvida!'
          : 'Dúvida reaberta para novas respostas.',
        'success'
      );
      if (onTopicUpdated) {
        onTopicUpdated({ id: topic.id, status: data.status, has_solution: data.has_solution });
      }
    } catch (err) {
      addToast(err.message || 'Erro ao alterar status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleSolution = async (replyId) => {
    if (!topic) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/support/replies/${replyId}/solution`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao definir solução.');

      setTopic((prev) => {
        const nextReplies = prev.replies.map((r) =>
          r.id === replyId
            ? { ...r, is_solution: data.is_solution }
            : (data.is_solution ? { ...r, is_solution: false } : r)
        );
        return {
          ...prev,
          status: data.topic_status || prev.status,
          has_solution: nextReplies.some((r) => r.is_solution),
          replies: nextReplies,
        };
      });

      addToast(
        data.is_solution
          ? 'Resposta marcada como Solução Oficial!'
          : 'Marcação de Solução Oficial removida.',
        'success'
      );

      if (onTopicUpdated) {
        onTopicUpdated({
          id: topic.id,
          status: data.topic_status,
          has_solution: data.is_solution,
        });
      }
    } catch (err) {
      addToast(err.message || 'Erro ao definir solução.', 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Selecione uma imagem válida (PNG, JPG, WEBP).', 'error');
      return;
    }
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
      setReplyImageUrl(data.image_url);
      addToast('Imagem anexada à resposta!', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao enviar imagem.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      addToast('Digite o conteúdo da sua resposta.', 'error');
      return;
    }

    setSendingReply(true);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`/api/v1/support/topics/${topic.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          image_url: replyImageUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao enviar resposta.');

      addToast('Resposta publicada com sucesso!', 'success');
      setTopic((prev) => ({
        ...prev,
        replies: [...prev.replies, data],
      }));
      setReplyContent('');
      setReplyImageUrl('');
      if (onReplyAdded) onReplyAdded(topic.id);
    } catch (err) {
      addToast(err.message || 'Erro ao enviar resposta.', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const confirmDeleteReply = async () => {
    if (!replyToDelete) return;
    setDeletingReply(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/support/topics/${topic.id}/replies/${replyToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao excluir resposta.');
      addToast('Resposta excluída.', 'success');
      setTopic((prev) => ({
        ...prev,
        replies: prev.replies.filter((r) => r.id !== replyToDelete.id),
      }));
      setReplyToDelete(null);
    } catch (err) {
      addToast(err.message || 'Falha ao excluir resposta.', 'error');
    } finally {
      setDeletingReply(false);
    }
  };

  return (
    <>
      <div
        className="modal-backdrop"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
        data-testid="support-topic-detail-modal"
      >
        <div
          className="modal-content"
          style={{
            width: '100%',
            maxWidth: '760px',
            maxHeight: '90vh',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Cabeçalho */}
          <div
            style={{
              padding: '16px 22px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <BookOpen size={12} />
                {topic?.course?.title || 'Curso'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {topic && (currentUser?.id === topic.author.id || ['superadmin', 'admin'].includes(currentUser?.role)) && (
                <button
                  type="button"
                  onClick={() => {
                    if (onRequestDeleteTopic) {
                      onRequestDeleteTopic(topic);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  data-testid="detail-delete-topic-btn"
                  title="Excluir dúvida"
                >
                  <Trash2 size={18} />
                </button>
              )}
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f8fafc';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                data-testid="close-topic-detail-modal-btn"
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Corpo com Rolagem */}
          <div style={{ padding: '22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
                <Loader2 size={32} className="spin-animation" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px' }}>Carregando publicação...</p>
              </div>
            ) : !topic ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                Dúvida não encontrada.
              </div>
            ) : (
              <>
                {/* Tópico Original Modularizado */}
                <SupportTopicOriginalPost
                  topic={topic}
                  currentUser={currentUser}
                  onToggleLike={handleToggleLike}
                  onToggleStatus={handleToggleStatus}
                  updatingStatus={updatingStatus}
                  onImageClick={(url, title) => setLightboxImage({ url, title })}
                />

                {/* Lista de Respostas */}
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
                    Respostas ({topic.replies?.length || 0})
                  </h3>

                  {topic.replies?.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      Nenhuma resposta ainda. Seja o primeiro a responder!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {topic.replies.map((reply) => (
                        <SupportReplyItem
                          key={reply.id}
                          reply={reply}
                          currentUser={currentUser}
                          topicAuthorId={topic?.author?.id}
                          onToggleSolution={() => handleToggleSolution(reply.id)}
                          onDeleteReply={(r) => setReplyToDelete(r)}
                          onImageClick={(url, title) => setLightboxImage({ url, title })}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Caixa para Enviar Nova Resposta */}
                <SupportReplyForm
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  replyImageUrl={replyImageUrl}
                  setReplyImageUrl={setReplyImageUrl}
                  uploadingImage={uploadingImage}
                  sendingReply={sendingReply}
                  onImageUpload={handleImageUpload}
                  onSubmit={handleSendReply}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <DeleteSupportConfirmModal
        isOpen={Boolean(replyToDelete)}
        title="Excluir resposta"
        message="Tem certeza que deseja apagar esta resposta? Esta ação não pode ser desfeita."
        loading={deletingReply}
        onConfirm={confirmDeleteReply}
        onClose={() => setReplyToDelete(null)}
      />

      <SupportImageLightboxModal
        isOpen={Boolean(lightboxImage)}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage?.url}
        title={lightboxImage?.title}
      />
    </>
  );
}
