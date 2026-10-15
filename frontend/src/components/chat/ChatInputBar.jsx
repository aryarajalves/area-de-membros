import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ChatAttachedMediaPreview from './ChatAttachedMediaPreview';
import ChatAttachedLinkPreview from './ChatAttachedLinkPreview';
import ChatEmojiPickerPopup from './ChatEmojiPickerPopup';
import ChatMentionContactsList from './ChatMentionContactsList';
import ChatGifPickerPopup from './ChatGifPickerPopup';
import ChatImageCaptionModal from './ChatImageCaptionModal';
import ChatVideoRecorderModal from './ChatVideoRecorderModal';
import ChatInternalLinkModal from './ChatInternalLinkModal';
import ChatInputActionsToolbar from './ChatInputActionsToolbar';
import { useChatInputMedia } from './useChatInputMedia';
import {
  getStoredAuthUser,
  validateMentionsForSend,
  countMentionsInText,
} from './chatMentionUtils';

export default function ChatInputBar({
  onSendMessage,
  sending = false,
  channelName = '',
  parentMessage = null,
  placeholder = '',
}) {
  const { addToast } = useToast();
  const [text, setText] = useState('');
  const [attachedLink, setAttachedLink] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Popups e Modais
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showInternalLinkModal, setShowInternalLinkModal] = useState(false);

  const [mentionFilter, setMentionFilter] = useState('');
  const [contacts, setContacts] = useState([]);

  const textareaRef = useRef(null);

  const {
    attachedMedia,
    setAttachedMedia,
    uploading,
    setUploading,
    isDraggingOver,
    pendingImageForCaption,
    setPendingImageForCaption,
    fileInputRef,
    imageOnlyInputRef,
    uploadFileToServer,
    handleFileChange,
    handleImageOnlyChange,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleConfirmSendImageWithCaption,
    handleSendRecordedVideo,
  } = useChatInputMedia({ onSendMessage });

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  // Buscar contatos para autocomplete de @
  useEffect(() => {
    const fetchContacts = async () => {
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetch('/api/v1/chat/mention-contacts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (err) {
        console.error('Erro ao buscar contatos:', err);
      }
    };
    fetchContacts();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendRecordedAudio = async (audioBlob) => {
    setUploading(true);
    try {
      const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
        type: audioBlob.type || 'audio/webm',
      });
      const data = await uploadFileToServer(audioFile);
      if (data) {
        const trimmed = text.trim();
        const success = await onSendMessage(trimmed, data.media_url, 'audio');
        if (success) {
          setText('');
          setAttachedMedia(null);
          setIsRecording(false);
          addToast('Áudio enviado com sucesso!', 'success');
        }
      }
    } catch (err) {
      console.error('Erro ao enviar áudio:', err);
      addToast('Erro ao enviar áudio.', 'error');
    } finally {
      setUploading(false);
      setIsRecording(false);
    }
  };

  const handleSelectGif = (gif) => {
    setAttachedMedia({
      url: gif.url,
      type: 'image',
      name: `${gif.title}.gif`,
    });
    setShowGifPicker(false);
    addToast('GIF selecionado!', 'info');
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleSelectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleSelectContact = (contact) => {
    const user = getStoredAuthUser();
    const isPrivileged = user?.role === 'admin' || user?.role === 'superadmin';
    if (contact.isAll && !isPrivileged) {
      addToast('Apenas administradores podem utilizar a menção @todos.', 'error');
      setShowMentionPopup(false);
      return;
    }
    if (!isPrivileged && countMentionsInText(text) >= 5) {
      addToast('Usuários comuns podem mencionar no máximo 5 contatos por mensagem.', 'warning');
      setShowMentionPopup(false);
      return;
    }

    const atIndex = text.lastIndexOf('@');
    const tag = `@${contact.name} `;
    setText((prev) => (atIndex !== -1 ? `${prev.slice(0, atIndex)}${tag}` : `${prev}${tag}`));
    setShowMentionPopup(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleTriggerMention = () => {
    setShowMentionPopup((prev) => !prev);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    if (!text.includes('@')) {
      setText((prev) => (prev ? `${prev} @` : '@'));
    }
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleSelectInternalLink = (item) => {
    if (!item) return;
    setAttachedLink(item);
    setShowInternalLinkModal(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    const messageToSend = attachedLink
      ? (trimmed ? `${trimmed} [${attachedLink.label}](${attachedLink.url})` : `[${attachedLink.label}](${attachedLink.url})`)
      : trimmed;

    if ((!messageToSend && !attachedMedia) || sending || uploading) return;

    const val = validateMentionsForSend(messageToSend, getStoredAuthUser());
    if (!val.valid) {
      addToast(val.error, 'error');
      return;
    }

    const mediaUrl = attachedMedia?.url || null;
    const mediaType = attachedMedia?.type || null;

    const success = await onSendMessage(messageToSend, mediaUrl, mediaType);
    if (success) {
      setText('');
      setAttachedMedia(null);
      setAttachedLink(null);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      setShowMentionPopup(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = isMaximized ? '140px' : 'auto';
        textareaRef.current.focus();
      }
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);

    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && lastAt >= val.length - 15) {
      const afterAt = val.slice(lastAt + 1);
      if (!afterAt.includes(' ')) {
        setMentionFilter(afterAt);
        setShowMentionPopup(true);
      } else {
        setShowMentionPopup(false);
      }
    } else {
      setShowMentionPopup(false);
    }

    if (textareaRef.current && !isMaximized) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const isButtonDisabled = (!text.trim() && !attachedMedia && !attachedLink) || sending || uploading;
  const isCompact = Boolean(parentMessage);

  return (
    <footer
      className="chat-input-bar"
      data-testid="chat-input-bar"
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        padding: isCompact ? '12px 14px' : '16px 24px',
        backgroundColor: '#0f172a',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Overlay Visual em Tela Cheia ao Arrastar Arquivo */}
      {isDraggingOver && (
        <div
          data-testid="chat-drag-overlay"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(7, 11, 19, 0.88)',
            backdropFilter: 'blur(8px)', border: '3px dashed #38bdf8', zIndex: 99999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#38bdf8', gap: '16px', animation: 'fadeIn 0.15s ease', pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '88px', height: '88px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(56, 189, 248, 0.3)', pointerEvents: 'none',
            }}
          >
            <UploadCloud size={48} color="#38bdf8" />
          </div>
          <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', pointerEvents: 'none' }}>
              Solte sua mídia aqui para enviar
            </h3>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: '#94a3b8', pointerEvents: 'none' }}>
              Imagens abrirão o assistente com pré-visualização e legenda
            </p>
          </div>
        </div>
      )}

      {/* Inputs Ocultos de Arquivo */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*,audio/*,.pdf,.docx,.xlsx,.txt,.zip"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        data-testid="chat-file-input"
      />
      <input
        type="file"
        ref={imageOnlyInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageOnlyChange}
        data-testid="chat-image-input"
      />

      {/* Previews de Mídia e Link Anexados */}
      <ChatAttachedMediaPreview attachedMedia={attachedMedia} onRemove={() => setAttachedMedia(null)} />
      <ChatAttachedLinkPreview attachedLink={attachedLink} onRemove={() => setAttachedLink(null)} />

      {/* Popups e Modais */}
      {showEmojiPicker && <ChatEmojiPickerPopup onSelectEmoji={handleSelectEmoji} onClose={() => setShowEmojiPicker(false)} />}
      {showGifPicker && <ChatGifPickerPopup onSelectGif={handleSelectGif} onClose={() => setShowGifPicker(false)} />}
      {showMentionPopup && (
        <ChatMentionContactsList
          contacts={contacts}
          filterText={mentionFilter}
          onSelectContact={handleSelectContact}
          onClose={() => setShowMentionPopup(false)}
          currentUser={getStoredAuthUser()}
          currentMentionCount={countMentionsInText(text)}
        />
      )}
      {pendingImageForCaption && (
        <ChatImageCaptionModal
          imageFile={pendingImageForCaption}
          initialCaption={text}
          onConfirmSend={handleConfirmSendImageWithCaption}
          onCancel={() => setPendingImageForCaption(null)}
          isSending={uploading}
        />
      )}
      {showVideoRecorder && <ChatVideoRecorderModal onSendRecordedVideo={handleSendRecordedVideo} onClose={() => setShowVideoRecorder(false)} />}
      {showInternalLinkModal && <ChatInternalLinkModal isOpen={showInternalLinkModal} onClose={() => setShowInternalLinkModal(false)} onSelectLink={handleSelectInternalLink} />}

      {/* Container Principal de Digitação */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: isMaximized ? 'column' : 'row',
          alignItems: isMaximized ? 'stretch' : 'flex-end',
          gap: isCompact ? '6px' : '10px',
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: isCompact ? '6px 8px' : '10px 14px',
          border: isMaximized ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isMaximized ? '0 8px 32px rgba(56, 189, 248, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.2s ease',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Barra de Ferramentas / Ações Rápidas */}
        <ChatInputActionsToolbar
          fileInputRef={fileInputRef}
          imageOnlyInputRef={imageOnlyInputRef}
          uploading={uploading}
          sending={sending}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          onSendRecordedAudio={handleSendRecordedAudio}
          showGifPicker={showGifPicker}
          setShowGifPicker={setShowGifPicker}
          showEmojiPicker={showEmojiPicker}
          setShowEmojiPicker={setShowEmojiPicker}
          showMentionPopup={showMentionPopup}
          setShowMentionPopup={setShowMentionPopup}
          setShowVideoRecorder={setShowVideoRecorder}
          onOpenInternalLinkModal={() => setShowInternalLinkModal(true)}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
          isCompact={isCompact}
          onTriggerMention={handleTriggerMention}
        />

        {/* Textarea e Botão de Enviar */}
        <div
          style={{
            display: 'flex',
            alignItems: isMaximized ? 'stretch' : 'flex-end',
            gap: '8px',
            flex: 1,
            width: '100%',
          }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder || `Enviar mensagem em #${channelName || 'conversa'}... (ou cole imagens com Ctrl+V)`}
            rows={isMaximized ? 6 : 1}
            maxLength={3000}
            data-testid="chat-message-textarea"
            style={{
              flex: 1,
              minWidth: '100px',
              backgroundColor: isMaximized ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
              borderRadius: isMaximized ? '8px' : '0',
              padding: isMaximized ? '10px' : '0',
              border: isMaximized ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              resize: 'none',
              minHeight: isMaximized ? '140px' : 'auto',
              maxHeight: isMaximized ? '280px' : '120px',
              fontFamily: 'inherit',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: isMaximized ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: isMaximized ? 'flex-end' : 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            {text.length > 2500 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: text.length > 2900 ? '#ef4444' : '#f59e0b',
                  fontWeight: 500,
                }}
              >
                {text.length}/3000
              </span>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={isButtonDisabled}
              data-testid="chat-send-button"
              title="Enviar mensagem (Enter)"
              style={{
                width: isMaximized ? '42px' : '38px',
                height: isMaximized ? '42px' : '38px',
                borderRadius: '8px',
                backgroundColor: isButtonDisabled ? 'rgba(59, 130, 246, 0.3)' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease',
                boxShadow: isButtonDisabled ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.4)',
              }}
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div
        className="chat-input-keyboard-hint"
        style={{
          marginTop: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 4px',
        }}
      >
        <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
          Pressione <kbd style={{ padding: '1px 4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>Enter</kbd> para enviar ou <kbd style={{ padding: '1px 4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>Shift + Enter</kbd> para nova linha • Cole imagens com <kbd style={{ padding: '1px 4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>Ctrl + V</kbd>
        </span>
      </div>
    </footer>
  );
}
