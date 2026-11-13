import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import IntroductionBanner from './IntroductionBanner';
import IntroductionPostList from './IntroductionPostList';
import IntroductionPostModal from './IntroductionPostModal';
import IntroductionCreateModal from './IntroductionCreateModal';
import '../../styles/introductions.css';

export default function IntroductionManagement({ user, bgColor }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const { addToast } = useToast();

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await fetch('/api/v1/introductions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail || 'Erro ao carregar apresentações.', 'error');
      }
    } catch {
      addToast('Erro ao conectar ao servidor.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSelectPost = async (post) => {
    setSelectedPost(post);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/v1/introductions/${post.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const detailedPost = await res.json();
        setSelectedPost(detailedPost);
      }
    } catch {
      // Mantém os dados locais se falhar a rede
    }
  };

  const handleCreatePost = async (postPayload) => {
    const token = getAuthToken();
    try {
      const res = await fetch('/api/v1/introductions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postPayload),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts((prev) => [newPost, ...prev]);
        addToast('Sua apresentação foi publicada com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao criar apresentação.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao publicar apresentação.', 'error');
      throw err;
    }
  };

  const handleUpdatePost = async (postId, postPayload) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/introductions/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postPayload),
      });

      if (res.ok) {
        const updatedPost = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(updatedPost);
        }
        addToast('Apresentação atualizada com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao atualizar apresentação.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao atualizar apresentação.', 'error');
      throw err;
    }
  };

  const handleDeletePost = async (postId) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/introductions/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setSelectedPost(null);
        addToast('Apresentação excluída com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao excluir apresentação.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao excluir apresentação.', 'error');
    }
  };

  const handleTogglePin = async (postId) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/introductions/${postId}/pin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const updatedIsPinned = data.is_pinned;

        setPosts((prev) => {
          const updated = prev.map((p) => (p.id === postId ? { ...p, is_pinned: updatedIsPinned } : p));
          // Reordena: fixados primeiro, depois por data decrescente
          return [...updated].sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return new Date(b.created_at) - new Date(a.created_at);
          });
        });

        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost((prev) => (prev ? { ...prev, is_pinned: updatedIsPinned } : null));
        }

        addToast(
          updatedIsPinned ? 'Apresentação fixada no topo da comunidade!' : 'Apresentação desafixada do topo.',
          'success'
        );
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao alterar status de fixação.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao fixar apresentação.', 'error');
    }
  };

  const handleToggleExample = async (postId) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/introductions/${postId}/example`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const updatedIsExample = Boolean(data.is_example);
        const updatedIsPinned = Boolean(data.is_pinned);

        setPosts((prev) => {
          const updated = prev.map((p) =>
            p.id === postId ? { ...p, is_example: updatedIsExample, is_pinned: updatedIsPinned } : p
          );
          return [...updated].sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return new Date(b.created_at) - new Date(a.created_at);
          });
        });

        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost((prev) =>
            prev ? { ...prev, is_example: updatedIsExample, is_pinned: updatedIsPinned } : null
          );
        }

        addToast(
          updatedIsExample
            ? 'Apresentação fixada como Exemplo Oficial!'
            : 'Destaque de apresentação de exemplo removido.',
          'success'
        );
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao alterar status de exemplo.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao marcar apresentação como exemplo.', 'error');
    }
  };

  const handleToggleLike = async (postId, reactionType = 'like') => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/introductions/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction_type: reactionType }),
      });

      if (res.ok) {
        const data = await res.json();
        const updateState = (item) => {
          if (item.id === postId) {
            let nextSummary = Array.isArray(item.reactions_summary) ? [...item.reactions_summary] : [];
            if (data.liked && data.reaction_type) {
              if (!nextSummary.includes(data.reaction_type)) {
                nextSummary.push(data.reaction_type);
              }
            } else if (!data.liked && nextSummary.length > 0) {
              // Se removeu o like
              if (item.likes_count <= 1) {
                nextSummary = [];
              }
            }
            return {
              ...item,
              is_liked_by_me: data.liked,
              my_reaction: data.liked ? data.reaction_type : null,
              likes_count: data.likes_count,
              reactions_summary: nextSummary,
            };
          }
          return item;
        };

        setPosts((prev) => prev.map(updateState));
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost((prev) => (prev ? updateState(prev) : null));
        }
      }
    } catch {
      addToast('Não foi possível processar a curtida.', 'error');
    }
  };

  const handleAddComment = async (postId, text) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/introductions/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        const newComment = await res.json();
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost((prev) => ({
            ...prev,
            comments: [...(prev.comments || []), newComment],
            comments_count: (prev.comments_count || 0) + 1,
          }));
        }

        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                comments_count: (p.comments_count || 0) + 1,
                last_comment_user_name: newComment.user_name,
                last_comment_at: newComment.created_at,
              };
            }
            return p;
          })
        );
        addToast('Comentário publicado com sucesso!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao publicar comentário.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao enviar comentário.', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/introductions/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        if (selectedPost) {
          setSelectedPost((prev) => ({
            ...prev,
            comments: (prev.comments || []).filter((c) => c.id !== commentId),
            comments_count: Math.max(0, (prev.comments_count || 1) - 1),
          }));
        }

        setPosts((prev) =>
          prev.map((p) => {
            if (selectedPost && p.id === selectedPost.id) {
              return {
                ...p,
                comments_count: Math.max(0, (p.comments_count || 1) - 1),
              };
            }
            return p;
          })
        );
        addToast('Comentário removido.', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao remover comentário.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao excluir comentário.', 'error');
    }
  };

  const handleOpenDm = (authorId, authorName, authorData = {}) => {
    if (!authorId) return;
    // Fecha o modal de apresentação aberto para liberar a visão da conversa na DM
    setSelectedPost(null);

    window.dispatchEvent(
      new CustomEvent('open_direct_message', {
        detail: {
          contact: {
            id: authorId,
            name: authorName,
            email: authorData?.email,
            role: authorData?.role,
            avatar: authorData?.avatar,
          },
        },
      })
    );
    addToast(`Iniciando conversa direta com ${authorName}...`, 'info');
  };

  return (
    <div
      className="introductions-container"
      data-testid="introductions-container"
      style={{ backgroundColor: bgColor }}
    >
      <div className="introductions-content-wrapper">
        {/* Banner Superior com Ilustração e Apresentação da Aba */}
        <IntroductionBanner onOpenCreateModal={() => setIsCreateModalOpen(true)} />

        {/* Lista Sequencial de Posts de Apresentação */}
        <IntroductionPostList
          posts={posts}
          loading={loading}
          currentUser={user}
          onSelectPost={handleSelectPost}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onToggleLike={handleToggleLike}
          onOpenDm={handleOpenDm}
        />
      </div>

      {/* Modal de Detalhes da Apresentação com Comentários e Curtidas */}
      {selectedPost && (
        <IntroductionPostModal
          post={selectedPost}
          currentUser={user}
          onClose={() => setSelectedPost(null)}
          onToggleLike={handleToggleLike}
          onTogglePin={handleTogglePin}
          onToggleExample={handleToggleExample}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onDeletePost={handleDeletePost}
          onEditPost={(post) => setEditingPost(post)}
          onOpenDm={handleOpenDm}
        />
      )}

      {/* Modal para Criar ou Editar Apresentação */}
      <IntroductionCreateModal
        isOpen={isCreateModalOpen || Boolean(editingPost)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPost(null);
        }}
        onCreate={handleCreatePost}
        onUpdate={handleUpdatePost}
        initialData={editingPost}
      />
    </div>
  );
}
