import React from 'react';
import {
  Paperclip,
  Smile,
  AtSign,
  Maximize2,
  Minimize2,
  Video,
  Image as ImageIcon,
  Loader2,
  Link2,
} from 'lucide-react';
import ChatAudioRecorder from './ChatAudioRecorder';

export default function ChatInputActionsToolbar({
  fileInputRef,
  imageOnlyInputRef,
  uploading,
  sending,
  isRecording,
  setIsRecording,
  onSendRecordedAudio,
  showGifPicker,
  setShowGifPicker,
  showEmojiPicker,
  setShowEmojiPicker,
  showMentionPopup,
  setShowMentionPopup,
  setShowVideoRecorder,
  onOpenInternalLinkModal,
  isMaximized,
  setIsMaximized,
  isCompact,
  onTriggerMention,
}) {
  const isBusy = uploading || sending || isRecording;

  return (
    <div
      className="chat-input-actions-toolbar"
      data-testid="chat-input-toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isCompact ? '2px' : '4px',
        flexWrap: 'wrap',
        paddingBottom: isMaximized ? '8px' : '0',
        borderBottom: isMaximized ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
      }}
    >
      {/* Anexar Arquivo Geral */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isBusy}
        title="Anexar qualquer arquivo ou documento"
        data-testid="chat-attach-button"
        style={actionBtnStyle(uploading)}
      >
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
      </button>

      {/* Enviar Imagem Direta com Legenda */}
      <button
        type="button"
        onClick={() => imageOnlyInputRef.current?.click()}
        disabled={isBusy}
        title="Enviar imagem com legenda (ou cole com Ctrl+V)"
        data-testid="chat-image-button"
        style={actionBtnStyle(false)}
      >
        <ImageIcon size={18} />
      </button>

      {/* Seletor de GIFs Animados */}
      <button
        type="button"
        onClick={() => {
          setShowGifPicker((prev) => !prev);
          setShowEmojiPicker(false);
          setShowMentionPopup(false);
        }}
        disabled={isBusy}
        title="Adicionar GIF animado"
        data-testid="chat-gif-button"
        style={{
          ...actionBtnStyle(showGifPicker),
          padding: '4px 6px',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: showGifPicker ? '#38bdf8' : '#94a3b8',
            border: '1px solid currentColor',
            borderRadius: '4px',
            padding: '1px 3px',
            lineHeight: 1,
          }}
        >
          GIF
        </span>
      </button>

      {/* Emojis */}
      <button
        type="button"
        onClick={() => {
          setShowEmojiPicker((prev) => !prev);
          setShowGifPicker(false);
          setShowMentionPopup(false);
        }}
        disabled={isBusy}
        title="Inserir emoji"
        data-testid="chat-emoji-button"
        style={actionBtnStyle(showEmojiPicker, '#fbbf24')}
      >
        <Smile size={18} />
      </button>

      {/* Menção de Contatos (@) */}
      <button
        type="button"
        onClick={onTriggerMention}
        disabled={isBusy}
        title="Mencionar contato (@)"
        data-testid="chat-mention-button"
        style={actionBtnStyle(showMentionPopup, '#38bdf8')}
      >
        <AtSign size={18} />
      </button>

      {/* Gravação de Áudio */}
      <ChatAudioRecorder
        isRecording={isRecording}
        onStartRecording={() => setIsRecording(true)}
        onCancelRecording={() => setIsRecording(false)}
        onSendAudio={onSendRecordedAudio}
        sending={sending || uploading}
      />

      {/* Gravação de Vídeo pela Câmera */}
      <button
        type="button"
        onClick={() => setShowVideoRecorder(true)}
        disabled={isBusy}
        title="Gravar vídeo com a câmera"
        data-testid="chat-video-record-button"
        style={actionBtnStyle(false, '#38bdf8')}
      >
        <Video size={18} />
      </button>

      {/* Inserir Link de Aba, Curso ou Aula */}
      <button
        type="button"
        onClick={onOpenInternalLinkModal}
        disabled={isBusy}
        title="Inserir link de aba, curso ou aula"
        data-testid="chat-insert-link-button"
        style={actionBtnStyle(false, '#a855f7')}
      >
        <Link2 size={18} />
      </button>

      {/* Botão de Maximizar / Restaurar */}
      <button
        type="button"
        onClick={() => setIsMaximized((prev) => !prev)}
        title={isMaximized ? 'Restaurar modo compacto' : 'Maximizar caixa de texto'}
        data-testid="chat-maximize-button"
        style={actionBtnStyle(isMaximized, '#38bdf8')}
      >
        {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </div>
  );
}

function actionBtnStyle(isActive, activeColor = '#38bdf8') {
  return {
    background: 'none',
    border: 'none',
    color: isActive ? activeColor : '#94a3b8',
    cursor: 'pointer',
    padding: '6px',
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
  };
}
