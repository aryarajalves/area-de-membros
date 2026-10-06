import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Paperclip, Smile, AtSign } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ChatAudioRecorder from './ChatAudioRecorder';
import ChatAttachedMediaPreview from './ChatAttachedMediaPreview';
import ChatEmojiPickerPopup from './ChatEmojiPickerPopup';
import ChatMentionContactsList from './ChatMentionContactsList';

export default function ChatInputBar({
  onSendMessage,
  sending = false,
  channelName = '',
  parentMessage = null,
}) {
  const { addToast } = useToast();
  const [text, setText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [contacts, setContacts] = useState([]);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      addToast('O arquivo excede o limite máximo de 25 MB.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    const token = getAuthToken();
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/chat/upload-media', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachedMedia({
          url: data.media_url,
          type: data.media_type,
          name: data.filename || file.name,
        });
        addToast('Mídia anexada com sucesso!', 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.detail || 'Falha no upload da mídia.', 'error');
      }
    } catch (err) {
      console.error('Erro ao enviar mídia:', err);
      addToast('Erro ao fazer upload da mídia.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendRecordedAudio = async (audioBlob) => {
    setUploading(true);
    const token = getAuthToken();
    try {
      const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: audioBlob.type || 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioFile);

      const res = await fetch('/api/v1/chat/upload-media', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const trimmed = text.trim();
        const success = await onSendMessage(trimmed, data.media_url, 'audio');
        if (success) {
          setText('');
          setAttachedMedia(null);
          setIsRecording(false);
          addToast('Áudio enviado com sucesso!', 'success');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.detail || 'Falha no upload do áudio.', 'error');
      }
    } catch (err) {
      console.error('Erro ao enviar gravação de áudio:', err);
      addToast('Erro ao enviar áudio.', 'error');
    } finally {
      setUploading(false);
      setIsRecording(false);
    }
  };

  const handleRemoveMedia = () => {
    setAttachedMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSelectContact = (contact) => {
    const atIndex = text.lastIndexOf('@');
    if (atIndex !== -1) {
      const beforeAt = text.slice(0, atIndex);
      setText(`${beforeAt}@${contact.name} `);
    } else {
      setText((prev) => `${prev}@${contact.name} `);
    }
    setShowMentionPopup(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !attachedMedia) || sending || uploading) return;

    const mediaUrl = attachedMedia?.url || null;
    const mediaType = attachedMedia?.type || null;

    const success = await onSendMessage(trimmed, mediaUrl, mediaType);
    if (success) {
      setText('');
      setAttachedMedia(null);
      setShowEmojiPicker(false);
      setShowMentionPopup(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);

    // Detectar digitação de @ para abrir popup de contatos
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

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const isButtonDisabled = (!text.trim() && !attachedMedia) || sending || uploading;
  const isCompact = Boolean(parentMessage);

  return (
    <footer
      className="chat-input-bar"
      data-testid="chat-input-bar"
      style={{
        padding: isCompact ? '12px 14px' : '16px 24px',
        backgroundColor: '#0f172a',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Input de Arquivo Oculto */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*,audio/*,.pdf,.docx,.xlsx,.txt,.zip"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        data-testid="chat-file-input"
      />

      {/* Preview de Mídia Anexada */}
      <ChatAttachedMediaPreview
        attachedMedia={attachedMedia}
        onRemove={handleRemoveMedia}
      />

      {/* Popups de Emoji e Menção de Contatos */}
      {showEmojiPicker && (
        <ChatEmojiPickerPopup
          onSelectEmoji={handleSelectEmoji}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {showMentionPopup && (
        <ChatMentionContactsList
          contacts={contacts}
          filterText={mentionFilter}
          onSelectContact={handleSelectContact}
          onClose={() => setShowMentionPopup(false)}
        />
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          gap: isCompact ? '6px' : '10px',
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: isCompact ? '6px 8px' : '8px 12px 8px 14px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          transition: 'border-color 0.2s',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Botão de Anexo / Mídia */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sending || isRecording}
          title="Anexar imagem, vídeo, áudio ou documento"
          data-testid="chat-attach-button"
          style={{
            background: 'none',
            border: 'none',
            color: uploading ? '#3b82f6' : '#94a3b8',
            cursor: uploading || sending || isRecording ? 'not-allowed' : 'pointer',
            padding: '6px',
            marginBottom: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!uploading && !sending && !isRecording) e.currentTarget.style.color = '#38bdf8';
          }}
          onMouseLeave={(e) => {
            if (!uploading && !sending && !isRecording) e.currentTarget.style.color = '#94a3b8';
          }}
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Paperclip size={18} />
          )}
        </button>

        {/* Botão de Emojis */}
        <button
          type="button"
          onClick={() => {
            setShowEmojiPicker((prev) => !prev);
            setShowMentionPopup(false);
          }}
          disabled={uploading || sending || isRecording}
          title="Inserir emoji"
          data-testid="chat-emoji-button"
          style={{
            background: 'none',
            border: 'none',
            color: showEmojiPicker ? '#fbbf24' : '#94a3b8',
            cursor: uploading || sending || isRecording ? 'not-allowed' : 'pointer',
            padding: '6px',
            marginBottom: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!uploading && !sending && !isRecording) e.currentTarget.style.color = '#fbbf24';
          }}
          onMouseLeave={(e) => {
            if (!uploading && !sending && !isRecording) e.currentTarget.style.color = showEmojiPicker ? '#fbbf24' : '#94a3b8';
          }}
        >
          <Smile size={18} />
        </button>

        {/* Botão de Marcar Contato (@) */}
        <button
          type="button"
          onClick={() => {
            setShowMentionPopup((prev) => !prev);
            setShowEmojiPicker(false);
            if (!text.includes('@')) {
              setText((prev) => prev ? `${prev} @` : '@');
            }
            if (textareaRef.current) textareaRef.current.focus();
          }}
          disabled={uploading || sending || isRecording}
          title="Mencionar alguém (@)"
          data-testid="chat-mention-button"
          style={{
            background: 'none',
            border: 'none',
            color: showMentionPopup ? '#38bdf8' : '#94a3b8',
            cursor: uploading || sending || isRecording ? 'not-allowed' : 'pointer',
            padding: '6px',
            marginBottom: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!uploading && !sending && !isRecording) e.currentTarget.style.color = '#38bdf8';
          }}
          onMouseLeave={(e) => {
            if (!uploading && !sending && !isRecording) e.currentTarget.style.color = showMentionPopup ? '#38bdf8' : '#94a3b8';
          }}
        >
          <AtSign size={18} />
        </button>

        {/* Componente de Gravação de Áudio */}
        <ChatAudioRecorder
          isRecording={isRecording}
          onStartRecording={() => setIsRecording(true)}
          onCancelRecording={() => setIsRecording(false)}
          onSendAudio={handleSendRecordedAudio}
          sending={sending || uploading}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Enviar mensagem em #${channelName || 'conversa'}... (Enter para enviar)`}
          rows={1}
          maxLength={3000}
          data-testid="chat-message-textarea"
          style={{
            flex: 1,
            minWidth: '100px',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f8fafc',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            resize: 'none',
            maxHeight: '120px',
            fontFamily: 'inherit',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
              width: '38px',
              height: '38px',
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
            {sending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
      <div
        style={{
          marginTop: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 4px',
        }}
      >
        <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
          Pressione <kbd style={{ padding: '1px 4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>Enter</kbd> para enviar ou <kbd style={{ padding: '1px 4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>Shift + Enter</kbd> para nova linha
        </span>
      </div>
    </footer>
  );
}
