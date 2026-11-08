import React, { useState, useEffect } from 'react';
import { Lock, Calendar } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { formatReleaseDateTimePtBr } from '../course-management/CourseReleaseScheduleCard';
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
  const { addToast } = useToast();

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
          onOpenDm={() => {
            if (selectedChannel?.dm_locked || channels[0]?.dm_locked) {
              addToast(selectedChannel?.dm_locked_reason || channels[0]?.dm_locked_reason || 'O envio de Mensagens Diretas (DMs) está temporariamente fechado.', 'info');
              return;
            }
            setIsDmModalOpen(true);
          }}
          onToggleMembers={() => setIsMembersSidebarOpen((prev) => !prev)}
          isMembersOpen={isMembersSidebarOpen}
          onUnpinMessage={togglePin}
          onBack={onBack}
          onJumpToMessage={handleJumpToMessage}
          onBackToChannels={() => setMobileTab('channels')}
        />

        {selectedChannel?.is_locked ? (
          <div
            data-testid="chat-channel-locked-view"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                maxWidth: '460px',
                padding: '32px 28px',
                borderRadius: '18px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid rgba(245, 158, 11, 0.4)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 158, 11, 0.16)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                }}
              >
                <Lock size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                Canal Temporariamente Fechado
              </h3>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
                {selectedChannel.locked_reason || 'Este canal está temporariamente fechado pelo instrutor e será liberado em breve.'}
              </p>
              {selectedChannel.locked_until && (
                <div
                  data-testid="chat-channel-locked-until-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(245, 158, 11, 0.14)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fbbf24',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginTop: '4px',
                  }}
                >
                  <Calendar size={14} />
                  <span>Liberação em {formatReleaseDateTimePtBr(selectedChannel.locked_until)}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
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
            if (selectedChannel?.dm_locked || channels[0]?.dm_locked) {
              addToast(selectedChannel?.dm_locked_reason || channels[0]?.dm_locked_reason || 'O envio de Mensagens Diretas (DMs) está temporariamente fechado.', 'info');
              return;
            }
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
