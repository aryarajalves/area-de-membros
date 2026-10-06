import React, { useState } from 'react';
import { useChat } from './useChat';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatMessagesList from './ChatMessagesList';
import ChatInputBar from './ChatInputBar';
import DeleteChatMessageModal from './DeleteChatMessageModal';
import ChatMediaGalleryModal from './ChatMediaGalleryModal';

export default function ChatManagement({ currentUser, bgColor, onBack }) {
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);

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

  return (
    <div
      className="chat-management-view"
      data-testid="chat-management-view"
      style={{
        display: 'flex',
        height: '100vh',
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
        onSelectChannel={setSelectedChannel}
        loading={loadingChannels}
        onBack={onBack}
      />

      {/* Painel Central da Conversa */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0f1d',
          minWidth: 0,
        }}
      >
        <ChatHeader
          selectedChannel={selectedChannel}
          currentUser={currentUser}
          pinnedMessage={pinnedMessage}
          favoritesOnly={favoritesOnly}
          onToggleFavoritesOnly={() => setFavoritesOnly((prev) => !prev)}
          onOpenMediaGallery={() => setIsMediaGalleryOpen(true)}
          onUnpinMessage={togglePin}
          onBack={onBack}
          onJumpToMessage={handleJumpToMessage}
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
          highlightedMessageId={highlightedMessageId}
        />

        <ChatInputBar
          onSendMessage={sendMessage}
          sending={sending}
          channelName={selectedChannel?.name}
        />
      </section>

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
    </div>
  );
}
