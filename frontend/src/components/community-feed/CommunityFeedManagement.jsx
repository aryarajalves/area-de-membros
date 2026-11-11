import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Flame,
  Search,
  BookOpen,
  UserCheck,
  TrendingUp,
  RefreshCw,
  Loader2,
  Compass,
  Bookmark,
  Bell,
  Users,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { fetchFeed, deleteFeedPost, fetchFeedCourses, fetchFeedUnreadCount } from './communityFeedApi';
import FeedCreatePostCard from './FeedCreatePostCard';
import FeedPostCard from './FeedPostCard';
import FeedNotificationsModal from './FeedNotificationsModal';
import FeedProfileModal from './FeedProfileModal';
import CommunityStoriesBar from './CommunityStoriesBar';
import './community-feed.css';
import './community-feed-post.css';
import './community-feed-media.css';
import './community-feed-notif.css';

export default function CommunityFeedManagement({ user }) {
  const { addToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [courses, setCourses] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [viewingProfileUserId, setViewingProfileUserId] = useState(null);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Carrega cursos disponíveis e notificações não lidas
  useEffect(() => {
    let isMounted = true;
    fetchFeedCourses()
      .then((data) => {
        if (isMounted) setCourses(data || []);
      })
      .catch(() => {});

    fetchFeedUnreadCount()
      .then((data) => {
        if (isMounted && data?.unread_count !== undefined) {
          setUnreadNotifsCount(data.unread_count);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const loadFeed = useCallback(
    async (pageToLoad = 1, append = false) => {
      if (pageToLoad === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const res = await fetchFeed({
          filter: activeFilter,
          search: debouncedSearch,
          page: pageToLoad,
          limit: 15,
        });

        if (append) {
          setPosts((prev) => [...prev, ...(res.posts || [])]);
        } else {
          setPosts(res.posts || []);
        }

        setTotalPosts(res.total || 0);
        setCurrentPage(res.page || 1);
        setTotalPages(res.pages || 1);
      } catch (err) {
        addToast(err.message || 'Erro ao carregar o feed da comunidade.', 'error');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeFilter, debouncedSearch]
  );

  useEffect(() => {
    loadFeed(1, false);

    const handleFocus = () => {
      loadFeed(1, false);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadFeed]);

  // Sincronização em segundo plano a cada 25s para novos posts de outros alunos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!debouncedSearch && currentPage === 1) {
        fetchFeed({ filter: activeFilter, page: 1, limit: 15 })
          .then((res) => {
            if (res.posts) {
              setPosts(res.posts);
              setTotalPosts(res.total || 0);
            }
          })
          .catch(() => {});
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [activeFilter, debouncedSearch, currentPage]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setTotalPosts((prev) => prev + 1);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const handlePostDeleted = async (postId) => {
    await deleteFeedPost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setTotalPosts((prev) => Math.max(0, prev - 1));
  };

  const filterTabs = [
    { id: 'all', label: 'Para Você / Geral', icon: Compass },
    { id: 'following', label: 'Seguindo', icon: Users },
    { id: 'popular', label: 'Mais Curtidos', icon: Flame },
    { id: 'my_course', label: 'Meu Curso', icon: BookOpen },
    { id: 'my_posts', label: 'Minhas Publicações', icon: UserCheck },
    { id: 'saved', label: 'Salvos', icon: Bookmark },
  ];

  return (
    <div className="community-feed-page" data-testid="community-feed-management">
      {/* Cabeçalho da Comunidade */}
      <div className="feed-header">
        <div className="feed-header-titles">
          <div className="feed-header-badge">
            <Sparkles size={14} className="feed-badge-icon" />
            <span>Rede Social & Networking</span>
          </div>
          <h1 className="feed-page-title" data-testid="feed-page-title">
            Feed da Comunidade
          </h1>
          <p className="feed-page-description">
            Compartilhe aprendizados, comemore conquistas diárias e troque experiências com outros alunos.
          </p>
        </div>

        <div className="feed-header-actions">
          <button
            type="button"
            className="feed-notif-btn"
            onClick={() => setIsNotifsOpen(true)}
            title="Notificações do feed"
            data-testid="feed-notifs-btn"
          >
            <Bell size={18} />
            {unreadNotifsCount > 0 && (
              <span className="feed-notif-badge" data-testid="feed-notifs-badge">
                {unreadNotifsCount > 99 ? '99+' : unreadNotifsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="feed-refresh-btn"
            onClick={() => loadFeed(1, false)}
            disabled={isLoading}
            title="Atualizar feed"
            data-testid="feed-refresh-btn"
          >
            <RefreshCw size={16} className={isLoading ? 'feed-spin-icon' : ''} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Modal de Notificações do Feed */}
      <FeedNotificationsModal
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        onUnreadCountChange={setUnreadNotifsCount}
      />

      {/* Barra de Stories da Comunidade */}
      <CommunityStoriesBar currentUser={user} />

      {/* Caixa de Criação de Post */}
      <FeedCreatePostCard
        user={user}
        courses={courses}
        onPostCreated={handlePostCreated}
        onOpenProfile={setViewingProfileUserId}
      />

      {/* Filtros e Barra de Busca */}
      <div className="feed-nav-bar">
        <div className="feed-filter-tabs">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`feed-filter-tab ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter(tab.id);
                  setCurrentPage(1);
                }}
                data-testid={`feed-filter-tab-${tab.id}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="feed-search-box">
          <Search size={15} className="feed-search-icon" />
          <input
            type="text"
            className="feed-search-input"
            placeholder="Buscar por palavras-chave ou temas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="feed-search-input"
          />
        </div>
      </div>

      {/* Conteúdo do Feed */}
      <div className="feed-stream-container" data-testid="feed-stream-container">
        {isLoading ? (
          <div className="feed-loading-state" data-testid="feed-loading-state">
            <Loader2 size={32} className="feed-spinner" />
            <p>Carregando as publicações da comunidade...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty-state" data-testid="feed-empty-state">
            <div className="feed-empty-icon-wrapper">
              <Compass size={36} />
            </div>
            <h3>Nenhuma publicação encontrada</h3>
            <p>
              {searchTerm
                ? 'Nenhum resultado corresponde à sua pesquisa. Tente outros termos.'
                : 'Ainda não há postagens nesta seção. Seja o primeiro a compartilhar uma conquista!'}
            </p>
          </div>
        ) : (
          <>
            <div className="feed-posts-list" data-testid="feed-posts-list">
              {posts.map((post) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  onOpenProfile={setViewingProfileUserId}
                />
              ))}
            </div>

            {/* Paginação / Carregar Mais */}
            {currentPage < totalPages && (
              <div className="feed-load-more-wrapper">
                <button
                  type="button"
                  className="feed-load-more-btn"
                  onClick={() => loadFeed(currentPage + 1, true)}
                  disabled={isLoadingMore}
                  data-testid="feed-load-more-btn"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 size={16} className="feed-spinner" />
                      Carregando mais...
                    </>
                  ) : (
                    'Carregar mais publicações'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Perfil de Membro */}
      <FeedProfileModal
        isOpen={Boolean(viewingProfileUserId)}
        userId={viewingProfileUserId}
        onClose={() => setViewingProfileUserId(null)}
        onProfileUpdated={(updated) => {
          if (updated && updated.id === user?.id) {
            setPosts((prev) =>
              prev.map((p) =>
                p.user_id === user.id
                  ? { ...p, user_name: updated.name, user_avatar: updated.avatar_url }
                  : p
              )
            );
          }
        }}
      />
    </div>
  );
}
