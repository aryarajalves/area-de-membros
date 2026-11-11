import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { fetchStoriesTray } from './communityStoriesApi';
import StoryCreateModal from './StoryCreateModal';
import StoryViewerModal from './StoryViewerModal';
import './community-feed-stories.css';

export default function CommunityStoriesBar({ currentUser }) {
  const [tray, setTray] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const loadTray = async () => {
    try {
      const data = await fetchStoriesTray();
      setTray(data || []);
    } catch {
      setTray([]);
    }
  };

  useEffect(() => {
    loadTray();
  }, []);

  const myGroup = tray.find((g) => g.is_me);
  const otherGroups = tray.filter((g) => !g.is_me);

  const handleOpenMyStory = (e) => {
    e.stopPropagation();
    if (myGroup && myGroup.stories_count > 0) {
      setSelectedUserId(currentUser?.id);
    } else {
      setIsCreateOpen(true);
    }
  };

  const handlePlusClick = (e) => {
    e.stopPropagation();
    setIsCreateOpen(true);
  };

  const handleUserClick = (userId) => {
    setSelectedUserId(userId);
  };

  const handleStoryCreated = () => {
    loadTray();
  };

  const handleStoryDeleted = () => {
    loadTray();
  };

  const myAvatar = currentUser?.avatar_url;
  const myInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : '+';

  return (
    <>
      <div className="stories-bar-container" data-testid="community-stories-bar">
        <div className="stories-bar-scroll">
          {/* Item 0: Seu Story */}
          <button
            type="button"
            className="story-circle-item"
            onClick={handleOpenMyStory}
            data-testid="story-circle-me"
            title={myGroup?.stories_count > 0 ? 'Ver seu story' : 'Adicionar story'}
          >
            <div
              className={`story-avatar-wrapper ${
                myGroup?.stories_count > 0
                  ? myGroup.has_unviewed
                    ? 'unviewed'
                    : 'viewed'
                  : 'my-empty'
              }`}
            >
              <div className="story-avatar-inner">
                {myAvatar ? (
                  <img src={myAvatar} alt="Seu story" />
                ) : (
                  <span className="story-avatar-initial">{myInitial}</span>
                )}
              </div>
              <div
                className="story-plus-badge"
                onClick={handlePlusClick}
                data-testid="story-plus-btn"
                title="Postar novo story"
              >
                <Plus size={14} strokeWidth={3} />
              </div>
            </div>
            <span className="story-author-name">Seu Story</span>
          </button>

          {/* Outros membros */}
          {otherGroups.map((group) => {
            const initial = group.name ? group.name.charAt(0).toUpperCase() : '?';
            return (
              <button
                key={group.user_id}
                type="button"
                className="story-circle-item"
                onClick={() => handleUserClick(group.user_id)}
                data-testid={`story-circle-${group.user_id}`}
                title={`Ver stories de ${group.name}`}
              >
                <div className={`story-avatar-wrapper ${group.has_unviewed ? 'unviewed' : 'viewed'}`}>
                  <div className="story-avatar-inner">
                    {group.avatar_url ? (
                      <img src={group.avatar_url} alt={group.name} />
                    ) : (
                      <span className="story-avatar-initial">{initial}</span>
                    )}
                  </div>
                </div>
                <span className="story-author-name">{group.name?.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal de Criação de Story */}
      <StoryCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onStoryCreated={handleStoryCreated}
      />

      {/* Visualizador Fullscreen */}
      <StoryViewerModal
        isOpen={Boolean(selectedUserId)}
        targetUserId={selectedUserId}
        currentUser={currentUser}
        onClose={() => {
          setSelectedUserId(null);
          loadTray();
        }}
        onStoryDeleted={handleStoryDeleted}
      />
    </>
  );
}
