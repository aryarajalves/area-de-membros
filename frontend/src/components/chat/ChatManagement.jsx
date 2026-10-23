import React, { useState, useEffect } from 'react';
import { useChat } from './useChat';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatMessagesList from './ChatMessagesList';
import ChatInputBar from './ChatInputBar';
import DeleteChatMessageModal from './DeleteChatMessageModal';
import ChatMediaGalleryModal from './ChatMediaGalleryModal';
import ChatThreadPanel from './ChatThreadPanel';
import ChatMentionsModal from './ChatMentionsModal';
import ChatDmModal from './ChatDmModal';
import ChatMembersSidebar from './ChatMembersSidebar';
import ChatMemberProfileModal from './ChatMemberProfileModal';

export default function ChatManagement({ currentUser, bgColor, onBack }) {
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);
  const [isMentionsModalOpen, setIsMentionsModalOpen] = useState(false);
  const [isDmModalOpen, setIsDmModalOpen] = useState(false);
  const [isMembersSidebarOpen, setIsMembersSidebarOpen] = useState(true);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState(null);
  const [targetDmContact, setTargetDmContact] = useState(null);
  const [activeThreadMessage, setActiveThreadMessage] = useState(null);
  const [mobileTab, setMobileTab] = useState('channels');

  const {
    channels,
    selectedChannel,
    setSelectedChannel,
    messages,
    loadingChannels,
    loadingMessages,
    sending,
    sendMessage,
    favoritesOnly,
    setFavoritesOnly,
    pinnedMessage,
    toggleLike,
    toggleFavorite,
    togglePin,
    deleteModalState,
    promptDeleteMessage,
    closeDeleteModal,
    confirmDeleteMessage,
  } = useChat(currentUser);

  const handleJumpToMessage = (messageId) => {
    if (!messageId) return;
    const el = document.getElementById(`chat-message-${messageId}`);
    if (el) {
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId((curr) => (curr === messageId ? null : curr));
      }, 3000);
    }
  };

  useEffect(() => {
    const handleJumpEvent = (e) => {
      const { messageId, channelType, courseId } = e.detail || {};
      if (channelType === 'course' && courseId && channels.length > 0) {
        const found = channels.find((c) => c.course_id === Number(courseId));
        if (found) setSelectedChannel(found);
      } else if (channelType === 'general' && channels.length > 0) {
        const gen = channels.find((c) => c.type === 'general');
        if (gen) setSelectedChannel(gen);
      }
      setTimeout(() => {
        handleJumpToMessage(messageId);
      }, 350);
    };
    window.addEventListener('jump_to_chat_message', handleJumpEvent);
    return () => window.removeEventListener('jump_to_chat_message', handleJumpEvent);
  }, [channels, setSelectedChannel]);

  return (
    <div
      className={`chat-management-view mobile-chat-view-${mobileTab}`}
      data-testid="chat-management-view"
      style={{
        display: 'flex',
        height: 'calc(100vh - 64px)',
        minHeight: 'calc(100vh - 64px)',
        maxHeight: 'calc(100vh - 64px)',
        width: '100%',
        backgroundColor: '#070b13',
        borderRadius: 0,
        overflow: 'hidden',
        border: 'none',
        boxShadow: 'none',
        margin: 0,
      }}
    >
      {/* Barra Lateral com os Canais (Comunidade Geral + Cursos) */}
      <ChatSidebar
        channels={channels}
        selectedChannel={selectedChannel}
        onSelectChannel={(ch) => {
          setSelectedChannel(ch);
          setMobileTab('chat');
        }}
        loading={loadingChannels}
        onBack={onBack}
      />

      {/* Painel Central da Conversa */}
      <section
        className="chat-conversation-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0f1d',
          minWidth: 0,
          height: '100%',
        }}
      >
        <ChatHeader
          selectedChannel={selectedChannel}
          currentUser={currentUser}
          pinnedMessage={pinnedMessage}
          favoritesOnly={favoritesOnly}
          onToggleFavoritesOnly={() => setFavoritesOnly((prev) => !prev)}
          onOpenMediaGallery={() => setIsMediaGalleryOpen(true)}
          onOpenMentions={() => setIsMentionsModalOpen(true)}
          onOpenDm={() => setIsDmModalOpen(true)}
          onToggleMembers={() => setIsMembersSidebarOpen((prev) => !prev)}
          isMembersOpen={isMembersSidebarOpen}
          onUnpinMessage={togglePin}
          onBack={onBack}
          onJumpToMessage={handleJumpToMessage}
          onBackToChannels={() => setMobileTab('channels')}
        />

        <ChatMessagesList
          messages={messages}
          loading={loadingMessages}
          currentUser={currentUser}
          selectedChannel={selectedChannel}
          onDeleteMessage={promptDeleteMessage}
          onToggleLike={toggleLike}
          onToggleFavorite={toggleFavorite}
          onTogglePin={togglePin}
          onOpenThread={(msg) => setActiveThreadMessage(msg)}
          highlightedMessageId={highlightedMessageId}
        />

        <ChatInputBar
          onSendMessage={sendMessage}
          sending={sending}
          channelName={selectedChannel?.name}
        />
      </section>

      {/* Barra Lateral Direita com os Membros com Acesso ao Chat */}
      {isMembersSidebarOpen && (
        <ChatMembersSidebar
          isOpen={isMembersSidebarOpen}
          onClose={() => setIsMembersSidebarOpen(false)}
          channel={selectedChannel}
          currentUser={currentUser}
          onSelectMember={(m) => setSelectedMemberProfile(m)}
          onStartDm={(m) => {
            setTargetDmContact(m);
            setIsDmModalOpen(true);
          }}
        />
      )}

      {/* Painel Lateral de Threads de Discussão */}
      {activeThreadMessage && (
        <ChatThreadPanel
          parentMessage={activeThreadMessage}
          currentUser={currentUser}
          onClose={() => setActiveThreadMessage(null)}
          onDeleteMessage={promptDeleteMessage}
          onToggleLike={toggleLike}
          onToggleFavorite={toggleFavorite}
          onTogglePin={togglePin}
        />
      )}

      {/* Modal de Perfil Detalhado do Membro */}
      <ChatMemberProfileModal
        isOpen={!!selectedMemberProfile}
        member={selectedMemberProfile}
        currentUser={currentUser}
        onClose={() => setSelectedMemberProfile(null)}
        onStartDm={(m) => {
          setTargetDmContact(m);
          setIsDmModalOpen(true);
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      <DeleteChatMessageModal
        isOpen={deleteModalState.isOpen}
        loading={deleteModalState.loading}
        onConfirm={confirmDeleteMessage}
        onClose={closeDeleteModal}
      />

      {/* Modal de Galeria de Mídias e Arquivos */}
      <ChatMediaGalleryModal
        isOpen={isMediaGalleryOpen}
        onClose={() => setIsMediaGalleryOpen(false)}
        channel={selectedChannel}
        onJumpToMessage={handleJumpToMessage}
      />

      {/* Modal de Minhas Menções */}
      <ChatMentionsModal
        isOpen={isMentionsModalOpen}
        onClose={() => setIsMentionsModalOpen(false)}
        onJumpToMessage={handleJumpToMessage}
      />

      {/* Modal de Mensagens Diretas (DMs / Inbox) */}
      <ChatDmModal
        isOpen={isDmModalOpen}
        onClose={() => {
          setIsDmModalOpen(false);
          setTargetDmContact(null);
        }}
        currentUser={currentUser}
        targetContact={targetDmContact}
      />
    </div>
  );
}
