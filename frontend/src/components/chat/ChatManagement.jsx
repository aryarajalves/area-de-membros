import React from 'react';
import { useChat } from './useChat';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatMessagesList from './ChatMessagesList';
import ChatInputBar from './ChatInputBar';
import DeleteChatMessageModal from './DeleteChatMessageModal';

export default function ChatManagement({ currentUser, bgColor }) {
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

  return (
    <div
      className="chat-management-view"
      data-testid="chat-management-view"
      style={{
        display: 'flex',
        height: 'calc(100vh - 40px)',
        maxHeight: '1000px',
        backgroundColor: '#070b13',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Barra Lateral com os Canais (Comunidade Geral + Cursos) */}
      <ChatSidebar
        channels={channels}
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
        loading={loadingChannels}
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
          onUnpinMessage={togglePin}
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
    </div>
  );
}
