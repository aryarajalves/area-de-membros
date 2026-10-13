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
    // Abre com os dados básicos e faz fetch dos detalhes com comentários
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
      // Usa dados existentes se houver falha de rede
    }
  };

  const handleCreatePost = async ({ title, content }) => {
    const token = getAuthToken();
    try {
      const res = await fetch('/api/v1/introductions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
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

  const handleToggleLike = async (postId) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/introductions/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const updateState = (item) => {
          if (item.id === postId) {
            return {
              ...item,
              is_liked_by_me: data.liked,
              likes_count: data.likes_count,
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
          onSelectPost={handleSelectPost}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onToggleLike={handleToggleLike}
        />
      </div>

      {/* Modal de Detalhes da Apresentação com Comentários e Curtidas */}
      {selectedPost && (
        <IntroductionPostModal
          post={selectedPost}
          currentUser={user}
          onClose={() => setSelectedPost(null)}
          onToggleLike={handleToggleLike}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onDeletePost={handleDeletePost}
        />
      )}

      {/* Modal para Criar Nova Apresentação */}
      <IntroductionCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePost}
      />
    </div>
  );
}
